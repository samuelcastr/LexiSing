import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-supervisor-configuracion',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './configuracion.html',
  styleUrls: ['./configuracion.scss']
})
export class SupervisorConfiguracion {
  nombre = 'Juan Pérez';
  email = 'juan@gmail.com';
  nuevoPassword = '';
  confirmarPassword = '';
  saving = false;
  message = '';

  saveChanges(): void {
    if (this.nuevoPassword && this.nuevoPassword !== this.confirmarPassword) {
      this.message = 'Las contraseñas no coinciden';
      return;
    }

    this.saving = true;
    this.message = 'Los cambios se han guardado localmente (sin persistir en la BD).';
    setTimeout(() => {
      this.saving = false;
    }, 500);
  }

  cancel(): void {
    this.nombre = 'Juan Pérez';
    this.email = 'juan@gmail.com';
    this.nuevoPassword = '';
    this.confirmarPassword = '';
    this.message = '';
  }
}
