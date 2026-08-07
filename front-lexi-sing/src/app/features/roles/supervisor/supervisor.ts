import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-supervisor',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule],
  templateUrl: './supervisor.html',
  styleUrls: ['./supervisor.scss']
})
export class Supervisor implements OnInit {
  userName = 'Usuario';
  sidebarOpen = true;
  showGreeting = true;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.authService.getCurrentUser().subscribe((user: User | null) => {
      if (user) {
        this.userName = user.nombre || this.extractNameFromEmail(user.email) || 'Usuario';
      }
    });

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      const hideRoutes = [
        '/roles/supervisor/usuarios',
        '/roles/supervisor/reportes',
        '/roles/supervisor/conversations',
        '/roles/supervisor/monitoreo-conversaciones',
        '/roles/supervisor/configuracion'
      ];
      this.showGreeting = !hideRoutes.some(route => event.urlAfterRedirects.includes(route));
    });
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout() {
    this.authService.logout().subscribe();
  }

  private extractNameFromEmail(email: string): string {
    if (!email) return '';
    const local = email.split('@')[0];
    return local.charAt(0).toUpperCase() + local.slice(1);
  }
}
