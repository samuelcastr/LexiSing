import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
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
  getMensajes(): Observable<Message[]> {

  const mensajesRef = collection(
    this.firestore,
    'messages'
  );

  return collectionData(
    mensajesRef,
    { idField: 'id' }
  ) as Observable<Message[]>;

 }
 getRecentActivity() {

  const ref = collection(
    this.firestore,
    'conversations'
  );

  return collectionData(
    ref,
    { idField: 'id' }
  );
}
}

