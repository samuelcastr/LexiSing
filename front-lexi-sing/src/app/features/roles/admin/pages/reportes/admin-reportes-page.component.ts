import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-admin-reportes-page',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './admin-reportes-page.component.html',
  styleUrls: ['./admin-reportes-page.component.scss']
})
export class AdminReportesPageComponent {}
