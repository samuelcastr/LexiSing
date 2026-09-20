import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ConversationService {
  private apiUrl = 'http://localhost:8000/api/conversations/';

  constructor(private http: HttpClient) {}

  obtenerConversaciones(): Observable<any> { return this.http.get<any>(this.apiUrl).pipe(catchError(() => of([]))); }
  crearConversacion(data: any): Observable<any> { return this.http.post<any>(this.apiUrl, data).pipe(catchError(() => of({}))); }
  enviarMensaje(conversationId: string, mensaje: string): Observable<any> { return this.http.post<any>(`${this.apiUrl}${conversationId}/mensajes/`, { texto: mensaje }).pipe(catchError(() => of({}))); }
}
