import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-conversaciones-table',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="table-container"><p>Tabla de Conversaciones (próximamente)</p></div>`,
  styles: [`.table-container { padding: 20px; }`]
})
export class ConversacionesTableComponent {}
