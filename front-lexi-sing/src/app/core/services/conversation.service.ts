import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, query, where, orderBy, addDoc, doc, serverTimestamp, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Conversation, Message } from '../models/message.model';

@Injectable({ providedIn: 'root' })
export class ConversationService {
  constructor(private firestore: Firestore) {}

  getConversationsForUser(uid: string): Observable<Conversation[]> {
    const col = collection(this.firestore, 'conversaciones');
    const q = query(col, where('participants', 'array-contains', uid), orderBy('updatedAt', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<Conversation[]>;
  }

  createConversation(participants: string[]): Promise<any> {
    const col = collection(this.firestore, 'conversaciones');
    const payload: Conversation = { participants, updatedAt: serverTimestamp(), lastMessage: '' } as any;
    return addDoc(col, payload);
  }

  getMessages(convId: string): Observable<Message[]> {
    const col = collection(this.firestore, `conversaciones/${convId}/mensajes`);
    const q = query(col, orderBy('timestamp', 'asc'));
    return collectionData(q, { idField: 'id' }) as Observable<Message[]>;
  }

  sendMessage(convId: string, message: Partial<Message>) {
    const col = collection(this.firestore, `conversaciones/${convId}/mensajes`);
    const payload = { ...message, timestamp: serverTimestamp() } as any;
    return addDoc(col, payload).then(res => {
      // actualizar lastMessage y updatedAt en la conversación (merge)
      const convRef = doc(this.firestore, `conversaciones/${convId}`);
      return updateDoc(convRef, { lastMessage: message.content ?? '', updatedAt: serverTimestamp() } as any).then(() => res).catch(() => res);
    });
  }

  deleteMessage(convId: string, messageId: string) {
    const msgRef = doc(this.firestore, `conversaciones/${convId}/mensajes/${messageId}`);
    return deleteDoc(msgRef).then(() => {
      // Nota: actualizar lastMessage debe manejarse con transacción o Cloud Function en producción.
      return true;
    });
  }
}
