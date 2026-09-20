import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';
import { Conversation } from '../../../core/models/message.model';
import { UserApiService } from '../../../core/services/user-api.service';
import { ConversationService } from '../../../core/services/conversation.service';
import { Subject } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
import { parseDate } from '../../../core/utils/parse-date';

@Component({
  selector: 'app-usuario-role',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './usuario.html',
  styleUrls: ['./usuario.scss']
})
export class Usuario implements OnInit, OnDestroy {
  user: User | null = null;
  assignedEmployee: User | null = null;
  conversationId: string | null = null;
  waitingMessage = 'Esperando asignación...';
  queuePosition: number | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private userApi: UserApiService,
    private convService: ConversationService
  ) {}

  ngOnInit(): void {
    this.authService.getCurrentUser().pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.user = user;
      if (user) {
        this.loadAssignedEmployee(user.uid);
        this.loadActiveConversation(user.uid);
        this.loadQueuePosition(user.uid);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAssignedEmployee(uid: string): void {
    this.convService.getConversationsForUser(uid).pipe(
      takeUntil(this.destroy$),
      map(conversations => {
        if (conversations.length === 0) return null;
        const otherUid = conversations[0].participants?.find((p: string) => p !== uid);
        return otherUid || null;
      })
    ).subscribe(otherUid => {
      if (otherUid) {
        this.authService.getAllUsers().pipe(
          takeUntil(this.destroy$),
          map(users => users.find((u: any) => u.uid === otherUid) || null)
        ).subscribe((employee: User | null) => {
          this.assignedEmployee = employee;
        });
      }
    });
  }

  private loadActiveConversation(uid: string): void {
    this.convService.getConversationsForUser(uid).pipe(takeUntil(this.destroy$)).subscribe((conversations: Conversation[]) => {
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

  private loadQueuePosition(uid: string): void {
    this.authService.getAllUsers().pipe(takeUntil(this.destroy$)).subscribe((users: any[]) => {
      const waitingUsers = users
        .filter(u => u.rol === 'usuario')
        .sort((a, b) => parseDate(a.fechaCreacion).getTime() - parseDate(b.fechaCreacion).getTime());

      const index = waitingUsers.findIndex(u => u.uid === uid);
      this.queuePosition = index >= 0 ? index + 1 : null;
    });
  }

}