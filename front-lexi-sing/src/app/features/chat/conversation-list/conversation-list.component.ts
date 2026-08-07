import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ConversationService } from '../../../core/services/conversation.service';
import { AuthService } from '../../../core/services/auth.service';
import { CameraService } from '../../../core/services/camera.service';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { UserApiService } from '../../../core/services/user-api.service';
import { ActivityService } from '../../../core/services/activity.service';
import { PresenceService } from '../../../core/services/presence.service';
import { ErrorService } from '../../../core/services/error.service';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-conversation-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatListModule, MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule, MatCardModule, MatTooltipModule, MatSelectModule, MatOptionModule, FormsModule],
  templateUrl: './conversation-list.component.html',
  styleUrls: ['./conversation-list.component.scss']
})
export class ConversationListComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLDivElement>;

  users: any[] = [];
  filteredUsers: any[] = [];
  newConvSearchTerm: string = '';
  selectedUserUid: string = '';
  conversations: any[] = [];
  filteredConversations: any[] = [];
  searchTerm: string = '';
  uid: string = '';
  showNewConvForm = false;
  showCameraModal = false;
  cameraActive = false;
  selectedConversation: any = null;
  messageText: string = '';
  messages: any[] = [];
  editingMessageId: string | null = null;
  editingText: string = '';
  activeMessageMenuId: string | null = null;
  participantPresence: 'online' | 'offline' = 'offline';
  userRole: string = '';
  private sending = false;
  private destroy$ = new Subject<void>();
  private convSub?: Subscription;
  private usersSub?: Subscription;
  private presenceSub?: Subscription;

  constructor(
    private convService: ConversationService,
    private auth: AuthService,
    private router: Router,
    private location: Location,
    private userApi: UserApiService,
    private cameraService: CameraService,
    private activityService: ActivityService,
    private presenceService: PresenceService,
    private errorService: ErrorService
  ) { }

  ngOnInit(): void {
    this.auth.getCurrentUser().pipe(takeUntil(this.destroy$)).subscribe(user => {
      if (user?.uid) {
        this.uid = user.uid;
        this.userRole = user.rol || '';
        this.presenceService.startPresence(this.uid);
      } else {
        return;
      }
      this.loadUsers();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.convSub?.unsubscribe();
    this.usersSub?.unsubscribe();
    this.presenceSub?.unsubscribe();
    this.stopCamera();
    this.presenceService.stopPresence();
  }

  loadConversations(): void {
    this.convSub?.unsubscribe();
    this.convSub = this.convService.getConversationsForUser(this.uid).pipe(takeUntil(this.destroy$)).subscribe(list => {
      this.conversations = list.map(conv => {
        const otherUid = conv.participants?.find(p => p !== this.uid);
        const otherUser = this.users.find(u => u.uid === otherUid);
        return { ...conv, participantName: otherUser?.nombre || 'Conversación' };
      }).sort((a, b) => {
        const timeA = a.updatedAt?.toDate?.() || new Date(0);
        const timeB = b.updatedAt?.toDate?.() || new Date(0);
        return timeB.getTime() - timeA.getTime();
      });

      this.filterConversations();
    });
  }

  filterConversations(): void {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      this.filteredConversations = [...this.conversations];
      return;
    }

    this.filteredConversations = this.conversations.filter(conv => {
      const name = (conv.participantName || '').toLowerCase();
      const lastMessage = (conv.lastMessage || '').toLowerCase();
      return name.includes(term) || lastMessage.includes(term);
    });
  }

  toggleNewConvForm(): void {
    this.showNewConvForm = !this.showNewConvForm;
    this.selectedUserUid = '';
    this.newConvSearchTerm = '';
    if (this.showNewConvForm) {
      this.loadUsers();
    }
  }

  filterUsers(): void {
    const term = this.normalize(this.newConvSearchTerm.trim().toLowerCase());

    if (!term) {
      this.filteredUsers = [...this.users];
      return;
    }

    this.filteredUsers = this.users.filter(user => {
      const nombre = this.normalize((user.nombre || '').toLowerCase());
      const email = this.normalize((user.email || '').toLowerCase());
      return nombre.includes(term) || email.includes(term);
    });
  }

  private normalize(texto: string): string {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  loadUsers(): void {
    this.usersSub?.unsubscribe();
    this.usersSub = this.userApi.getUsers().pipe(takeUntil(this.destroy$)).subscribe({
      next: (users) => {
        this.users = users.filter(u => u.uid && u.uid !== this.uid);
        this.filterUsers();
        this.loadConversations();
      },
      error: (error) => {
        this.errorService.mostrarError(error, 'Error al cargar los usuarios.');
      }
    });
  }

  createConversation(): void {
    if (!this.selectedUserUid) {
      this.errorService.mostrarError(null, 'Por favor selecciona un usuario.');
      return;
    }

    if (this.selectedUserUid === this.uid) {
      this.errorService.mostrarError(null, 'No puedes crear una conversación contigo mismo.');
      return;
    }

    this.convService.createConversation([this.uid, this.selectedUserUid])
      .then(() => {

        const currentUser = this.users.find(
          u => u.uid === this.uid
        );

        this.activityService.addActivity(
          currentUser?.nombre || 'Usuario',
          'inició una conversación'
        );

        this.selectedUserUid = '';
        this.showNewConvForm = false;
        this.loadConversations();

      })
      .catch(error => {
        this.errorService.mostrarError(error, 'Error al crear la conversación.');
      });
  }

  async startCamera(): Promise<void> {
    try {
      await this.cameraService.startCamera(this.videoElement.nativeElement);
      this.cameraActive = true;
    } catch (error) {
      this.errorService.mostrarError(error, 'No se pudo acceder a la cámara. Verifica los permisos.');
    }
  }

  stopCamera(): void {
    if (this.videoElement?.nativeElement) {
      this.cameraService.stopCamera(this.videoElement.nativeElement);
    }
    this.cameraActive = false;
  }

  trackByUid(index: number, user: any): string {
    return user.uid || index;
  }

  selectConversation(conversation: any): void {
    this.selectedConversation = conversation;
    this.loadMessages(conversation.id);

    const otherUid = conversation.participants?.find((p: string) => p !== this.uid);
    if (otherUid) {
      this.presenceSub?.unsubscribe();
      this.presenceSub = this.presenceService.observePresence(otherUid).subscribe(status => {
        this.participantPresence = status;
      });
    }

    if (this.userRole === 'sordomudo' && !this.cameraActive) {
      setTimeout(() => {
        this.startCamera();
      }, 500);
    }
  }

  loadMessages(convId: string): void {
    this.convService.getMessages(convId).pipe(takeUntil(this.destroy$)).subscribe(msgs => {
      this.messages = msgs.filter(msg => !msg.deleted);
      this.scrollToBottom();
    });
  }

  scrollToBottom(): void {
    setTimeout(() => {
      try {
        if (this.messagesContainer?.nativeElement) {
          this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
        }
      } catch (err) {
        // El contenedor aún no está disponible
      }
    }, 0);
  }

  deselectConversation(): void {
    this.selectedConversation = null;
    this.participantPresence = 'offline';
    if (this.userRole === 'sordomudo' && this.cameraActive) {
      this.stopCamera();
    }
  }


  goBack(): void {
    if (this.router.url.includes('/roles/supervisor/conversations')) {
      this.router.navigate(['/roles/supervisor/dashboard']);
    } else if (this.router.url.includes('/roles/admin/conversations')) {
      this.router.navigate(['/roles/admin/dashboard']);
    } else if (this.router.url.includes('/roles/empleados/conversations')) {
      this.router.navigate(['/roles/empleados/dashboard']);
    } else if (this.router.url.includes('/roles/sordomudo/conversations')) {
      this.router.navigate(['/roles/sordomudo/dashboard']);
    } else if (this.router.url.includes('/roles/usuario/conversations')) {
      this.router.navigate(['/roles/usuario/dashboard']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
  sendMessage(): void {
    if (this.sending || !this.messageText.trim() || !this.selectedConversation?.id) {
      return;
    }

    const content = this.messageText;
    this.messageText = '';
    this.sending = true;

    this.convService.sendMessage(this.selectedConversation.id, {
      content,
      senderUid: this.uid
    }).then(() => {

      const currentUser = this.users.find(
        u => u.uid === this.uid
      );

      this.activityService.addActivity(
        currentUser?.nombre || 'Usuario',
        'envió un mensaje'
      );

      this.scrollToBottom();

    }).catch(error => {
      this.errorService.mostrarError(error, 'Error al enviar el mensaje.');
    }).finally(() => {
      this.sending = false;
    });
  }

  toggleMessageMenu(messageId: string | null): void {
    this.activeMessageMenuId = this.activeMessageMenuId === messageId ? null : messageId;
  }

  onMessageContextMenu(event: MouseEvent, message: any): void {
    event.preventDefault();
    if (message?.senderUid === this.uid) {
      this.toggleMessageMenu(message.id);
    }
  }

  startEditMessage(message: any): void {
    this.activeMessageMenuId = null;
    this.editingMessageId = message.id;
    this.editingText = message.content;
  }

  cancelEditMessage(): void {
    this.editingMessageId = null;
    this.editingText = '';
  }

  saveEditMessage(message: any): void {
    if (!this.selectedConversation?.id || !message?.id || !this.editingText.trim()) {
      return;
    }

    this.convService.editMessage(this.selectedConversation.id, message.id, this.editingText.trim())
      .then(() => {
        this.messages = this.messages.map(m =>
          m.id === message.id ? { ...m, content: this.editingText.trim(), edited: true } : m
        );
        this.editingMessageId = null;
        this.editingText = '';
        this.scrollToBottom();
      })
      .catch(error => {
        this.errorService.mostrarError(error, 'Error al editar el mensaje.');
      });
  }

  deleteMessage(message: any): void {
    if (!this.selectedConversation?.id || !message?.id) {
      return;
    }

    this.activeMessageMenuId = null;
    this.convService.softDeleteMessage(this.selectedConversation.id, message.id)
      .then(() => {
        this.editingMessageId = null;
      })
      .catch(error => {
        this.errorService.mostrarError(error, 'Error al eliminar el mensaje.');
      });
  }
}



