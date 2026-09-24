import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface GestoDetectado {
  id: string;
  etiqueta: string;
}

interface Landmark {
  x: number;
  y: number;
  z: number;
}

interface ManoDetectada {
  landmarks: Landmark[];
  handedness: 'Left' | 'Right';
}

const WASM_PATH = '/mediapipe/wasm';
const MODEL_PATH = '/mediapipe/models/hand_landmarker.task';

const FRAMES_CONFIRMACION = 10;
// Letras ambiguas del abecedario requieren más frames de retención para evitar falsos positivos.
const FRAMES_CONFIRMACION_LETRA_AMBIGUA = 14;
// Las letras con movimiento (J, Z) se confirman con menos frames porque su
// trazo completo dura menos de medio segundo.
const FRAMES_CONFIRMACION_MOVIMIENTO = 6;
const MAX_GESTOS = 15;
const HISTORY_SIZE = 15;
const SMOOTH_FRAMES = 10;
const GRACE_MS = 500;
const HAND_LOST_MS = 600;
const MAX_RETRY = 3;
// Frames usados para analizar la trayectoria de las letras con movimiento (J, Z).
const TRAYECTORIA_FRAMES = 12;

// Modo de reconocimiento: palabras (señas completas) o deletreo (abecedario).
export enum SignMode {
  PALABRAS = 'palabras',
  DELETREAR = 'deletrear'
}

// Letras del dactilológico LSC que comparten configuraciones manuales muy
// parecidas y necesitan retención adicional para distinguirse.
const LETRAS_AMBIGUAS = new Set(['A', 'S', 'M', 'N', 'Ñ', 'J', 'E', 'O', 'R']);

// Letras que se reconocen por su trazo (movimiento de la yema) en lugar de una
// pose estática; se confirman con pocos frames porque el trazo dura poco.
const LETRAS_MOVIMIENTO = new Set(['LETRA_J', 'LETRA_Z']);

const CONEXIONES = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17]
];

const COLORES_MANO: Record<string, { stroke: string; fill: string; label: string }> = {
  Right: { stroke: 'rgba(167, 139, 250, 0.6)', fill: '#c4b5fd', label: 'R' },
  Left:  { stroke: 'rgba(56, 189, 178, 0.6)',  fill: '#5eead4', label: 'L' }
};

@Injectable({
  providedIn: 'root'
})
export class SignLanguageService {
  private landmarker: any = null;
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private rafId: number | null = null;
  private ultimoTs = -1;

  private gestoActual: string | null = null;
  private framesConsecutivos = 0;
  private ultimoConfirmado: string | null = null;
  private loggedResult = false;

  private landmarkHistory: ManoDetectada[][] = [];
  private ultimaVezAmbasManos = 0;
  private ultimoGestoBimanual: string | null = null;
  private ultimaManoDetectada = 0;

  readonly gestos$ = new BehaviorSubject<GestoDetectado[]>([]);
  readonly detectando$ = new BehaviorSubject<boolean>(false);
  readonly gestoEnCurso$ = new BehaviorSubject<string | null>(null);
  readonly cargando$ = new BehaviorSubject<boolean>(false);
  readonly confirmado$ = new BehaviorSubject<string | null>(null);
  readonly manoPerdida$ = new BehaviorSubject<boolean>(false);
  readonly modo$ = new BehaviorSubject<SignMode>(SignMode.PALABRAS);

  private textoDeletreado = '';

  get detectando(): boolean {
    return this.detectando$.value;
  }

  get gestos(): GestoDetectado[] {
    return this.gestos$.value;
  }

  get modo(): SignMode {
    return this.modo$.value;
  }

  setModo(modo: SignMode): void {
    this.modo$.next(modo);
    this.limpiar();
    this.gestoActual = null;
    this.framesConsecutivos = 0;
    this.ultimoConfirmado = null;
    this.textoDeletreado = '';
    this.gestoEnCurso$.next(null);
  }

  async iniciar(video: HTMLVideoElement, canvas?: HTMLCanvasElement): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('El reconocimiento de señas solo funciona en el navegador.');
    }
    this.video = video;
    this.canvas = canvas || null;
    if (!this.landmarker) {
      this.cargando$.next(true);
      const vision = await import('@mediapipe/tasks-vision');
      const fileset = await vision.FilesetResolver.forVisionTasks(WASM_PATH);

      for (let intento = 0; intento < MAX_RETRY; intento++) {
        try {
          this.landmarker = await vision.HandLandmarker.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: MODEL_PATH, delegate: 'GPU' },
            runningMode: 'VIDEO',
            numHands: 2,
            minHandDetectionConfidence: 0.3,
            minHandPresenceConfidence: 0.3,
            minTrackingConfidence: 0.3
          });
          break;
        } catch {
          if (intento === MAX_RETRY - 1) {
            try {
              this.landmarker = await vision.HandLandmarker.createFromOptions(fileset, {
                baseOptions: { modelAssetPath: MODEL_PATH, delegate: 'CPU' },
                runningMode: 'VIDEO',
                numHands: 2,
                minHandDetectionConfidence: 0.3,
                minHandPresenceConfidence: 0.3,
                minTrackingConfidence: 0.3
              });
            } catch (e) {
              this.cargando$.next(false);
              throw e;
            }
          } else {
            await new Promise(r => setTimeout(r, 1000 * Math.pow(2, intento)));
          }
        }
      }
      this.cargando$.next(false);
    }
    this.detectando$.next(true);
    this.bucle();
  }

  reanudar(): void {
    if (!this.video || !this.landmarker) {
      return;
    }
    this.detectando$.next(true);
    this.bucle();
  }

  pausar(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.detectando$.next(false);
    this.gestoEnCurso$.next(null);
  }

  detener(): void {
    this.pausar();
    this.video = null;
    this.canvas = null;
    this.gestoActual = null;
    this.framesConsecutivos = 0;
    this.ultimoConfirmado = null;
    this.landmarkHistory = [];
    this.ultimoGestoBimanual = null;
    this.manoPerdida$.next(false);
    this.limpiar();
  }

  limpiar(): void {
    this.textoDeletreado = '';
    this.gestos$.next([]);
  }

  eliminarGesto(index: number): void {
    const actual = [...this.gestos];
    if (index >= 0 && index < actual.length) {
      actual.splice(index, 1);
      this.gestos$.next(actual);
    }
  }

  getHistorial(): ManoDetectada[][] {
    return this.landmarkHistory;
  }

  traducirAhora(): string {
    if (this.modo === SignMode.DELETREAR) {
      if (!this.textoDeletreado) return '';
      return this.textoDeletreado.charAt(0).toUpperCase() + this.textoDeletreado.slice(1);
    }

    const palabras = this.gestos.map(g => g.etiqueta.replace(/[.,;:!?]/g, ''));
    if (palabras.length === 0) {
      return '';
    }
    return palabras
      .map((p, i) => (i === 0 ? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() : p.toLowerCase()))
      .join(' ')
      + '.';
  }

  // En modo deletreo, el gesto "por favor" se interpreta como espacio.
  marcarEspacio(): void {
    if (this.modo !== SignMode.DELETREAR) return;
    this.textoDeletreado += ' ';
    this.gestos$.next([{ id: 'espacio', etiqueta: this.textoDeletreado }]);
  }

  borrarUltimaLetra(): void {
    if (this.modo !== SignMode.DELETREAR) return;
    if (this.textoDeletreado.length > 0) {
      this.textoDeletreado = this.textoDeletreado.slice(0, -1);
    }
    this.gestos$.next([{ id: 'borrar', etiqueta: this.textoDeletreado }]);
  }

  private bucle = (): void => {
    if (!this.video || !this.landmarker) {
      this.rafId = null;
      return;
    }

    if (this.video.readyState >= 2 && this.video.currentTime !== this.ultimoTs) {
      this.ultimoTs = this.video.currentTime;
      try {
        const resultado = this.landmarker.detectForVideo(this.video, performance.now());
        this.procesarResultado(resultado);
      } catch (e) {
        console.warn('Error en reconocimiento:', e);
        this.procesarResultado(null);
      }
    }

    this.rafId = requestAnimationFrame(this.bucle);
  };

  private procesarResultado(resultado: any): void {
    const rawHands: Landmark[][] | undefined = resultado?.landmarks;
    const rawHandedness: any[][] | undefined = resultado?.handedness;

    if (rawHands && rawHands.length > 0 && !this.loggedResult) {
      console.log('MediaPipe resultado:', {
        manosEncontradas: rawHands.length,
        handedness: rawHandedness?.map((h: any[]) => h[0]?.categoryName)
      });
      this.loggedResult = true;
    }

    const manos: ManoDetectada[] = [];
    if (rawHands) {
      for (let i = 0; i < rawHands.length; i++) {
        const label: 'Left' | 'Right' = rawHandedness?.[i]?.[0]?.categoryName === 'Left' ? 'Left' : 'Right';
        manos.push({ landmarks: rawHands[i], handedness: label });
      }
    }

    this.landmarkHistory.push(manos);
    if (this.landmarkHistory.length > HISTORY_SIZE) {
      this.landmarkHistory.shift();
    }

    const ahora = Date.now();

    if (manos.length >= 2) {
      this.ultimaVezAmbasManos = ahora;
      this.ultimaManoDetectada = ahora;
      const left = manos.find(m => m.handedness === 'Left');
      const right = manos.find(m => m.handedness === 'Right');
      if (left && right) {
        this.ultimoGestoBimanual = evaluarGestoBimanual(left.landmarks, right.landmarks);
      }
    } else if (manos.length === 1) {
      this.ultimaManoDetectada = ahora;
      this.manoPerdida$.next(false);
    } else {
      if (ahora - this.ultimaManoDetectada > HAND_LOST_MS) {
        this.manoPerdida$.next(true);
        this.ultimoGestoBimanual = null;
      }
    }

    const manosSuavizadas = this.suavizarLandmarks(manos);

    if (manosSuavizadas.length > 0) {
      this.dibujarLandmarks(manosSuavizadas);
    } else {
      this.limpiarCanvas();
    }

    const gesto = this.evaluarGestos(manosSuavizadas);
    this.gestoEnCurso$.next(gesto);

    if (gesto && gesto === this.gestoActual) {
      this.framesConsecutivos++;
    } else {
      this.gestoActual = gesto;
      this.framesConsecutivos = gesto ? 1 : 0;
    }

    const esLetra = this.modo === SignMode.DELETREAR;
    const letraAmbigua = esLetra && LETRAS_AMBIGUAS.has(gesto ?? '');
    const esMovimiento = esLetra && LETRAS_MOVIMIENTO.has(gesto ?? '');
    const framesRequeridos = esMovimiento
      ? FRAMES_CONFIRMACION_MOVIMIENTO
      : letraAmbigua
        ? FRAMES_CONFIRMACION_LETRA_AMBIGUA
        : FRAMES_CONFIRMACION;

    if (gesto && this.framesConsecutivos >= framesRequeridos && gesto !== this.ultimoConfirmado) {
      this.confirmarGesto(gesto);
    }

    if (!gesto || gesto !== this.ultimoConfirmado) {
      if (!gesto) {
        this.ultimoConfirmado = null;
      }
    }
  }

  private suavizarLandmarks(manos: ManoDetectada[]): ManoDetectada[] {
    if (this.landmarkHistory.length < SMOOTH_FRAMES) {
      return manos;
    }

    const n = Math.min(this.landmarkHistory.length, SMOOTH_FRAMES);
    const result: ManoDetectada[] = [];

    for (const mano of manos) {
      const historialMano = this.landmarkHistory
        .slice(-n)
        .map(frame => frame.find(m => m.handedness === mano.handedness))
        .filter((m): m is ManoDetectada => !!m);

      if (historialMano.length === 0) {
        result.push(mano);
        continue;
      }

      const smoothed: Landmark[] = mano.landmarks.map((lm, i) => {
        let sx = 0, sy = 0, sz = 0;
        for (const h of historialMano) {
          sx += h.landmarks[i].x;
          sy += h.landmarks[i].y;
          sz += h.landmarks[i].z;
        }
        const count = historialMano.length;
        return { x: sx / count, y: sy / count, z: sz / count };
      });

      result.push({ landmarks: smoothed, handedness: mano.handedness });
    }

    return result;
  }

  private evaluarGestos(manos: ManoDetectada[]): string | null {
    if (this.modo === SignMode.DELETREAR) {
      // En deletreo usamos una sola mano (dactilología LSC).
      const mano = manos[0];
      if (!mano) {
        return null;
      }
      // Las letras con movimiento (J, Z) se leen del trazo de la yema.
      const trazo = this.evaluarTrazoLetra(mano);
      if (trazo) {
        return trazo;
      }
      return evaluarLetra(mano.landmarks);
    }

    const ahora = Date.now();
    const dentroDeGrace = (ahora - this.ultimaVezAmbasManos) < GRACE_MS;

    // Señales de movimiento con forma definida (Fase 2). Se evalúan ANTES del
    // estático porque comparten configuración manual con señas estáticas
    // (puño = Gracias, índice = Atención, pulgar = Sí/No, manos abiertas = Aplauso).
    const gestoConMovimiento = this.evaluarMovimientoConForma(manos);
    if (gestoConMovimiento) return gestoConMovimiento;

    if (manos.length === 2) {
      const left = manos.find(m => m.handedness === 'Left');
      const right = manos.find(m => m.handedness === 'Right');
      if (left && right) {
        const bimanual = evaluarGestoBimanual(left.landmarks, right.landmarks);
        if (bimanual) return bimanual;
      }
    }

    if (manos.length === 1 && dentroDeGrace && this.ultimoGestoBimanual) {
      return this.ultimoGestoBimanual;
    }

    if (manos.length < 2) {
      this.ultimoGestoBimanual = null;
    }

    for (const mano of manos) {
      const gestoEstatico = evaluarGesto(mano.landmarks);
      if (gestoEstatico) return gestoEstatico;
    }

    const gestoMovimiento = this.detectarMovimiento(manos);
    if (gestoMovimiento) return gestoMovimiento;

    return null;
  }

  private evaluarMovimientoConForma(manos: ManoDetectada[]): string | null {
    if (this.landmarkHistory.length < 6) {
      return null;
    }

    // EMERGENCIA_GESTO: ambas manos abiertas agitándose en la parte alta del
    // encuadre (por encima del pecho). Distinto de APLAUSO/ORACION (juntas) y
    // de PARAR (media distancia) por la altura y la sacudida vertical.
    if (manos.length === 2) {
      const izquierda = manos.find(m => m.handedness === 'Left');
      const derecha = manos.find(m => m.handedness === 'Right');
      if (izquierda && derecha) {
        const lmI = izquierda.landmarks;
        const lmD = derecha.landmarks;
        const abiertaIzq = fingerExtended(lmI, 8, 6) && fingerExtended(lmI, 12, 10) &&
                           fingerExtended(lmI, 16, 14) && fingerExtended(lmI, 20, 18);
        const abiertaDer = fingerExtended(lmD, 8, 6) && fingerExtended(lmD, 12, 10) &&
                           fingerExtended(lmD, 16, 14) && fingerExtended(lmD, 20, 18);
        const altas = lmI[0].y < 0.42 && lmD[0].y < 0.42;
        if (abiertaIzq && abiertaDer && altas) {
          const sacudidaVertical = (handedness: string): boolean => {
            const h = this.landmarkHistory
              .slice(-8)
              .map(frame => frame.find(m => m.handedness === handedness))
              .filter((m): m is ManoDetectada => !!m);
            if (h.length < 5) return false;
            const ys = h.map(x => x.landmarks[0].y);
            const mean = ys.reduce((a, b) => a + b, 0) / ys.length;
            let cruces = 0;
            for (let i = 1; i < ys.length; i++) {
              if ((ys[i] - mean) * (ys[i - 1] - mean) < 0) cruces++;
            }
            return cruces >= 2;
          };
          if (sacudidaVertical('Left') || sacudidaVertical('Right')) {
            return 'EMERGENCIA_GESTO';
          }
        }
      }
    }

    // TECLADO_GESTO: ambas manos abiertas en posición de teclado — separadas
    // horizontalmente, a la misma altura, con micro-movimiento vertical de
    // escritura. Distinto de EMERGENCIA (manos altas) y de PARAR (estáticas).
    if (manos.length === 2) {
      const izquierdaT = manos.find(m => m.handedness === 'Left');
      const derechaT = manos.find(m => m.handedness === 'Right');
      if (izquierdaT && derechaT) {
        const lmIT = izquierdaT.landmarks;
        const lmDT = derechaT.landmarks;
        const abiertasT = fingerExtended(lmIT, 8, 6) && fingerExtended(lmIT, 12, 10) &&
                          fingerExtended(lmIT, 16, 14) && fingerExtended(lmIT, 20, 18) &&
                          fingerExtended(lmDT, 8, 6) && fingerExtended(lmDT, 12, 10) &&
                          fingerExtended(lmDT, 16, 14) && fingerExtended(lmDT, 20, 18);
        const pecho = lmIT[0].y > 0.42 && lmDT[0].y > 0.42;
        const mismaAltura = Math.abs(lmIT[0].y - lmDT[0].y) < 0.14;
        const xGapT = Math.abs(lmIT[0].x - lmDT[0].x);
        const separadas = xGapT > 0.2 && xGapT < 0.55;
        if (abiertasT && pecho && mismaAltura && separadas) {
          const temblorTecleo = (handedness: string): boolean => {
            const h = this.landmarkHistory
              .slice(-8)
              .map(frame => frame.find(m => m.handedness === handedness))
              .filter((m): m is ManoDetectada => !!m);
            if (h.length < 5) return false;
            const ys = h.map(x => x.landmarks[8].y);
            const rango = Math.max(...ys) - Math.min(...ys);
            return rango > 0.01 && rango < 0.09;
          };
          if (temblorTecleo('Left') && temblorTecleo('Right')) {
            return 'TECLADO_GESTO';
          }
        }
      }
    }

    // FELICIDAD: ambas manos abiertas, separadas, que ascienden desde el pecho
    // con entusiasmo. Distinta de EMERGENCIA (oscilación sobre la cabeza)
    // porque arranca a la altura del pecho y sube de forma sostenida.
    if (manos.length === 2) {
      const izquierdaF = manos.find(m => m.handedness === 'Left');
      const derechaF = manos.find(m => m.handedness === 'Right');
      if (izquierdaF && derechaF) {
        const lmIF = izquierdaF.landmarks;
        const lmDF = derechaF.landmarks;
        const abiertasF = fingerExtended(lmIF, 8, 6) && fingerExtended(lmIF, 12, 10) &&
                          fingerExtended(lmIF, 16, 14) && fingerExtended(lmIF, 20, 18) &&
                          fingerExtended(lmDF, 8, 6) && fingerExtended(lmDF, 12, 10) &&
                          fingerExtended(lmDF, 16, 14) && fingerExtended(lmDF, 20, 18);
        const separadasF = Math.abs(lmIF[0].x - lmDF[0].x) > 0.15;
        if (abiertasF && separadasF) {
          const subeF = (handedness: string): boolean => {
            const h = this.landmarkHistory
              .slice(-8)
              .map(frame => frame.find(m => m.handedness === handedness))
              .filter((m): m is ManoDetectada => !!m);
            if (h.length < 5) return false;
            const ys = h.map(x => x.landmarks[0].y);
            const arranca = ys[0] > 0.45;
            const sube = ys[0] - ys[ys.length - 1] > 0.06;
            return arranca && sube;
          };
          if (subeF('Left') && subeF('Right')) {
            return 'FELICIDAD';
          }
        }
      }
    }

    for (const mano of manos) {
      const lm = mano.landmarks;
      const historial = this.landmarkHistory
        .slice(-8)
        .map(frame => frame.find(m => m.handedness === mano.handedness))
        .filter((m): m is ManoDetectada => !!m);
      if (historial.length < 5) continue;

      const handSize = dist(lm[0], lm[9]);
      const idx = fingerExtended(lm, 8, 6);
      const mid = fingerExtended(lm, 12, 10);
      const ring = fingerExtended(lm, 16, 14);
      const pink = fingerExtended(lm, 20, 18);
      const thumb = thumbExtended(lm);

      // PELIGRO: puño cerrado agitándose de lado a lado frente al pecho.
      // Comparte forma con PUÑO_CERRADO (Gracias), se distingue por la
      // oscilación lateral de la muñeca.
      if (!idx && !mid && !ring && !pink && !thumb) {
        const xs = historial.map(h => h.landmarks[0].x);
        const meanX = xs.reduce((a, b) => a + b, 0) / xs.length;
        let crucesX = 0;
        for (let i = 1; i < xs.length; i++) {
          if ((xs[i] - meanX) * (xs[i - 1] - meanX) < 0) crucesX++;
        }
        const spread = Math.max(...xs) - Math.min(...xs);
        if (crucesX >= 2 && spread > handSize * 0.5) {
          return 'PELIGRO';
        }
      }

      // MAÑANA: índice extendido (solo) que asciende junto a la cabeza.
      // Comparte forma con INDICE_ARRIBA (Atención), se distingue por el
      // desplazamiento vertical ascendente desde una posición baja o media.
      if (idx && !mid && !ring && !pink && !thumb && lm[0].y > 0.35) {
        const ys = historial.map(h => h.landmarks[0].y);
        const subida = ys[0] - ys[ys.length - 1];
        if (subida > handSize * 0.6) {
          return 'MAÑANA';
        }
      }

      // AYER: pulgar extendido (solo) desplazándose hacia atrás sobre el hombro.
      // Comparte forma con PULGAR_ARRIBA/ABAJO (Sí/No), se distingue por el
      // retroceso lateral marcado de la muñeca (direcciones ignoradas por el
      // espejo de la cámara).
      if (thumb && !idx && !mid && !ring && !pink && lm[0].y > 0.45) {
        const xs = historial.map(h => h.landmarks[0].x);
        const retroceso = Math.abs(xs[xs.length - 1] - xs[0]);
        if (retroceso > handSize * 0.8) {
          return 'AYER';
        }
      }

      // DONDE: mano abierta en HORIZONTAL (dedos al frente, palma abajo) que
      // oscila de lado a lado a la altura del pecho. El discriminador principal
      // es el MOVIMIENTO lateral (HOLA y NADA son estáticas); la orientación
      // solo evita colisionar con ONDEO (Adiós: mano en vertical, dedos arriba).
      // No se exige pulgar separado: si está pegado pero la mano oscila, es
      // Dónde (el movimiento manda sobre Nada).
      const abiertaD = [idx, mid, ring, pink].filter(Boolean).length >= 4;
      const noVerticalD = Math.abs(lm[9].y - lm[0].y) < handSize * 0.8;
      const aLaAlturaD = lm[0].y > 0.25 && lm[0].y < 0.75;
      if (abiertaD && noVerticalD && aLaAlturaD) {
        const xsD = this.landmarkHistory
          .slice(-14)
          .map(frame => frame.find(m => m.handedness === mano.handedness))
          .filter((m): m is ManoDetectada => !!m)
          .map(h => h.landmarks[0].x);
        if (xsD.length >= 9) {
          const meanXD = xsD.reduce((a, b) => a + b, 0) / xsD.length;
          let crucesXD = 0;
          for (let i = 1; i < xsD.length; i++) {
            if ((xsD[i] - meanXD) * (xsD[i - 1] - meanXD) < 0) crucesXD++;
          }
          const spreadD = Math.max(...xsD) - Math.min(...xsD);
          if ((crucesXD >= 2 && spreadD > handSize * 0.4) ||
              spreadD > handSize * 0.9) {
            return 'DONDE';
          }
        }
      }

      // RECHAZAR_GESTO / RECIBIR_GESTO: mano abierta (3+ dedos) que se empuja
      // hacia adelante (z decrece = se acerca a la cámara) o se trae al cuerpo
      // (z crece). El eje de profundidad de MediaPipe da la dirección.
      const abiertaMov = [idx, mid, ring, pink].filter(Boolean).length >= 3;
      if (abiertaMov) {
        const zs = historial.map(h => h.landmarks[9].z);
        const avanceZ = zs[zs.length - 1] - zs[0];
        if (avanceZ < -0.08) {
          return 'RECHAZAR_GESTO';
        }
        if (avanceZ > 0.08) {
          return 'RECIBIR_GESTO';
        }
      }
    }

    return null;
  }

  private detectarMovimiento(manos: ManoDetectada[]): string | null {
    if (this.landmarkHistory.length < 6) {
      return null;
    }

    for (const mano of manos) {
      const historial = this.landmarkHistory
        .slice(-8)
        .map(frame => frame.find(m => m.handedness === mano.handedness))
        .filter((m): m is ManoDetectada => !!m);

      if (historial.length < 5) continue;

      const wristXs = historial.map(h => h.landmarks[0].x);

      let cruces = 0;
      const mean = wristXs.reduce((a, b) => a + b, 0) / wristXs.length;
      for (let i = 1; i < wristXs.length; i++) {
        if ((wristXs[i] - mean) * (wristXs[i - 1] - mean) < 0) {
          cruces++;
        }
      }
      if (cruces >= 3) {
        return 'ONDEO';
      }

      const idxTip = mano.landmarks[8];
      const wrist = mano.landmarks[0];
      const dx = idxTip.x - wrist.x;
      const dy = idxTip.y - wrist.y;
      const angle = Math.atan2(-dy, dx);

      if (fingerExtended(mano.landmarks, 8, 6) && !fingerExtended(mano.landmarks, 12, 10)) {
        if (angle > 0.5 && angle < 1.2) {
          return 'APUNTAR_ARRIBA';
        }
        if (angle < -0.5 && angle > -1.2) {
          return 'APUNTAR_ABAJO';
        }
      }
    }

    return null;
  }

  // Lee las letras dactilológicas que se dibujan en el aire (J, Z) a partir de
  // la trayectoria de la yema dentro del buffer histórico.
  private evaluarTrazoLetra(mano: ManoDetectada): string | null {
    const historias = this.landmarkHistory
      .slice(-TRAYECTORIA_FRAMES)
      .map(frame => frame.find(m => m.handedness === mano.handedness))
      .filter((m): m is ManoDetectada => !!m);

    if (historias.length < 8) {
      return null;
    }

    const actual = historias[historias.length - 1].landmarks;
    const handSize = dist(actual[0], actual[9]);
    const idx = fingerExtended(actual, 8, 6);
    const mid = fingerExtended(actual, 12, 10);
    const ring = fingerExtended(actual, 16, 14);
    const pink = fingerExtended(actual, 20, 18);
    const thumb = thumbExtended(actual);

    // J: solo meñique estirado (pose de I) trazando un gancho hacia abajo y
    // de regreso arriba.
    if (!thumb && !idx && !mid && !ring && pink) {
      const ys = historias.map(h => h.landmarks[20].y);
      const maxY = Math.max(...ys);
      const minY = Math.min(...ys);
      const range = maxY - minY;
      const descendio = maxY - ys[0] > range * 0.4;
      const subio = maxY - ys[ys.length - 1] > range * 0.3;
      if (range > handSize * 0.8 && descendio && subio) {
        return 'LETRA_J';
      }
      return null;
    }

    // Z: solo índice estirado (pose de X/I) trazando un zigzag lateral con dos
    // giros de dirección.
    if (!thumb && idx && !mid && !ring && !pink) {
      const pts = historias.map(h => h.landmarks[8]);
      const dxs = pts.slice(1).map((p, i) => p.x - pts[i].x);
      const noise = handSize * 0.15;
      let giros = 0;
      for (let i = 1; i < dxs.length; i++) {
        const a = dxs[i - 1];
        const b = dxs[i];
        if (Math.abs(a) > noise && Math.abs(b) > noise && Math.sign(a) !== Math.sign(b)) {
          giros++;
        }
      }
      const xs = pts.map(p => p.x);
      const xRange = Math.max(...xs) - Math.min(...xs);
      if (giros >= 2 && xRange > handSize * 1.5) {
        return 'LETRA_Z';
      }
      return null;
    }

    return null;
  }

  private confirmarGesto(id: string): void {
    this.ultimoConfirmado = id;

    if (this.modo === SignMode.DELETREAR) {
      // En deletreo cada confirmación aporta UNA letra al texto corrido.
      const letra = id.startsWith('LETRA_') ? id.slice('LETRA_'.length) : (GESTO_PALABRA[id] ?? id);
      this.textoDeletreado += letra;
      this.gestos$.next([{ id, etiqueta: this.textoDeletreado }]);
    } else {
      const secuencia = [...this.gestos, { id, etiqueta: GESTO_PALABRA[id] ?? id }];
      this.gestos$.next(secuencia.slice(-MAX_GESTOS));
    }

    this.confirmado$.next(id);
    setTimeout(() => this.confirmado$.next(null), 400);
  }

  private dibujarLandmarks(manos: ManoDetectada[]): void {
    if (!this.canvas || !this.video) {
      return;
    }

    const parent = this.canvas.parentElement;
    const rect = parent?.getBoundingClientRect();
    const cw = (rect && rect.width > 0) ? Math.round(rect.width) : 420;
    const ch = (rect && rect.height > 0) ? Math.round(rect.height) : 315;

    if (this.canvas.width !== cw || this.canvas.height !== ch) {
      this.canvas.width = cw;
      this.canvas.height = ch;
    }

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, cw, ch);

    const vw = this.video.videoWidth;
    const vh = this.video.videoHeight;
    if (!vw || !vh) {
      return;
    }

    ctx.save();
    ctx.translate(cw, 0);
    ctx.scale(-1, 1);

    const scale = Math.min(cw / vw, ch / vh);
    const ox = (cw - vw * scale) / 2;
    const oy = (ch - vh * scale) / 2;

    for (const mano of manos) {
      const lm = mano.landmarks;
      const color = COLORES_MANO[mano.handedness] ?? COLORES_MANO['Right'];

      const px = (i: number) => ox + lm[i].x * vw * scale;
      const py = (i: number) => oy + lm[i].y * vh * scale;

      ctx.strokeStyle = color.stroke;
      ctx.lineWidth = 2;
      for (const [a, b] of CONEXIONES) {
        ctx.beginPath();
        ctx.moveTo(px(a), py(a));
        ctx.lineTo(px(b), py(b));
        ctx.stroke();
      }

      for (let i = 0; i < lm.length; i++) {
        ctx.beginPath();
        ctx.arc(px(i), py(i), 4, 0, Math.PI * 2);
        ctx.fillStyle = i === 0 ? '#ef4444' : color.fill;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      const wristX = px(0);
      const wristY = py(0);
      ctx.font = 'bold 13px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillText(color.label, wristX, wristY - 10);
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 2;
      ctx.strokeText(color.label, wristX, wristY - 10);
    }

    ctx.restore();
  }

  private limpiarCanvas(): void {
    if (!this.canvas) {
      return;
    }
    const ctx = this.canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

export const GESTO_PALABRA: Record<string, string> = {
  PALMA_ABIERTA: 'Hola',
  PULGAR_ARRIBA: 'Sí',
  PULGAR_ABAJO: 'No',
  VICTORIA: 'Adiós',
  TE_QUIERO: 'Te quiero',
  INDICE_ARRIBA: 'Atención',
  PUÑO_CERRADO: 'Gracias',
  TRES_DEDOS: 'Por favor',
  CUATRO_DEDOS: 'Necesito',
  OK_SIGN: 'Perfecto',
  PULGAR_MEÑIQUE: 'Llamar',
  MEÑIQUE_ARRIBA: 'Promesa',
  PINZA: 'Poco',
  LETRA_L: 'Letra L',
  LETRA_O: 'Letra O',
  NUMERO_3: 'Tres',
  NUMERO_6: 'Seis',
  ONDEO: 'Adiós (ondeo)',
  APUNTAR_ARRIBA: 'Mira arriba',
  APUNTAR_ABAJO: 'Mira abajo',
  ORACION: 'Oración',
  APLAUSO: 'Aplauso',
  PAZ: 'Paz',
  CORAZON: 'Amor',
  PARAR: 'Parar',
  // Léxico empresarial (LSC)
  REUNION: 'Reunión',
  INFORME: 'Informe',
  CLIENTE: 'Cliente',
  PAUSA: 'Pausa',
  APROBAR: 'Aprobar',
  ENVIAR: 'Enviar',
  TRABAJAR: 'Trabajar',
  PEDIR: 'Pedir',
  // Fase 1: números y tiempos (CM distintivas, sin colisiones)
  NUMERO_7: 'Siete',
  HORA: 'Hora',
  AHORA: 'Ahora',
  HOY: 'Hoy',
  SUPERVISAR: 'Supervisar',
  // Fase 2: emergencias y tiempos con movimiento (requieren historial de frames)
  PELIGRO: 'Peligro',
  EMERGENCIA_GESTO: 'Emergencia',
  MAÑANA: 'Mañana',
  AYER: 'Ayer',
  // Fase 3: tareas, tecnología y emociones con movimiento
  TECLADO_GESTO: 'Teclear',
  RECHAZAR_GESTO: 'Rechazar',
  RECIBIR_GESTO: 'Recibir',
  FELICIDAD: 'Felicidad',
  // Fase 2 (Bloque A): preguntas y conectores — estáticas
  QUE: 'Qué',
  DONDE: 'Dónde',
  TAMBIEN: 'También',
  NADA: 'Nada'
};

function dist(a: Landmark, b: Landmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function fingerExtended(lm: Landmark[], tip: number, pip: number): boolean {
  return dist(lm[tip], lm[0]) > dist(lm[pip], lm[0]);
}

function thumbExtended(lm: Landmark[]): boolean {
  return dist(lm[4], lm[9]) > dist(lm[3], lm[9]);
}

function thumbIndexClose(lm: Landmark[]): boolean {
  const handSize = dist(lm[0], lm[9]);
  return dist(lm[4], lm[8]) < handSize * 0.25;
}

function angleBetween(a: Landmark, vertex: Landmark, b: Landmark): number {
  const va = { x: a.x - vertex.x, y: a.y - vertex.y };
  const vb = { x: b.x - vertex.x, y: b.y - vertex.y };
  const dot = va.x * vb.x + va.y * vb.y;
  const magA = Math.hypot(va.x, va.y);
  const magB = Math.hypot(vb.x, vb.y);
  if (magA === 0 || magB === 0) return 0;
  return Math.acos(Math.min(1, Math.max(-1, dot / (magA * magB))));
}

function fingerTipsTouching(a: number, b: number, lm: Landmark[], ratio = 0.28): boolean {
  const handSize = dist(lm[0], lm[9]);
  return dist(lm[a], lm[b]) < handSize * ratio;
}

// En Y el pulgar apunta hacia arriba, bien separado de la base del índice; en M
// el pulgar queda doblado sobre los dedos (yema cerca del índice y más baja que
// la yema del meñique).
function pulgarEnPosicionY(lm: Landmark[], handSize: number): boolean {
  const pulgarSeparado = dist(lm[4], lm[6]) > handSize * 0.45;
  const pulgarAlto = lm[4].y < lm[20].y;
  return pulgarSeparado && pulgarAlto;
}

// Punto medio de un dedo índice "doblado" (pulgar a lado).
function fingerFoldedOverThumb(lm: Landmark[], tips: number[], pips: number[]): boolean {
  // Los dedos se doblan sobre el pulgar: sus puntas caen por debajo (más cerca
  // del centro de la mano) que sus articulaciones medias.
  let folded = 0;
  for (let i = 0; i < tips.length; i++) {
    if (!fingerExtended(lm, tips[i], pips[i])) folded++;
  }
  return folded >= Math.floor(tips.length * 0.6);
}

// Clasificador del abecedario dactilológico de la Lengua de Señas Colombiana.
// Prioriza configuraciones más específicas y requiere retención en letras
// ambiguas (ver LETRAS_AMBIGUAS).
export function evaluarLetra(lm: Landmark[]): string | null {
  const idx = fingerExtended(lm, 8, 6);
  const mid = fingerExtended(lm, 12, 10);
  const ring = fingerExtended(lm, 16, 14);
  const pink = fingerExtended(lm, 20, 18);
  const thumb = thumbExtended(lm);
  const floor = [idx, mid, ring, pink].filter(Boolean).length;
  const handSize = dist(lm[0], lm[9]);

  const tipsIndexRing = fingerTipsTouching(8, 16, lm, 0.35);
  const tipsMidRing = fingerTipsTouching(12, 16, lm, 0.35);
  const tipsMidPink = fingerTipsTouching(12, 20, lm, 0.35);

  // --- Familia de puño (A, E, S, O, T) ---
  if (floor === 0) {
    // O: las cinco yemas se tocan formando un círculo abierto (la palma queda hueca).
    if (thumb && allTipsClose(lm, handSize)) {
      return 'LETRA_O';
    }
    // E: dedos doblados con las puntas apretadas hacia la base del pulgar.
    if (!thumb && (tipsIndexRing && tipsMidPink)) {
      return 'LETRA_E';
    }
    // S: puño cerrado con el pulgar doblado delante de los cuatro dedos.
    if (thumb) {
      return 'LETRA_S';
    }
    // T: índice doblado sobre el pulgar, resto cerrado (punta del índice cerca del pulgar).
    if (dist(lm[8], lm[4]) < handSize * 0.3) {
      return 'LETRA_T';
    }
    // A: puño cerrado, pulgar al costado/sobre el puño sin dedos extendidos.
    return 'LETRA_A';
  }

  // --- I (solo meñique extendido) ---
  if (!thumb && !idx && !mid && !ring && pink) {
    return 'LETRA_I';
  }

  // --- Y / M (pulgar + meñique; Y estira el pulgar hacia arriba y separado,
  // M lo dobla sobre el índice/medio/anular dejando el meñique de apoyo) ---
  if (thumb && !idx && !mid && !ring && pink) {
    return pulgarEnPosicionY(lm, handSize) ? 'LETRA_Y' : 'LETRA_M';
  }

  // --- N / Ñ (índice y medio doblados sobre el pulgar, anular y meñique
  // extendidos; Ñ se marca cuando la mano sube hasta la mejilla) ---
  if (thumb && !idx && !mid && ring && pink) {
    const centroManoY = (lm[0].y + lm[9].y) * 0.5;
    return centroManoY < 0.32 ? 'LETRA_Ñ' : 'LETRA_N';
  }

  // --- U / V / K / H (índice + medio extendidos; la orientación y la apertura
  // discriminan: H es horizontal, K tiene el pulgar pegado a la muñeca,
  // U junta las yemas y V las separa) ---
  if (thumb && idx && mid && !ring && !pink) {
    const dirIdx = { dx: lm[8].x - lm[5].x, dy: lm[8].y - lm[5].y };
    const horizontal = Math.abs(dirIdx.dx) > Math.abs(dirIdx.dy) * 1.3;
    const kPegado = dist(lm[4], lm[0]) < handSize * 0.5;
    if (horizontal) {
      return 'LETRA_H';
    }
    if (kPegado) {
      return 'LETRA_K';
    }
    return tipsMidRing ? 'LETRA_U' : 'LETRA_V';
  }

  // --- W (índice + medio + anular extendidos juntos) ---
  if (thumb && idx && mid && ring && !pink && tipsIndexRing) {
    return 'LETRA_W';
  }

  // --- D (índice extendido, otros doblados, pulgar apoyado en el medio) ---
  if (idx && !mid && !ring && !pink && thumb) {
    return 'LETRA_D';
  }

  // --- X (índice extendido y ligeramente doblado, medio/anular/meñique doblados) ---
  if (idx && !mid && !ring && !pink && !thumb) {
    // A diferencia de I, en X el índice está doblado (la yema cae cerca del PIP).
    const anguloIndice = angleBetween(lm[5], lm[6], lm[8]);
    return anguloIndice < 1.9 && anguloIndice > 0.5 ? 'LETRA_X' : 'LETRA_I';
  }

  // --- B (cuatro dedos extendidos juntos, pulgar doblado/pegado) ---
  if (floor >= 4 && !thumb) {
    return 'LETRA_B';
  }

  // --- F (pulgar + índice tocándose, tres dedos extendidos) ---
  if (thumbIndexClose(lm) && idx && mid && ring && pink) {
    return 'LETRA_F';
  }

  // --- G (índice y pulgar extendidos casi tocándose hacia adelante) ---
  if (thumb && idx && !mid && !ring && !pink && fingerTipsTouching(4, 8, lm, 0.5)) {
    return 'LETRA_G';
  }

  // --- L (índice + pulgar extendidos en L) ---
  if (thumb && idx && !mid && !ring && !pink) {
    const angulo = angleBetween(lm[4], lm[2], lm[8]);
    if (angulo > 0.9) return 'LETRA_L';
  }

  // --- P / Q (cuatro dedos juntos apuntando hacia abajo; P vertical y Q en
  // diagonal, ambas con el pulgar abierto) ---
  if (thumb && idx && mid && ring && pink) {
    const dirIdxDown = { dx: lm[8].x - lm[5].x, dy: lm[8].y - lm[5].y };
    if (dirIdxDown.dy > 0 && Math.abs(dirIdxDown.dy) > Math.abs(dirIdxDown.dx) * 1.3) {
      return 'LETRA_P';
    }
    if (dirIdxDown.dy > 0 && Math.abs(dirIdxDown.dy) > Math.abs(dirIdxDown.dx) * 0.4) {
      return 'LETRA_Q';
    }
  }

  // --- C (cuatro dedos curvados formando C, pulgar abierto) ---
  if (thumb && floor >= 4 && !allTipsClose(lm, handSize)) {
    return 'LETRA_C';
  }

  // --- P/Q/R fallback (letras con configuración de dedos extendidos hacia abajo)
  // --- R (índice y medio entrecruzados) ---
  if (idx && mid && !ring && !pink && fingerTipsTouching(8, 12, lm, 0.6)) {
    return 'LETRA_R';
  }

  return null;
}

function allTipsClose(lm: Landmark[], handSize: number): boolean {
  return dist(lm[4], lm[8]) < handSize * 0.3 &&
         dist(lm[4], lm[12]) < handSize * 0.35 &&
         dist(lm[4], lm[16]) < handSize * 0.4;
}

export function evaluarGesto(lm: Landmark[]): string | null {
  const idx = fingerExtended(lm, 8, 6);
  const mid = fingerExtended(lm, 12, 10);
  const ring = fingerExtended(lm, 16, 14);
  const pink = fingerExtended(lm, 20, 18);
  const thumb = thumbExtended(lm);
  const thumbIndexPinch = thumbIndexClose(lm);

  const handSize = dist(lm[0], lm[9]);

  const extended = [idx, mid, ring, pink].filter(Boolean).length;

  if (thumb && idx && !mid && !ring && pink) {
    return 'TE_QUIERO';
  }

  // NUMERO_7: yemas del pulgar, índice y medio juntas (pico de tres dedos),
  // anular y meñique doblados. Distinta de PINZA (dos yemas) y de OK_SIGN
  // (anular extendido).
  if (thumb && idx && mid && !ring && !pink &&
      fingerTipsTouching(4, 8, lm, 0.32) && fingerTipsTouching(4, 12, lm, 0.32)) {
    return 'NUMERO_7';
  }

  if (thumbIndexPinch && idx && mid && ring && !pink) {
    return 'OK_SIGN';
  }

  // SUPERVISAR: círculo con pulgar e índice llevado a la altura del ojo
  // (vigilar/monitorear). PINZA tiene la misma forma pero a nivel del pecho;
  // la altura de la muñeca discrimina.
  if (thumbIndexPinch && !idx && !mid && !ring && !pink && (lm[0].y + lm[9].y) / 2 < 0.45) {
    return 'SUPERVISAR';
  }

  if (thumbIndexPinch && !idx && !mid && !ring && !pink) {
    return 'PINZA';
  }

  // VICTORIA (Adiós) es la V en vertical. TAMBIÉN usa la misma V en horizontal
  // (configuración provisional LSC — calibrar en Fase 9). El umbral 0.9 admite
  // V ligeramente inclinadas; Adiós exige dominancia vertical clara.
  if (idx && mid && !ring && !pink) {
    const dirV = { dx: lm[8].x - lm[5].x, dy: lm[8].y - lm[5].y };
    return Math.abs(dirV.dx) > Math.abs(dirV.dy) * 0.9 ? 'TAMBIEN' : 'VICTORIA';
  }

  // Índice extendido y mano cerrada: la dirección de la punta discrimina
  // QUE (¿Qué?, lateral — provisional a calibrar), AHORA (firme hacia abajo)
  // e INDICE_ARRIBA (Atención, hacia arriba).
  if (idx && !mid && !ring && !pink && !thumb) {
    const dirIdx = { dx: lm[8].x - lm[5].x, dy: lm[8].y - lm[5].y };
    if (Math.abs(dirIdx.dx) > Math.abs(dirIdx.dy) * 1.2) {
      return 'QUE';
    }
    if (dirIdx.dy > handSize * 1.1) {
      return 'AHORA';
    }
    return 'INDICE_ARRIBA';
  }

  if (!idx && !mid && !ring && pink && !thumb) {
    return 'MEÑIQUE_ARRIBA';
  }

  if (thumb && !idx && !mid && !ring && pink) {
    return 'PULGAR_MEÑIQUE';
  }

  if (thumb && idx && mid && !ring && !pink) {
    return 'NUMERO_3';
  }

  if (idx && mid && ring && !pink && !thumb) {
    return 'TRES_DEDOS';
  }

  // NADA: mano plana en horizontal (dedos apuntando al frente) bajo el pecho.
  // Admite el pulgar doblado O relajado pegado a la palma; si el pulgar está
  // separado se interpreta como Hola (palma abierta). CUATRO_DEDOS (Necesito)
  // se hace en vertical cerca de la cara.
  if (idx && mid && ring && pink) {
    const thumbTucked = !thumb || dist(lm[4], lm[9]) < handSize * 0.55;
    if (thumbTucked) {
      const manoHorizontal = Math.abs(lm[9].x - lm[0].x) > Math.abs(lm[9].y - lm[0].y) * 0.8 &&
                             (lm[0].y + lm[9].y) / 2 > 0.5;
      if (manoHorizontal) {
        return 'NADA';
      }
      return 'CUATRO_DEDOS';
    }
  }

  // HORA: mano plana con el índice doblado sobre la muñeca (lugar del reloj),
  // medio, anular y meñique extendidos. Distinta de CUATRO_DEDOS (índice
  // extendido) por la posición de la yema del índice junto a la muñeca.
  if (!idx && mid && ring && pink && !thumb && dist(lm[8], lm[0]) < handSize * 0.55) {
    return 'HORA';
  }

  if (thumb && idx && !mid && !ring && !pink) {
    const angulo = angleBetween(lm[4], lm[2], lm[8]);
    if (angulo > 0.9) {
      return 'LETRA_L';
    }
  }

  if (!idx && !mid && !ring && !pink && !thumb && allTipsClose(lm, handSize)) {
    return 'LETRA_O';
  }

  if (thumb && !idx && !mid && !ring && !pink) {
    if (thumbIndexClose(lm) && extended === 0) {
      return 'NUMERO_6';
    }
    return lm[4].y < lm[3].y ? 'PULGAR_ARRIBA' : 'PULGAR_ABAJO';
  }

  if (extended >= 4 && thumb) {
    return 'PALMA_ABIERTA';
  }

  if (extended === 0 && !thumb) {
    return 'PUÑO_CERRADO';
  }

  return null;
}

function evaluarGestoBimanual(left: Landmark[], right: Landmark[]): string | null {
  const lIdx = fingerExtended(left, 8, 6);
  const lMid = fingerExtended(left, 12, 10);
  const lRing = fingerExtended(left, 16, 14);
  const lPink = fingerExtended(left, 20, 18);
  const lThumb = thumbExtended(left);

  const rIdx = fingerExtended(right, 8, 6);
  const rMid = fingerExtended(right, 12, 10);
  const rRing = fingerExtended(right, 16, 14);
  const rPink = fingerExtended(right, 20, 18);
  const rThumb = thumbExtended(right);

  const lExtended = [lIdx, lMid, lRing, lPink].filter(Boolean).length;
  const rExtended = [rIdx, rMid, rRing, rPink].filter(Boolean).length;

  const lOpen = lExtended >= 4 && lThumb;
  const rOpen = rExtended >= 4 && rThumb;

  const handsClose = dist(left[0], right[0]) < 0.15;

  if (lOpen && rOpen && handsClose) {
    const palmDist = dist(left[9], right[9]);
    if (palmDist < 0.12) {
      return 'ORACION';
    }
  }

  if (lOpen && rOpen && !handsClose) {
    const palmDist = dist(left[9], right[9]);
    if (palmDist > 0.15 && palmDist < 0.4) {
      return 'PARAR';
    }
  }

  const lVictory = lIdx && lMid && !lRing && !lPink;
  const rVictory = rIdx && rMid && !rRing && !rPink;
  if (lVictory && rVictory) {
    return 'PAZ';
  }

  if (lOpen && rOpen && handsClose) {
    return 'APLAUSO';
  }

  const lHeartThumb = thumbExtended(left);
  const rHeartThumb = thumbExtended(right);
  const lHeartIdx = fingerExtended(left, 8, 6);
  const rHeartIdx = fingerExtended(right, 8, 6);
  const lHeartClosed = !lMid && !lRing && !lPink;
  const rHeartClosed = !rMid && !rRing && !rPink;

  if (lHeartThumb && lHeartIdx && lHeartClosed &&
      rHeartThumb && rHeartIdx && rHeartClosed) {
    const thumbTouch = dist(left[4], right[4]);
    const idxTouch = dist(left[8], right[8]);
    if (thumbTouch < 0.08 && idxTouch < 0.08) {
      return 'CORAZON';
    }
  }

  // --- Léxico empresarial bimanual (LSC) ---
  const lFlat = lExtended >= 4 && !lThumb;
  const rFlat = rExtended >= 4 && !rThumb;

  // APROBAR: ambos pulgares hacia arriba (distinto de PUÑO/PALMA unimanual).
  const lThumbUp = lThumb && !lIdx && !lMid && !lRing && !lPink;
  const rThumbUp = rThumb && !rIdx && !rMid && !rRing && !rPink;
  if (lThumbUp && rThumbUp) {
    return 'APROBAR';
  }

  // PAUSA: ambas manos extendidas apuntando una a la otra en vertical (forma "T").
  const lIndexOver = lIdx && !lMid && !lRing && !lPink;
  const rIndexOver = rIdx && !rMid && !rRing && !rPink;
  if (lIndexOver && rIndexOver && !handsClose) {
    const yGap = Math.abs(left[6].y - right[6].y);
    const xGap = Math.abs(left[6].x - right[6].x);
    if (yGap > 0.12 && xGap < 0.12) {
      return 'PAUSA';
    }
  }

  // HOY: ambas manos en L (pulgar + índice extendidos, demás doblados) apuntando
  // hacia abajo, una junto a la otra a la misma altura (el momento presente).
  // Distinta de PAUSA (índices opuestos en vertical) y de CORAZON (puntas tocándose).
  const lLshape = lThumb && lIdx && !lMid && !lRing && !lPink;
  const rLshape = rThumb && rIdx && !rMid && !rRing && !rPink;
  if (lLshape && rLshape && !handsClose) {
    const down = left[8].y - left[0].y > 0 && right[8].y - right[0].y > 0;
    const sameRow = Math.abs(left[0].y - right[0].y) < 0.12;
    const apart = Math.abs(left[0].x - right[0].x);
    if (down && sameRow && apart > 0.06 && apart < 0.4) {
      return 'HOY';
    }
  }

  // TRABAJAR: ambos puños cerca (una contra la otra).
  const lFist = !lIdx && !lMid && !lRing && !lPink && !lThumb;
  const rFist = !rIdx && !rMid && !rRing && !rPink && !rThumb;
  if (lFist && rFist && handsClose) {
    return 'TRABAJAR';
  }

  // REUNION: ambas manos planas (B), una frente a la otra a distancia media y
  // a la misma altura (grupo reunido). Distinto de ORACION (palmas abiertas) y
  // de INFORME (una encima de la otra).
  if (lFlat && rFlat && !handsClose) {
    const palmY = Math.abs(left[9].y - right[9].y);
    const palmX = Math.abs(left[9].x - right[9].x);
    if (palmY < 0.08 && palmX > 0.12 && palmX < 0.35) {
      return 'REUNION';
    }
  }

  // INFORME: ambas manos planas (B), una encima de la otra a corta distancia
  // (como sosteniendo un documento).
  if (lFlat && rFlat) {
    const yGap = Math.abs(left[9].y - right[9].y);
    if (yGap > 0.08 && yGap < 0.3) {
      return 'INFORME';
    }
  }

  // ENVIAR: palmas abiertas, una claramente más arriba que la otra (empujar/envío).
  if (lOpen && rOpen) {
    const yGap = Math.abs(left[9].y - right[9].y);
    if (yGap > 0.2) {
      return 'ENVIAR';
    }
  }

  // PEDIR: una mano abierta y la otra cerrada, ambas cerca (petición/palma arriba).
  const lMuestra = lOpen && !rOpen;
  const rMuestra = rOpen && !lOpen;
  if ((lMuestra || rMuestra) && handsClose) {
    return 'PEDIR';
  }

  return null;
}
