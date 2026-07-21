import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService } from '../../../../../core/services/dashboard.service';
import { ActivityService } from '../../../../../core/services/activity.service';

@Component({
  selector: 'app-supervisor-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class SupervisorDashboardPageComponent implements OnInit {
  usuariosSordos = 0;
  conversacionesHoy = 0;
  usuariosActivos = 0;
  recentActivities: any[] = [];

  constructor(
    private dashboardService: DashboardService,
    private activityService: ActivityService
  ) {}

  ngOnInit(): void {
    this.dashboardService.getUsuarios().subscribe(users => {
      this.usuariosSordos = users.filter(u => u.activo).length;
      this.usuariosActivos = users.length;
    });

    this.dashboardService.getConversaciones().subscribe(c => {
      this.conversacionesHoy = c.length;
    });

    this.activityService.getRecentActivities().subscribe(data => {
      this.recentActivities = data;
    });
  }
}
