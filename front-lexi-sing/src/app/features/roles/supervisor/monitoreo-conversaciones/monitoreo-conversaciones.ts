import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ConversationService } from '../../../../core/services/conversation.service';
import { UserApiService } from '../../../../core/services/user-api.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-monitoreo-conversaciones',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatTableModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatOptionModule, FormsModule],
  templateUrl: './monitoreo-conversaciones.html',
  styleUrls: ['./monitoreo-conversaciones.scss']
})
export class MonitoreoConversaciones implements OnInit, OnDestroy {
  conversations: any[] = [];
  filteredConversations: any[] = [];
  displayedColumns: string[] = ['participantes', 'ultimoMensaje', 'fecha'];
  users: any[] = [];
  searchTerm: string = '';
  selectedUserUid: string = '';
  dateFilter: string = 'todos';
  private destroy$ = new Subject<void>();

  constructor(
    private convService: ConversationService,
    private userApi: UserApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers(): void {
    this.userApi.getUsers().pipe(takeUntil(this.destroy$)).subscribe(users => {
      this.users = users;
      this.loadAllConversations();
    });
  }

  loadAllConversations(): void {
    this.convService.getAllConversations().pipe(takeUntil(this.destroy$)).subscribe(conversations => {
      this.conversations = conversations
        .map(conv => {
          const participantNames = conv.participants?.map((uid: string) => {
            const user = this.users.find((u: any) => u.uid === uid);
            return user?.nombre || user?.displayName || user?.email || uid;
          }).join(', ') || 'Sin participantes';

          return {
            ...conv,
            participantNames,
            ultimoMensaje: conv.lastMessage || 'Sin mensajes',
            fecha: conv.updatedAt?.toDate ? conv.updatedAt.toDate() : new Date()
          };
        })
        .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
      this.applyFilters();
    });
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    const now = new Date();

    this.filteredConversations = this.conversations.filter(conv => {
      if (this.selectedUserUid && !conv.participants?.includes(this.selectedUserUid)) {
        return false;
      }

      if (term) {
        const nameMatch = (conv.participantNames || '').toLowerCase().includes(term);
        const lastMessageMatch = (conv.ultimoMensaje || '').toLowerCase().includes(term);
        if (!nameMatch && !lastMessageMatch) {
          return false;
        }
      }

      if (this.dateFilter !== 'todos') {
        const fecha = conv.fecha ? new Date(conv.fecha) : new Date();
        const diffDays = Math.floor((now.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24));
        if (this.dateFilter === 'hoy' && diffDays > 0) return false;
        if (this.dateFilter === 'semana' && diffDays > 7) return false;
        if (this.dateFilter === 'mes' && diffDays > 30) return false;
      }

      return true;
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedUserUid = '';
    this.dateFilter = 'todos';
    this.applyFilters();
  }

  goBack(): void {
    this.router.navigate(['/roles/supervisor']);
  }
}
