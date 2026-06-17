import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';
import { DashboardService } from '../../core/services/dashboard.service';
import { ActivityService } from '../../core/services/activity.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  userName: string = 'Usuario';
  sidebarOpen = true;
  empleadosActivos = 0;
  conversacionesHoy = 0;
  mensajesEnviados = 0;
  recentActivities: any[] = [];


  constructor(
    private authService: AuthService,
    private router: Router,
    private dashboardService: DashboardService,
    private activityService: ActivityService

  ) { }

  ngOnInit() {

    this.authService.getCurrentUser().subscribe((user: User | null) => {
      if (user) {
        this.userName = user.nombre || user.email || 'Usuario';
      }

    });

    this.loadActivities();


    this.dashboardService.getUsuarios().subscribe(users => {

      this.empleadosActivos =
        users.filter(
          user => user.activo
        ).length;
    });

    this.dashboardService
      .getConversaciones()
      .subscribe(conversaciones => {

        this.conversacionesHoy =
          conversaciones.length;

      });

    this.dashboardService
      .getMensajes()
      .subscribe(messages => {

        this.mensajesEnviados =
          messages.length;

      });


  }
  loadActivities(): void {
    this.activityService.getRecentActivities().subscribe(data => {
      this.recentActivities = data;
    });
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout() {
    this.authService.logout().subscribe(() => {
      console.log('Sesión cerrada');
    });
  }

}

