import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, collectionChanges, query, where, orderBy, addDoc, doc, serverTimestamp, updateDoc, deleteDoc, getDocs } from '@angular/fire/firestore';
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

/**
   * Busca una conversación existente entre exactamente los mismos participantes.
   * Devuelve la conversación encontrada o null si no existe.
   */
  async findExistingConversation(participants: string[]): Promise<any | null> {
    if (!participants || participants.length === 0) return null;

    const col = collection(this.firestore, 'conversaciones');
    const q = query(col, where('participants', 'array-contains', participants[0]));
    const snapshot = await getDocs(q);

    const sorted = [...participants].sort();
    const existing = snapshot.docs
      .map(d => ({ id: d.id, ...(d.data() as any) }))
      .find(conv => {
        const convParticipants = (conv.participants || []) as string[];
        if (convParticipants.length !== sorted.length) return false;
        const sortedConv = [...convParticipants].sort();
        return sorted.every((p, i) => p === sortedConv[i]);
      });

    return existing ?? null;
  }

  createConversation(participants: string[]): Promise<any> {
    const col = collection(this.firestore, 'conversaciones');

    if (participants.length === 2) {
      const [uidA, uidB] = participants;
      const q = query(
        col,
        where('participants', 'array-contains', uidA)
      );
      return getDocs(q).then(snapshot => {
        const exists = snapshot.docs.some((docSnap: any) => {
          const data = docSnap.data();
          const parts: string[] = (data as any)?.participants || [];
          return parts.includes(uidB);
        });
        if (exists) {
          throw new Error('Ya existe una conversación con este usuario.');
        }
        const payload: Conversation = { participants, updatedAt: serverTimestamp(), lastMessage: '' } as any;
        return addDoc(col, payload);
      });
    }

    const payload: Conversation = { participants, updatedAt: serverTimestamp(), lastMessage: '' } as any;
    return addDoc(col, payload);
  }

  getMessages(convId: string): Observable<Message[]> {
    const col = collection(this.firestore, `conversaciones/${convId}/mensajes`);
    const q = query(col, orderBy('timestamp', 'asc'));
    return collectionData(q, { idField: 'id' }) as Observable<Message[]>;
  }

  /**
   * Cambios en tiempo real de los mensajes de una conversación.
   * Emite el array de cambios (type 'added' | 'modified' | 'removed') de cada snapshot.
   */
  getMessageChanges(convId: string): Observable<any[]> {
    const col = collection(this.firestore, `conversaciones/${convId}/mensajes`);
    const q = query(col, orderBy('timestamp', 'asc'));
    return collectionChanges(q) as Observable<any[]>;
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
