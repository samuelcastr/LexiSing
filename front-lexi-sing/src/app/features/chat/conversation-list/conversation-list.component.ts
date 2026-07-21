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

  users: any[] = [];
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
    private presenceService: PresenceService
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
    if (this.showNewConvForm) {
      this.loadUsers();
    }
  }

  loadUsers(): void {
    this.usersSub?.unsubscribe();
    this.usersSub = this.userApi.getUsers().pipe(takeUntil(this.destroy$)).subscribe({
      next: (users) => {
        this.users = users.filter(u => u.uid && u.uid !== this.uid);
        this.loadConversations();
      },
      error: (error) => {
        console.error('Error cargando usuarios:', error);
      }
    });
  }

  createConversation(): void {
    if (!this.selectedUserUid) {
      alert('Por favor selecciona un usuario');
      return;
    }

    if (this.selectedUserUid === this.uid) {
      alert('No puedes crear una conversación contigo mismo');
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
        console.error('Error creando conversación:', error);
        alert('Error al crear conversación');
      });
  }

  async startCamera(): Promise<void> {
    try {
      await this.cameraService.startCamera(this.videoElement.nativeElement);
      this.cameraActive = true;
    } catch (error) {
      alert('No se pudo acceder a la cámara. Verifica los permisos.');
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
    });
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
    if (!this.messageText.trim() || !this.selectedConversation?.id) {
      return;
    }

    this.convService.sendMessage(this.selectedConversation.id, {
      content: this.messageText,
      senderUid: this.uid
    }).then(() => {

      const currentUser = this.users.find(
        u => u.uid === this.uid
      );

      this.activityService.addActivity(
        currentUser?.nombre || 'Usuario',
        'envió un mensaje'
      );

      this.messageText = '';

    }).catch(error => {
      console.error('Error enviando mensaje:', error);
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
      })
      .catch(error => {
        console.error('Error editando mensaje:', error);
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
        console.error('Error eliminando mensaje:', error);
      });
  }
}



