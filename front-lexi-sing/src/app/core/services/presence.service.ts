import { Injectable } from '@angular/core';
import { Firestore, doc, docData, setDoc } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

interface PresenceState {
  uid: string;
  status: 'online' | 'offline';
  lastSeen: number;
  tabs?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PresenceService {
  private currentUid: string | null = null;
  private heartbeatTimer: any = null;
  private tabId = this.generateTabId();

  constructor(private firestore: Firestore) {
    this.setupListeners();
  }

  startPresence(uid: string): void {
    this.currentUid = uid;
    this.setPresence(uid, 'online', true);
    this.startHeartbeat();
  }

  stopPresence(): void {
    if (this.currentUid) {
      this.setPresence(this.currentUid, 'offline', false);
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  observePresence(uid: string): Observable<'online' | 'offline'> {
    if (typeof window === 'undefined') {
      return of('offline');
    }

    const presenceRef = doc(this.firestore, 'presence', uid);
    return docData(presenceRef).pipe(
      map((state: any) => {
        const online = state?.status === 'online';
        const lastSeen = typeof state?.lastSeen === 'number' ? state.lastSeen : 0;
        const isFresh = lastSeen > Date.now() - 45000;
        return online && isFresh ? 'online' : 'offline';
      })
    );
  }

  private setupListeners(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('beforeunload', () => this.stopPresence());
    window.addEventListener('pagehide', () => this.stopPresence());
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.currentUid) {
        this.setPresence(this.currentUid, 'online', true);
      }
    });
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.heartbeatTimer = setInterval(() => {
      if (this.currentUid) {
        this.setPresence(this.currentUid, 'online', true);
      }
    }, 15000);
  }

  private setPresence(uid: string, status: 'online' | 'offline', activeTab: boolean): void {
    const presenceRef = doc(this.firestore, 'presence', uid);
    const payload: any = {
      uid,
      status,
      lastSeen: Date.now(),
      tabId: this.tabId,
    };

    if (activeTab) {
      payload.activeTab = this.tabId;
    }

    setDoc(presenceRef, payload, { merge: true }).catch(() => {
      // Ignorar fallos silenciosamente para no romper la navegación.
    });
  }

  private generateTabId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
