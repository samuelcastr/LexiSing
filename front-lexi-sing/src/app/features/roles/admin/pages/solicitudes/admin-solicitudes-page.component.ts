import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { UserTableComponent } from '../../components/user-table/user-table.component';
import { AuthService } from '../../../../../core/services/auth.service';
import { User } from '../../../../../core/models/user.model';
import { parseDate } from '../../../../../core/utils/parse-date';

@Component({
  selector: 'app-admin-solicitudes-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule, MatIconModule, UserTableComponent],
  templateUrl: './admin-solicitudes-page.component.html',
  styleUrls: ['./admin-solicitudes-page.component.scss']
})
export class AdminSolicitudesPageComponent implements OnInit {
  pendingUsers: User[] = [];
  filteredPending: User[] = [];
  searchTerm = '';

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
        this.pendingUsers = users
          .filter(user => user.rol === 'usuario')
          .slice()
          .sort((a, b) => parseDate(a.fechaCreacion).getTime() - parseDate(b.fechaCreacion).getTime());
        this.filterSolicitudes();
      },
      error: (err) => console.error('Error al cargar usuarios', err)
    });
  }

  filterSolicitudes(): void {
    const term = this.normalize(this.searchTerm.trim().toLowerCase());
    if (!term) {
      this.filteredPending = this.pendingUsers;
      return;
    }

    this.filteredPending = this.pendingUsers.filter(user =>
      this.normalize((user.nombre || '').toLowerCase()).includes(term) ||
      this.normalize((user.email || '').toLowerCase()).includes(term)
    );
  }

  private normalize(texto: string): string {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
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
