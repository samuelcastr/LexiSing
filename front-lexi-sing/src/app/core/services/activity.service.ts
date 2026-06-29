import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  collectionData,
  query,
  orderBy,
  limit,
  serverTimestamp
} from '@angular/fire/firestore';

import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ActivityService {

  constructor(private firestore: Firestore) {}

  addActivity(
    userName: string,
    action: string
  ) {

    const ref = collection(
      this.firestore,
      'activities'
    );

    return addDoc(ref, {
      userName,
      action,
      timestamp: serverTimestamp()
    });
  }

  getRecentActivities(): Observable<any[]> {

    const ref = collection(
      this.firestore,
      'activities'
    );

    const q = query(
      ref,
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    // Temporal: devolver vacío para evitar llamadas Firestore en desarrollo
    return of([] as any[]);
  }

}