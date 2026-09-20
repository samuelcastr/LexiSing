import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface GestoDetectado {
  id: string;
  etiqueta: string;
}

interface Landmark {
  x: number; y: number; z: number;
}

interface ManoDetectada {
  landmarks: Landmark[];
  handedness: 'Left' | 'Right';
}

const WASM_PATH = '/mediapipe/wasm';
const MODEL_PATH = '/mediapipe/models/hand_landmarker.task';
const FRAMES_CONFIRMACION = 10;
const FRAMES_CONFIRMACION_LETRA_AMBIGUA = 14;
const FRAMES_CONFIRMACION_MOVIMIENTO = 6;
const MAX_GESTOS = 15;
const HISTORY_SIZE = 15;
const SMOOTH_FRAMES = 10;
const GRACE_MS = 500;
const HAND_LOST_MS = 600;
const MAX_RETRY = 3;
const TRAYECTORIA_FRAMES = 12;

export enum SignMode {
  PALABRAS = 'palabras',
  DELETREAR = 'deletrear'
}

const LETRAS_AMBIGUAS = new Set(['A', 'S', 'M', 'N', 'Ñ', 'J', 'E', 'O', 'R']);
const LETRAS_MOVIMIENTO = new Set(['LETRA_J', 'LETRA_Z']);

const CONEXIONES = [
  [0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],
  [9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]
];

const COLORES_MANO: Record<string, { stroke: string; fill: string; label: string }> = {
  Right: { stroke: 'rgba(167, 139, 250, 0.6)', fill: '#c4b5fd', label: 'R' },
  Left:  { stroke: 'rgba(56, 189, 178, 0.6)',  fill: '#5eead4', label: 'L' }
};

export const GESTO_PALABRA: Record<string, string> = {
  // SALUDOS
  PALMA_ABIERTA: 'Hola', SALUDO_BUENOS_DIAS: 'Buenos días', SALUDO_BUENAS_TARDES: 'Buenas tardes',
  SALUDO_BUENAS_NOCHES: 'Buenas noches', PULGAR_ARRIBA: 'Sí', PULGAR_ABAJO: 'No',
  VICTORIA: 'Adiós', ADIOS_ONDEO: 'Adiós (ondeo)', TE_QUIERO: 'Te quiero', MUCHO_GUSTO: 'Mucho gusto',
  CON_PERMISO: 'Con permiso', DISCULPE: 'Disculpe', PERDON: 'Perdón', GRACIAS: 'Gracias',
  DE_NADA: 'De nada', POR_FAVOR_GESTO: 'Por favor', CONFIRMAR_SI: 'Confirmar', NEGAR_NO: 'Negar',
  // NUMEROS
  NUMERO_0: 'Cero', NUMERO_1: 'Uno', NUMERO_2: 'Dos', NUMERO_3: 'Tres', NUMERO_4: 'Cuatro',
  NUMERO_5: 'Cinco', NUMERO_6: 'Seis', NUMERO_7: 'Siete', NUMERO_8: 'Ocho', NUMERO_9: 'Nueve',
  NUMERO_10: 'Diez', NUMERO_20: 'Veinte', NUMERO_30: 'Treinta', NUMERO_40: 'Cuarenta',
  NUMERO_50: 'Cincuenta', NUMERO_100: 'Cien', NUMERO_MAYOR_QUE: 'Mayor que',
  NUMERO_MENOR_QUE: 'Menor que', NUMERO_IGUAL_QUE: 'Igual que',
  // TIEMPOS
  HORA_GESTO: 'Hora', AHORA: 'Ahora', HOY: 'Hoy', MANANA: 'Mañana', AYER: 'Ayer',
  ESTA_SEMANA: 'Esta semana', ESTE_MES: 'Este mes', ESTE_ANO: 'Este año',
  PRONTO: 'Pronto', TARDE_RETRASO: 'Tarde', DURACION: 'Duración', TIEMPO_LIBRE: 'Tiempo libre',
  DESCANSO: 'Descanso', HORA_EXTRA: 'Hora extra',
  // PERSONAS
  JEFE: 'Jefe', SUPERVISOR: 'Supervisor', GERENTE: 'Gerente', DIRECTOR: 'Director',
  EMPLEADO: 'Empleado', ASISTENTE: 'Asistente', SECRETARIA: 'Secretaria', CLIENTE: 'Cliente',
  PROVEEDOR: 'Proveedor', ENTREVISTADOR: 'Entrevistador', CANDIDATO: 'Candidato',
  COLEGAS: 'Compañeros', EQUIPO: 'Equipo', RECURSOS_HUMANOS: 'Recursos humanos',
  CONTABILIDAD: 'Contabilidad', VENTAS: 'Ventas', MARKETING: 'Marketing',
  LEGAL: 'Legal', IT_SISTEMAS: 'Sistemas',
  // COMUNICACION
  HABLAR: 'Hablar', ESCUCHAR: 'Escuchar', REUNION: 'Reunión', PARTICIPAR: 'Participar',
  OPINION: 'Opinión', CONSENSO: 'Consenso', DISCUSION: 'Discusión', PRESENTACION: 'Presentación',
  INFORME_GESTO: 'Informe', EMAIL_GESTO: 'Email', LLAMADA_TELEFONICA: 'Llamada',
  CONFERENCIA: 'Conferencia', TRADUCCION: 'Traducción', ACTA: 'Acta',
  HACER_PREGUNTA: 'Preguntar', RESPONDER_GESTO: 'Responder', REPORTE_GESTO: 'Reportar',
  // TAREAS
  TRABAJAR: 'Trabajar', PRODUCIR: 'Producción', VENDER: 'Vender', COMPRAR_GESTO: 'Comprar',
  SERVIR: 'Servir', ORGANIZAR: 'Organizar', PLANIFICAR: 'Planificar', EJECUTAR: 'Ejecutar',
  SUPERVISAR: 'Supervisar', INSPECCIONAR: 'Inspeccionar', EVALUAR_GESTO: 'Evaluar',
  CALIFICAR: 'Calificar', INVESTIGAR: 'Investigar', ANALIZAR: 'Analizar',
  ENVIAR_GESTO: 'Enviar', RECIBIR_GESTO: 'Recibir', TRANSFERIR_GESTO: 'Transferir',
  COPIAR_GESTO: 'Copiar', IMPRIMIR_GESTO: 'Imprimir', GUARDAR_GESTO: 'Guardar',
  ELIMINAR_GESTO: 'Eliminar', CORREGIR: 'Corregir', APROBAR_GESTO: 'Aprobar',
  RECHAZAR_GESTO: 'Rechazar', PRIORIZAR: 'Priorizar', ASIGNAR_GESTO: 'Asignar',
  DELEGAR: 'Delegar', COLABORAR: 'Colaborar', COORDINAR: 'Coordinar', LIDERAR: 'Liderar',
  MOTIVAR_GESTO: 'Motivar', RESOLVER_GESTO: 'Resolver', SOLICITUD_GESTO: 'Solicitud',
  AUTORIZACION_GESTO: 'Autorización',
  // OBJETOS
  COMPUTADORA: 'Computadora', TECLADO_GESTO: 'Teclado', RATON_GESTO: 'Ratón',
  MONITOR: 'Monitor', TELEFONO_GESTO: 'Teléfono', IMPRESORA: 'Impresora',
  ESCRITORIO: 'Escritorio', SILLA: 'Silla', ARCHIVERO: 'Archivero', PAPEL_GESTO: 'Papel',
  BOLIGRAFO: 'Bolígrafo', CUADERNO: 'Cuaderno', BORRADOR: 'Borrador', CLIPS: 'Clips',
  CINTA_ADHESIVA: 'Cinta adhesiva', PEGAMENTO: 'Pegamento', REGLA: 'Regla',
  MARCADOR: 'Marcador', RESALTADOR: 'Resaltador', SOBRES: 'Sobres', SELLOS: 'Sellos',
  PROYECTOR: 'Proyector', PIZARRA: 'Pizarra', CAMARA: 'Cámara', AUDIFONOS: 'Audífonos',
  MEMORIA_USB: 'Memoria USB', CARGA_OR: 'Cargador', BATERIA: 'Batería', NUBE_CLOUD: 'Nube',
  ENLACE: 'Enlace', PDF_GESTO: 'PDF', HOJA_CALCULO: 'Hoja de cálculo',
  PROCESADOR_TEXTO: 'Procesador de textos', PRESENTACION_GESTO: 'Presentación',
  DIAPOSITIVA: 'Diapositiva', CHAT_GESTO: 'Chat', NOTIFICACION: 'Notificación',
  // DOCUMENTOS
  DOCUMENTO_GESTO: 'Documento', CONTRATO: 'Contrato', FIRMA_GESTO: 'Firma',
  IDENTIFICACION: 'Identificación', CURRICULUM: 'Curriculum', CARTA_GESTO: 'Carta',
  FACTURA: 'Factura', RECIBO_GESTO: 'Recibo', PRESUPUESTO_GESTO: 'Presupuesto',
  INFORME_FINANCIERO: 'Informe financiero', NOMINA: 'Nómina', CERTIFICADO: 'Certificado',
  CONSTANCIA: 'Constancia', FORMULARIO_GESTO: 'Formulario', POLIZA: 'Póliza',
  CONTRATO_COLECTIVO: 'Contrato colectivo', LEGISLACION: 'Legislación', REGLAMENTO: 'Reglamento',
  CODIGO_CONDUCTA: 'Código de conducta', CONFIDENCIALIDAD: 'Confidencialidad',
  DERECHOS_AUTOR: 'Derechos de autor', PATENTE: 'Patente', MARCA_GESTO: 'Marca',
  // UBICACIONES
  OFICINA: 'Oficina', SALA_REUNIONES: 'Sala de reuniones', RECEPCION: 'Recepción',
  PASILLO: 'Pasillo', BANO: 'Baño', CAFETERIA: 'Cafetería', ESTACIONAMIENTO: 'Estacionamiento',
  ALMACEN: 'Almacén', LABORATORIO: 'Laboratorio', PLANTA: 'Planta', GERENCIA: 'Gerencia',
  PUERTA: 'Puerta', VENTANA: 'Ventana', EXTERIOR: 'Exterior', INTERIOR: 'Interior',
  ESCALERA: 'Escalera', ASCENSOR: 'Ascensor', CUBICULO: 'Cubículo',
  // SITUACIONES LABORALES
  ENTREVISTA: 'Entrevista', PRUEBA_TECNICA: 'Prueba técnica', EVALUACION_DESEMPEÑO: 'Evaluación de desempeño',
  ASCENSO: 'Ascenso', BONO: 'Bono', ALMUERZO: 'Almuerzo', PERMISO_GESTO: 'Permiso',
  VACACIONES: 'Vacaciones', LICENCIA_MATERNA: 'Licencia de maternidad',
  LICENCIA_PATERNIDAD: 'Licencia de paternidad', INCAPACIDAD: 'Incapacidad',
  RETIRO: 'Retiro', RENUNCIA: 'Renuncia', DESPIDO: 'Despido', SUSPENSION: 'Suspensión',
  PRACTICAS: 'Prácticas', CONTRATO_TEMPORAL: 'Contrato temporal', CONTRATO_INDEFINIDO: 'Contrato indefinido',
  PRUEBA_CONTRATO: 'Prueba de contrato', CAPACITACION: 'Capacitación', TALLER: 'Taller',
  CONGRESO: 'Congreso', FERIA: 'Feria', NETWORKING: 'Networking', TELETRABAJO: 'Teletrabajo',
  HOME_OFFICE: 'Home office', MODALIDAD_MIXTA: 'Modalidad mixta',
  // HERRAMIENTAS DIGITALES
  ENVIAR_EMAIL: 'Enviar', RECIBIR_EMAIL: 'Recibir', ADJUNTAR: 'Adjuntar',
  RESPONDER_EMAIL: 'Responder', REENVIO: 'Reenviar', BORRAR_EMAIL: 'Borrar',
  CORREO_NO_DESEADO: 'Spam', FIRMA_DIGITAL: 'Firma digital', SUBIR_ARCHIVO: 'Subir',
  DESCARGAR_GESTO: 'Descargar', GUARDAR_NUBE: 'Guardar en nube', COPIAR_PEGAR: 'Copiar y pegar',
  BUSCAR_WEB: 'Buscar', CONFIGURACION: 'Configuración', ACTUALIZAR_GESTO: 'Actualizar',
  WEBCONFERENCIA: 'Videollamada',
  // EMERGENCIAS
  EMERGENCIA_GESTO: 'Emergencia', PELIGRO: 'Peligro', SOCORRO: 'Socorro',
  INCENDIO: 'Incendio', EVACUACION: 'Evacuación', SALIDA_EMERGENCIA: 'Salida de emergencia',
  EXTINTOR: 'Extintor', BOTIQUIN: 'Botiquín', LESION: 'Lesión', ACCIDENTE: 'Accidente',
  RIESGO: 'Riesgo', BOMBERO: 'Bombero', AMBULANCIA: 'Ambulancia',
  // SALUD
  DOLOR_GESTO: 'Dolor', DOLOR_CABEZA: 'Dolor de cabeza', DOLOR_ESPALDA: 'Dolor de espalda',
  FATIGA: 'Fatiga', CANSANCIO: 'Cansancio', ENFERMO: 'Enfermo', MEDICINA: 'Medicina',
  EJERCICIO: 'Ejercicio', AGUA: 'Agua', ERGONOMIA: 'Ergonomía',
  // EMOCIONES
  FELICIDAD: 'Felicidad', TRISTEZA: 'Tristeza', ENOJO: 'Enojo', PREOCUPACION: 'Preocupación',
  ORGULLO: 'Orgullo', FRUSTRACION: 'Frustración', CONFUSION: 'Confusión', SORPRESA: 'Sorpresa',
  CALMA: 'Calma', NERVIOS: 'Nerviosismo', MOTIVACION_EMOCION: 'Motivación', ENTUSIASMO: 'Entusiasmo',
  RESPETO_GESTO: 'Respeto', CONFIANZA_GESTO: 'Confianza', EMPATIA_GESTO: 'Empatía',
  TOLERANCIA: 'Tolerancia', SOLIDARIDAD: 'Solidaridad', PROFESIONALISMO: 'Profesionalismo',
  RESPONSABILIDAD: 'Responsabilidad', LEALTAD: 'Lealtad',
  // BINARUAL
  ORACION_GESTO: 'Oración', PARAR_GESTO: 'Parar', PAZ_GESTO: 'Paz', APLAUSO: 'Aplauso',
  AMOR_GESTO: 'Amor', REUNION_B: 'Reunión', INFORME_B: 'Informe', PAUSA_B: 'Pausa',
  APROBAR_B: 'Aprobar', ENVIAR_B: 'Enviar', TRABAJAR_B: 'Trabajar', PEDIR_GESTO: 'Pedir',
  // LETRAS DACTILOLOGICAS
  LETRA_A: 'A', LETRA_B: 'B', LETRA_C: 'C', LETRA_D: 'D', LETRA_E: 'E', LETRA_F: 'F',
  LETRA_G: 'G', LETRA_H: 'H', LETRA_I: 'I', LETRA_J: 'J', LETRA_K: 'K', LETRA_L: 'L',
  LETRA_M: 'M', LETRA_N: 'N', LETRA_NY: 'Ñ', LETRA_O: 'O', LETRA_P: 'P', LETRA_Q: 'Q',
  LETRA_R: 'R', LETRA_S: 'S', LETRA_T: 'T', LETRA_U: 'U', LETRA_V: 'V', LETRA_W: 'W',
  LETRA_X: 'X', LETRA_Y: 'Y', LETRA_Z: 'Z'
};

@Injectable({ providedIn: 'root' })
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

  get detectando(): boolean { return this.detectando$.value; }
  get gestos(): GestoDetectado[] { return this.gestos$.value; }
  get modo(): SignMode { return this.modo$.value; }

  setModo(modo: SignMode): void {
    this.modo$.next(modo); this.limpiar(); this.gestoActual = null;
    this.framesConsecutivos = 0; this.ultimoConfirmado = null; this.textoDeletreado = '';
    this.gestoEnCurso$.next(null);
  }

  async iniciar(video: HTMLVideoElement, canvas?: HTMLCanvasElement): Promise<void> {
    if (typeof window === 'undefined') throw new Error('El reconocimiento de señas solo funciona en el navegador.');
    this.video = video; this.canvas = canvas || null;
    if (!this.landmarker) {
      this.cargando$.next(true);
      const vision = await import('@mediapipe/tasks-vision');
      const fileset = await vision.FilesetResolver.forVisionTasks(WASM_PATH);
      for (let intento = 0; intento < MAX_RETRY; intento++) {
        try {
          this.landmarker = await vision.HandLandmarker.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: MODEL_PATH, delegate: 'GPU' }, runningMode: 'VIDEO', numHands: 2,
            minHandDetectionConfidence: 0.3, minHandPresenceConfidence: 0.3, minTrackingConfidence: 0.3
          }); break;
        } catch {
          if (intento === MAX_RETRY - 1) {
            try { this.landmarker = await vision.HandLandmarker.createFromOptions(fileset, {
              baseOptions: { modelAssetPath: MODEL_PATH, delegate: 'CPU' }, runningMode: 'VIDEO', numHands: 2,
              minHandDetectionConfidence: 0.3, minHandPresenceConfidence: 0.3, minTrackingConfidence: 0.3
            }); break; } catch (e) { this.cargando$.next(false); throw e; }
          } else { await new Promise(r => setTimeout(r, 1000 * Math.pow(2, intento))); }
        }
      }
      this.cargando$.next(false);
    }
    this.detectando$.next(true); this.bucle();
  }

  reanudar(): void { if (!this.video || !this.landmarker) return; this.detectando$.next(true); this.bucle(); }
  pausar(): void { if (this.rafId !== null) { cancelAnimationFrame(this.rafId); this.rafId = null; } this.detectando$.next(false); this.gestoEnCurso$.next(null); }
  detener(): void { this.pausar(); this.video = null; this.canvas = null; this.gestoActual = null; this.framesConsecutivos = 0; this.ultimoConfirmado = null; this.landmarkHistory = []; this.ultimoGestoBimanual = null; this.manoPerdida$.next(false); this.limpiar(); }
  limpiar(): void { this.textoDeletreado = ''; this.gestos$.next([]); }
  eliminarGesto(index: number): void { const actual = [...this.gestos]; if (index >= 0 && index < actual.length) { actual.splice(index, 1); this.gestos$.next(actual); } }
  getHistorial(): ManoDetectada[][] { return this.landmarkHistory; }

  traducirAhora(): string {
    if (this.modo === SignMode.DELETREAR) { if (!this.textoDeletreado) return ''; return this.textoDeletreado.charAt(0).toUpperCase() + this.textoDeletreado.slice(1); }
    const palabras = this.gestos.map(g => g.etiqueta.replace(/[.,;:!?]/g, ''));
    if (palabras.length === 0) return '';
    return palabras.map((p, i) => (i === 0 ? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() : p.toLowerCase())).join(' ') + '.';
  }

  marcarEspacio(): void { if (this.modo !== SignMode.DELETREAR) return; this.textoDeletreado += ' '; this.gestos$.next([{ id: 'espacio', etiqueta: this.textoDeletreado }]); }
  borrarUltimaLetra(): void { if (this.modo !== SignMode.DELETREAR) return; if (this.textoDeletreado.length > 0) { this.textoDeletreado = this.textoDeletreado.slice(0, -1); } this.gestos$.next([{ id: 'borrar', etiqueta: this.textoDeletreado }]); }

  private bucle = (): void => {
    if (!this.video || !this.landmarker) { this.rafId = null; return; }
    if (this.video.readyState >= 2 && this.video.currentTime !== this.ultimoTs) {
      this.ultimoTs = this.video.currentTime;
      try { const resultado = this.landmarker.detectForVideo(this.video, performance.now()); this.procesarResultado(resultado); }
      catch (e) { console.warn('Error:', e); this.procesarResultado(null); }
    }
    this.rafId = requestAnimationFrame(this.bucle);
  };

  private procesarResultado(resultado: any): void {
    const rawHands: Landmark[][] | undefined = resultado?.landmarks;
    const manos: ManoDetectada[] = [];
    if (rawHands) { for (let i = 0; i < rawHands.length; i++) { const label: 'Left' | 'Right' = rawHandedness?.[i]?.[0]?.categoryName === 'Left' ? 'Left' : 'Right'; manos.push({ landmarks: rawHands[i], handedness: label }); } }
    this.landmarkHistory.push(manos);
    if (this.landmarkHistory.length > HISTORY_SIZE) this.landmarkHistory.shift();
    const ahora = Date.now();
    if (manos.length >= 2) { this.ultimaVezAmbasManos = ahora; const left = manos.find(m => m.handedness === 'Left'); const right = manos.find(m => m.handedness === 'Right'); if (left && right) { this.ultimoGestoBimanual = evaluarGestoBimanual(left.landmarks, right.landmarks); } }
    else if (manos.length === 1) { this.ultimaManoDetectada = ahora; this.manoPerdida$.next(false); }
    else { if (ahora - this.ultimaManoDetectada > HAND_LOST_MS) { this.manoPerdida$.next(true); this.ultimoGestoBimanual = null; } }
    const manosSuavizadas = this.suavizarLandmarks(manos);
    if (manosSuavizadas.length > 0) { this.dibujarLandmarks(manosSuavizadas); } else { this.limpiarCanvas(); }
    const gesto = this.evaluarGestos(manosSuavizadas);
    this.gestoEnCurso$.next(gesto);
    if (gesto && gesto === this.gestoActual) { this.framesConsecutivos++; } else { this.gestoActual = gesto; this.framesConsecutivos = gesto ? 1 : 0; }
    const esLetra = this.modo === SignMode.DELETREAR;
    const letraAmbigua = esLetra && LETRAS_AMBIGUAS.has(gesto ?? '');
    const esMovimiento = esLetra && LETRAS_MOVIMIENTO.has(gesto ?? '');
    const framesRequeridos = esMovimiento ? FRAMES_CONFIRMACION_MOVIMIENTO : letraAmbigua ? FRAMES_CONFIRMACION_LETRA_AMBIGUA : FRAMES_CONFIRMACION;
    if (gesto && this.framesConsecutivos >= framesRequeridos && gesto !== this.ultimoConfirmado) { this.confirmarGesto(gesto); }
    if (!gesto || gesto !== this.ultimoConfirmado) { if (!gesto) { this.ultimoConfirmado = null; } }
  }

  private suavizarLandmarks(manos: ManoDetectada[]): ManoDetectada[] {
    if (this.landmarkHistory.length < SMOOTH_FRAMES) return manos;
    const n = Math.min(this.landmarkHistory.length, SMOOTH_FRAMES);
    const result: ManoDetectada[] = [];
    for (const mano of manos) {
      const historialMano = this.landmarkHistory.slice(-n).map(frame => frame.find(m => m.handedness === mano.handedness)).filter((m): m is ManoDetectada => !!m);
      if (historialMano.length === 0) { result.push(mano); continue; }
      const smoothed: Landmark[] = mano.landmarks.map((lm, i) => { let sx = 0, sy = 0, sz = 0; for (const h of historialMano) { sx += h.landmarks[i].x; sy += h.landmarks[i].y; sz += h.landmarks[i].z; } return { x: sx / n, y: sy / n, z: sz / n }; });
      result.push({ landmarks: smoothed, handedness: mano.handedness });
    }
    return result;
  }

  private evaluarGestos(manos: ManoDetectada[]): string | null {
    if (this.modo === SignMode.DELETREAR) { const mano = manos[0]; if (!mano) return null; const trazo = this.evaluarTrazoLetra(mano); if (trazo) return trazo; return evaluarLetra(mano.landmarks); }
    const ahora = Date.now(); const dentroDeGrace = (ahora - this.ultimaVezAmbasManos) < GRACE_MS;
    if (manos.length === 2) { const left = manos.find(m => m.handedness === 'Left'); const right = manos.find(m => m.handedness === 'Right'); if (left && right) { const bimanual = evaluarGestoBimanual(left.landmarks, right.landmarks); if (bimanual) return bimanual; } }
    if (manos.length === 1 && dentroDeGrace && this.ultimoGestoBimanual) return this.ultimoGestoBimanual;
    if (manos.length < 2) this.ultimoGestoBimanual = null;
    for (const mano of manos) { const gestoEstatico = evaluarGesto(mano.landmarks); if (gestoEstatico) return gestoEstatico; }
    const gestoMovimiento = this.detectarMovimiento(manos); if (gestoMovimiento) return gestoMovimiento;
    return null;
  }

  private detectarMovimiento(manos: ManoDetectada[]): string | null {
    if (this.landmarkHistory.length < 6) return null;
    for (const mano of manos) {
      const historial = this.landmarkHistory.slice(-8).map(frame => frame.find(m => m.handedness === mano.handedness)).filter((m): m is ManoDetectada => !!m);
      if (historial.length < 5) continue;
      const wristXs = historial.map(h => h.landmarks[0].x); let cruces = 0;
      const mean = wristXs.reduce((a, b) => a + b, 0) / wristXs.length;
      for (let i = 1; i < wristXs.length; i++) { if ((wristXs[i] - mean) * (wristXs[i - 1] - mean) < 0) cruces++; }
      if (cruces >= 3) return 'ADIOS_ONDEO';
      const idxTip = mano.landmarks[8]; const wrist = mano.landmarks[0]; const dx = idxTip.x - wrist.x; const dy = idxTip.y - wrist.y; const angle = Math.atan2(-dy, dx);
      if (fingerExtended(mano.landmarks, 8, 6) && !fingerExtended(mano.landmarks, 12, 10)) {
        if (angle > 0.5 && angle < 1.2) return 'APUNTAR_ARRIBA';
        if (angle < -0.5 && angle > -1.2) return 'APUNTAR_ABAJO';
      }
    }
    return null;
  }

  private evaluarTrazoLetra(mano: ManoDetectada): string | null {
    const historias = this.landmarkHistory.slice(-TRAYECTORIA_FRAMES).map(frame => frame.find(m => m.handedness === mano.handedness)).filter((m): m is ManoDetectada => !!m);
    if (historias.length < 8) return null;
    const actual = historias[historias.length - 1].landmarks; const handSize = dist(actual[0], actual[9]);
    const idx = fingerExtended(actual, 8, 6); const mid = fingerExtended(actual, 12, 10); const ring = fingerExtended(actual, 16, 14); const pink = fingerExtended(actual, 20, 18); const thumb = thumbExtended(actual);
    if (!thumb && !idx && !mid && !ring && pink) {
      const ys = historias.map(h => h.landmarks[20].y); const maxY = Math.max(...ys); const minY = Math.min(...ys); const range = maxY - minY;
      if (range > handSize * 0.8 && maxY - ys[0] > range * 0.4 && maxY - ys[ys.length - 1] > range * 0.3) return 'LETRA_J';
      return null;
    }
    if (!thumb && idx && !mid && !ring && !pink) {
      const pts = historias.map(h => h.landmarks[8]); const dxs = pts.slice(1).map((p, i) => p.x - pts[i].x); const noise = handSize * 0.15; let giros = 0;
      for (let i = 1; i < dxs.length; i++) { const a = dxs[i - 1]; const b = dxs[i]; if (Math.abs(a) > noise && Math.abs(b) > noise && Math.sign(a) !== Math.sign(b)) giros++; }
      const xs = pts.map(p => p.x); const xRange = Math.max(...xs) - Math.min(...xs);
      if (giros >= 2 && xRange > handSize * 1.5) return 'LETRA_Z';
      return null;
    }
    return null;
  }

  private confirmarGesto(id: string): void {
    this.ultimoConfirmado = id;
    if (this.modo === SignMode.DELETREAR) {
      const letra = id.startsWith('LETRA_') ? id.slice('LETRA_'.length) : (GESTO_PALABRA[id] ?? id);
      this.textoDeletreado += letra; this.gestos$.next([{ id, etiqueta: this.textoDeletreado }]);
    } else {
      const secuencia = [...this.gestos, { id, etiqueta: GESTO_PALABRA[id] ?? id }];
      this.gestos$.next(secuencia.slice(-MAX_GESTOS));
    }
    this.confirmado$.next(id); setTimeout(() => this.confirmado$.next(null), 400);
  }

  private dibujarLandmarks(manos: ManoDetectada[]): void {
    if (!this.canvas || !this.video) return;
    const parent = this.canvas.parentElement; const rect = parent?.getBoundingClientRect();
    const cw = (rect && rect.width > 0) ? Math.round(rect.width) : 420; const ch = (rect && rect.height > 0) ? Math.round(rect.height) : 315;
    if (this.canvas.width !== cw || this.canvas.height !== ch) { this.canvas.width = cw; this.canvas.height = ch; }
    const ctx = this.canvas.getContext('2d'); if (!ctx) return;
    ctx.clearRect(0, 0, cw, ch);
    const vw = this.video.videoWidth; const vh = this.video.videoHeight; if (!vw || !vh) return;
    ctx.save(); ctx.translate(cw, 0); ctx.scale(-1, 1);
    const scale = Math.min(cw / vw, ch / vh); const ox = (cw - vw * scale) / 2; const oy = (ch - vh * scale) / 2;
    for (const mano of manos) {
      const lm = mano.landmarks; const color = COLORES_MANO[mano.handedness] ?? COLORES_MANO['Right'];
      const px = (i: number) => ox + lm[i].x * vw * scale; const py = (i: number) => oy + lm[i].y * vh * scale;
      ctx.strokeStyle = color.stroke; ctx.lineWidth = 2;
      for (const [a, b] of CONEXIONES) { ctx.beginPath(); ctx.moveTo(px(a), py(a)); ctx.lineTo(px(b), py(b)); ctx.stroke(); }
      for (let i = 0; i < lm.length; i++) { ctx.beginPath(); ctx.arc(px(i), py(i), 4, 0, Math.PI * 2); ctx.fillStyle = i === 0 ? '#ef4444' : color.fill; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke(); }
      const wristX = px(0); const wristY = py(0); ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillText(color.label, wristX, wristY - 10);
    }
    ctx.restore();
  }

  private limpiarCanvas(): void { if (!this.canvas) return; const ctx = this.canvas.getContext('2d'); if (ctx) ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); }
}

function dist(a: Landmark, b: Landmark): number { return Math.hypot(a.x - b.x, a.y - b.y); }
function fingerExtended(lm: Landmark[], tip: number, pip: number): boolean { return dist(lm[tip], lm[0]) > dist(lm[pip], lm[0]); }
function thumbExtended(lm: Landmark[]): boolean { return dist(lm[4], lm[9]) > dist(lm[3], lm[9]); }
function thumbIndexClose(lm: Landmark[]): boolean { const handSize = dist(lm[0], lm[9]); return dist(lm[4], lm[8]) < handSize * 0.25; }
function angleBetween(a: Landmark, vertex: Landmark, b: Landmark): number {
  const va = { x: a.x - vertex.x, y: a.y - vertex.y }; const vb = { x: b.x - vertex.x, y: b.y - vertex.y };
  const dot = va.x * vb.x + va.y * vb.y; const magA = Math.hypot(va.x, va.y); const magB = Math.hypot(vb.x, vb.y);
  if (magA === 0 || magB === 0) return 0; return Math.acos(Math.min(1, Math.max(-1, dot / (magA * magB))));
}
function fingerTipsTouching(a: number, b: number, lm: Landmark[], ratio = 0.28): boolean { const handSize = dist(lm[0], lm[9]); return dist(lm[a], lm[b]) < handSize * ratio; }
function allTipsClose(lm: Landmark[], handSize: number): boolean { return dist(lm[4], lm[8]) < handSize * 0.3 && dist(lm[4], lm[12]) < handSize * 0.35 && dist(lm[4], lm[16]) < handSize * 0.4; }

function pulgarEnPosicionY(lm: Landmark[], handSize: number): boolean { return dist(lm[4], lm[6]) > handSize * 0.45 && lm[4].y < lm[20].y; }

export function evaluarLetra(lm: Landmark[]): string | null {
  const idx = fingerExtended(lm, 8, 6); const mid = fingerExtended(lm, 12, 10); const ring = fingerExtended(lm, 16, 14); const pink = fingerExtended(lm, 20, 18); const thumb = thumbExtended(lm);
  const floor = [idx, mid, ring, pink].filter(Boolean).length; const handSize = dist(lm[0], lm[9]);
  if (floor === 0) { if (thumb && allTipsClose(lm, handSize)) return 'LETRA_O'; if (!thumb && fingerTipsTouching(8, 16, lm, 0.35) && fingerTipsTouching(12, 20, lm, 0.35)) return 'LETRA_E'; if (thumb) return 'LETRA_S'; if (dist(lm[8], lm[4]) < handSize * 0.3) return 'LETRA_T'; return 'LETRA_A'; }
  if (!thumb && !idx && !mid && !ring && pink) return 'LETRA_I';
  if (thumb && !idx && !mid && !ring && pink) return pulgarEnPosicionY(lm, handSize) ? 'LETRA_Y' : 'LETRA_M';
  if (thumb && !idx && !mid && ring && pink) { const centroManoY = (lm[0].y + lm[9].y) * 0.5; return centroManoY < 0.32 ? 'LETRA_Ñ' : 'LETRA_N'; }
  if (thumb && idx && mid && !ring && !pink) { const dirIdx = { dx: lm[8].x - lm[5].x, dy: lm[8].y - lm[5].y }; const horizontal = Math.abs(dirIdx.dx) > Math.abs(dirIdx.dy) * 1.3; const kPegado = dist(lm[4], lm[0]) < handSize * 0.5; if (horizontal) return 'LETRA_H'; if (kPegado) return 'LETRA_K'; return fingerTipsTouching(12, 16, lm, 0.35) ? 'LETRA_U' : 'LETRA_V'; }
  if (thumb && idx && mid && ring && !pink && fingerTipsTouching(8, 16, lm, 0.35)) return 'LETRA_W';
  if (idx && !mid && !ring && !pink && thumb) return 'LETRA_D';
  if (idx && !mid && !ring && !pink && !thumb) { const anguloIndice = angleBetween(lm[5], lm[6], lm[8]); return anguloIndice < 1.9 && anguloIndice > 0.5 ? 'LETRA_X' : 'LETRA_I'; }
  if (floor >= 4 && !thumb) return 'LETRA_B';
  if (thumbIndexClose(lm) && idx && mid && ring && pink) return 'LETRA_F';
  if (thumb && idx && !mid && !ring && !pink && fingerTipsTouching(4, 8, lm, 0.5)) return 'LETRA_G';
  if (thumb && idx && !mid && !ring && !pink) { const angulo = angleBetween(lm[4], lm[2], lm[8]); if (angulo > 0.9) return 'LETRA_L'; }
  if (thumb && idx && mid && ring && pink) { const dd = { dx: lm[8].x - lm[5].x, dy: lm[8].y - lm[5].y }; if (dd.dy > 0 && Math.abs(dd.dy) > Math.abs(dd.dx) * 1.3) return 'LETRA_P'; if (dd.dy > 0 && Math.abs(dd.dy) > Math.abs(dd.dx) * 0.4) return 'LETRA_Q'; }
  if (thumb && floor >= 4 && !allTipsClose(lm, handSize)) return 'LETRA_C';
  if (idx && mid && !ring && !pink && fingerTipsTouching(8, 12, lm, 0.6)) return 'LETRA_R';
  return null;
}

export function evaluarGesto(lm: Landmark[]): string | null {
  const idx = fingerExtended(lm, 8, 6); const mid = fingerExtended(lm, 12, 10); const ring = fingerExtended(lm, 16, 14); const pink = fingerExtended(lm, 20, 18); const thumb = thumbExtended(lm); const thumbIndexPinch = thumbIndexClose(lm); const handSize = dist(lm[0], lm[9]); const extended = [idx, mid, ring, pink].filter(Boolean).length;
  if (thumb && idx && !mid && !ring && pink) return 'TE_QUIERO';
  if (thumbIndexPinch && idx && mid && ring && !pink) return 'OK_SIGN';
  if (thumbIndexPinch && !idx && !mid && !ring && !pink) return 'PINZA';
  if (idx && mid && !ring && !pink) return 'VICTORIA';
  if (idx && !mid && !ring && !pink && !thumb) return 'INDICE_ARRIBA';
  if (!idx && !mid && !ring && pink && !thumb) return 'MEÑIQUE_ARRIBA';
  if (thumb && !idx && !mid && !ring && pink) return 'PULGAR_MEÑIQUE';
  if (thumb && idx && mid && !ring && !pink) return 'NUMERO_3';
  if (idx && mid && ring && !pink && !thumb) return 'TRES_DEDOS';
  if (idx && mid && ring && pink && !thumb) return 'CUATRO_DEDOS';
  if (thumb && idx && !mid && !ring && !pink) { const angulo = angleBetween(lm[4], lm[2], lm[8]); if (angulo > 0.9) return 'LETRA_L'; }
  if (!idx && !mid && !ring && !pink && !thumb && allTipsClose(lm, handSize)) return 'LETRA_O';
  if (thumb && !idx && !mid && !ring && !pink) { if (thumbIndexClose(lm) && extended === 0) return 'NUMERO_6'; return lm[4].y < lm[3].y ? 'PULGAR_ARRIBA' : 'PULGAR_ABAJO'; }
  if (extended >= 4 && thumb) return 'PALMA_ABIERTA';
  if (extended === 0 && !thumb) return 'PUÑO_CERRADO';
  return null;
}

export function evaluarGestoBimanual(left: Landmark[], right: Landmark[]): string | null {
  const lIdx = fingerExtended(left, 8, 6); const lMid = fingerExtended(left, 12, 10); const lRing = fingerExtended(left, 16, 14); const lPink = fingerExtended(left, 20, 18); const lThumb = thumbExtended(left);
  const rIdx = fingerExtended(right, 8, 6); const rMid = fingerExtended(right, 12, 10); const rRing = fingerExtended(right, 16, 14); const rPink = fingerExtended(right, 20, 18); const rThumb = thumbExtended(right);
  const lExtended = [lIdx, lMid, lRing, lPink].filter(Boolean).length; const rExtended = [rIdx, rMid, rRing, rPink].filter(Boolean).length;
  const lOpen = lExtended >= 4 && lThumb; const rOpen = rExtended >= 4 && rThumb;
  const handsClose = dist(left[0], right[0]) < 0.15;
  if (lOpen && rOpen && handsClose) { if (dist(left[9], right[9]) < 0.12) return 'ORACION_GESTO'; }
  if (lOpen && rOpen && !handsClose) { const pd = dist(left[9], right[9]); if (pd > 0.15 && pd < 0.4) return 'PARAR_GESTO'; }
  if (lIdx && lMid && !lRing && !lPink && rIdx && rMid && !rRing && !rPink) return 'PAZ_GESTO';
  if (lOpen && rOpen && handsClose) return 'APLAUSO';
  if (thumbExtended(left) && fingerExtended(left, 8, 6) && !fingerExtended(left, 12, 10) && !fingerExtended(left, 16, 14) && !fingerExtended(left, 20, 18) &&
      thumbExtended(right) && fingerExtended(right, 8, 6) && !fingerExtended(right, 12, 10) && !fingerExtended(right, 16, 14) && !fingerExtended(right, 20, 18)) {
    if (dist(left[4], right[4]) < 0.08 && dist(left[8], right[8]) < 0.08) return 'AMOR_GESTO';
  }
  const lFlat = lExtended >= 4 && !lThumb; const rFlat = rExtended >= 4 && !rThumb;
  if (lThumb && !lIdx && !lMid && !lRing && !lPink && rThumb && !rIdx && !rMid && !rRing && !rPink) return 'APROBAR_B';
  if (lIdx && !lMid && !lRing && !lPink && rIdx && !rMid && !rRing && !rPink && !handsClose) { const yGap = Math.abs(left[6].y - right[6].y); if (yGap > 0.12 && Math.abs(left[6].x - right[6].x) < 0.12) return 'PAUSA_B'; }
  if (!lIdx && !lMid && !lRing && !lPink && !lThumb && !rIdx && !rMid && !rRing && !rPink && !rThumb && handsClose) return 'TRABAJAR_B';
  if (lFlat && rFlat && !handsClose) { const palmY = Math.abs(left[9].y - right[9].y); const palmX = Math.abs(left[9].x - right[9].x); if (palmY < 0.08 && palmX > 0.12 && palmX < 0.35) return 'REUNION_B'; }
  if (lFlat && rFlat) { const yGap = Math.abs(left[9].y - right[9].y); if (yGap > 0.08 && yGap < 0.3) return 'INFORME_B'; }
  if (lOpen && rOpen) { const yGap = Math.abs(left[9].y - right[9].y); if (yGap > 0.2) return 'ENVIAR_B'; }
  const lMuestra = lOpen && !rOpen; const rMuestra = rOpen && !lOpen;
  if ((lMuestra || rMuestra) && handsClose) return 'PEDIR_GESTO';
  return null;
}
