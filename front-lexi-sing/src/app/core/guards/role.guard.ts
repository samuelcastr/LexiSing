import { inject, Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const devBypass = !environment.production && typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.search.includes('dev=true') ||
      (localStorage && localStorage.getItem('DEV_BYPASS') === '1')
    );

    if (devBypass) return of(true as any);

    return authService.getCurrentUser().pipe(
      take(1),
      map(user => {
        if (typeof window === 'undefined') return true; // allow SSR to render without redirect
        if (!user) return router.parseUrl('/login');

        const role = (user.rol || 'usuario').toString().toLowerCase();
        const normalizedRoles = allowedRoles.map(r => r.toLowerCase());

        if (!normalizedRoles.includes(role)) return router.parseUrl('/dashboard');

        return true;
      })
    );
  };
};
