import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserApiService {

  private api = environment.apiUrl;

  constructor(private http: HttpClient) { }

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
      map(users => users.filter(user => user.activo === true))
    );
  }
}
