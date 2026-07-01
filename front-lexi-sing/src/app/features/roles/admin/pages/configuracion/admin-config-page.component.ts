import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-admin-config-page',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './admin-config-page.component.html',
  styleUrls: ['./admin-config-page.component.scss']
})
export class AdminConfigPageComponent {}
