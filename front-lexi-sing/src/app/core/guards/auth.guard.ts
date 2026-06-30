import { inject, Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.isAuthenticated().pipe(
    take(1),
    map(auth => {
      if (!auth) {
        router.navigate(['/login']);
        return false;
      }
      return true;
    })
  );
};

@Injectable({ providedIn: 'root' })
export class AuthGuard {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate() {
    return this.authService.isAuthenticated().pipe(
      take(1),
      map(auth => {
        if (!auth) {
          this.router.navigate(['/login']);
          return false;
        }
        return true;
      })
    );
  }
}
