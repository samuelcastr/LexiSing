export interface UserProfile {
  uid: string;
  nombre: string;
  email: string;
  rol: string; // e.g. 'usuario'
  fechaCreacion: any; // Firestore Timestamp
  activo: boolean;
}

export type User = UserProfile;
