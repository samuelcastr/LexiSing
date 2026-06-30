import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface PresenceState {
  uid: string;
  status: 'online' | 'offline';
  lastSeen: number;
}

@Injectable({
  providedIn: 'root'
})
export class PresenceService {
  private readonly storageKey = 'lexising-presence-map';
  private readonly channelName = 'lexising-presence-channel';
  private readonly presenceSubject = new BehaviorSubject<Record<string, PresenceState>>({});
  private currentUid: string | null = null;
  private heartbeatTimer: any = null;
  private channel: BroadcastChannel | null = null;

  constructor() {
    this.loadFromStorage();
    this.setupChannel();
    this.setupListeners();
  }

  startPresence(uid: string): void {
    this.currentUid = uid;
    this.setPresence(uid, 'online');
    this.startHeartbeat();
  }

  stopPresence(): void {
    if (this.currentUid) {
      this.setPresence(this.currentUid, 'offline');
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  observePresence(uid: string): Observable<'online' | 'offline'> {
    return this.presenceSubject.pipe(
      map(map => map[uid]?.status || 'offline')
    );
  }

  private setupChannel(): void {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
      return;
    }

    this.channel = new BroadcastChannel(this.channelName);
    this.channel.onmessage = (event) => {
      if (event.data?.type === 'presence-update') {
        this.mergePresence(event.data.payload);
      }
    };
  }

  private setupListeners(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('beforeunload', () => this.stopPresence());
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && this.currentUid) {
        this.setPresence(this.currentUid, 'offline');
      } else if (document.visibilityState === 'visible' && this.currentUid) {
        this.setPresence(this.currentUid, 'online');
      }
    });
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.heartbeatTimer = setInterval(() => {
      if (this.currentUid) {
        this.setPresence(this.currentUid, 'online');
      }
    }, 15000);
  }

  private setPresence(uid: string, status: 'online' | 'offline'): void {
    const map = this.readPresenceMap();
    map[uid] = {
      uid,
      status,
      lastSeen: Date.now()
    };

    this.writePresenceMap(map);
  }

  private mergePresence(payload: Record<string, PresenceState>): void {
    const map = this.readPresenceMap();
    const merged = { ...map, ...payload };
    this.writePresenceMap(merged);
  }

  private readPresenceMap(): Record<string, PresenceState> {
    if (typeof window === 'undefined') {
      return {};
    }

    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private writePresenceMap(map: Record<string, PresenceState>): void {
    if (typeof window === 'undefined') {
      return;
    }

    localStorage.setItem(this.storageKey, JSON.stringify(map));
    this.presenceSubject.next(map);

    if (this.channel) {
      this.channel.postMessage({
        type: 'presence-update',
        payload: map
      });
    }
  }

  private loadFromStorage(): void {
    this.presenceSubject.next(this.readPresenceMap());
  }
}
