import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService } from '../../../../../core/services/dashboard.service';
import { ActivityService } from '../../../../../core/services/activity.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-supervisor-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class SupervisorDashboardPageComponent implements OnInit, OnDestroy {
  usuariosSordos = 0;
  conversacionesHoy = 0;
  usuariosActivos = 0;
  recentActivities: any[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private dashboardService: DashboardService,
    private activityService: ActivityService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.dashboardService.getUsuarios().pipe(takeUntil(this.destroy$)).subscribe(users => {
      this.usuariosSordos = users.filter(u => u.activo).length;
      this.usuariosActivos = users.length;
    });

    this.dashboardService.getConversaciones().pipe(takeUntil(this.destroy$)).subscribe(c => {
      this.conversacionesHoy = c.length;
    });

    this.authService.getCurrentUser().pipe(takeUntil(this.destroy$)).subscribe(user => {
      if (user) {
        this.activityService.getRecentActivities().pipe(takeUntil(this.destroy$)).subscribe(data => {
          this.recentActivities = data;
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
