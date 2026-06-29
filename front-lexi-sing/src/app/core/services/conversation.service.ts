import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from '@angular/fire/firestore';
import { Observable, from, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Conversation, Message } from '../models/message.model';

@Injectable({ providedIn: 'root' })
export class ConversationService {
  constructor(private firestore: Firestore) {}

  getAvailableUsers(): Observable<any[]> {
    try {
      const usuariosRef = collection(this.firestore, 'usuarios');
      return from(getDocs(usuariosRef)).pipe(
        map(snapshot => snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }))),
        catchError(error => {
          console.error('Error fetching users:', error);
          return of([]);
        })
      );
    } catch (error) {
      console.error('Error in getAvailableUsers:', error);
      return of([]);
    }
  }

  getActiveConversationForUser(uid: string): Observable<Conversation | null> {
    try {
      const conversacionesRef = collection(this.firestore, 'conversaciones');
      const q = query(
        conversacionesRef,
        where('participants', 'array-contains', uid),
        where('activa', '==', true),
        orderBy('updatedAt', 'desc'),
        limit(1)
      );
      return from(getDocs(q)).pipe(
        map(snapshot => {
          const docs = snapshot.docs;
          return docs.length ? ({ id: docs[0].id, ...docs[0].data() } as Conversation) : null;
        }),
        catchError(error => {
          console.error('Error fetching active conversation:', error);
          return of(null);
        })
      );
    } catch (error) {
      console.error('Error in getActiveConversationForUser:', error);
      return of(null);
    }
  }

  getConversationsForUser(uid: string): Observable<Conversation[]> {
    try {
      const conversacionesRef = collection(this.firestore, 'conversaciones');
      const q = query(
        conversacionesRef,
        where('participants', 'array-contains', uid),
        orderBy('updatedAt', 'desc')
      );
      return from(getDocs(q)).pipe(
        map(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation))),
        catchError(error => {
          console.error('Error fetching conversations for user:', error);
          return of([]);
        })
      );
    } catch (error) {
      console.error('Error in getConversationsForUser:', error);
      return of([]);
    }
  }

  getAllConversations(): Observable<Conversation[]> {
    try {
      const conversacionesRef = collection(this.firestore, 'conversaciones');
      return from(getDocs(conversacionesRef)).pipe(
        map(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation))),
        catchError(error => {
          console.error('Error fetching conversations:', error);
          return of([]);
        })
      );
    } catch (error) {
      console.error('Error in getAllConversations:', error);
      return of([]);
    }
  }

  createConversation(participants: string[]): Promise<any> {
    try {
      const conversacionesRef = collection(this.firestore, 'conversaciones');
      const payload: Conversation = {
        participants,
        updatedAt: serverTimestamp(),
        lastMessage: '',
        activa: true
      } as any;
      return addDoc(conversacionesRef, payload);
    } catch (error) {
      console.error('Error creating conversation:', error);
      return Promise.reject(error);
    }
  }

  getMessages(convId: string): Observable<Message[]> {
    try {
      const mensajesRef = collection(this.firestore, `conversaciones/${convId}/mensajes`);
      const q = query(mensajesRef, orderBy('timestamp', 'asc'));
      return from(getDocs(q)).pipe(
        map(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message))),
        catchError(error => {
          console.error('Error fetching messages:', error);
          return of([]);
        })
      );
    } catch (error) {
      console.error('Error in getMessages:', error);
      return of([]);
    }
  }

  sendMessage(convId: string, message: Partial<Message>) {
    try {
      const mensajesRef = collection(this.firestore, `conversaciones/${convId}/mensajes`);
      const payload = { ...message, timestamp: serverTimestamp() } as any;
      return addDoc(mensajesRef, payload).then(res => {
        const convRef = doc(this.firestore, `conversaciones/${convId}`);
        return updateDoc(convRef, {
          lastMessage: message.content ?? '',
          updatedAt: serverTimestamp()
        } as any)
          .then(() => res)
          .catch(() => res);
      });
    } catch (error) {
      console.error('Error sending message:', error);
      return Promise.reject(error);
    }
  }

  deleteMessage(convId: string, messageId: string) {
    try {
      const msgRef = doc(this.firestore, `conversaciones/${convId}/mensajes/${messageId}`);
      return deleteDoc(msgRef).then(() => true);
    } catch (error) {
      console.error('Error deleting message:', error);
      return Promise.reject(error);
    }
  }

  updateMessage(convId: string, messageId: string, newContent: string) {
    try {
      const msgRef = doc(this.firestore, `conversaciones/${convId}/mensajes/${messageId}`);
      return updateDoc(msgRef, {
        content: newContent,
        edited: true
      });
    } catch (error) {
      console.error('Error updating message:', error);
      return Promise.reject(error);
    }
  }

  getEmployeeUsers(): Observable<any[]> {
    try {
      const usuariosRef = collection(this.firestore, 'usuarios');
      const q = query(usuariosRef, where('rol', '==', 'empleado'));
      return from(getDocs(q)).pipe(
        map(snapshot => snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }))),
        catchError(error => {
          console.error('Error fetching employee users:', error);
          return of([]);
        })
      );
    } catch (error) {
      console.error('Error in getEmployeeUsers:', error);
      return of([]);
    }
  }
}
