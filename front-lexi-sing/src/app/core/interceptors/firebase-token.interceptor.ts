import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { Auth, authState } from '@angular/fire/auth';
import { switchMap, take, mergeMap } from 'rxjs/operators';

@Injectable()
export class FirebaseTokenInterceptor implements HttpInterceptor {
  constructor(private auth: Auth) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return authState(this.auth).pipe(
      take(1),
      mergeMap(user => {
        if (!user) {
          // No hay usuario autenticado, pasar request tal cual
          return next.handle(req);
        }
        
        // Obtener ID token del usuario
        return from(user.getIdToken()).pipe(
          switchMap(token => {
            // Clonar request y agregar token en header Authorization
            const cloned = req.clone({
              setHeaders: {
                Authorization: `Bearer ${token}`
              }
            });
            return next.handle(cloned);
          })
        );
      })
    );
  }
}
