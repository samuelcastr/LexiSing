import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MessagingService {
  private token$ = new BehaviorSubject<string | null>(null);

  constructor() {}

  // Skeleton: request permission and obtain FCM token (implementation requires firebase config & service worker)
  requestPermission(): Observable<string | null> {
    // Implement using AngularFire Messaging when ready
    console.warn('MessagingService.requestPermission: FCM client implementation missing in this skeleton.');
    return of(null);
  }

  getToken(): Observable<string | null> {
    return this.token$.asObservable();
  }
}
