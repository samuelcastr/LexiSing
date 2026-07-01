import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { StatCardComponent } from '../../components/stat-card/stat-card.component';
import { AuthService } from '../../../../../core/services/auth.service';
import { User } from '../../../../../core/models/user.model';

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, StatCardComponent],
  templateUrl: './admin-dashboard-page.component.html',
  styleUrls: ['./admin-dashboard-page.component.scss']
})
export class AdminDashboardPageComponent implements OnInit {
  totalUsuarios = 0;
  totalPendientes = 0;
  totalEmpleados = 0;
  totalSupervisores = 0;
  totalAdmins = 0;


  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  private loadStats(): void {
    this.authService.getAllUsers().subscribe({
      next: (users) => {
        this.totalUsuarios = users.length;
        this.totalPendientes = users.filter(u => u.rol === 'usuario').length;
        this.totalEmpleados = users.filter(u => u.rol === 'empleado').length;
        this.totalSupervisores = users.filter(u => u.rol === 'supervisor').length;
        this.totalAdmins = users.filter(u => u.rol === 'admin').length;

      },
      error: (err) => console.error('Error al cargar usuarios', err)
    });
  }
}
