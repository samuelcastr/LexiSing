import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-activity-chart',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="chart-container"><p>Gráfico de Actividad (próximamente)</p></div>`,
  styles: [`.chart-container { padding: 20px; }`]
})
export class ActivityChartComponent {}
