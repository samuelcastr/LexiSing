import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { from, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { map as rxMap } from 'rxjs/operators';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserApiService {

  private api = 'http://localhost:8000/api';

  constructor(private http: HttpClient, private firestore: Firestore) { }

  saveUser(user: any): Observable<any> {
    return this.http.post(
      `${this.api}/register-user/`,
      user
    );
  }

  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.api}/users/`
    );
  }

  getOnlineUsers(): Observable<any[]> {
    return this.getUsers().pipe(
      rxMap(users => users.filter(user => user.activo === true))
    );
  }

  getAssignedEmployee(uid: string): Observable<User | null> {
    const userRef = doc(this.firestore, 'usuarios', uid);
    return from(getDoc(userRef)).pipe(
      switchMap(snapshot => {
        if (!snapshot.exists()) {
          return of(null);
        }
        const data = snapshot.data() as any;
        const assignedUid = data.assignedEmployeeUid || data.empleadoAsignado || null;
        if (!assignedUid) {
          return of(null);
        }

        const assignedRef = doc(this.firestore, 'usuarios', assignedUid);
        return from(getDoc(assignedRef)).pipe(
          map(empSnap => empSnap.exists() ? (empSnap.data() as User) : null),
          catchError(() => of(null))
        );
      }),
      catchError(() => of(null))
    );
  }
}
