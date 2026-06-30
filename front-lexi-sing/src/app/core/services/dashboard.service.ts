import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, collectionGroup, query, orderBy, limit } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '../models/user.model';
import { Conversation } from '../models/conversation.model';
import { Message } from '../models/message.model';

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
}

