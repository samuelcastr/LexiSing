import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { traducirErrorFirebase } from '../../../core/utils/firebase-errors';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  form!: FormGroup;

  loading = false;
  success: string | null = null;
  error: string | null = null;

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get email() { return this.form.get('email'); }

  submit(): void {
    this.error = null;
    this.success = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    const { email } = this.form.value;
    this.authService.resetPassword(email!).subscribe({
      next: () => {
        this.loading = false;
        this.success = 'Correo de restablecimiento enviado. Revisa tu bandeja de entrada.';
      },
      error: (err: any) => {
        this.loading = false;
        this.error = traducirErrorFirebase(err, 'No se pudo enviar el correo');
      }
    });
  }
}
