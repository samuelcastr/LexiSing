import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private authUrl = 'http://localhost:8000/api/';

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string): Observable<any> { return this.http.post<any>(`${this.authUrl}auth/token/`, { email, password }).pipe(catchError(() => of({}))); }
  logout(): void { localStorage.removeItem('firebaseToken'); this.router.navigate(['/auth/login']); }
  isAuthenticated(): boolean { return !!localStorage.getItem('firebaseToken'); }
  getToken(): string | null { return localStorage.getItem('firebaseToken'); }
}
