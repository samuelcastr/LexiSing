import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule],
  template: `
    <div style="padding:24px">
      <h1>Dashboard</h1>
      <p>Área protegida</p>

      <div style="margin-top:24px; display:flex; gap:12px; flex-wrap:wrap;">
        <button mat-stroked-button routerLink="/conversations">Conversaciones</button>
        <button mat-stroked-button routerLink="/conversations">Mensajes</button>
      </div>
    </div>
  `
})
export class DashboardComponent {}
