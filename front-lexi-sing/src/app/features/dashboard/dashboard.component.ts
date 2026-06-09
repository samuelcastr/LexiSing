import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `<div style="padding:24px"><h1>Dashboard</h1><p>Área protegida</p></div>`
})
export class DashboardComponent {}
