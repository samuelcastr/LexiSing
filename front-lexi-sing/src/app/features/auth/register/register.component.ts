import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { FieldErrorComponent } from '../../../shared/components/field-error/field-error.component';
import { Observable, Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';

function confirmPasswordValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.parent?.get('password');
  if (!password) return null;
  return password.value === control.value ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, RouterModule, FieldErrorComponent],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit, OnDestroy {
  form!: FormGroup;

  loading = false;
  error: string | null = null;
  passwordFocused = false;
  connecting$!: Observable<boolean>;
  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.connecting$ = this.authService.connecting$;
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/)]],
      confirmPassword: ['', [Validators.required, confirmPasswordValidator]]
    });

    this.form.get('password')?.valueChanges.subscribe(() => {
      this.form.get('confirmPassword')?.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    this.authService.ensureAuthServerReachable();
    this.form.valueChanges.pipe(
      debounceTime(400),
      takeUntil(this.destroy$)
    ).subscribe(() => this.authService.ensureAuthServerReachable());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get passwordChecks(): { label: string; ok: boolean }[] {
    const value: string = this.password?.value ?? '';
    return [
      { label: 'Mínimo 8 caracteres', ok: value.length >= 8 },
      { label: 'Una letra mayúscula (A-Z)', ok: /[A-Z]/.test(value) },
      { label: 'Una letra minúscula (a-z)', ok: /[a-z]/.test(value) },
      { label: 'Un número (0-9)', ok: /[0-9]/.test(value) },
      { label: 'Un símbolo (ej. !@#$%)', ok: /[^A-Za-z0-9]/.test(value) },
    ];
  }

  get nombre() { return this.form.get('nombre'); }
  get email() { return this.form.get('email'); }
  get password() { return this.form.get('password'); }
  get confirmPassword() { return this.form.get('confirmPassword'); }

  onPasswordFocus(): void {
    this.passwordFocused = true;
  }

  onPasswordBlur(): void {
    this.passwordFocused = false;
  }

  submit() {
    this.error = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    const { nombre, email, password } = this.form.value;
    this.authService.register(email!, password!, nombre!).pipe(takeUntil(this.destroy$)).subscribe({
      next: res => {
        this.loading = false;
        if (res.user) {
          this.router.navigate(['/login']);
        } else {
          if (res.error?.code === 'auth/email-already-in-use') {
            this.email?.setErrors({ emailExiste: true });
            this.email?.markAsTouched();
          }
          this.error = res.message || 'Error al registrarse';
        }
      },
      error: err => {
        this.loading = false;
        this.error = err?.message || 'Error de red';
      }
    });
  }
}
