import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { StatCardComponent } from '../../components/stat-card/stat-card.component';
import { AuthService } from '../../../../../core/services/auth.service';
import { User } from '../../../../../core/models/user.model';

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatIconModule, StatCardComponent],
  templateUrl: './admin-dashboard-page.component.html',
  styleUrls: ['./admin-dashboard-page.component.scss']
})
export class AdminDashboardPageComponent implements OnInit {
  totalUsuarios = 0;
  totalPendientes = 0;
  totalEmpleados = 0;
  totalSupervisores = 0;
  totalAdmins = 0;
  nombreUsuario = 'Administrador';
  ultimasSolicitudes: User[] = [];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadStats();

    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        if (user?.nombre) {
          this.nombreUsuario = user.nombre;
        }
      },
      error: (err) => console.error('Error al cargar usuario', err)
    });
  }

  private loadStats(): void {
    this.authService.getAllUsers().subscribe({
      next: (users) => {
        this.totalUsuarios = users.length;
        this.totalPendientes = users.filter(u => u.rol === 'usuario').length;
        this.totalEmpleados = users.filter(u => u.rol === 'empleado').length;
        this.totalSupervisores = users.filter(u => u.rol === 'supervisor').length;
        this.totalAdmins = users.filter(u => u.rol === 'admin').length;

        this.ultimasSolicitudes = users
          .filter(u => u.rol === 'usuario')
          .slice()
          .sort((a, b) => this.parseDate(b.fechaCreacion).getTime() - this.parseDate(a.fechaCreacion).getTime())
          .slice(0, 5);
      },
      error: (err) => console.error('Error al cargar usuarios', err)
    });
  }

   parseDate(value: any): Date {
    if (!value) return new Date(0);
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      return isNaN(date.getTime()) ? new Date(0) : date;
    }
    if (value.seconds !== undefined) return new Date(value.seconds * 1000);
    if (value._seconds !== undefined) return new Date(value._seconds * 1000);
    if (typeof value.toDate === 'function') {
      const date = value.toDate();
      return date instanceof Date && !isNaN(date.getTime()) ? date : new Date(0);
    }
    return new Date(0);
  }
  
}

