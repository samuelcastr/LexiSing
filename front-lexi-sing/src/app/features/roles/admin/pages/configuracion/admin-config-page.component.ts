import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../../../core/services/auth.service';
import { User } from '../../../../../core/models/user.model';

@Component({
  selector: 'app-admin-config-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule, MatSnackBarModule],
  templateUrl: './admin-config-page.component.html',
  styleUrls: ['./admin-config-page.component.scss']
})
export class AdminConfigPageComponent implements OnInit {
  nombre = '';
  email = '';
  telefono = '';
  currentPassword = '';
  nuevoPassword = '';
  confirmarPassword = '';
  saving = false;
  savingPassword = false;
  message = '';
  messageType: 'success' | 'error' = 'success';
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

  saveProfile(): void {
    if (!this.nombre.trim()) {
      this.snackBar.open('El nombre es obligatorio', 'Cerrar', { duration: 3000 });
      return;
    }

    this.saving = true;
    this.authService.updateUserProfile({
      nombre: this.nombre.trim(),
      email: this.email.trim()
    }).subscribe({
      next: () => {
        this.saving = false;
        this.snackBar.open('Perfil actualizado correctamente', 'Cerrar', { duration: 3000 });
        this.loadUser();
      },
      error: (err) => {
        this.saving = false;
        const msg = err?.message || 'Error al actualizar el perfil';
        this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
      }
    });
  }

  changePassword(): void {
    if (!this.currentPassword) {
      this.snackBar.open('Ingresa tu contraseña actual', 'Cerrar', { duration: 3000 });
      return;
    }

    if (!this.nuevoPassword) {
      this.snackBar.open('Ingresa una nueva contraseña', 'Cerrar', { duration: 3000 });
      return;
    }

    if (this.nuevoPassword.length < 6) {
      this.snackBar.open('La nueva contraseña debe tener al menos 6 caracteres', 'Cerrar', { duration: 3000 });
      return;
    }

    if (this.nuevoPassword !== this.confirmarPassword) {
      this.snackBar.open('Las contraseñas no coinciden', 'Cerrar', { duration: 3000 });
      return;
    }

    this.savingPassword = true;
    this.authService.changePassword(this.currentPassword, this.nuevoPassword).subscribe({
      next: () => {
        this.savingPassword = false;
        this.currentPassword = '';
        this.nuevoPassword = '';
        this.confirmarPassword = '';
        this.snackBar.open('Contraseña actualizada correctamente', 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        this.savingPassword = false;
        let msg = 'Error al cambiar la contraseña';
        if (err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
          msg = 'La contraseña actual es incorrecta';
        } else if (err?.code === 'auth/weak-password') {
          msg = 'La nueva contraseña es muy débil';
        } else if (err?.code) {
          msg = `Error: ${err.code}`;
        }
        this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
      }
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
