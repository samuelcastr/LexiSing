export interface UserProfile {
  uid: string;
  nombre: string;
  email: string;
  rol: string; // e.g. 'usuario'
  fechaCreacion: any; // Firestore Timestamp
  activo: boolean;
  photoURL?: string;
}

export type User = UserProfile;
