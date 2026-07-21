import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ConversationService } from '../../../../../core/services/conversation.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { CameraService } from '../../../../../core/services/camera.service';
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
import { UserApiService } from '../../../../../core/services/user-api.service';
import { ActivityService } from '../../../../../core/services/activity.service';

@Component({
  selector: 'app-conversation-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatListModule, MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule, MatCardModule, MatTooltipModule, MatSelectModule, MatOptionModule, FormsModule],
  templateUrl: './conversacion-list.html',
  styleUrls: ['./conversacion-list.scss']
})
export class ConversationListComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;

  users: any[] = [];
  selectedUserUid: string = '';
  conversations: any[] = [];
  uid: string = '';
  showNewConvForm = false;
  showCameraModal = false;
  cameraActive = false;
  selectedConversation: any = null;
  messageText: string = '';
  messages: any[] = [];

  constructor(
    private convService: ConversationService,
    private auth: AuthService,
    private router: Router,
    private location: Location,
    private userApi: UserApiService,
    private cameraService: CameraService,
    private activityService: ActivityService
  ) { }

  ngOnInit(): void {
    this.auth.getCurrentUser().subscribe(user => {
      if (user?.uid) {
        this.uid = user.uid;
      } else {
        this.uid = 'supervisor-demo';
      }
      this.loadUsers();
      this.loadConversations();
    });
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  loadConversations(): void {
    this.convService.getConversationsForUser(this.uid).subscribe(list => {
      this.conversations = list.map(conv => {
        const otherUid = conv.participants?.find(p => p !== this.uid);
        const otherUser = this.users.find(u => u.uid === otherUid);
        return { ...conv, participantName: otherUser?.nombre || 'Conversación' };
      }).sort((a, b) => {
        const timeA = a.updatedAt?.toDate?.() || new Date(0);
        const timeB = b.updatedAt?.toDate?.() || new Date(0);
        return timeB.getTime() - timeA.getTime();
      });
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
    this.userApi.getUsers().subscribe({
      next: (users) => {
        this.users = users.filter(u => u.uid && u.uid !== this.uid);
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
    this.cameraService.stopCamera(this.videoElement.nativeElement);
    this.cameraActive = false;
  }

  trackByUid(index: number, user: any): string {
    return user.uid || index;
  }

  selectConversation(conversation: any): void {
    console.log(conversation);

    this.selectedConversation = conversation;
    this.loadMessages(conversation.id);
  }

  loadMessages(convId: string): void {
    this.convService.getMessages(convId).subscribe(msgs => {
      this.messages = msgs;
    });
  }

  deselectConversation(): void {
    this.selectedConversation = null;
  }

  goBack(): void {
    const currentUrl = this.router.url;
    const targetUrl = currentUrl.includes('/roles/supervisor/conversations')
      ? '/roles/supervisor/dashboard'
      : (currentUrl.includes('/roles/empleados/conversations') || currentUrl.includes('/conversations'))
        ? '/roles/empleados/dashboard'
        : '/dashboard';

    if (typeof window !== 'undefined') {
      window.location.assign(targetUrl);
      return;
    }

    this.router.navigateByUrl(targetUrl);
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
}



