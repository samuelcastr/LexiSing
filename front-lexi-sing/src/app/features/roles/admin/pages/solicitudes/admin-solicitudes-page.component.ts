import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { UserTableComponent } from '../../components/user-table/user-table.component';
import { AuthService } from '../../../../../core/services/auth.service';
import { User } from '../../../../../core/models/user.model';

@Component({
  selector: 'app-admin-solicitudes-page',
  standalone: true,
  imports: [CommonModule, MatSnackBarModule, UserTableComponent],
  templateUrl: './admin-solicitudes-page.component.html',
  styleUrls: ['./admin-solicitudes-page.component.scss']
})
export class AdminSolicitudesPageComponent implements OnInit {
  pendingUsers: User[] = [];

  constructor(
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadPendingUsers();
  }

  private loadPendingUsers(): void {
    this.authService.getAllUsers().subscribe({
      next: (users) => {
        this.pendingUsers = users.filter(user => user.rol === 'usuario');
      },
      error: (err) => console.error('Error al cargar usuarios', err)
    });
  }

  handleRoleChange(event: {uid: string, currentRole: string, newRole: string}): void {
    this.authService.updateUserRole(event.uid, event.newRole).subscribe({
      next: () => {
        this.snackBar.open(`Rol asignado: ${event.newRole}`, 'Cerrar', { duration: 3000 });
        this.loadPendingUsers();
      },
      error: (err) => {
        this.snackBar.open('Error al actualizar rol', 'Cerrar', { duration: 3000 });
        console.error('Error al actualizar rol', err);
      }
    });
  }
}
