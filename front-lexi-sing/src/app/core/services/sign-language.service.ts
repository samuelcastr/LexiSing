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
      const thumbIndexPinch = thumbIndexClose(lm);

      // TRAER: puño que se TRAE al cuerpo (z>0.05) TERMINANDO ARRIBA (y<0.55, al
      // pecho). GUARDAR termina abajo (y>0.55, "cajón").
      if (!idx && !mid && !ring && !pink && !thumb) {
        const zsTr = historial.map(h => h.landmarks[9].z);
        const ysTr = historial.map(h => h.landmarks[0].y);
        if (zsTr[zsTr.length - 1] - zsTr[0] > 0.05 && ysTr[ysTr.length - 1] < 0.55) {
          return 'TRAER';
        }
      }

      // GUARDAR_GESTO: puño cerrado que se acerca al cuerpo (z crece) TERMINANDO
      // ABAJO (y>0.55, "guardar en el cajón"). ENTRAR se acerca a cualquier
      // altura; el final bajo discrimina.
      if (!idx && !mid && !ring && !pink && !thumb) {
        const zsG = historial.map(h => h.landmarks[9].z);
        const ysG = historial.map(h => h.landmarks[0].y);
        const avanceZG = zsG[zsG.length - 1] - zsG[0];
        if (avanceZG > 0.05 && ysG[ysG.length - 1] > 0.55) {
          return 'GUARDAR_GESTO';
        }
      }

      // SALIR / ENTRAR: puño cerrado que se aleja (z decrece, hacia la cámara)
      // o se acerca (z crece, hacia el cuerpo). Misma forma de PUÑO_CERRADO
      // (Gracias) y PELIGRO (agitado lateral); aquí el movimiento es en
      // PROFUNDIDAD, no lateral.
      if (!idx && !mid && !ring && !pink && !thumb) {
        const zs = historial.map(h => h.landmarks[9].z);
        const avanceZ = zs[zs.length - 1] - zs[0];
        if (avanceZ < -0.07) {
          return 'SALIR';
        }
        if (avanceZ > 0.07) {
          return 'ENTRAR';
        }
      }

      // REPARAR: puño cerrado que golpea DOS veces hacia adelante (martillazo
      // doble en profundidad). SALIR/ENTRAR son pulsos únicos (net z grande).
      if (!idx && !mid && !ring && !pink && !thumb) {
        const histR = this.landmarkHistory
          .slice(-14)
          .map(frame => frame.find(m => m.handedness === mano.handedness))
          .filter((m): m is ManoDetectada => !!m);
        if (histR.length >= 9) {
          const zsR = histR.map(h => h.landmarks[9].z);
          const meanR = zsR.reduce((a, b) => a + b, 0) / zsR.length;
          let crucesR = 0;
          for (let i = 1; i < zsR.length; i++) {
            if ((zsR[i] - meanR) * (zsR[i - 1] - meanR) < 0) crucesR++;
          }
          if (crucesR >= 2) {
            return 'REPARAR';
          }
        }
      }

      // EMPEZAR: puño cerrado que golpea UNA vez hacia abajo (descenso brusco,
      // sin rebote). Distinto de PELIGRO (lateral), REPETIR (rebote vertical
      // pequeño) y SALIR/ENTRAR (movimiento en profundidad).
      if (!idx && !mid && !ring && !pink && !thumb) {
        const ysE = historial.map(h => h.landmarks[0].y);
        const meanYE = ysE.reduce((a, b) => a + b, 0) / ysE.length;
        let crucesYE = 0;
        for (let i = 1; i < ysE.length; i++) {
          if ((ysE[i] - meanYE) * (ysE[i - 1] - meanYE) < 0) crucesYE++;
        }
        if (ysE[ysE.length - 1] - ysE[0] > handSize * 1.0 && crucesYE < 2) {
          return 'EMPEZAR';
        }
      }

      // ALMACENAR: puño cerrado que DESCIENDE con deriva LATERAL marcada
      // (ubicar en un estante bajo). AUTORIZACION sella en recto (rango X
      // pequeño); aquí el desplazamiento lateral discrimina.
      if (!idx && !mid && !ring && !pink && !thumb) {
        const xsAL2 = historial.map(h => h.landmarks[0].x);
        const ysAL2 = historial.map(h => h.landmarks[0].y);
        const rangoXAL = Math.max(...xsAL2) - Math.min(...xsAL2);
        const descensoAL = ysAL2[ysAL2.length - 1] - ysAL2[0];
        if (descensoAL > handSize * 0.5 && rangoXAL > handSize * 0.4) {
          return 'ALMACENAR';
        }
      }

      // AUTORIZACION_GESTO: puño cerrado que DESCIENDE con amplitud MEDIA
      // (estampar un sello de aprobación). EMPEZAR golpea más profundo
      // (>1.0 handSize) y REPETIR rebota.
      if (!idx && !mid && !ring && !pink && !thumb) {
        const ysAU = historial.map(h => h.landmarks[0].y);
        const descensoAU = ysAU[ysAU.length - 1] - ysAU[0];
        if (descensoAU > handSize * 0.3 && descensoAU < handSize * 0.85) {
          return 'AUTORIZACION_GESTO';
        }
      }

      // REPETIR: puño cerrado que REBOTA en vertical (dos o más cruces con
      // amplitud pequeña). Distinto de EMPEZAR (un golpe grande) y de PELIGRO
      // (oscilación lateral).
      if (!idx && !mid && !ring && !pink && !thumb) {
        const ysR = historial.map(h => h.landmarks[0].y);
        const meanYR = ysR.reduce((a, b) => a + b, 0) / ysR.length;
        let crucesYR = 0;
        for (let i = 1; i < ysR.length; i++) {
          if ((ysR[i] - meanYR) * (ysR[i - 1] - meanYR) < 0) crucesYR++;
        }
        const rangoYR = Math.max(...ysR) - Math.min(...ysR);
        if (crucesYR >= 2 && rangoYR < handSize * 1.0) {
          return 'REPETIR';
        }
      }

      // RESOLVER_GESTO: puño cerrado que SUBE con golpe seco (ascenso marcado,
      // "resolver/solución"). MAÑANA sube con el índice y MEJORAR con el
      // pulgar; aquí la forma es el puño.
      if (!idx && !mid && !ring && !pink && !thumb) {
        const ysRS = historial.map(h => h.landmarks[0].y);
        if (ysRS[0] - ysRS[ysRS.length - 1] > handSize * 0.6) {
          return 'RESOLVER_GESTO';
        }
      }

      // LLEVAR: puño barriendo UNA vez en lateral con amplitud MEDIA (0.5-1.0
      // handSize, llevar algo al costado). NUNCA barre más amplio (>1.0) y
      // PELIGRO oscila.
      if (!idx && !mid && !ring && !pink && !thumb) {
        const xsLv = historial.map(h => h.landmarks[0].x);
        const meanLv = xsLv.reduce((a, b) => a + b, 0) / xsLv.length;
        let crucesLv = 0;
        for (let i = 1; i < xsLv.length; i++) {
          if ((xsLv[i] - meanLv) * (xsLv[i - 1] - meanLv) < 0) crucesLv++;
        }
        const rangoXLv = Math.max(...xsLv) - Math.min(...xsLv);
        if (rangoXLv > handSize * 0.5 && rangoXLv < handSize * 1.0 && crucesLv < 2) {
          return 'LLEVAR';
        }
      }

      // NUNCA: puño cerrado barriendo UNA vez en lateral con amplitud grande
      // (negación enfática). PELIGRO oscila (cruces>=2) y EMPEZAR golpea abajo.
      if (!idx && !mid && !ring && !pink && !thumb) {
        const xsNC = historial.map(h => h.landmarks[0].x);
        const ysNC = historial.map(h => h.landmarks[0].y);
        const meanNC = xsNC.reduce((a, b) => a + b, 0) / xsNC.length;
        let crucesNC = 0;
        for (let i = 1; i < xsNC.length; i++) {
          if ((xsNC[i] - meanNC) * (xsNC[i - 1] - meanNC) < 0) crucesNC++;
        }
        if (Math.max(...xsNC) - Math.min(...xsNC) > handSize * 1.0 &&
            crucesNC < 2 && Math.max(...ysNC) - Math.min(...ysNC) < handSize * 0.5) {
          return 'NUNCA';
        }
      }

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

      // MEJORAR: pulgar arriba (forma de Sí) que ASCIENDE de forma marcada
      // (las cosas van mejorando). "Sí" es estático; el ascenso discrimina.
      if (thumb && !idx && !mid && !ring && !pink) {
        const ysMJ = historial.map(h => h.landmarks[0].y);
        if (ysMJ[0] - ysMJ[ysMJ.length - 1] > handSize * 0.7) {
          return 'MEJORAR';
        }
      }

      // CONSULTAR: pulgar y meñique extendidos (forma de Llamar) VIBRANDO en
      // lateral: "consultar por teléfono". Llamar es estático; aquí hay micro
      // oscilación.
      if (thumb && !idx && !mid && !ring && pink) {
        const xsCS = historial.map(h => h.landmarks[0].x);
        const meanCS = xsCS.reduce((a, b) => a + b, 0) / xsCS.length;
        let crucesCS = 0;
        for (let i = 1; i < xsCS.length; i++) {
          if ((xsCS[i] - meanCS) * (xsCS[i - 1] - meanCS) < 0) crucesCS++;
        }
        if (crucesCS >= 3 &&
            Math.max(...xsCS) - Math.min(...xsCS) < handSize * 0.5) {
          return 'CONSULTAR';
        }
      }

      // ESCRIBIR: pinza pulgar-índice GARABATEANDO (micro oscilación de la
      // muñeca). PINZA/Supervisar/Puntual son estáticas; el movimiento pequeño
      // discrimina.
      if (thumbIndexPinch && !idx && !mid && !ring && !pink) {
        const xsES = historial.map(h => h.landmarks[0].x);
        const ysES = historial.map(h => h.landmarks[0].y);
        const rangoXES = Math.max(...xsES) - Math.min(...xsES);
        const rangoYES = Math.max(...ysES) - Math.min(...ysES);
        const crucesES = (arr: number[]) => {
          const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
          let c = 0;
          for (let i = 1; i < arr.length; i++) {
            if ((arr[i] - mean) * (arr[i - 1] - mean) < 0) c++;
          }
          return c;
        };
        if ((crucesES(xsES) >= 2 || crucesES(ysES) >= 2) &&
            rangoXES < handSize * 0.5 && rangoYES < handSize * 0.5) {
          return 'ESCRIBIR';
        }
      }

      // REGISTRAR: pinza pulgar-índice que DESCIENDE trazando una línea de
      // anotación (un solo trazo, sin garabatear). ESCRIBIR oscila.
      if (thumbIndexPinch && !idx && !mid && !ring && !pink) {
        const ysRG = historial.map(h => h.landmarks[0].y);
        if (ysRG[ysRG.length - 1] - ysRG[0] > handSize * 0.6) {
          return 'REGISTRAR';
        }
      }

      // ESTA_SEMANA: TRES dedos (índice+medio+anular) en una pasada HORIZONTAL
      // única (cruces<2, la semana que avanza). INTENTAR vibra (cruces≥2).
      if (idx && mid && ring && !pink && !thumb) {
        const xsSem = historial.map(h => h.landmarks[0].x);
        const ysSem = historial.map(h => h.landmarks[0].y);
        const meanXSem = xsSem.reduce((a, b) => a + b, 0) / xsSem.length;
        let crucesXSem = 0;
        for (let i = 1; i < xsSem.length; i++) {
          if ((xsSem[i] - meanXSem) * (xsSem[i - 1] - meanXSem) < 0) crucesXSem++;
        }
        const rangoXSem = Math.max(...xsSem) - Math.min(...xsSem);
        if (crucesXSem < 2 && rangoXSem > handSize * 0.5 && rangoXSem < handSize * 1.2 &&
            Math.max(...ysSem) - Math.min(...ysSem) < handSize * 0.4) {
          return 'ESTA_SEMANA';
        }
      }

      // ESTE_MES: TRES dedos en una pasada DIAGONAL (descenso con deriva
      // lateral, "el mes que pasa"). ESTA_SEMANA es horizontal (rangoY<0.4).
      if (idx && mid && ring && !pink && !thumb) {
        const xsMes = historial.map(h => h.landmarks[0].x);
        const ysMes = historial.map(h => h.landmarks[0].y);
        const meanXMes = xsMes.reduce((a, b) => a + b, 0) / xsMes.length;
        let crucesXMes = 0;
        for (let i = 1; i < xsMes.length; i++) {
          if ((xsMes[i] - meanXMes) * (xsMes[i - 1] - meanXMes) < 0) crucesXMes++;
        }
        const rangoXMes = Math.max(...xsMes) - Math.min(...xsMes);
        const rangoYMes = Math.max(...ysMes) - Math.min(...ysMes);
        if (crucesXMes < 2 && rangoXMes > handSize * 0.4 &&
            rangoYMes >= handSize * 0.4 && rangoYMes < handSize * 0.8) {
          return 'ESTE_MES';
        }
      }

      // ESTE_ANO: TRES dedos trazando un CÍRCULO (cruces en x y en y, el año
      // que da la vuelta). INTENTAR vibra solo en x; aquí hay ciclo completo.
      if (idx && mid && ring && !pink && !thumb) {
        const xsAno = historial.map(h => h.landmarks[0].x);
        const ysAno = historial.map(h => h.landmarks[0].y);
        const meanXAno = xsAno.reduce((a, b) => a + b, 0) / xsAno.length;
        const meanYAno = ysAno.reduce((a, b) => a + b, 0) / ysAno.length;
        let crucesXAno = 0, crucesYAno = 0;
        for (let i = 1; i < xsAno.length; i++) {
          if ((xsAno[i] - meanXAno) * (xsAno[i - 1] - meanXAno) < 0) crucesXAno++;
          if ((ysAno[i] - meanYAno) * (ysAno[i - 1] - meanYAno) < 0) crucesYAno++;
        }
        if (crucesXAno >= 2 && crucesYAno >= 2 &&
            Math.max(...xsAno) - Math.min(...xsAno) > handSize * 0.4) {
          return 'ESTE_ANO';
        }
      }

      // INTENTAR: índice+medio+anular extendidos (sin pulgar ni meñique)
      // oscilando en lateral con amplitud pequeña (probar/ensayar). TRES_DEDOS
      // (Por favor) es estático; el movimiento discrimina.
      if (idx && mid && ring && !pink && !thumb) {
        const xsT = historial.map(h => h.landmarks[0].x);
        const meanT = xsT.reduce((a, b) => a + b, 0) / xsT.length;
        let crucesT = 0;
        for (let i = 1; i < xsT.length; i++) {
          if ((xsT[i] - meanT) * (xsT[i - 1] - meanT) < 0) crucesT++;
        }
        const rangoT = Math.max(...xsT) - Math.min(...xsT);
        if (crucesT >= 2 && rangoT > handSize * 0.3 && rangoT < handSize * 1.0) {
          return 'INTENTAR';
        }
      }

      // PRODUCIR: índice+medio+anular (sin pulgar) descendiendo en UN golpe
      // firme (producir/ensamblar). EJECUTAR baja en dos pasos y EMPEZAR usa
      // el puño; aquí es un golpe seco con la forma de tres dedos.
      if (idx && mid && ring && !pink && !thumb) {
        const ysPD = historial.map(h => h.landmarks[0].y);
        const meanPD = ysPD.reduce((a, b) => a + b, 0) / ysPD.length;
        let crucesPD = 0;
        for (let i = 1; i < ysPD.length; i++) {
          if ((ysPD[i] - meanPD) * (ysPD[i - 1] - meanPD) < 0) crucesPD++;
        }
        if (ysPD[ysPD.length - 1] - ysPD[0] > handSize * 0.6 && crucesPD < 2) {
          return 'PRODUCIR';
        }
      }

      // CORREGIR: V (índice y medio) APUNTANDO ABAJO que baja en ZIGZAG AMPLIO
      // (rango ≥ 0.6, tachar/corregir). ANALIZAR vibra con amplitud pequeña
      // (<0.6); aquí el vaivén es más marcado.
      if (idx && mid && !ring && !pink && !thumb) {
        const dirCg = { dx: lm[8].x - lm[5].x, dy: lm[8].y - lm[5].y };
        if (Math.abs(dirCg.dy) > Math.abs(dirCg.dx) * 0.9) {
          const xsCG = historial.map(h => h.landmarks[0].x);
          const ysCG = historial.map(h => h.landmarks[0].y);
          const meanCG = xsCG.reduce((a, b) => a + b, 0) / xsCG.length;
          let crucesCG = 0;
          for (let i = 1; i < xsCG.length; i++) {
            if ((xsCG[i] - meanCG) * (xsCG[i - 1] - meanCG) < 0) crucesCG++;
          }
          if (crucesCG >= 2 &&
              Math.max(...xsCG) - Math.min(...xsCG) >= handSize * 0.6 &&
              ysCG[ysCG.length - 1] - ysCG[0] > handSize * 0.4) {
            return 'CORREGIR';
          }
        }
      }

      // ANALIZAR: V (índice y medio separados) APUNTANDO HACIA ABAJO que vibra
      // en lateral (analizar en detalle). RÁPIDO vibra sin importar la
      // orientación; aquí la punta domina hacia abajo.
      if (idx && mid && !ring && !pink && !thumb) {
        const dirAn = { dx: lm[8].x - lm[5].x, dy: lm[8].y - lm[5].y };
        if (Math.abs(dirAn.dy) > Math.abs(dirAn.dx) * 0.9) {
          const xsAN = historial.map(h => h.landmarks[0].x);
          const meanAN = xsAN.reduce((a, b) => a + b, 0) / xsAN.length;
          let crucesAN = 0;
          for (let i = 1; i < xsAN.length; i++) {
            if ((xsAN[i] - meanAN) * (xsAN[i - 1] - meanAN) < 0) crucesAN++;
          }
          if (crucesAN >= 2 &&
              Math.max(...xsAN) - Math.min(...xsAN) < handSize * 0.6) {
            return 'ANALIZAR';
          }
        }
      }

      // RAPIDO: V (índice y medio separados) VIBRANDO rápido en lateral con
      // pequeña amplitud. Adiós/También usan la misma V en estático; aquí el
      // movimiento discrimina.
      if (idx && mid && !ring && !pink && !thumb) {
        const xsRD = historial.map(h => h.landmarks[0].x);
        const meanRD = xsRD.reduce((a, b) => a + b, 0) / xsRD.length;
        let crucesRD = 0;
        for (let i = 1; i < xsRD.length; i++) {
          if ((xsRD[i] - meanRD) * (xsRD[i - 1] - meanRD) < 0) crucesRD++;
        }
        const rangoRD = Math.max(...xsRD) - Math.min(...xsRD);
        if (crucesRD >= 3 && rangoRD < handSize * 0.7) {
          return 'RAPIDO';
        }
      }

      // LENTO: mano abierta (3+ dedos) que se desliza en horizontal DESPACIO
      // (una pasada sin regreso, amplitud media). Dónde/Rápido oscilan;
      // aquí no hay cruces y la mano no desciende.
      if ([idx, mid, ring, pink].filter(Boolean).length >= 3) {
        const xsLN = historial.map(h => h.landmarks[0].x);
        const ysLN = historial.map(h => h.landmarks[0].y);
        const rangoXLN = Math.max(...xsLN) - Math.min(...xsLN);
        const rangoYLN = Math.max(...ysLN) - Math.min(...ysLN);
        if (rangoXLN > handSize * 0.3 && rangoXLN < handSize * 0.9 &&
            rangoYLN < handSize * 0.4) {
          return 'LENTO';
        }
      }

      // INVESTIGAR: índice APUNTANDO HACIA ABAJO (punta bajo la muñeca) trazando
      // círculos con la mano baja (y≥0.4, "escarbar sobre la mesa"). BUSCAR y
      // SIEMPRE circulan con el índice al frente; la orientación discrimina.
      if (idx && !mid && !ring && !pink && !thumb && lm[0].y >= 0.4) {
        const dirIn = { dx: lm[8].x - lm[5].x, dy: lm[8].y - lm[5].y };
        if (dirIn.dy > Math.abs(dirIn.dx) * 0.9) {
          const histIN = this.landmarkHistory
            .slice(-14)
            .map(frame => frame.find(m => m.handedness === mano.handedness))
            .filter((m): m is ManoDetectada => !!m);
          if (histIN.length >= 9) {
            const xsIN = histIN.map(h => h.landmarks[0].x);
            const ysIN = histIN.map(h => h.landmarks[0].y);
            const crucesIN = (arr: number[]) => {
              const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
              let c = 0;
              for (let i = 1; i < arr.length; i++) {
                if ((arr[i] - mean) * (arr[i - 1] - mean) < 0) c++;
              }
              return c;
            };
            if (crucesIN(xsIN) >= 2 && crucesIN(ysIN) >= 2) {
              return 'INVESTIGAR';
            }
          }
        }
      }

      // BUSCAR: índice solo extendido trazando un movimiento CIRCULAR frente a la
      // cara (oscila en x y en y). Distinto de QUE (estático), de MAÑANA
      // (sube) y de IR (barrido lateral unilateral).
      if (idx && !mid && !ring && !pink && !thumb && lm[0].y < 0.6) {
        const histB = this.landmarkHistory
          .slice(-14)
          .map(frame => frame.find(m => m.handedness === mano.handedness))
          .filter((m): m is ManoDetectada => !!m);
        if (histB.length >= 9) {
          const xsB = histB.map(h => h.landmarks[0].x);
          const ysB = histB.map(h => h.landmarks[0].y);
          const cruces = (arr: number[]) => {
            const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
            let c = 0;
            for (let i = 1; i < arr.length; i++) {
              if ((arr[i] - mean) * (arr[i - 1] - mean) < 0) c++;
            }
            return c;
          };
          if (cruces(xsB) >= 2 && cruces(ysB) >= 2) {
            return 'BUSCAR';
          }
        }
      }

      // PREGUNTAR: índice solo extendido VIBRANDO rápido en lateral (micro
      // oscilación, pequeña amplitud). Distinto de BUSCAR (circular), de IR
      // (barrido amplio) y de QUE (estático).
      if (idx && !mid && !ring && !pink && !thumb) {
        const xsP = historial.map(h => h.landmarks[0].x);
        const ysP = historial.map(h => h.landmarks[0].y);
        const crucesP = (arr: number[]) => {
          const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
          let c = 0;
          for (let i = 1; i < arr.length; i++) {
            if ((arr[i] - mean) * (arr[i - 1] - mean) < 0) c++;
          }
          return c;
        };
        const rangoXP = Math.max(...xsP) - Math.min(...xsP);
        if (crucesP(xsP) >= 3 && rangoXP < handSize * 0.6 && crucesP(ysP) < 3) {
          return 'PREGUNTAR';
        }
      }

      // SIEMPRE: índice solo trazando un CÍRCULO a la altura del pecho
      // (y>0.55). BUSCAR hace el círculo frente a la cara (y<0.6) y se evalúa
      // antes, así que aquí queda el círculo bajo.
      if (idx && !mid && !ring && !pink && !thumb && lm[0].y > 0.55) {
        const histS = this.landmarkHistory
          .slice(-14)
          .map(frame => frame.find(m => m.handedness === mano.handedness))
          .filter((m): m is ManoDetectada => !!m);
        if (histS.length >= 9) {
          const xsS = histS.map(h => h.landmarks[0].x);
          const ysS = histS.map(h => h.landmarks[0].y);
          const crucesS = (arr: number[]) => {
            const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
            let c = 0;
            for (let i = 1; i < arr.length; i++) {
              if ((arr[i] - mean) * (arr[i - 1] - mean) < 0) c++;
            }
            return c;
          };
          if (crucesS(xsS) >= 2 && crucesS(ysS) >= 2) {
            return 'SIEMPRE';
          }
        }
      }

      // IR: índice solo extendido que se desplaza en HORIZONTAL (excursión
      // lateral grande y sostenida, sin circular). Distinto de QUE (estático,
      // sin movimiento sustancial).
      if (idx && !mid && !ring && !pink && !thumb) {
        const xsI = historial.map(h => h.landmarks[0].x);
        const ysI = historial.map(h => h.landmarks[0].y);
        const rangeYI = Math.max(...ysI) - Math.min(...ysI);
        if (Math.max(...xsI) - Math.min(...xsI) > handSize * 1.1 &&
            rangeYI < handSize * 0.6) {
          return 'IR';
        }
      }

      // RESPONDER: índice solo extendido que sale DESDE LA CARA descendiendo
      // (la respuesta "sale" de la boca). Distinto de MAÑANA (asciende) y de
      // IR (barrido lateral).
      if (idx && !mid && !ring && !pink && !thumb) {
        const ysRes = historial.map(h => h.landmarks[0].y);
        if (ysRes[0] < 0.4 && ysRes[ysRes.length - 1] - ysRes[0] > handSize * 0.8) {
          return 'RESPONDER';
        }
      }

      // ANTES: MEÑIQUE extendido que RETROCEDE en lateral (una pasada, sin
      // regreso). Ninguna otra regla de movimiento usa el meñique solo; las de
      // puño y abierta no aplican a esta forma.
      if (!idx && !mid && !ring && pink && !thumb) {
        const xsAnt = historial.map(h => h.landmarks[0].x);
        const retrocesoAnt = Math.max(...xsAnt) - Math.min(...xsAnt);
        if (retrocesoAnt > handSize * 0.6 && retrocesoAnt < handSize * 1.2) {
          return 'ANTES';
        }
      }

      // TARDE_RETRASO: índice que BAJA en DOS micro-pasos (el reloj marcando el
      // atraso, con descenso neto). A_VECES oscila en vertical sin bajar.
      if (idx && !mid && !ring && !pink && !thumb) {
        const ysRet = historial.map(h => h.landmarks[0].y);
        const meanYRet = ysRet.reduce((a, b) => a + b, 0) / ysRet.length;
        let crucesYRet = 0;
        for (let i = 1; i < ysRet.length; i++) {
          if ((ysRet[i] - meanYRet) * (ysRet[i - 1] - meanYRet) < 0) crucesYRet++;
        }
        if (crucesYRet >= 2 && ysRet[ysRet.length - 1] - ysRet[0] > handSize * 0.3 &&
            ysRet[ysRet.length - 1] > 0.45) {
          return 'TARDE_RETRASO';
        }
      }

      // HORA_EXTRA: índice que da UN golpe corto descendente a la altura de la
      // muñeca (marcar horas extra). AHORA es estático; aquí hay un trazo único
      // que termina en la zona de la muñeca.
      if (idx && !mid && !ring && !pink && !thumb) {
        const ysHx = historial.map(h => h.landmarks[0].y);
        const meanYHx = ysHx.reduce((a, b) => a + b, 0) / ysHx.length;
        let crucesYHx = 0;
        for (let i = 1; i < ysHx.length; i++) {
          if ((ysHx[i] - meanYHx) * (ysHx[i - 1] - meanYHx) < 0) crucesYHx++;
        }
        const descHx = ysHx[ysHx.length - 1] - ysHx[0];
        if (crucesYHx < 2 && descHx > handSize * 0.3 && descHx < handSize * 0.6 &&
            ysHx[ysHx.length - 1] > 0.4 && ysHx[ysHx.length - 1] < 0.68) {
          return 'HORA_EXTRA';
        }
      }

      // A_VECES: índice solo que oscila en VERTICAL dos veces (ritmo de
      // "a veces sí, a veces no"). MAÑANA asciende una vez; PREGUNTAR vibra
      // en lateral.
      if (idx && !mid && !ring && !pink && !thumb) {
        const xsAV = historial.map(h => h.landmarks[0].x);
        const ysAV = historial.map(h => h.landmarks[0].y);
        const meanYAV = ysAV.reduce((a, b) => a + b, 0) / ysAV.length;
        let crucesYAV = 0;
        for (let i = 1; i < ysAV.length; i++) {
          if ((ysAV[i] - meanYAV) * (ysAV[i - 1] - meanYAV) < 0) crucesYAV++;
        }
        if (crucesYAV >= 2 &&
            Math.max(...xsAV) - Math.min(...xsAV) < handSize * 0.5) {
          return 'A_VECES';
        }
      }

      // DURACION: índice solo extendido que se ALEJA lentamente en profundidad
      // (el tiempo "se alarga"). RECHAZAR/RECIBIR usan mano abierta.
      if (idx && !mid && !ring && !pink && !thumb) {
        const zsDR = historial.map(h => h.landmarks[9].z);
        const avanceZDR = zsDR[zsDR.length - 1] - zsDR[0];
        if (avanceZDR < -0.05) {
          return 'DURACION';
        }
      }

      // TRANSFERIR_GESTO: ÍNDICE+MEDIO+MEÑIQUE extendidos (sin anular ni
      // pulgar) desplazándose en una pasada lateral (transferir/trasladar).
      if (idx && mid && !ring && pink && !thumb) {
        const xsTF = historial.map(h => h.landmarks[0].x);
        const ysTF = historial.map(h => h.landmarks[0].y);
        if (Math.max(...xsTF) - Math.min(...xsTF) > handSize * 0.8 &&
            Math.max(...ysTF) - Math.min(...ysTF) < handSize * 0.5) {
          return 'TRANSFERIR_GESTO';
        }
      }

      // ALMUERZO: mano abierta (3+ dedos) que va DOS veces hacia la boca
      // (comer), terminando en la parte alta del encuadre.
      if ([idx, mid, ring, pink].filter(Boolean).length >= 3) {
        const ysAL = historial.map(h => h.landmarks[0].y);
        const meanYAL = ysAL.reduce((a, b) => a + b, 0) / ysAL.length;
        let crucesYAL = 0;
        for (let i = 1; i < ysAL.length; i++) {
          if ((ysAL[i] - meanYAL) * (ysAL[i - 1] - meanYAL) < 0) crucesYAL++;
        }
        if (crucesYAL >= 2 && ysAL[ysAL.length - 1] < 0.42) {
          return 'ALMUERZO';
        }
      }

      // PASADO: mano abierta (3+ dedos) que SUBE con deriva lateral marcada
      // (rango X ≥ 0.4, pasar hacia atrás). TEMPRANO asciende en recto y más
      // profundo (>0.9); aquí la subida es media con trayectoria curva.
      if ([idx, mid, ring, pink].filter(Boolean).length >= 3) {
        const xsPas = historial.map(h => h.landmarks[0].x);
        const ysPas = historial.map(h => h.landmarks[0].y);
        const subPas = ysPas[0] - ysPas[ysPas.length - 1];
        if (subPas > handSize * 0.4 && subPas < handSize * 0.9 &&
            Math.max(...xsPas) - Math.min(...xsPas) > handSize * 0.4) {
          return 'PASADO';
        }
      }

      // TEMPRANO: mano abierta (3+ dedos) que ASCIENDE de forma marcada (el
      // día que amanece). MAÑANA usa índice solo y LLEGAR/TARDE descienden.
      if ([idx, mid, ring, pink].filter(Boolean).length >= 3) {
        const ysTP = historial.map(h => h.landmarks[0].y);
        if (ysTP[0] - ysTP[ysTP.length - 1] > handSize * 0.9) {
          return 'TEMPRANO';
        }
      }

      // TARDE: mano abierta (3+ dedos) que DESCIENDE en diagonal con arco
      // lateral (el sol bajando). LLEGAR baja en línea recta (rango X corto).
      if ([idx, mid, ring, pink].filter(Boolean).length >= 3) {
        const xsTD = historial.map(h => h.landmarks[0].x);
        const ysTD = historial.map(h => h.landmarks[0].y);
        const rangoXTD = Math.max(...xsTD) - Math.min(...xsTD);
        if (ysTD[ysTD.length - 1] - ysTD[0] > handSize * 0.8 && rangoXTD > handSize * 0.4) {
          return 'TARDE';
        }
      }

      // DESCANSO: mano abierta (3+ dedos) que BAJA suave y corto (0.3-0.6 handSize,
      // pausa). IMPRIMIR aplasta parecido pero pide terminar abajo (y>0.6);
      // aquí el descenso es contenido.
      if ([idx, mid, ring, pink].filter(Boolean).length >= 3) {
        const xsDes = historial.map(h => h.landmarks[0].x);
        const ysDes = historial.map(h => h.landmarks[0].y);
        const meanYDes = ysDes.reduce((a, b) => a + b, 0) / ysDes.length;
        let crucesYDes = 0;
        for (let i = 1; i < ysDes.length; i++) {
          if ((ysDes[i] - meanYDes) * (ysDes[i - 1] - meanYDes) < 0) crucesYDes++;
        }
        const descDes = ysDes[ysDes.length - 1] - ysDes[0];
        if (descDes > handSize * 0.3 && descDes < handSize * 0.6 &&
            crucesYDes < 2 &&
            Math.max(...xsDes) - Math.min(...xsDes) < handSize * 0.5 &&
            ysDes[ysDes.length - 1] > 0.5) {
          return 'DESCANSO';
        }
      }

      // IMPRIMIR_GESTO: mano abierta (4 dedos, sin pulgar) que APLASTA hacia abajo
      // (descenso medio y termina abajo y>0.6: "imprimir la hoja"). LLEGAR
      // desciende más profundo (>0.9); aquí es un aplastado contenido.
      if (idx && mid && ring && pink && !thumb) {
        const xsIM = historial.map(h => h.landmarks[0].x);
        const ysIM = historial.map(h => h.landmarks[0].y);
        const meanIM = ysIM.reduce((a, b) => a + b, 0) / ysIM.length;
        let crucesIM = 0;
        for (let i = 1; i < ysIM.length; i++) {
          if ((ysIM[i] - meanIM) * (ysIM[i - 1] - meanIM) < 0) crucesIM++;
        }
        const descensoIM = ysIM[ysIM.length - 1] - ysIM[0];
        if (descensoIM > handSize * 0.5 && descensoIM < handSize * 0.9 &&
            ysIM[ysIM.length - 1] > 0.6 && crucesIM < 2 &&
            Math.max(...xsIM) - Math.min(...xsIM) < handSize * 0.4) {
          return 'IMPRIMIR_GESTO';
        }
      }

      // LLEGAR: mano abierta (3+ dedos) que DESCIENDE en línea recta (rango X
      // corto) y se detiene (llegada/aterrizaje). Distinta de TARDE (arco
      // lateral amplio), de DONDE (oscila en x) y de RECHAZAR/RECIBIR (z).
      if ([idx, mid, ring, pink].filter(Boolean).length >= 3) {
        const xsL2 = historial.map(h => h.landmarks[0].x);
        const ysL2 = historial.map(h => h.landmarks[0].y);
        const rangoXL2 = Math.max(...xsL2) - Math.min(...xsL2);
        const desciende = ysL2[ysL2.length - 1] - ysL2[0];
        if (desciende > handSize * 0.9 && rangoXL2 < handSize * 0.4) {
          return 'LLEGAR';
        }
      }

      // TERMINAR: mano abierta (3+ dedos) que BAJA mientras gira la palma (una
      // rotación + descenso: "cerrar el asunto"). LEER gira sin bajar; el
      // descenso discrimina.
      if ([idx, mid, ring, pink].filter(Boolean).length >= 3) {
        const angsTm = historial.map(h => {
          const lmH = h.landmarks;
          return Math.atan2(lmH[9].y - lmH[0].y, lmH[9].x - lmH[0].x);
        });
        const meanTm = angsTm.reduce((a, b) => a + b, 0) / angsTm.length;
        let crucesTm = 0;
        for (let i = 1; i < angsTm.length; i++) {
          if ((angsTm[i] - meanTm) * (angsTm[i - 1] - meanTm) < 0) crucesTm++;
        }
        const ysTm = historial.map(h => h.landmarks[0].y);
        if (crucesTm === 1 && ysTm[ysTm.length - 1] - ysTm[0] > handSize * 0.4) {
          return 'TERMINAR';
        }
      }

      // LEER: mano abierta (3+ dedos) que gira la palma UNA vez (pasar la hoja).
      // CAMBIAR rota dos o más veces; aquí hay exactamente un cruce.
      if ([idx, mid, ring, pink].filter(Boolean).length >= 3) {
        const angsLR = historial.map(h => {
          const lmH = h.landmarks;
          return Math.atan2(lmH[9].y - lmH[0].y, lmH[9].x - lmH[0].x);
        });
        const meanLR = angsLR.reduce((a, b) => a + b, 0) / angsLR.length;
        let crucesLR = 0;
        for (let i = 1; i < angsLR.length; i++) {
          if ((angsLR[i] - meanLR) * (angsLR[i - 1] - meanLR) < 0) crucesLR++;
        }
        if (crucesLR === 1) {
          return 'LEER';
        }
      }

      // CAMBIAR: rotación de la muñeca (palma arriba ↔ abajo) con mano abierta
      // (3+ dedos): dos o más cruces del ángulo del antebrazo. Ninguna otra
      // seña mide rotación pura.
      if ([idx, mid, ring, pink].filter(Boolean).length >= 3) {
        const angsCB = historial.map(h => {
          const lmH = h.landmarks;
          return Math.atan2(lmH[9].y - lmH[0].y, lmH[9].x - lmH[0].x);
        });
        const meanCB = angsCB.reduce((a, b) => a + b, 0) / angsCB.length;
        let crucesCB = 0;
        for (let i = 1; i < angsCB.length; i++) {
          if ((angsCB[i] - meanCB) * (angsCB[i - 1] - meanCB) < 0) crucesCB++;
        }
        if (crucesCB >= 2) {
          return 'CAMBIAR';
        }
      }

      // ACTUALIZAR: puño cerrado ROTANDO la muñeca dos o más veces (actualizar/
      // renovar la versión). LEER/CAMBIAR rotan con mano abierta; aquí la
      // forma es el puño.
      if (!idx && !mid && !ring && !pink && !thumb) {
        const angsAC = historial.map(h => {
          const lmH = h.landmarks;
          return Math.atan2(lmH[9].y - lmH[0].y, lmH[9].x - lmH[0].x);
        });
        const meanAC = angsAC.reduce((a, b) => a + b, 0) / angsAC.length;
        let crucesAC = 0;
        for (let i = 1; i < angsAC.length; i++) {
          if ((angsAC[i] - meanAC) * (angsAC[i - 1] - meanAC) < 0) crucesAC++;
        }
        if (crucesAC >= 2) {
          return 'ACTUALIZAR';
        }
      }

      // EJECUTAR: mano abierta (3+ dedos) que baja en DOS pasos hacia el pecho
      // (ejecutar tareas por pasos). ALMUERZO acaba arriba; aquí termina abajo
      // (y>0.45) con amplitud media.
      if ([idx, mid, ring, pink].filter(Boolean).length >= 3) {
        const ysEJ = historial.map(h => h.landmarks[0].y);
        const meanEJ = ysEJ.reduce((a, b) => a + b, 0) / ysEJ.length;
        let crucesEJ = 0;
        for (let i = 1; i < ysEJ.length; i++) {
          if ((ysEJ[i] - meanEJ) * (ysEJ[i - 1] - meanEJ) < 0) crucesEJ++;
        }
        if (crucesEJ >= 2 && ysEJ[ysEJ.length - 1] > 0.45 &&
            Math.max(...ysEJ) - Math.min(...ysEJ) < handSize * 1.0) {
          return 'EJECUTAR';
        }
      }

      // ELIMINAR_GESTO: mano abierta (4+ dedos) barriendo UNA vez en lateral por
      // la parte ALTA (y<0.5, "borrar del aire"), amplitud media-grande.
      // Dónde oscila o barre bajo; aquí es una pasada alta y seca.
      if (idx && mid && ring && pink) {
        const xsEL = historial.map(h => h.landmarks[0].x);
        const ysEL = historial.map(h => h.landmarks[0].y);
        const meanEL = xsEL.reduce((a, b) => a + b, 0) / xsEL.length;
        let crucesEL = 0;
        for (let i = 1; i < xsEL.length; i++) {
          if ((xsEL[i] - meanEL) * (xsEL[i - 1] - meanEL) < 0) crucesEL++;
        }
        if (Math.max(...xsEL) - Math.min(...xsEL) > handSize * 0.7 &&
            crucesEL < 2 && ysEL[0] < 0.5) {
          return 'ELIMINAR_GESTO';
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

      // APRENDER: la mano pasa de ABIERTA (4+ dedos) a CERRADA (puño) dentro de
      // la ventana (tomar el conocimiento). Ninguna otra seña combina ambos
      // extremos en el mismo trazo.
      {
        const histA = this.landmarkHistory
          .slice(-12)
          .map(frame => frame.find(m => m.handedness === mano.handedness))
          .filter((m): m is ManoDetectada => !!m);
        if (histA.length >= 8) {
          const cuentaExt = (h: ManoDetectada) =>
            [fingerExtended(h.landmarks, 8, 6), fingerExtended(h.landmarks, 12, 10),
             fingerExtended(h.landmarks, 16, 14), fingerExtended(h.landmarks, 20, 18)]
              .filter(Boolean).length;
          const serieA = histA.map(cuentaExt);
          if (serieA[0] >= 4 && serieA[serieA.length - 1] <= 1) {
            return 'APRENDER';
          }
        }
      }

      // HABLAR: mano abierta (3+ dedos) junto a la BOCA (y<0.45) con doble pulso
      // en profundidad (hablar). CONTINUAR hace z-pulsos a cualquier altura;
      // aquí la mano queda alta.
      if ([idx, mid, ring, pink].filter(Boolean).length >= 3 && lm[0].y < 0.45) {
        const histHB = this.landmarkHistory
          .slice(-14)
          .map(frame => frame.find(m => m.handedness === mano.handedness))
          .filter((m): m is ManoDetectada => !!m);
        if (histHB.length >= 9) {
          const zsHB = histHB.map(h => h.landmarks[9].z);
          const meanHB = zsHB.reduce((a, b) => a + b, 0) / zsHB.length;
          let crucesHB = 0;
          for (let i = 1; i < zsHB.length; i++) {
            if ((zsHB[i] - meanHB) * (zsHB[i - 1] - meanHB) < 0) crucesHB++;
          }
          if (crucesHB >= 2) {
            return 'HABLAR';
          }
        }
      }

      // SOLICITUD_GESTO: mano abierta (3+ dedos) que tira HACIA EL CUERPO en dos
      // tirones (cruces z≥2 con avance neto hacia adentro: "pedir favor").
      // CONTINUAR impulsa hacia adelante; aquí el neto va hacia el cuerpo.
      if ([idx, mid, ring, pink].filter(Boolean).length >= 3) {
        const histS2 = this.landmarkHistory
          .slice(-14)
          .map(frame => frame.find(m => m.handedness === mano.handedness))
          .filter((m): m is ManoDetectada => !!m);
        if (histS2.length >= 9) {
          const zsS2 = histS2.map(h => h.landmarks[9].z);
          const meanS2 = zsS2.reduce((a, b) => a + b, 0) / zsS2.length;
          let crucesS2 = 0;
          for (let i = 1; i < zsS2.length; i++) {
            if ((zsS2[i] - meanS2) * (zsS2[i - 1] - meanS2) < 0) crucesS2++;
          }
          if (crucesS2 >= 2 && zsS2[zsS2.length - 1] - zsS2[0] > 0.02) {
            return 'SOLICITUD_GESTO';
          }
        }
      }

      // CONTINUAR: mano abierta dando DOS pulsos hacia adelante (doble cruce en
      // profundidad z). RECHAZAR/RECIBIR son pulsos únicos.
      if ([idx, mid, ring, pink].filter(Boolean).length >= 3) {
        const histC = this.landmarkHistory
          .slice(-14)
          .map(frame => frame.find(m => m.handedness === mano.handedness))
          .filter((m): m is ManoDetectada => !!m);
        if (histC.length >= 9) {
          const zsC = histC.map(h => h.landmarks[9].z);
          const meanC = zsC.reduce((a, b) => a + b, 0) / zsC.length;
          let crucesC = 0;
          for (let i = 1; i < zsC.length; i++) {
            if ((zsC[i] - meanC) * (zsC[i - 1] - meanC) < 0) crucesC++;
          }
          if (crucesC >= 2) {
            return 'CONTINUAR';
          }
        }
      }

      // CONSEGUIR: mano abierta que SE CIERRA mientras se acerca al cuerpo
      // (atrapar el logro: los dedos se pliegan y la muñeca vuelve en z).
      // TOMAR solo cierra; aquí además hay tiraje de profundidad.
      {
        const cerrC = historial.map(h => {
          const l = h.landmarks;
          return [8, 12, 16, 20].filter(i => dist(l[i], l[0]) > handSize * 0.9).length;
        });
        const zsC2 = historial.map(h => h.landmarks[9].z);
        if (cerrC[0] >= 3 && cerrC[cerrC.length - 1] <= 1 &&
            Math.max(...zsC2) - zsC2[zsC2.length - 1] > 0.04) {
          return 'CONSEGUIR';
        }
      }

      // TOMAR: mano que SE CIERRA (3+ dedos extendidos al inicio y ≤1 al
      // final: agarrar/recoger algo). Ninguna otra seña mide el cierre de la
      // mano.
      {
        const cerrT = historial.map(h => {
          const l = h.landmarks;
          return [8, 12, 16, 20].filter(i => dist(l[i], l[0]) > handSize * 0.9).length;
        });
        if (cerrT[0] >= 3 && cerrT[cerrT.length - 1] <= 1) {
          return 'TOMAR';
        }
      }

      // ENCONTRAR: mano que SE ABRE (puño → abierta: dedos extendidos crecen
      // ≥2, "encontrar/descubrir"). TOMAR es el cierre; aquí es la apertura.
      {
        const abrE = historial.map(h => {
          const l = h.landmarks;
          return [8, 12, 16, 20].filter(i => dist(l[i], l[0]) > handSize * 0.9).length;
        });
        if (abrE[0] <= 1 && abrE[abrE.length - 1] >= 3) {
          return 'ENCONTRAR';
        }
      }

      // DESPUES: mano abierta (3+ dedos) que se ALEJA hacia adelante con un
      // avance contenida (-0.05 a -0.14) TERMINANDO BAJO (y>0.55). RECHAZAR
      // empuja fuerte (z<-0.08) a cualquier altura; aquí el final bajo en la
      // trayectoria a media distancia discrimina. (Provisional LSC.)
      if ([idx, mid, ring, pink].filter(Boolean).length >= 3) {
        const zsDes = historial.map(h => h.landmarks[9].z);
        const ysDes = historial.map(h => h.landmarks[0].y);
        const avanceZDes = zsDes[zsDes.length - 1] - zsDes[0];
        if (avanceZDes < -0.05 && avanceZDes > -0.14 && ysDes[ysDes.length - 1] > 0.55) {
          return 'DESPUES';
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
  NADA: 'Nada',

  // Fase 3 - lote 1 (Bloque B: verbos de acción) — configs provisionales LSC
  IR: 'Ir',
  VENIR: 'Venir',
  LLEGAR: 'Llegar',
  SALIR: 'Salir',
  ENTRAR: 'Entrar',
  QUERER: 'Querer',
  PODER: 'Poder',
  DEBER: 'Deber',
  TENER: 'Tener',
  BUSCAR: 'Buscar',
  LOGRAR: 'Lograr',
  EMPEZAR: 'Empezar',
  INTENTAR: 'Intentar',
  REPETIR: 'Repetir',
  CONTINUAR: 'Continuar',
  PREGUNTAR: 'Preguntar',
  RESPONDER: 'Responder',
  APRENDER: 'Aprender',
  ENTENDER: 'Entender',
  SABER: 'Saber',
  TEMPRANO: 'Temprano',
  TARDE: 'Tarde',
  PUNTUAL: 'Puntual',
  RAPIDO: 'Rápido',
  LENTO: 'Lento',
  SIEMPRE: 'Siempre',
  NUNCA: 'Nunca',
  A_VECES: 'A veces',
  DURACION: 'Duración',
  ALMUERZO: 'Almuerzo',

  // Fase 3 - lote 4 (Bloque B: más verbos/acción) — configs provisionales LSC
  AVISAR: 'Avisar',
  CONFIRMAR: 'Confirmar',
  VERIFICAR: 'Verificar',
  CALIFICAR: 'Calificar',
  PRIORIZAR: 'Priorizar',
  AUTORIZACION_GESTO: 'Autorizar',
  CAMBIAR: 'Cambiar',
  MEJORAR: 'Mejorar',
  REPARAR: 'Reparar',
  EJECUTAR: 'Ejecutar',

  // Fase 3 - lote 5 (Bloque B: más verbos/acción) — configs provisionales LSC
  LEER: 'Leer',
  ESCRIBIR: 'Escribir',
  HABLAR: 'Hablar',
  CONSULTAR: 'Consultar',
  TRANSFERIR_GESTO: 'Transferir',
  ANALIZAR: 'Analizar',
  REGISTRAR: 'Registrar',
  GUARDAR_GESTO: 'Guardar',
  VENDER: 'Vender',
  ELIMINAR_GESTO: 'Eliminar',

  // Fase 3 - lote 6 (Bloque B: últimos verbos de acción) — provisionales LSC
  TOMAR: 'Tomar',
  CONSEGUIR: 'Conseguir',
  PRODUCIR: 'Producir',
  INVESTIGAR: 'Investigar',
  IMPRIMIR_GESTO: 'Imprimir',
  CORREGIR: 'Corregir',
  RESOLVER_GESTO: 'Resolver',
  SOLICITUD_GESTO: 'Solicitar',
  ACTUALIZAR: 'Actualizar',
  ALMACENAR: 'Almacenar',

  // Fase 3 - lote 7 (cierre de una mano: resto de B + C) — provisionales LSC
  HACER: 'Hacer',
  ENCONTRAR: 'Encontrar',
  TRAER: 'Traer',
  LLEVAR: 'Llevar',
  TERMINAR: 'Terminar',
  TARDE_RETRASO: 'Retraso',
  PASADO: 'Pasado',
  ESTA_SEMANA: 'Esta semana',
  ESTE_MES: 'Este mes',
  ESTE_ANO: 'Este año',
  DESCANSO: 'Descanso',
  HORA_EXTRA: 'Hora extra',

  // Fase 2 - lote 8 (Bloque A, una mano) — provisionales LSC
  QUIEN: 'Quién',
  CUANDO: 'Cuándo',
  POR_QUE: 'Por qué',
  COMO: 'Cómo',
  CUANTO: 'Cuánto',
  CUAL: 'Cuál',
  PARA_QUE: 'Para qué',
  TODO: 'Todo',
  ANTES: 'Antes',
  DESPUES: 'Después',

  // Fase 2 - lote 9 (A restante + primeros D) — provisionales LSC
  ALGO: 'Algo',
  NADIE: 'Nadie',
  TAMPOCO: 'Tampoco',
  CERCA: 'Cerca',
  LEJOS: 'Lejos',
  BIEN: 'Bien',
  MAL: 'Mal',
  LISTO: 'Listo',
  PREPARADO: 'Preparado',
  DISPONIBLE: 'Disponible'
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

  // DISPONIBLE: pinza pulgar-índice con la muñeca HORIZONTAL (mano tendida,
  // "disponible"). La pinza en vertical conserva Supervisar/Puntual/Pinza.
  if (thumbIndexPinch && !idx && !mid && !ring && !pink &&
      Math.abs(lm[9].x - lm[0].x) > Math.abs(lm[9].y - lm[0].y) * 0.9) {
    return 'DISPONIBLE';
  }

  // SUPERVISAR: círculo con pulgar e índice llevado a la altura del ojo
  // (vigilar/monitorear). PINZA tiene la misma forma pero a nivel del pecho;
  // la altura de la muñeca discrimina.
  if (thumbIndexPinch && !idx && !mid && !ring && !pink && (lm[0].y + lm[9].y) / 2 < 0.45) {
    return 'SUPERVISAR';
  }

  // PUNTUAL: pinza de pulgar-índice a la altura BAJA (junto al reloj, y>0.6).
  // SUPERVISAR es la pinza alta (y<0.45) y PINZA la del pecho.
  if (thumbIndexPinch && !idx && !mid && !ring && !pink && (lm[0].y + lm[9].y) / 2 > 0.6) {
    return 'PUNTUAL';
  }

  if (thumbIndexPinch && !idx && !mid && !ring && !pink) {
    return 'PINZA';
  }

  // ENTENDER: índice y medio juntos (misma forma de QUERER) tocando la SIEN —
  // la muñeca alta discrimina frente a Querer (frente al pecho).
  if (idx && mid && !ring && !pink && lm[0].y < 0.4 &&
      fingerTipsTouching(8, 12, lm, 0.45) &&
      !fingerTipsTouching(4, 8, lm, 0.3)) {
    return 'ENTENDER';
  }

  // QUERER: índice y medio extendidos CON LAS PUNTAS JUNTAS frente al pecho
  // (no es la V de Adiós/También, cuyas puntas van separadas). El pulgar no
  // debe rozar la punta del índice (ese caso es NUMERO_7, evaluado antes).
  if (idx && mid && !ring && !pink &&
      fingerTipsTouching(8, 12, lm, 0.45) &&
      !fingerTipsTouching(4, 8, lm, 0.3)) {
    return 'QUERER';
  }

  // VERIFICAR: V (índice y medio separados) HORIZONTAL y en la parte ALTA del
  // encuadre (revisar con la mirada). Adiós/También se hacen más abajo; el
  // ángulo horizontal + la altitud discriminan.
  if (idx && mid && !ring && !pink && (lm[0].y + lm[9].y) / 2 < 0.35) {
    const dirVer = { dx: lm[8].x - lm[5].x, dy: lm[8].y - lm[5].y };
    if (Math.abs(dirVer.dx) > Math.abs(dirVer.dy) * 0.9) {
      return 'VERIFICAR';
    }
  }

  // TAMPOCO: V en DIAGONAL (ni horizontal ni vertical dominante). VICTORIA es
  // vertical y TAMBIEN horizontal; el ángulo intermedio expresa negación.
  // (Provisional LSC, calibrar en Fase 9.)
  if (idx && mid && !ring && !pink) {
    const dirTp = { dx: lm[8].x - lm[5].x, dy: lm[8].y - lm[5].y };
    if (Math.abs(dirTp.dx) < Math.abs(dirTp.dy) * 0.9 &&
        Math.abs(dirTp.dy) < Math.abs(dirTp.dx) * 0.9) {
      return 'TAMPOCO';
    }
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

  // LISTO: cuatro dedos sin pulgar en VERTICAL con la muñeca ALTA (y<0.36,
  // "todo listo, mano alzada"). CUATRO_DEDOS se hace a media altura y NADA
  // horizontal y baja; la combinación de orientación y altura discrimina.
  if (idx && mid && ring && pink && !thumb &&
      Math.abs(lm[9].y - lm[0].y) > Math.abs(lm[9].x - lm[0].x) * 0.8 &&
      (lm[0].y + lm[9].y) / 2 < 0.36) {
    return 'LISTO';
  }

  // PREPARADO: cuatro dedos sin pulgar en HORIZONTAL con la muñeca media
  // (0.45-0.55, "listo y dispuesto"); NADA lo hace más abajo (>0.55).
  if (idx && mid && ring && pink && !thumb &&
      Math.abs(lm[9].x - lm[0].x) > Math.abs(lm[9].y - lm[0].y) * 0.8 &&
      (lm[0].y + lm[9].y) / 2 >= 0.45 && (lm[0].y + lm[9].y) / 2 < 0.55) {
    return 'PREPARADO';
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

  // PODER: únicamente el dedo MEDIO extendido (índice, anular, meñique y
  // pulgar cerrados). Forma única que no choca con ninguna regla existente.
  if (!idx && mid && !ring && !pink && !thumb) {
    return 'PODER';
  }

  // DEBER: MEDIO y ANULAR extendidos (índice, meñique y pulgar cerrados).
  if (!idx && mid && ring && !pink && !thumb) {
    return 'DEBER';
  }

  // TENER: ANULAR y MEÑIQUE extendidos (índice, medio y pulgar cerrados).
  if (!idx && !mid && ring && pink && !thumb) {
    return 'TENER';
  }

  // VENIR: ÍNDICE y MEÑIQUE extendidos sin pulgar (forma de "cuernos").
  if (idx && !mid && !ring && pink && !thumb) {
    return 'VENIR';
  }

  // LOGRAR: MEDIO+ANULAR+MEÑIQUE extendidos con pulgar extendido e ÍNDICE
  // doblado (forma de "llave/candado"). HORA no lleva pulgar.
  if (!idx && mid && ring && pink && thumb && dist(lm[8], lm[0]) < handSize * 0.5) {
    return 'LOGRAR';
  }

  // CONFIRMAR: MEDIO y MEÑIQUE extendidos (índice, anular y pulgar cerrados).
  // Forma única: ningún otro gesto combina esos dos dedos.
  if (!idx && mid && !ring && pink && !thumb) {
    return 'CONFIRMAR';
  }

  // CALIFICAR: PULGAR+ÍNDICE+MEDIO+ANULAR extendidos (meñique cerrado, sin
  // pinza). No choca con PALMA (necesita meñique) ni OK_SIGN (pinza).
  if (thumb && idx && mid && ring && !pink && !thumbIndexClose(lm)) {
    return 'CALIFICAR';
  }

  // PRIORIZAR: ÍNDICE y ANULAR extendidos (medio, meñique y pulgar cerrados):
  // "primer dedo y tercero" = dar primer lugar.
  if (idx && !mid && ring && !pink && !thumb) {
    return 'PRIORIZAR';
  }

  // VENDER: PULGAR y MEDIO extendidos (índice, anular y meñique cerrados).
  // Forma única: ningún otro gesto combina esos dos dedos.
  if (thumb && !idx && mid && !ring && !pink) {
    return 'VENDER';
  }

  // HACER: PULGAR y ANULAR extendidos (índice, medio y meñique cerrados).
  // LETRA_L ocupa pulgar+índice; el anular diferencia la forma de "hacer".
  // (Provisional LSC, calibrar en Fase 9.)
  if (thumb && !idx && !mid && ring && !pink) {
    return 'HACER';
  }

  // Fase 2 - Bloque A (preguntas): formas de una mano exclusivas PROVISIONALES
  // LSC (calibrar en Fase 9). Cada combinación de dedos es única del catálogo.
  // QUIEN: pulgar+anular+meñique ("ventana" hacia el interlocutor).
  if (thumb && !idx && !mid && ring && pink) {
    return 'QUIEN';
  }
  // CUANDO: índice+medio+meñique (tres puntas de pregunta, sin pulgar).
  if (idx && mid && !ring && pink && !thumb) {
    return 'CUANDO';
  }
  // POR_QUE: índice+anular+meñique (sin medio ni pulgar).
  if (idx && !mid && ring && pink && !thumb) {
    return 'POR_QUE';
  }
  // COMO: pulgar+medio+meñique.
  if (thumb && !idx && mid && !ring && pink) {
    return 'COMO';
  }
  // CUANTO: pulgar+índice+anular (sin medio ni meñique).
  if (thumb && idx && !mid && ring && !pink) {
    return 'CUANTO';
  }
  // CUAL: pulgar+medio+anular (sin índice ni meñique).
  if (thumb && !idx && mid && ring && !pink) {
    return 'CUAL';
  }
  // PARA_QUE: pulgar+índice+anular+meñique (sin medio, "cuatro abiertos").
  if (thumb && idx && !mid && ring && pink) {
    return 'PARA_QUE';
  }
  // TODO: medio+anular+meñique sin pulgar ni índice ("todo lo que queda").
  if (!idx && mid && ring && pink && !thumb) {
    return 'TODO';
  }

  // Fase 2 - lote 9 (A restantes + primeros D) — provisionales LSC.
  // ALGO: pulgar+índice+medio+meñique (sin anular) — forma exclusiva.
  if (thumb && idx && mid && !ring && pink) {
    return 'ALGO';
  }
  // BIEN: pulgar+medio+anular+meñique (sin índice). LOGRAR dobla ese índice
  // hacia la palma; aquí el índice va cerrado y suelto.
  if (thumb && !idx && mid && ring && pink) {
    return 'BIEN';
  }
  // NADIE: únicamente el ANULAR extendido ("quedarse sin dedos").
  if (!idx && !mid && ring && !pink && !thumb) {
    return 'NADIE';
  }

  if (!idx && !mid && !ring && !pink && !thumb && allTipsClose(lm, handSize)) {
    return 'LETRA_O';
  }

  // AVISAR: pulgar arriba con la mano MUY ALTA (y<0.35, levantada llamando la
  // atención). "Sí" (pulgar arriba) se hace normalmente más abajo.
  if (thumb && !idx && !mid && !ring && !pink && lm[4].y < lm[3].y && lm[4].y < 0.35) {
    return 'AVISAR';
  }

  if (thumb && !idx && !mid && !ring && !pink) {
    if (thumbIndexClose(lm) && extended === 0) {
      return 'NUMERO_6';
    }
    return lm[4].y < lm[3].y ? 'PULGAR_ARRIBA' : 'PULGAR_ABAJO';
  }

  // Fase 2 - lote 9 — banda de mano abierta (5 dedos): CERCA (mano a la cara),
  // MAL (muñeca horizontal media) y LEJOS (mano baja).
  // CERCA: mano abierta (5 dedos) con la muñeca en la zona de la cara.
  if (extended >= 4 && thumb && lm[0].y >= 0.32 && lm[0].y < 0.45) {
    return 'CERCA';
  }
  // MAL: mano abierta con la muñeca HORIZONTAL en banda media (palma abajo).
  if (extended >= 4 && thumb && lm[0].y >= 0.45 && lm[0].y <= 0.62 &&
      Math.abs(lm[9].x - lm[0].x) > Math.abs(lm[9].y - lm[0].y) * 0.9) {
    return 'MAL';
  }
  // LEJOS: mano abierta con la muñeca muy baja (y>0.62, alargada hacia allá).
  if (extended >= 4 && thumb && lm[0].y > 0.62) {
    return 'LEJOS';
  }

  // SABER: mano abierta (4+ dedos) con la palma junto a la SIEN (muñeca en la
  // parte alta del encuadre). PALMA_ABIERTA (Hola) se hace a la altura del
  // pecho; la posición de la muñeca discrimina.
  if (extended >= 4 && thumb && lm[0].y < 0.32) {
    return 'SABER';
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
