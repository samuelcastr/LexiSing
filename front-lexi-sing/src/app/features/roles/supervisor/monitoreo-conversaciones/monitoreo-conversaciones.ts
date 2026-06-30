import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ConversationService } from '../../../../core/services/conversation.service';
import { UserApiService } from '../../../../core/services/user-api.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-monitoreo-conversaciones',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatTableModule],
  templateUrl: './monitoreo-conversaciones.html',
  styleUrls: ['./monitoreo-conversaciones.scss']
})
export class MonitoreoConversaciones implements OnInit {
  conversations: any[] = [];
  displayedColumns: string[] = ['participantes', 'ultimoMensaje', 'fecha'];
  users: any[] = [];

  constructor(
    private convService: ConversationService,
    private userApi: UserApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userApi.getUsers().subscribe(users => {
      this.users = users;
      this.loadAllConversations();
    });
  }

  loadAllConversations(): void {
    this.convService.getAllConversations().subscribe(conversations => {
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
    });
  }

  goBack(): void {
    this.router.navigate(['/roles/supervisor']);
  }
}
