import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';
import { Conversation } from '../../../core/models/message.model';
import { UserApiService } from '../../../core/services/user-api.service';
import { ConversationService } from '../../../core/services/conversation.service';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-usuario-role',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './usuario.html',
  styleUrls: ['./usuario.scss']
})
export class Usuario implements OnInit {
  user: User | null = null;
  assignedEmployee: User | null = null;
  conversationId: string | null = null;
  waitingMessage = 'Esperando asignación...';
  queuePosition = 2;

  constructor(
    private authService: AuthService,
    private userApi: UserApiService,
    private convService: ConversationService
  ) {}

  ngOnInit(): void {
    this.authService.getCurrentUser().subscribe(user => {
      this.user = user;
      if (user) {
        this.loadAssignedEmployee(user.uid);
        this.loadActiveConversation(user.uid);
      }
    });
  }

  private loadAssignedEmployee(uid: string): void {
    this.userApi.getUsers().pipe(
      map(users => users.find((u: any) => u.uid && u.uid !== uid) || null)
    ).subscribe((employee: User | null) => {
      this.assignedEmployee = employee;
    });
  }

  private loadActiveConversation(uid: string): void {
    this.convService.getConversationsForUser(uid).subscribe((conversations: Conversation[]) => {
      const activeConversation = conversations[0] || null;
      if (activeConversation?.id) {
        this.conversationId = activeConversation.id;
        this.waitingMessage = 'Ya tienes una conversación activa.';
      } else {
        this.conversationId = null;
        this.waitingMessage = 'Esperando asignación...';
      }
    });
  }
}
