import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FormalizeResponse } from '../models/formalize-response.model';

@Injectable({
  providedIn: 'root'
})
export class TextFormalizerService {

  private api = environment.apiUrl;

  constructor(private http: HttpClient) { }

  formalize(gestos: string[], contexto?: string): Observable<FormalizeResponse> {
    const body: Record<string, unknown> = { gestos };
    if (contexto) {
      body['contexto'] = contexto;
    }
    return this.http.post<FormalizeResponse>(`${this.api}/text/formalize/`, body);
  }
}
