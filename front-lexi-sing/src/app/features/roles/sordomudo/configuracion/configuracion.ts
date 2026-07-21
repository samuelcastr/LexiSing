import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-sordomudo-configuracion',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './configuracion.html',
  styleUrls: ['./configuracion.scss']
})
export class SordomudoConfiguracion implements OnInit {
  nombre = '';
  email = '';
  currentPassword = '';
  nuevoPassword = '';
  confirmarPassword = '';
  saving = false;
  message = '';
  user: User | null = null;

  constructor(
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUser();
  }

  loadUser(): void {
    this.authService.getCurrentUser().subscribe(user => {
      if (user) {
        this.user = user;
        this.nombre = user.nombre || '';
        this.email = user.email || '';
      }
    });
  }

  saveChanges(): void {
    if (!this.nombre.trim()) {
      this.snackBar.open('El nombre es obligatorio', 'Cerrar', { duration: 3000 });
      return;
    }

    if (this.nuevoPassword && this.nuevoPassword !== this.confirmarPassword) {
      this.snackBar.open('Las contraseñas no coinciden', 'Cerrar', { duration: 3000 });
      return;
    }

    this.saving = true;

    const profileUpdates: Promise<any>[] = [];

    if (this.nombre.trim() !== (this.user?.nombre || '')) {
      profileUpdates.push(
        new Promise((resolve, reject) => {
          this.authService.updateUserProfile({ nombre: this.nombre.trim() }).subscribe({
            next: resolve,
            error: reject
          });
        })
      );
    }

    if (this.nuevoPassword) {
      if (!this.currentPassword) {
        this.saving = false;
        this.snackBar.open('Ingresa tu contraseña actual para cambiarla', 'Cerrar', { duration: 3000 });
        return;
      }
      profileUpdates.push(
        new Promise((resolve, reject) => {
          this.authService.changePassword(this.currentPassword, this.nuevoPassword).subscribe({
            next: resolve,
            error: reject
          });
        })
      );
    }

    if (profileUpdates.length === 0) {
      this.saving = false;
      this.snackBar.open('No hay cambios para guardar', 'Cerrar', { duration: 3000 });
      return;
    }

    Promise.all(profileUpdates).then(() => {
      this.saving = false;
      this.message = 'Los cambios se han guardado correctamente.';
      this.currentPassword = '';
      this.nuevoPassword = '';
      this.confirmarPassword = '';
      this.loadUser();
    }).catch(err => {
      this.saving = false;
      this.message = err?.message || 'Error al guardar los cambios.';
    });
  }

  cancel(): void {
    this.loadUser();
    this.currentPassword = '';
    this.nuevoPassword = '';
    this.confirmarPassword = '';
    this.message = '';
  }
}
