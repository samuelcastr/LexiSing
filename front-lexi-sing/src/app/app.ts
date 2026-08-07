import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { AuthService } from './core/services/auth.service';
import { PresenceService } from './core/services/presence.service';
import { ErrorToastComponent } from './core/components/error-toast/error-toast.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ErrorToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('front-lexi-sing');

  constructor(
    private auth: Auth,
    private authService: AuthService,
    private presenceService: PresenceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    authState(this.auth).subscribe(user => {
      if (user?.uid) {
        this.presenceService.startPresence(user.uid);
      } else {
        this.presenceService.stopPresence();
      }
    });

    this.authService.checkGoogleRedirectResult().subscribe(res => {
      if (res?.user) {
        const roleRoutes: Record<string, string> = {
          admin: '/roles/admin',
          supervisor: '/roles/supervisor',
          empleado: '/roles/empleados',
          usuario: '/roles/usuario',
          sordomudo: '/roles/sordomudo',
        };
        this.router.navigate([roleRoutes[res.user.rol] || '/login']);
      }
    });
  }
}
