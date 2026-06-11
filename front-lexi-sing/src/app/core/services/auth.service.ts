import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { Firestore, doc, setDoc, serverTimestamp, getDoc } from '@angular/fire/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { from, Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { User } from '../models/user.model';
import { AuthResponse } from '../models/auth-response.model';
import { UserApiService } from './user-api.service';

@Injectable({ providedIn: 'root' })
export class AuthService {

  constructor(private auth: Auth, private firestore: Firestore, private router: Router, private userApi: UserApiService) { }

register(
  email: string,
  password: string,
  nombre: string
): Observable<AuthResponse> {

  return from(
    createUserWithEmailAndPassword(
      this.auth,
      email,
      password
    )
  ).pipe(

    switchMap(cred => {

      const uid = cred.user.uid;

      console.log('UID creado:', uid);

      const userData: User = {
        uid,
        nombre,
        email,
        rol: 'usuario',
        fechaCreacion: serverTimestamp(),
        activo: true,
      } as unknown as User;

      const ref = doc(
        this.firestore,
        'usuarios',
        uid
      );

      return from(
        setDoc(ref, userData)
      ).pipe(

        map(() => {

          console.log(
            'Usuario guardado en Firestore'
          );

          return {
            user: userData,
            message: 'Registro exitoso'
          };
        })

      );

    }),

    catchError(err => {

      console.error(
        'ERROR REGISTER:',
        err
      );

      return of({
        user: null,
        message:
          err?.message ||
          'Error al registrar',
        error: err
      });

    })
  );
}

  login(email: string, password: string): Observable<AuthResponse> {
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      map(cred => ({ user: { uid: cred.user.uid, nombre: cred.user.displayName ?? '', email: cred.user.email ?? '' } as User, message: 'Login exitoso' } as AuthResponse)),
      catchError(err => of({ user: null, message: err?.message || 'Error al autenticar', error: err } as AuthResponse))
    );
  }

  loginWithGoogle(): Observable<AuthResponse> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return from(signInWithPopup(this.auth, provider)).pipe(
      switchMap(cred => {
        const fbUser = cred.user;
        const uid = fbUser.uid;
        const ref = doc(this.firestore, 'usuarios', uid);
        return from(getDoc(ref)).pipe(
          switchMap(snapshot => {
            const userData: User = {
              uid,
              nombre: fbUser.displayName ?? '',
              email: fbUser.email ?? '',
              rol: 'usuario',
              fechaCreacion: serverTimestamp(),
              activo: true,
            } as unknown as User;

            if (!snapshot.exists()) {
              return from(setDoc(ref, userData)).pipe(
                map(() => ({ user: userData, message: 'Login con Google exitoso' } as AuthResponse))
              );
            }

            return of({ user: snapshot.data() as User, message: 'Login con Google exitoso' } as AuthResponse);
          })
        );
      }),
      catchError(err => {
        console.error('Google login error', err);
        let message = err?.message || 'Error al autenticar con Google';

        if (err?.code === 'auth/unauthorized-domain') {
          message = 'Dominio no autorizado: agrega localhost en Firebase Auth > Authorized domains.';
        } else if (err?.code === 'auth/operation-not-allowed') {
          message = 'Google no está habilitado: activa el proveedor Google en Firebase Authentication.';
        } else if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
          message = 'Popup bloqueado o cerrado. Intentando iniciar con redirect...';
        }

        const errorResponse = {
          user: null,
          message,
          code: err?.code || null,
          error: err,
        } as AuthResponse;

        if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
          return from(signInWithRedirect(this.auth, provider)).pipe(
            map(() => ({
              user: null,
              message: 'Redirigiendo para iniciar sesión con Google...',
              code: err.code,
              error: err,
            } as AuthResponse)),
            catchError(err2 => of({
              user: null,
              message: err2?.message || 'Error al usar redirect de Google',
              code: err2?.code || null,
              error: err2,
            } as AuthResponse))
          );
        }

        return of(errorResponse);
      })
    );
  }

  checkGoogleRedirectResult(): Observable<AuthResponse> {
    if (typeof window === 'undefined') {
      return of({ user: null, message: 'No hay resultado de redirect en SSR', code: null, error: null } as AuthResponse);
    }
    return from(getRedirectResult(this.auth)).pipe(
      switchMap(cred => {
        if (!cred || !cred.user) {
          return of({ user: null, message: 'No hay resultado de redirect', code: null, error: null } as AuthResponse);
        }

        const fbUser = cred.user;
        const uid = fbUser.uid;
        const ref = doc(this.firestore, 'usuarios', uid);
        return from(getDoc(ref)).pipe(
          switchMap(snapshot => {
            const userData: User = {
              uid,
              nombre: fbUser.displayName ?? '',
              email: fbUser.email ?? '',
              rol: 'usuario',
              fechaCreacion: serverTimestamp(),
              activo: true,
            } as unknown as User;

            if (!snapshot.exists()) {
              return from(setDoc(ref, userData)).pipe(
                map(result => {
                  this.router.navigate(['/dashboard']);
                  return { user: userData, message: 'Login con Google por redirect exitoso' } as AuthResponse;
                })
              );
            }

            return of({ user: snapshot.data() as User, message: 'Login con Google por redirect exitoso' } as AuthResponse).pipe(
              map(result => {
                this.router.navigate(['/dashboard']);
                return result;
              })
            );
          })
        );
      }),
      catchError(err => {
        console.error('Error processing redirect result', err);
        return of({ user: null, message: err?.message || 'Error al procesar redirect de Google', code: err?.code || null, error: err } as AuthResponse);
      })
    );
  }

  logout(): Observable<void> {
    return from(signOut(this.auth)).pipe(
      map(() => {
        this.router.navigate(['/login']);
        return;
      }),
      catchError(err => throwError(() => err))
    );
  }

  resetPassword(email: string): Observable<void | { message: string }> {
    return from(sendPasswordResetEmail(this.auth, email)).pipe(
      map(() => ({ message: 'Correo de restablecimiento enviado' })),
      catchError(err => throwError(() => err))
    );
  }

  getCurrentUser(): Observable<User | null> {
    return authState(this.auth).pipe(
      switchMap(fbUser => {
        if (!fbUser) return of(null);
        const ref = doc(this.firestore, 'usuarios', fbUser.uid);
        return from(getDoc(ref)).pipe(
          map(snapshot => (snapshot.exists() ? (snapshot.data() as User) : null)),
          catchError(() => of(null))
        );
      })
    );
  }

  isAuthenticated(): Observable<boolean> {
    return authState(this.auth).pipe(map(u => !!u));
  }
}
