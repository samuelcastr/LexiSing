import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService } from '../../../../../core/services/dashboard.service';

@Component({
  selector: 'app-sordomudo-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class SordomudoDashboardPageComponent implements OnInit {
  conversaciones = 0;
  mensajes = 0;
  recentActivities: any[] = [];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.dashboardService.getConversaciones().subscribe(c => this.conversaciones = c.length);
    this.dashboardService.getMensajes().subscribe(m => this.mensajes = m.length);
    this.dashboardService.getRecentActivity().subscribe(a => this.recentActivities = a.slice(0, 5));
  }
}
