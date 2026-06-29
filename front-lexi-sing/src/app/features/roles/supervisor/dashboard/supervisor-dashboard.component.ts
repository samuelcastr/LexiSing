import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../../core/services/auth.service';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { ActivityService } from '../../../../core/services/activity.service';
import { User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-supervisor-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './supervisor-dashboard.component.html',
  styleUrls: ['./supervisor-dashboard.component.scss']
})
export class SupervisorDashboardComponent implements OnInit {
  userName = 'Usuario';
  sidebarOpen = true;
  usuariosSordos = 0;
  conversacionesHoy = 0;
  usuariosActivos = 0;
  recentActivities: any[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private dashboardService: DashboardService,
    private activityService: ActivityService
  ) {}

  ngOnInit() {
    this.authService.getCurrentUser().subscribe((user: User | null) => {
      if (user) {
        this.userName = user.nombre || user.email || 'Usuario';
      }
    });

    this.loadActivities();

    this.dashboardService.getUsuarios().subscribe(users => {
      this.usuariosSordos = users.filter(user => user.activo).length;
    });

    this.dashboardService.getConversaciones().subscribe(conversaciones => {
      this.conversacionesHoy = conversaciones.length;
    });

    this.dashboardService.getUsuarios().subscribe(users => {
      this.usuariosActivos = users.length;
    });
  }

  loadActivities(): void {
    this.activityService.getRecentActivities().subscribe(data => {
      this.recentActivities = data;
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  goToChat(): void {
    this.router.navigate(['/supervisor/conversations']);
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      console.log('Sesión cerrada');
    });
  }
}
