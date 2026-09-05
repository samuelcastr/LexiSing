import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { User } from '../../../../core/models/user.model';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-supervisor-usuarios-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule],
  templateUrl: './usuarios_list.html',
  styleUrls: ['./usuarios_list.scss']
})
export class SupervisorUsuariosList implements OnInit, OnDestroy {
  usuarios: User[] = [];
  filteredUsuarios: User[] = [];
  searchTerm = '';
  private destroy$ = new Subject<void>();

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    combineLatest([
      this.dashboardService.getUsuarios(),
      this.dashboardService.getConversaciones()
    ]).pipe(takeUntil(this.destroy$)).subscribe(([users, conversaciones]) => {
      const uidsConParticipacion = new Set<string>();
      conversaciones.forEach(conv => {
        (conv.participants || []).forEach((uid: string) => uidsConParticipacion.add(uid));
      });

      this.usuarios = users.filter(u => u.uid && uidsConParticipacion.has(u.uid));
      this.filteredUsuarios = this.usuarios;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  filterUsuarios(): void {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.filteredUsuarios = this.usuarios;
      return;
    }

    this.filteredUsuarios = this.usuarios.filter(user =>
      user.nombre?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term) ||
      user.rol?.toLowerCase().includes(term)
    );
  }
}
