import { inject, Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const devBypass = !environment.production && typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.search.includes('dev=true') ||
    (localStorage && localStorage.getItem('DEV_BYPASS') === '1')
  );
  return authService.isAuthenticated().pipe(
    take(1),
    map(auth => {
      if (devBypass) return true;
      return auth ? true : router.parseUrl('/login');
    })
  );
};

@Injectable({ providedIn: 'root' })
export class AuthGuard {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate() {
    if (!environment.production && typeof window !== 'undefined' && (window.location.search.includes('dev=true') || (localStorage && localStorage.getItem('DEV_BYPASS') === '1'))) {
      return of(true as any);
    }

    return this.authService.isAuthenticated().pipe(
      take(1),
      map(auth => {
        if (typeof window === 'undefined') return true; // allow SSR to render without redirect
        return auth ? true : this.router.parseUrl('/login');
      })
    );
  }
}
