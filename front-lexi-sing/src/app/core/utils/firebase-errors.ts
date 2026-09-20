export const ERROR_GENERICO = 'Ocurrió un error, intenta nuevamente.';

const FIREBASE_ERROR_MAP: Record<string, string> = {
  // Auth
  'auth/user-not-found': 'No existe una cuenta con este correo.',
  'auth/wrong-password': 'La contraseña es incorrecta.',
  'auth/invalid-credential': 'El correo o la contraseña son incorrectos.',
  'auth/invalid-email': 'El correo ingresado no es válido.',
  'auth/email-already-in-use': 'Este correo ya está registrado. Intenta iniciar sesión.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/too-many-requests': 'Demasiados intentos fallidos. Espera un momento e inténtalo de nuevo.',
  'auth/user-disabled': 'Esta cuenta ha sido deshabilitada. Contacta a un administrador.',
  'auth/operation-not-allowed': 'Esta operación no está disponible en este momento.',
  'auth/network-request-failed': 'Error de conexión. Verifica tu internet e inténtalo de nuevo.',
  'auth/popup-closed-by-user': 'Cerraste la ventana de inicio de sesión. Inténtalo de nuevo.',
  'auth/cancelled-popup-request': 'La solicitud de inicio de sesión fue cancelada.',
  'auth/popup-blocked': 'El navegador bloqueó la ventana emergente. Permítela e inténtalo de nuevo.',
  'auth/unauthorized-domain': 'Este dominio no está autorizado para iniciar sesión.',
  'auth/requires-recent-login': 'Debes iniciar sesión nuevamente para realizar esta acción.',
  'auth/invalid-verification-code': 'El código de verificación no es válido.',
  'auth/account-exists-with-different-credential': 'Ya existe una cuenta con este correo usando otro método de acceso.',
  'auth/provider-already-linked': 'Esta cuenta ya está vinculada a este proveedor.',

  // Firestore
  'permission-denied': 'No tienes permisos para realizar esta acción.',
  'not-found': 'El elemento que buscas no existe o fue eliminado.',
  'already-exists': 'Este elemento ya existe.',
  'unavailable': 'El servicio no está disponible en este momento. Inténtalo más tarde.',
  'resource-exhausted': 'Se alcanzó el límite de consultas. Inténtalo más tarde.',
  'deadline-exceeded': 'La operación tardó demasiado. Inténtalo de nuevo.',
  'cancelled': 'La operación fue cancelada.',
  'aborted': 'La operación fue interrumpida.'
};

function extraerCodigo(error: any): string | null {
  const valor = error?.code ?? error?.message ?? error;
  if (typeof valor !== 'string') return null;
  const texto = valor.trim();
  if (FIREBASE_ERROR_MAP[texto]) return texto;
  const match = texto.match(/^([a-z][a-z0-9]+(?:\.[a-z0-9-]+)*\/[a-z0-9-]+)/i);
  if (match && FIREBASE_ERROR_MAP[match[1]]) return match[1];
  if (texto === 'permission_denied') return 'permission-denied';
  return null;
}

export function traducirErrorFirebase(error: any, mensajePorDefecto?: string): string {
  const codigo = extraerCodigo(error);
  if (codigo) {
    return FIREBASE_ERROR_MAP[codigo];
  }
  return mensajePorDefecto || ERROR_GENERICO;
}
