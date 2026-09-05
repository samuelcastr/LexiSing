import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { traducirErrorFirebase } from '../utils/firebase-errors';

export interface ErrorNotification {
  id: number;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ErrorService {
  private errorsSubject = new BehaviorSubject<ErrorNotification[]>([]);
  errors$: Observable<ErrorNotification[]> = this.errorsSubject.asObservable();

  private contador = 0;

  mostrarError(error: unknown, mensajePorDefecto?: string): void {
    const message = traducirErrorFirebase(error, mensajePorDefecto);
    const id = ++this.contador;
    const actuales = this.errorsSubject.value;
    this.errorsSubject.next([...actuales, { id, message }]);
    setTimeout(() => this.eliminarError(id), 6000);
  }

  eliminarError(id: number): void {
    this.errorsSubject.next(this.errorsSubject.value.filter(e => e.id !== id));
  }
}
