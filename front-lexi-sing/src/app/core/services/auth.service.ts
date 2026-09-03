import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, setDoc, serverTimestamp, getDoc, collection, getDocs, updateDoc } from '@angular/fire/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, sendEmailVerification, GoogleAuthProvider, OAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, updateProfile as fbUpdateProfile, updateEmail as fbUpdateEmail, updatePassword as fbUpdatePassword, reauthenticateWithCredential, EmailAuthProvider,linkWithCredential, setPersistence, browserLocalPersistence, onAuthStateChanged } from '@angular/fire/auth';
import { BehaviorSubject, from, MonoTypeOperatorFunction, Observable, of, throwError, timer } from 'rxjs';
import { catchError, map, retry, switchMap, tap } from 'rxjs/operators';
import { User } from '../models/user.model';
import { AuthResponse } from '../models/auth-response.model';
import { UserApiService } from './user-api.service';
import { PresenceService } from './presence.service';
import { traducirErrorFirebase } from '../utils/firebase-errors';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly SESSION_KEY = 'lexising_session_user';
  private readyPromise: Promise<void>;
  private authReachableAt = 0;
  private probeInFlight = false;
  private connectingSubject = new BehaviorSubject<boolean>(false);

  readonly connecting$ = this.connectingSubject.asObservable();

  constructor(private auth: Auth, private firestore: Firestore, private router: Router, private userApi: UserApiService, private presenceService: PresenceService) {
    if (typeof window !== 'undefined') {
      if (!this.auth.currentUser) {
        setPersistence(this.auth, browserLocalPersistence).catch(() => undefined);
      }
      onAuthStateChanged(this.auth, fbUser => {
        if (fbUser) {
          // Firebase Auth no conoce el rol (está en Firestore); conservamos el ya guardado.
          const prev = this.getSessionFromStorage();
          this.saveSessionToStorage({ uid: fbUser.uid, rol: prev?.rol || '', nombre: fbUser.displayName ?? prev?.nombre ?? '', email: fbUser.email ?? prev?.email ?? '' } as any);
        }
      });
    }
    this.readyPromise = typeof window !== 'undefined'
      ? this.auth.authStateReady().catch(() => undefined as void)
      : Promise.resolve();
  }

  private retryOnNetworkErrors<T>(): MonoTypeOperatorFunction<T> {
    return retry<T>({
      count: 2,
      delay: (error) => {
        if (error?.code !== 'auth/network-request-failed') throw error;
        return timer(1200);
      },
    });
  }

  ensureAuthServerReachable(): void {
    if (typeof window === 'undefined') return;
    if (this.probeInFlight) return;
    if (Date.now() - this.authReachableAt < 8000) return;
    this.probeInFlight = true;
    this.probeAuthServer().then(ok => {
      this.probeInFlight = false;
      if (ok) this.authReachableAt = Date.now();
    });
  }

  private probeAuthServer(): Promise<boolean> {
    return new Promise(resolve => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      fetch('https://identitytoolkit.googleapis.com/', {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal,
      }).then(
        () => { clearTimeout(timeoutId); resolve(true); },
        () => { clearTimeout(timeoutId); resolve(false); }
      );
    });
  }

  private saveSessionToStorage(user: User | null): void {
    if (typeof window === 'undefined') return;
    if (user) {
      window.localStorage.setItem(this.SESSION_KEY, JSON.stringify({ uid: user.uid, rol: user.rol, nombre: user.nombre, email: user.email }));
    } else {
      window.localStorage.removeItem(this.SESSION_KEY);
    }
  }

  private getSessionFromStorage(): { uid: string; rol?: string; nombre?: string; email?: string } | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(this.SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  private startConnectivityProbe(): Observable<boolean> {
    if (typeof window === 'undefined') {
      return of(true);
    }
    if (Date.now() - this.authReachableAt >= 8000 && !this.probeInFlight) {
      this.probeInFlight = true;
      this.connectingSubject.next(true);
      this.probeAuthServer().then(ok => {
        this.probeInFlight = false;
        this.connectingSubject.next(false);
        if (ok) this.authReachableAt = Date.now();
      });
    }
    return of(true);
  }

  register(
    email: string,
    password: string,
    nombre: string
  ): Observable<AuthResponse> {
    return this.startConnectivityProbe().pipe(
      switchMap(() => from(
        createUserWithEmailAndPassword(
          this.auth,
          email,
          password
        )
      ).pipe(
          switchMap(cred => {
            const uid = cred.user.uid;
            const userData: User = {
              uid,
              nombre,
              email,
              rol: 'usuario',
              fechaCreacion: serverTimestamp(),
              activo: true,
              photoURL:"",
            } as unknown as User;
            const ref = doc(this.firestore, 'usuarios', uid);
            return from(sendEmailVerification(cred.user)).pipe(
              switchMap(() => from(setDoc(ref, userData))),
              switchMap(() => from(signOut(this.auth))),
              map(() => ({
                user: userData,
                message: 'Registro exitoso. Te enviamos un correo de confirmación. Revisa tu bandeja de entrada y confirma tu correo antes de iniciar sesión.'
              }))
            );
          })
        )
      ),
      this.retryOnNetworkErrors(),
      catchError(err => {
        this.connectingSubject.next(false);
        return of({
          user: null,
          message: traducirErrorFirebase(err, 'Error al registrar'),
          error: err
        });
      })
    );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.startConnectivityProbe().pipe(
      switchMap(() => setPersistence(this.auth, browserLocalPersistence).then(() => true, () => true).then(() => signInWithEmailAndPassword(this.auth, email, password))),
      switchMap(cred => {
        if (!cred.user.emailVerified) {
          return from(signOut(this.auth)).pipe(
            map(() => ({
              user: null,
              message: 'Debes confirmar tu correo electrónico antes de iniciar sesión.',
              code: 'auth/email-not-verified',
              error: { code: 'auth/email-not-verified' }
            } as AuthResponse))
          );
        }

        const uid = cred.user.uid;
        const ref = doc(this.firestore, 'usuarios', uid);
        return from(getDoc(ref)).pipe(
          map(snapshot => {
            let user: User;
            if (snapshot.exists()) {
              user = snapshot.data() as User;
            } else {
              user = {
                uid,
                nombre: cred.user.displayName ?? '',
                email: cred.user.email ?? '',
                rol: 'usuario',
                fechaCreacion: serverTimestamp(),
                activo: true,
                photoURL: cred.user.photoURL ?? '',
              } as unknown as User;
              setDoc(ref, user).catch(() => undefined);
            }
            return { user, message: 'Login exitoso' } as AuthResponse;
          }),
          tap((res: AuthResponse) => {
            if (res.user) {
              this.saveSessionToStorage(res.user);
            }
          })
        );
      }),
      this.retryOnNetworkErrors(),
      catchError(err => {
        this.connectingSubject.next(false);
        return of({ user: null, message: traducirErrorFirebase(err, 'Error al autenticar'), error: err } as AuthResponse);
      })
    );
  }

  loginWithGoogle(): Observable<AuthResponse> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return from(setPersistence(this.auth, browserLocalPersistence).then(() => signInWithPopup(this.auth, provider), () => signInWithPopup(this.auth, provider))).pipe(
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
              photoURL: fbUser.photoURL ?? '',
            } as unknown as User;

            if (!snapshot.exists()) {
              return from(setDoc(ref, userData)).pipe(
                map(() => ({ user: userData, message: 'Login con Google exitoso' } as AuthResponse))
              );
            }

            return of({ user: snapshot.data() as User, message: 'Login con Google exitoso' } as AuthResponse);
          }),
          tap((res: AuthResponse) => {
            if (res.user) this.saveSessionToStorage(res.user);
          })
        );
      }),
      catchError(err => {
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
          return from(setPersistence(this.auth, browserLocalPersistence).then(() => signInWithRedirect(this.auth, provider), () => signInWithRedirect(this.auth, provider))).pipe(
            map(() => ({
              user: null,
              message: 'Redirigiendo para iniciar sesión con Google...',
              code: err.code,
              error: err,
            } as AuthResponse)),
            catchError(err2 => of({
              user: null,
              message: traducirErrorFirebase(err2, 'Error al usar redirect de Google'),
              code: err2?.code || null,
              error: err2,
            } as AuthResponse))
          );
        }

        return of(errorResponse);
      })
    );
  }

loginWithMicrosoft(): Observable<AuthResponse> {
  const microsoftProvider = new OAuthProvider('microsoft.com');
  microsoftProvider.setCustomParameters({
    prompt: 'select_account'
  });

  return from(setPersistence(this.auth, browserLocalPersistence).then(() => signInWithPopup(this.auth, microsoftProvider), () => signInWithPopup(this.auth, microsoftProvider))).pipe(
    switchMap(cred => {
      return this.finishSocialLogin(cred.user, 'Microsoft');
    }),

    catchError(err => {
      console.log('Error Microsoft:', err);

      // La cuenta ya existe con otro proveedor.
      if (err?.code === 'auth/account-exists-with-different-credential') {
        const pendingCredential =
          OAuthProvider.credentialFromError(err);

        if (!pendingCredential) {
          return of({
            user: null,
            message: 'No se pudo obtener la credencial pendiente de Microsoft.',
            code: err?.code,
            error: err
          } as AuthResponse);
        }

        /*
         * Guardamos temporalmente la credencial Microsoft.
         * No guardamos tokens manualmente en localStorage.
         */
        return this.completeMicrosoftAccountLink(
          pendingCredential,
          err?.customData?.email || err?.email || ''
        );
      }

      let message = traducirErrorFirebase(
        err,
        'Error al autenticar con Microsoft'
      );

      if (err?.code === 'auth/unauthorized-domain') {
        message =
          'Dominio no autorizado: agrega localhost en Firebase Authentication > Authorized domains.';
      } else if (err?.code === 'auth/operation-not-allowed') {
        message =
          'Microsoft no está habilitado: activa Microsoft en Firebase Authentication > Sign-in method.';
      } else if (err?.code === 'auth/popup-blocked') {
        message =
          'El navegador bloqueó la ventana de Microsoft.';
      } else if (err?.code === 'auth/popup-closed-by-user') {
        message =
          'La ventana de Microsoft fue cerrada.';
      }

      return of({
        user: null,
        message,
        code: err?.code || null,
        error: err
      } as AuthResponse);
    })
  );
}

private completeMicrosoftAccountLink(
  pendingCredential: any,
  email: string
): Observable<AuthResponse> {

  const googleProvider = new GoogleAuthProvider();

  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });

  return from(
    signInWithPopup(this.auth, googleProvider)
  ).pipe(

    switchMap(googleResult => {

      const existingUser = googleResult.user;

      return from(
        linkWithCredential(
          existingUser,
          pendingCredential
        )
      ).pipe(

        switchMap(linkResult => {

          const linkedUser = linkResult.user;

          return this.saveSocialUser(
            linkedUser,
            'Microsoft'
          );

        })

      );

    }),

    catchError(err => {

      console.error(
        'Error vinculando Microsoft:',
        err
      );

      let message =
        'No se pudo vincular Microsoft con tu cuenta.';

      if (err?.code === 'auth/popup-closed-by-user') {
        message =
          'Se canceló el inicio de sesión con Google.';
      }

      if (err?.code === 'auth/credential-already-in-use') {
        message =
          'Esta cuenta de Microsoft ya está vinculada a otra cuenta de Firebase.';
      }

      if (err?.code === 'auth/provider-already-linked') {
        message =
          'Microsoft ya está vinculado a esta cuenta.';
      }

      if (err?.code === 'auth/wrong-password') {
        message =
          'La contraseña de Google/esta cuenta no es correcta.';
      }

      return of({
        user: null,
        message,
        code: err?.code || null,
        error: err
      } as AuthResponse);

    })
  );
}

private saveSocialUser(
  fbUser: any,
  providerName: string
): Observable<AuthResponse> {

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
        photoURL: fbUser.photoURL ?? '',
      } as unknown as User;

      if (!snapshot.exists()) {

        return from(
          setDoc(ref, userData)
        ).pipe(

          map(() => ({
            user: userData,
            message:
              `Cuenta vinculada correctamente con ${providerName}`
          } as AuthResponse))

        );

      }

      const existingUser =
        snapshot.data() as User;

      return of({
        user: {
          ...existingUser,
          uid
        },
        message:
          `Cuenta vinculada correctamente con ${providerName}`
      } as AuthResponse);

    }),
    tap((res: AuthResponse) => {
      if (res.user) this.saveSessionToStorage(res.user);
    })
  );
}

  private finishSocialLogin(fbUser: any, providerName: string): Observable<AuthResponse> {
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
          photoURL: fbUser.photoURL ?? '',
        } as unknown as User;

        if (!snapshot.exists()) {
          return from(setDoc(ref, userData)).pipe(
            map(() => ({
              user: userData,
              message: `Login con ${providerName} exitoso`
            } as AuthResponse))
          );
        }

        return of({
          user: { ...(snapshot.data() as User), uid },
          message: `Login con ${providerName} exitoso`
        } as AuthResponse);
      }),
      tap((res: AuthResponse) => {
        if (res.user) this.saveSessionToStorage(res.user);
      })
    );
  }

  getCurrentAuthEmail(): string {
    return this.auth.currentUser?.email ?? '';
  }

  sendVerificationEmail(): Observable<void> {
    const fbUser = this.auth.currentUser;
    if (!fbUser) {
      return throwError(() => new Error('No hay una cuenta pendiente de verificación.'));
    }

    return from(sendEmailVerification(fbUser)).pipe(
      map(() => undefined),
      catchError(err => throwError(() => err))
    );
  }

  reloadCurrentUser(): Observable<boolean> {
    const fbUser = this.auth.currentUser;
    if (!fbUser) return of(false);

    return from(fbUser.reload()).pipe(
      map(() => !!this.auth.currentUser?.emailVerified),
      catchError(() => of(false))
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
              photoURL: fbUser.photoURL ?? '',
            } as unknown as User;

            if (!snapshot.exists()) {
              return from(setDoc(ref, userData)).pipe(
                map(result => {
                  return { user: userData, message: 'Login con Google por redirect exitoso' } as AuthResponse;
                })
              );
            }

            return of({ user: snapshot.data() as User, message: 'Login con Google por redirect exitoso' } as AuthResponse);
          }),
          tap((res: AuthResponse) => {
            if (res.user) this.saveSessionToStorage(res.user);
          })
        );
      }),
      catchError(err => {
        return of({ user: null, message: traducirErrorFirebase(err, 'Error al procesar redirect de Google'), code: err?.code || null, error: err } as AuthResponse);
      })
    );
  }

  logout(): Observable<void> {
    const currentUid = this.auth.currentUser?.uid ?? this.getSessionFromStorage()?.uid ?? null;
    this.saveSessionToStorage(null);
    return from(signOut(this.auth)).pipe(
      map(() => {
        if (currentUid) {
          this.presenceService.stopPresence();
        }
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
    if (typeof window === 'undefined') {
      return of(null);
    }
    return from(this.readyPromise).pipe(
      switchMap(() => {
        const fbUser = this.auth.currentUser;
        if (!fbUser) {
          // Restaurar desde localStorage: no requiere token de Firebase
          const cached = this.getSessionFromStorage();
          if (!cached?.uid) return of(null);
          return of({ uid: cached.uid, rol: cached.rol || 'usuario', nombre: cached.nombre || '', email: cached.email || '' } as User);
        }
        const ref = doc(this.firestore, 'usuarios', fbUser.uid);
        return from(getDoc(ref)).pipe(
          map(snapshot => {
            let user: User;
            if (!snapshot.exists()) {
              user = {
                uid: fbUser.uid,
                nombre: fbUser.displayName ?? '',
                email: fbUser.email ?? '',
                rol: 'usuario',
                photoURL: fbUser.photoURL ?? '',
              } as User;
            } else {
              user = { ...(snapshot.data() as User), uid: fbUser.uid } as User;
            }
            this.saveSessionToStorage(user);
            return user;
          }),
          catchError(() => of(null))
        );
      })
    );
  }

  getAllUsers(): Observable<User[]> {
    return from(getDocs(collection(this.firestore, 'usuarios'))).pipe(
      map(snapshot => snapshot.docs.map(d => ({ uid: d.id, ...d.data() } as User))),
      catchError(() => of([]))
    );
  }

  updateUserRole(uid: string, newRole: string): Observable<void> {
    const ref = doc(this.firestore, 'usuarios', uid);
    return from(updateDoc(ref, { rol: newRole } as any)).pipe(
      tap(() => {
        if (this.auth.currentUser?.uid === uid) {
          this.navigateToRoleHome(newRole);
        }
      })
    );
  }

  navigateToRoleHome(rol: string): void {
    const roleRoutes: Record<string, string> = {
      admin: '/roles/admin',
      supervisor: '/roles/supervisor',
      empleado: '/roles/empleados',
      usuario: '/roles/usuario',
      sordomudo: '/roles/sordomudo',
    };

    const target = roleRoutes[rol] || '/login';
    this.router.navigate([target]);
  }

  updateUserProfile(data: { nombre?: string; email?: string; photoURL?: string }): Observable<void> {
    const fbUser = this.auth.currentUser;
    if (!fbUser) return throwError(() => new Error('No hay usuario autenticado'));

    const firestoreUpdates: any = {};
    if (data.nombre) firestoreUpdates.nombre = data.nombre;
    if (data.email) firestoreUpdates.email = data.email;
    if (data.photoURL) firestoreUpdates.photoURL = data.photoURL;

    const tasks: Promise<any>[] = [];

    if (data.nombre) {
      tasks.push(fbUpdateProfile(fbUser, { displayName: data.nombre }));
    }

    if (data.email && data.email !== fbUser.email) {
      tasks.push(fbUpdateEmail(fbUser, data.email));
    }

    if (Object.keys(firestoreUpdates).length > 0) {
      const ref = doc(this.firestore, 'usuarios', fbUser.uid);
      tasks.push(updateDoc(ref, firestoreUpdates));
    }

    return from(Promise.all(tasks)).pipe(
      map(() => undefined),
      catchError(err => throwError(() => err))
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    const fbUser = this.auth.currentUser;
    if (!fbUser || !fbUser.email) return throwError(() => new Error('No hay usuario autenticado'));

    const credential = EmailAuthProvider.credential(fbUser.email, currentPassword);

    return from(reauthenticateWithCredential(fbUser, credential)).pipe(
      switchMap(() => from(fbUpdatePassword(fbUser, newPassword))),
      map(() => undefined),
      catchError(err => throwError(() => err))
    );
  }

  isAuthenticated(): Observable<boolean> {
    if (typeof window === 'undefined') {
      return of(false);
    }
    return from(this.readyPromise).pipe(
      map(() => !!(this.auth.currentUser || this.getSessionFromStorage()?.uid))
    );
  }
}
