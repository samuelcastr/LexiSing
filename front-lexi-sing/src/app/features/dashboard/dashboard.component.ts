import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';
import { DashboardService } from '../../core/services/dashboard.service';
import { ActivityService } from '../../core/services/activity.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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
export class DashboardComponent implements OnInit, OnDestroy {

  userName: string = 'Usuario';
  currentUserUid: string | null = null;
  currentUserRole: string | null = null;
  sidebarOpen = true;
  mobileMenuOpen = false;
  empleadosActivos = 0;
  conversacionesHoy = 0;
  mensajesEnviados = 0;
  recentActivities: any[] = [];
  onlineUsers = 0;
  messagesSent = 0;
  private destroy$ = new Subject<void>();


  constructor(
    private authService: AuthService,
    private router: Router,
    private dashboardService: DashboardService,
    private activityService: ActivityService

  ) { }

  ngOnInit() {

    this.authService.getCurrentUser().pipe(takeUntil(this.destroy$)).subscribe((user: User | null) => {
      if (user) {
        this.userName = user.nombre || user.email || 'Usuario';
        this.currentUserUid = user.uid;
        this.currentUserRole = user.rol;
      }

    });

    this.loadActivities();


    this.dashboardService.getUsuarios().pipe(takeUntil(this.destroy$)).subscribe(users => {

      this.empleadosActivos =
        users.filter(
          user => user.activo
        ).length;

      this.onlineUsers =
        users.filter(
          user => user.activo === true
        ).length;

    });

    const canSeeAll = this.currentUserRole === 'supervisor' || this.currentUserRole === 'admin';

    this.dashboardService
      .getConversaciones()
      .pipe(takeUntil(this.destroy$))
      .subscribe(conversaciones => {
        const filtered = canSeeAll
          ? conversaciones
          : conversaciones.filter(c => c.participants?.includes(this.currentUserUid ?? ''));
        this.conversacionesHoy = filtered.length;
      });

    this.dashboardService
      .getMensajes()
      .pipe(takeUntil(this.destroy$))
      .subscribe(messages => {
        const filtered = canSeeAll
          ? messages
          : messages.filter(m => m.senderUid === this.currentUserUid);
        this.mensajesEnviados = filtered.length;
      });

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadActivities(): void {
    this.activityService.getRecentActivities().pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.recentActivities = data;
    });
  }

  toggleSidebar() {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      this.mobileMenuOpen = !this.mobileMenuOpen;
    } else {
      this.sidebarOpen = !this.sidebarOpen;
    }
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }

  logout() {
    this.authService.logout().subscribe();
  }

}

