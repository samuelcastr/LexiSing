import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { provideRouter } from '@angular/router';

registerLocaleData(localeEs);
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth, setPersistence, browserLocalPersistence } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { APP_ROUTES as routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { environment } from '../environments/environment';
import { firebaseTokenInterceptor } from './core/interceptors/firebase-token.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'es' },
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => {
      const auth = getAuth();
      if (typeof window !== 'undefined') {
        setPersistence(auth, browserLocalPersistence).catch(() => undefined);
      }
      return auth;
    }),
    provideFirestore(() => getFirestore()),
    provideHttpClient(withInterceptors([firebaseTokenInterceptor])),
    provideClientHydration(withEventReplay())
  ]
};
