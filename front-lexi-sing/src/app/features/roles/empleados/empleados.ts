import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DashboardService } from '../../../core/services/dashboard.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-sordomudo-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule],
  templateUrl: './empleados.html',
  styleUrls: ['./empleados.scss']
})
export class Empleados implements OnInit {
  userName = 'Usuario';
  sidebarOpen = true;
  conversaciones = 0;
  mensajes = 0;
  reportes = 0;
  recentActivities: any[] = [];

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    this.authService.getCurrentUser().subscribe((user: User | null) => {
      this.userName = user?.nombre || user?.email || 'Usuario';
    });

    this.dashboardService.getConversaciones().subscribe((conversations) => {
      this.conversaciones = conversations.length;
    });

    this.dashboardService.getMensajes().subscribe((messages) => {
      this.mensajes = messages.length;
    });

    this.dashboardService.getRecentActivity().subscribe((activities: any[]) => {
      this.recentActivities = activities.slice(0, 5);
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout(): void {
    this.authService.logout().subscribe();
  }
}
