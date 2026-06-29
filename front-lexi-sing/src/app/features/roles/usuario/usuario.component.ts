import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';
import { Conversation } from '../../../core/models/message.model';
import { UserApiService } from '../../../core/services/user-api.service';
import { ConversationService } from '../../../core/services/conversation.service';

@Component({
  selector: 'app-usuario-role',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './usuario.component.html',
  styleUrls: ['./usuario.component.scss']
})
export class UsuarioComponent implements OnInit {
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
    this.userApi.getAssignedEmployee(uid).subscribe((employee: User | null) => {
      this.assignedEmployee = employee;
    });
  }

  private loadActiveConversation(uid: string): void {
    this.convService.getActiveConversationForUser(uid).subscribe((conv: Conversation | null) => {
      if (conv?.id) {
        this.conversationId = conv.id;
        this.waitingMessage = 'Ya tienes una conversación activa.';
      } else {
        this.conversationId = null;
        this.waitingMessage = 'Esperando asignación...';
      }
    });
  }
}
