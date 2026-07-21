import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('front-lexi-sing');

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
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
