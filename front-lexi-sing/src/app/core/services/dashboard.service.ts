import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, collectionGroup } from '@angular/fire/firestore';
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

