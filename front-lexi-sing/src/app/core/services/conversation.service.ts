import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, query, where, orderBy, addDoc, doc, serverTimestamp, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Conversation, Message } from '../models/message.model';

@Injectable({ providedIn: 'root' })
export class ConversationService {
  constructor(private firestore: Firestore) {}

  getConversationsForUser(uid: string): Observable<Conversation[]> {
    const col = collection(this.firestore, 'conversaciones');
    const q = query(col, where('participants', 'array-contains', uid));
    return collectionData(q, { idField: 'id' }) as Observable<Conversation[]>;
  }

  getAllConversations(): Observable<Conversation[]> {
    const col = collection(this.firestore, 'conversaciones');
    return collectionData(col, { idField: 'id' }) as Observable<Conversation[]>;
  }

  async createConversation(participants: string[]): Promise<any> {
    const col = collection(this.firestore, 'conversaciones');

    if (participants.length === 2) {
      const [uidA, uidB] = participants;
      const q = query(
        col,
        where('participants', 'array-contains', uidA)
      );
      const snapshot = await this._getSnapshot(q);
      const exists = snapshot.docs.some((docSnap: any) => {
        const data = docSnap.data();
        const parts: string[] = (data as any)?.participants || [];
        return parts.includes(uidB);
      });
      if (exists) {
        throw new Error('Ya existe una conversación con este usuario.');
      }
    }

    const payload: Conversation = { participants, updatedAt: serverTimestamp(), lastMessage: '' } as any;
    return addDoc(col, payload);
  }

  private async _getSnapshot(q: any): Promise<any> {
    const { getDocs } = await import('@angular/fire/firestore');
    return getDocs(q);
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

  editMessage(convId: string, messageId: string, newContent: string) {
    const msgRef = doc(this.firestore, `conversaciones/${convId}/mensajes/${messageId}`);
    return updateDoc(msgRef, {
      content: newContent,
      edited: true,
      editedAt: serverTimestamp()
    } as Partial<Message>);
  }

  deleteMessage(convId: string, messageId: string) {
    const msgRef = doc(this.firestore, `conversaciones/${convId}/mensajes/${messageId}`);
    return updateDoc(msgRef, {
      deleted: true,
      deletedAt: serverTimestamp(),
      content: 'Mensaje eliminado'
    } as Partial<Message>);
  }

  softDeleteMessage(convId: string, messageId: string) {
    return this.deleteMessage(convId, messageId);
  }
}
