import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { UserTableComponent } from '../../components/user-table/user-table.component';
import { AuthService } from '../../../../../core/services/auth.service';
import { User } from '../../../../../core/models/user.model';

@Component({
  selector: 'app-admin-usuarios-page',
  standalone: true,
  imports: [CommonModule, MatSnackBarModule, UserTableComponent],
  templateUrl: './admin-usuarios-page.component.html',
  styleUrls: ['./admin-usuarios-page.component.scss']
})
export class AdminUsuariosPageComponent implements OnInit {
  allUsers: User[] = [];

  constructor(
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadAllUsers();
  }

  private loadAllUsers(): void {
    this.authService.getAllUsers().subscribe({
      next: (users) => {
        this.allUsers = users
          .slice()
          .sort((a, b) => this.parseDate(a.fechaCreacion).getTime() - this.parseDate(b.fechaCreacion).getTime());
      },
      error: (err) => console.error('Error al cargar usuarios', err)
    });
  }

  private parseDate(value: any): Date {
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

  handleRoleChange(event: {uid: string, currentRole: string, newRole: string}): void {
    this.authService.updateUserRole(event.uid, event.newRole).subscribe({
      next: () => {
        this.snackBar.open(`Rol actualizado a ${event.newRole}`, 'Cerrar', { duration: 3000 });
        this.loadAllUsers();
      },
      error: (err) => {
        this.snackBar.open('Error al actualizar rol', 'Cerrar', { duration: 3000 });
        console.error('Error al actualizar rol', err);
      }
    });
  }
}
