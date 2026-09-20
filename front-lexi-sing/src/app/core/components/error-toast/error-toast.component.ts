import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ErrorNotification, ErrorService } from '../../services/error.service';

@Component({
  selector: 'app-error-toast',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './error-toast.component.html',
  styleUrls: ['./error-toast.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ErrorToastComponent implements OnInit {
  errores: ErrorNotification[] = [];

  constructor(private errorService: ErrorService) {}

  ngOnInit(): void {
    this.errorService.errors$.subscribe(errores => {
      this.errores = errores;
    });
  }

  cerrar(id: number): void {
    this.errorService.eliminarError(id);
  }
}
