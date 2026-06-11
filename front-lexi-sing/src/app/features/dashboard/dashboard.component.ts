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
   <div class="dashboard-layout">

  <!-- Sidebar -->
  <aside class="sidebar">
    <div class="logo">
      <mat-icon>back_hand</mat-icon>
      <span>LexiSing</span>
    </div>

    <nav>
      <a class="active">
        <mat-icon>home</mat-icon>
        Inicio
      </a>

      <a routerLink="/conversations">
        <mat-icon>chat</mat-icon>
        Chat
      </a>

      <a>
        <mat-icon>person</mat-icon>
        Mi Perfil
      </a>

      <a>
        <mat-icon>bar_chart</mat-icon>
        Estadísticas
      </a>
    </nav>

    <button mat-raised-button color="warn" (click)="logout()">
      <mat-icon>logout</mat-icon>
      Salir
    </button>
  </aside>

  <!-- Contenido -->
  <main class="content">

    <div class="topbar">
      <div>
        <h1>Hola, {{ userName }} 👋</h1>
        <p>Plataforma de comunicación inclusiva</p>
      </div>

      <div class="profile">
        <mat-icon>account_circle</mat-icon>
      </div>
    </div>

    <div class="cards-grid">

      <mat-card class="feature-card">
        <div class="card-icon">💬</div>

        <h3>Conversaciones</h3>

        <p>Accede a tus conversaciones y chats activos.</p>

        <button mat-raised-button color="primary"
                routerLink="/conversations">
          Ir al Chat
        </button>
      </mat-card>

      <mat-card class="feature-card">
        <div class="card-icon">👤</div>

        <h3>Mi Perfil</h3>

        <p>Gestiona tu información personal.</p>

        <button mat-raised-button color="accent">
          Ver Perfil
        </button>
      </mat-card>

      <mat-card class="feature-card">
        <div class="card-icon">📊</div>

        <h3>Estadísticas</h3>

        <p>Visualiza tu actividad y estadísticas.</p>

        <button mat-raised-button disabled>
          Próximamente
        </button>
      </mat-card>

      <mat-card class="feature-card">
        <div class="card-icon">🚪</div>

        <h3>Cerrar Sesión</h3>

        <p>Finaliza la sesión actual.</p>

        <button mat-raised-button color="warn"
                (click)="logout()">
          Cerrar Sesión
        </button>
      </mat-card>

    </div>

  </main>

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
