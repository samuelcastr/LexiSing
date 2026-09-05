import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { Auth, authState } from '@angular/fire/auth';
import { inject } from '@angular/core';
import { switchMap, take } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export function firebaseTokenInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const apiUrl = environment.apiUrl;

  if (!req.url.startsWith(apiUrl)) {
    return next(req);
  }

  const auth = inject(Auth);

  return authState(auth).pipe(
    take(1),
    switchMap(user => {
      if (!user) {
        return next(req);
      }

      return from(user.getIdToken()).pipe(
        switchMap(token => {
          const cloned = req.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`
            }
          });
          return next(cloned);
        })
      );
    })
  );
}
