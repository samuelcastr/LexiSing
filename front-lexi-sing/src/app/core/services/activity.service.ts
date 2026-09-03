import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  collectionData,
  query,
  where,
  serverTimestamp
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

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
    const uid = this.auth.currentUser?.uid;
    if (!uid) return of([]);

    const ref = collection(
      this.firestore,
      'activities'
    );

    const q = query(
      ref,
      where('uid', '==', uid)
    );

    return (collectionData(
      q,
      { idField: 'id' }
    ) as Observable<any[]>).pipe(
      map(list => [...list]
        .sort((a, b) => (this.obtenerMs(b.timestamp) - this.obtenerMs(a.timestamp)))
        .slice(0, 10))
    );
  }

  private obtenerMs(fecha: any): number {
    if (!fecha) return 0;
    if (typeof fecha.toDate === 'function') {
      const d = fecha.toDate();
      return d instanceof Date ? d.getTime() : 0;
    }
    if (fecha.seconds !== undefined) return fecha.seconds * 1000;
    if (fecha instanceof Date) return fecha.getTime();
    return 0;
  }

}