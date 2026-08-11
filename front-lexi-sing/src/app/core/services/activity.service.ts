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
import { Auth } from '@angular/fire/auth';

import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ActivityService {

  constructor(private firestore: Firestore, private auth: Auth) {}

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
      uid: this.auth.currentUser?.uid ?? null,
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

    return collectionData(
      q,
      { idField: 'id' }
    ) as Observable<any[]>;
  }

}