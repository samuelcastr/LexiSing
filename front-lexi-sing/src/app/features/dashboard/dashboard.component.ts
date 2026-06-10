import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatCardModule, MatIconModule],
  template: `
    <div class="dashboard-container">
      <div class="header">
        <h1>Bienvenido, {{ userName }}!</h1>
        <p class="subtitle">Plataforma de comunicación inclusiva</p>
      </div>

      <div class="cards-grid">
        <mat-card class="feature-card">
          <mat-card-header>
            <div class="icon">💬</div>
            <mat-card-title>Conversaciones</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>Accede a tus conversaciones y chats activos</p>
            <button mat-raised-button color="primary" routerLink="/conversations">
              <mat-icon>chat</mat-icon>
              Ir a Conversaciones
            </button>
          </mat-card-content>
        </mat-card>

        <mat-card class="feature-card">
          <mat-card-header>
            <div class="icon">👤</div>
            <mat-card-title>Mi Perfil</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>Gestiona tu información personal</p>
            <button mat-raised-button color="accent">
              <mat-icon>person</mat-icon>
              Ver Perfil
            </button>
          </mat-card-content>
        </mat-card>

        <mat-card class="feature-card">
          <mat-card-header>
            <div class="icon">📊</div>
            <mat-card-title>Estadísticas</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>Visualiza tu actividad y estadísticas</p>
            <button mat-raised-button disabled>
              <mat-icon>trending_up</mat-icon>
              Estadísticas
            </button>
          </mat-card-content>
        </mat-card>

        <mat-card class="feature-card">
          <mat-card-header>
            <div class="icon">🚪</div>
            <mat-card-title>Sesión</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>Cerrar tu sesión actual</p>
            <button mat-raised-button color="warn" (click)="logout()">
              <mat-icon>logout</mat-icon>
              Cerrar Sesión
            </button>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  userName: string = 'Usuario';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.authService.getCurrentUser().subscribe((user: User | null) => {
      if (user) {
        this.userName = user.nombre || user.email || 'Usuario';
      }
    });
  }

  logout() {
    this.authService.logout().subscribe(() => {
      console.log('Sesión cerrada');
    });
  }
}
