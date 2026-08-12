import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, collectionGroup, query, orderBy, limit, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '../models/user.model';
import { Conversation } from '../models/conversation.model';
import { Message } from '../models/message.model';

export interface DatoPorHora {
  hour: number;
  count: number;
}

function obtenerTimestamp(item: any, campo: string): Date | null {
  const valor = item?.[campo];
  if (!valor) return null;
  if (typeof valor.toDate === 'function') {
    const fecha = valor.toDate();
    return fecha instanceof Date && !isNaN(fecha.getTime()) ? fecha : null;
  }
  if (valor instanceof Date && !isNaN(valor.getTime())) return valor;
  return null;
}

export function agruparPorHora(items: any[], campo: string): DatoPorHora[] {
  const horas: DatoPorHora[] = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
  items.forEach(item => {
    const fecha = obtenerTimestamp(item, campo);
    if (fecha) {
      horas[fecha.getHours()].count += 1;
    }
  });
  return horas;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor(private firestore: Firestore) { }

  getUsuarios(): Observable<User[]> {

    const usuariosRef = collection(
      this.firestore,
      'usuarios'
    );

    return collectionData(
      usuariosRef,
      { idField: 'id' }
    ) as Observable<User[]>;

  }
  getConversaciones(): Observable<Conversation[]> {

    const conversacionesRef = collection(
      this.firestore,
      'conversaciones'
    );

    return collectionData(
      conversacionesRef,
      { idField: 'id' }
    ) as Observable<Conversation[]>;

  }
  getMensajes(): Observable<any[]> {

    const mensajesRef = collectionGroup(
      this.firestore,
      'mensajes'
    );

    return collectionData(
      mensajesRef,
      { idField: 'id' }
    );

  }
  getTraduccionesHoy(): Observable<number> {
    return this.getMensajes().pipe(map((mensajes) => mensajes.length));
  }

  getSesionesActivas(): Observable<number> {
    return this.getConversaciones().pipe(map((conversaciones) => conversaciones.length));
  }

  getTotalConversations(): Observable<number> {
    return this.getConversaciones().pipe(map((conversaciones) => conversaciones.length));
  }

  getRecentActivity(): Observable<any[]> {
    const ref = collection(this.firestore, 'activities');
    const q = query(ref, orderBy('timestamp', 'desc'), limit(5));

    return collectionData(q, { idField: 'id' }) as Observable<any[]>;
  }

  /**
   * Actividad reciente del propio usuario (filtrada por uid a nivel de Firestore).
   * Se ordena y limita del lado del cliente para no requerir un índice compuesto.
   */
  getRecentActivityPorUsuario(uid: string): Observable<any[]> {
    const ref = collection(this.firestore, 'activities');
    const q = query(ref, where('uid', '==', uid));

    return (collectionData(q, { idField: 'id' }) as Observable<any[]>).pipe(
      map(list => [...list]
        .sort((a, b) => (obtenerTimestamp(b, 'timestamp')?.getTime() ?? 0) - (obtenerTimestamp(a, 'timestamp')?.getTime() ?? 0))
        .slice(0, 5))
    );
  }

  /**
   * Conversaciones por hora del día.
   * Si se pasa `uid`, la consulta se filtra a nivel de Firestore
   * (participants array-contains uid): el empleado solo recibe sus propias conversaciones.
   */
  getConversacionesPorHora(uid?: string): Observable<DatoPorHora[]> {
    const ref = collection(this.firestore, 'conversaciones');
    const q = uid
      ? query(ref, where('participants', 'array-contains', uid))
      : query(ref);
    return (collectionData(q, { idField: 'id' }) as Observable<any[]>)
      .pipe(map(conversations => agruparPorHora(conversations, 'updatedAt')));
  }

  /**
   * Mensajes por hora del día.
   * Si se pasa `uid`, la consulta se filtra a nivel de Firestore
   * (senderUid == uid): el empleado solo recibe sus propios mensajes.
   */
  getMensajesPorHora(uid?: string): Observable<DatoPorHora[]> {
    const ref = collectionGroup(this.firestore, 'mensajes');
    const q = uid
      ? query(ref, where('senderUid', '==', uid))
      : query(ref);
    return (collectionData(q, { idField: 'id' }) as Observable<any[]>)
      .pipe(map(messages => agruparPorHora(messages, 'timestamp')));
  }
}

