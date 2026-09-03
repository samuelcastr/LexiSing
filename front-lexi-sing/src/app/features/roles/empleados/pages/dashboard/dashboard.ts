import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService, DatoPorHora } from '../../../../../core/services/dashboard.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { HourlyBarChartComponent } from '../../../../../shared/components/hourly-bar-chart/hourly-bar-chart.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-empleados-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, HourlyBarChartComponent],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class EmpleadosDashboardPageComponent implements OnInit, OnDestroy {
  conversaciones = 0;
  mensajes = 0;
  recentActivities: any[] = [];
  conversacionesPorHora: DatoPorHora[] = [];
  mensajesPorHora: DatoPorHora[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.getCurrentUser().pipe(takeUntil(this.destroy$)).subscribe(user => {
      if (!user?.uid) return;

      this.dashboardService.getConversacionesPorHora(user.uid).pipe(takeUntil(this.destroy$)).subscribe(data => {
        this.conversacionesPorHora = data;
        this.conversaciones = data.reduce((acc, d) => acc + d.count, 0);
      });

      this.dashboardService.getMensajesPorHora(user.uid).pipe(takeUntil(this.destroy$)).subscribe(data => {
        this.mensajesPorHora = data;
        this.mensajes = data.reduce((acc, d) => acc + d.count, 0);
      });

      this.dashboardService.getRecentActivityPorUsuario(user.uid).pipe(takeUntil(this.destroy$)).subscribe(a => this.recentActivities = a);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
