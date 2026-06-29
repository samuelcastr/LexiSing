import { Injectable } from '@angular/core';
import { Firestore, collection, query, where, orderBy, limit, getDocs } from '@angular/fire/firestore';
import { Observable, from, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { User } from '../models/user.model';
import { Conversation } from '../models/conversation.model';
import { Message } from '../models/message.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor(private firestore: Firestore) { }

  getUsuarios(): Observable<User[]> {
    const usuariosRef = collection(this.firestore, 'usuarios');
    return from(getDocs(usuariosRef)).pipe(
      map(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as User) } as User)))
    );
  }

  getConversaciones(): Observable<Conversation[]> {
    const conversacionesRef = collection(this.firestore, 'conversaciones');
    return from(getDocs(conversacionesRef)).pipe(
      map(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Conversation) } as Conversation)))
    );
  }

  getMensajes(): Observable<any[]> {
    const conversacionesRef = collection(this.firestore, 'conversaciones');
    const q = query(conversacionesRef, orderBy('updatedAt', 'desc'));
    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(doc => ({
        id: doc.id,
        content: ((doc.data() as any).lastMessage) || 'Sin mensaje',
        timestamp: (doc.data() as any).updatedAt,
        conversationId: doc.id
      }))),
      catchError(() => of([]))
    );
  }

  getRecentActivity(): Observable<any[]> {
    const conversacionesRef = collection(this.firestore, 'conversaciones');
    const q = query(conversacionesRef, orderBy('updatedAt', 'desc'), limit(10));
    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(doc => ({
        id: doc.id,
        content: ((doc.data() as any).lastMessage) || 'Conversación actualizada',
        timestamp: (doc.data() as any).updatedAt,
        conversationId: doc.id
      }))),
      catchError(() => of([]))
    );
  }

  getTraduccionesHoy(): Observable<number> {
    const start = new Date();
    start.setHours(0,0,0,0);
    const conversacionesRef = collection(this.firestore, 'conversaciones');
    const q = query(conversacionesRef, where('updatedAt', '>=', start));
    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.size),
      catchError(() => of(0))
    );
  }

  getSesionesActivas(): Observable<number> {
    const convs = collection(this.firestore, 'conversaciones');
    const q = query(convs, where('activa', '==', true));
    return from(getDocs(q)).pipe(map(snapshot => snapshot.size));
  }

  getTotalConversations(): Observable<number> {
    const convs = collection(this.firestore, 'conversaciones');
    return from(getDocs(convs)).pipe(map(snapshot => snapshot.size));
  }
}

