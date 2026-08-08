import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.getCurrentUser().pipe(
      map(user => {
        if (!user) {
          router.navigate(['/login']);
          return false;
        }

        if (!allowedRoles.includes(user.rol)) {
          authService.navigateToRoleHome(user.rol || 'usuario');
          return false;
        }

        return true;
      })
    );
  };
};
