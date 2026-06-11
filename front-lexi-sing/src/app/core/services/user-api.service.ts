import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserApiService {

  private api = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

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
}