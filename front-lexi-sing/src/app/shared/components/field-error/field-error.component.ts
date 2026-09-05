import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl } from '@angular/forms';

export const DEFAULT_VALIDATION_MESSAGES: Record<string, string> = {
  required: 'Este campo es obligatorio.',
  email: 'Ingresa un correo electrónico válido.',
  minlength: 'Debe tener al menos {minLength} caracteres.',
  maxlength: 'Debe tener máximo {maxLength} caracteres.',
  pattern: 'El formato ingresado no es válido.',
};

@Component({
  selector: 'app-field-error',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="field-error" *ngIf="control && control.invalid && (control.touched || mostrarSiempre) && getError()">
      {{ getError() }}
    </div>
  `,
})
export class FieldErrorComponent {
  @Input() control: AbstractControl | null = null;
  @Input() customMessages: Record<string, string> = {};
  @Input() mostrarSiempre = false;

  getError(): string | null {
    if (!this.control || !this.control.errors) return null;
    const keys = Object.keys(this.control.errors);
    if (keys.length === 0) return null;

    const key = keys[0];
    const template = this.customMessages[key] || DEFAULT_VALIDATION_MESSAGES[key];
    if (!template) return null;

    if (key === 'minlength') {
      const required = this.control.errors[key]?.requiredLength ?? 0;
      return template.replace('{minLength}', String(required));
    }
    if (key === 'maxlength') {
      const required = this.control.errors[key]?.requiredLength ?? 0;
      return template.replace('{maxLength}', String(required));
    }
    return template;
  }
}
