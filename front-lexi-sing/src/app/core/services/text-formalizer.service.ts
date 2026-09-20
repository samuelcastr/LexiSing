import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class TextFormalizerService {
  private apiUrl = 'http://localhost:8000/api/text/formalize/';

  constructor(private http: HttpClient) {}

  formalizar(gestos: string[], contexto: string): Observable<any> {
    return this.http.post<any>(this.apiUrl, { gestos, contexto }, {
      headers: { 'Authorization': 'Bearer TOKEN', 'Content-Type': 'application/json' }
    }).pipe(
      catchError(error => {
        const fallback = { texto_formal: gestos.join(' ').replace(/^\w/, c => c.toUpperCase()) + '.', gestos_originales: gestos, fuente: 'fallback' };
        return of(fallback);
      })
    );
  }
}
