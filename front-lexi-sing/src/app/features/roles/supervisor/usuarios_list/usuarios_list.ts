import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-supervisor-usuarios-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatIconModule, MatButtonModule],
  templateUrl: './usuarios_list.html',
  styleUrls: ['./usuarios_list.scss']
})
export class SupervisorUsuariosList implements OnInit {
  usuarios: User[] = [];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.dashboardService.getUsuarios().subscribe(users => {
      this.usuarios = users;
    });
  }
}
