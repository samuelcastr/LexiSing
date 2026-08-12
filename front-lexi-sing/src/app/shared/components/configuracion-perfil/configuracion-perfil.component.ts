import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/;

@Component({
  selector: 'app-configuracion-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule, MatSnackBarModule],
  templateUrl: './configuracion-perfil.component.html',
  styleUrls: ['./configuracion-perfil.component.scss']
})
export class ConfiguracionPerfilComponent implements OnInit {
  nombre = '';
  email = '';
  currentPassword = '';
  nuevoPassword = '';
  confirmarPassword = '';
  saving = false;
  message = '';
  messageType: 'success' | 'error' = 'success';
  user: User | null = null;
  passwordFocused = false;

  constructor(
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUser();
  }

  get rolFormateado(): string {
    const rol = this.user?.rol || '';
    return rol ? rol.charAt(0).toUpperCase() + rol.slice(1) : 'Sin rol';
  }

  get passwordChecks(): { label: string; ok: boolean }[] {
    const value = this.nuevoPassword ?? '';
    return [
      { label: 'Mínimo 8 caracteres', ok: value.length >= 8 },
      { label: 'Una letra mayúscula (A-Z)', ok: /[A-Z]/.test(value) },
      { label: 'Una letra minúscula (a-z)', ok: /[a-z]/.test(value) },
      { label: 'Un número (0-9)', ok: /[0-9]/.test(value) },
      { label: 'Un símbolo (ej. !@#$%)', ok: /[^A-Za-z0-9]/.test(value) },
    ];
  }

  onPasswordFocus(): void {
    this.passwordFocused = true;
  }

  onPasswordBlur(): void {
    this.passwordFocused = false;
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

    if (this.nuevoPassword && (this.nuevoPassword.length < 8 || !PASSWORD_REGEX.test(this.nuevoPassword))) {
      this.snackBar.open('La nueva contraseña debe tener mínimo 8 caracteres con mayúscula, minúscula, número y símbolo', 'Cerrar', { duration: 4000 });
      return;
    }

    if (this.nuevoPassword && this.nuevoPassword !== this.confirmarPassword) {
      this.snackBar.open('Las contraseñas no coinciden', 'Cerrar', { duration: 3000 });
      return;
    }

    if (this.nuevoPassword && !this.currentPassword) {
      this.snackBar.open('Ingresa tu contraseña actual para cambiarla', 'Cerrar', { duration: 3000 });
      return;
    }

    this.saving = true;

    const tasks: Promise<any>[] = [];

    if (this.nombre.trim() !== (this.user?.nombre || '')) {
      tasks.push(
        new Promise((resolve, reject) => {
          this.authService.updateUserProfile({ nombre: this.nombre.trim() }).subscribe({
            next: resolve,
            error: reject
          });
        })
      );
    }

    if (this.email.trim() !== (this.user?.email || '')) {
      tasks.push(
        new Promise((resolve, reject) => {
          this.authService.updateUserProfile({ email: this.email.trim() }).subscribe({
            next: resolve,
            error: reject
          });
        })
      );
    }

    if (this.nuevoPassword) {
      tasks.push(
        new Promise((resolve, reject) => {
          this.authService.changePassword(this.currentPassword, this.nuevoPassword).subscribe({
            next: resolve,
            error: reject
          });
        })
      );
    }

    if (tasks.length === 0) {
      this.saving = false;
      this.snackBar.open('No hay cambios para guardar', 'Cerrar', { duration: 3000 });
      return;
    }

    Promise.all(tasks).then(() => {
      this.saving = false;
      this.message = 'Los cambios se han guardado correctamente.';
      this.messageType = 'success';
      this.currentPassword = '';
      this.nuevoPassword = '';
      this.confirmarPassword = '';
      this.snackBar.open('Perfil actualizado', 'Cerrar', { duration: 3000 });
      this.loadUser();
    }).catch(err => {
      this.saving = false;
      this.message = err?.message || 'Error al guardar los cambios.';
      this.messageType = 'error';
      this.snackBar.open(this.message, 'Cerrar', { duration: 5000 });
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
