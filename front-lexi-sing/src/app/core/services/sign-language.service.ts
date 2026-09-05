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
const MAX_GESTOS = 15;
const HISTORY_SIZE = 15;
const SMOOTH_FRAMES = 10;
const GRACE_MS = 500;
const HAND_LOST_MS = 600;
const MAX_RETRY = 3;

// Modo de reconocimiento: palabras (señas completas) o deletreo (abecedario).
export enum SignMode {
  PALABRAS = 'palabras',
  DELETREAR = 'deletrear'
}

// Letras del dactilológico LSC que comparten configuraciones manuales muy
// parecidas y necesitan retención adicional para distinguirse.
const LETRAS_AMBIGUAS = new Set(['A', 'S', 'M', 'N', 'Ñ', 'J', 'E', 'O', 'R']);

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
    const framesRequeridos = letraAmbigua ? FRAMES_CONFIRMACION_LETRA_AMBIGUA : FRAMES_CONFIRMACION;

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
      return mano ? evaluarLetra(mano.landmarks) : null;
    }

    const ahora = Date.now();
    const dentroDeGrace = (ahora - this.ultimaVezAmbasManos) < GRACE_MS;

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
  PEDIR: 'Pedir'
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

  // --- Y (pulgar + meñique) ---
  if (thumb && !idx && !mid && !ring && pink) {
    return 'LETRA_Y';
  }

  // --- M (índice + medio + anular doblados sobre el pulgar, meñique en banco) ---
  if (thumb && !idx && !mid && !ring && pink) {
    return 'LETRA_M';
  }

  // --- N (índice y medio doblados sobre el pulgar, anular y meñique extendidos) ---
  if (thumb && !idx && !mid && ring && pink) {
    return 'LETRA_N';
  }

  // --- U (índice + medio extendidos juntos, anular y meñique doblados) ---
  if (thumb && idx && mid && !ring && !pink && tipsMidRing) {
    return 'LETRA_U';
  }

  // --- V (índice + medio extendidos separados) ---
  if (thumb && idx && mid && !ring && !pink && !tipsMidRing) {
    return 'LETRA_V';
  }

  // --- K (índice + medio extendidos con el pulgar entre ellos / al frente) ---
  if (thumb && idx && mid && !ring && !pink && dist(lm[4], lm[0]) < handSize * 0.5) {
    return 'LETRA_K';
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

  if (thumbIndexPinch && idx && mid && ring && !pink) {
    return 'OK_SIGN';
  }

  if (thumbIndexPinch && !idx && !mid && !ring && !pink) {
    return 'PINZA';
  }

  if (idx && mid && !ring && !pink) {
    return 'VICTORIA';
  }

  if (idx && !mid && !ring && !pink && !thumb) {
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

  if (idx && mid && ring && pink && !thumb) {
    return 'CUATRO_DEDOS';
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
