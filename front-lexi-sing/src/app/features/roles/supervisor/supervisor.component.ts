import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-supervisor-role',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule],
  templateUrl: './supervisor.component.html',
  styleUrls: ['./supervisor.component.scss']
})
export class SupervisorComponent implements OnInit {
  userName = 'Supervisor';

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.getCurrentUser().subscribe(user => {
      if (user?.nombre) {
        this.userName = user.nombre;
      }
    });
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard/supervisor']);
  }

  goToConversations(): void {
    this.router.navigate(['/supervisor/conversations']);
  }

  goToMonitoring(): void {
    this.router.navigate(['/supervisor/monitoreo-conversaciones']);
  }

  goToReports(): void {
    this.router.navigate(['/supervisor/reportes']);
  }
}
