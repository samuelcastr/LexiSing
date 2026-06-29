import { Component, OnInit, AfterViewChecked, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ConversationService } from '../../../core/services/conversation.service';
import { AuthService } from '../../../core/services/auth.service';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { UserSelectionDialog } from './user-selection.dialog';

@Component({
  selector: 'app-sordomudo-chat',
  standalone: true,
  imports: [CommonModule, RouterModule, MatInputModule, MatButtonModule, MatIconModule, MatMenuModule, MatSnackBarModule, MatDialogModule, MatListModule, FormsModule],
  templateUrl: './sordomudo-chat.component.html',
  styleUrls: ['./sordomudo-chat.component.scss']
})
export class SordomudoChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('videoElement') private videoElement!: ElementRef<HTMLVideoElement>;

  convId: string | null = null;
  activeConversation: any = null;
  conversations: any[] = [];
  messages: any[] = [];
  text = '';
  uid: string | null = null;
  currentUserName = 'Sordomudo';
  showCreateButton = false;
  shouldScroll = false;
  sessionStarted = false;
  cameraStatus = 'Sin iniciar';
  cameraActive = false;
  selectedMessage: any = null;
  editingMessage: any = null;
  availableUsers: any[] = [];
  selectedUser: any = null;
  private videoStream: MediaStream | null = null;

  constructor(
    private router: Router,
    private conversationService: ConversationService,
    private authService: AuthService,
    private snack: MatSnackBar,
    private dialog: MatDialog
  ) {}

  private isDevBypass(): boolean {
    return !environment.production && typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.search.includes('dev=true') ||
      (localStorage && localStorage.getItem('DEV_BYPASS') === '1')
    );
  }

  ngOnInit(): void {
    this.authService.getCurrentUser().subscribe(user => {
      if (!user?.uid) {
        if (this.isDevBypass()) {
          this.uid = 'dev-sordomudo';
          this.currentUserName = 'Sordomudo Dev';
          this.convId = null;
          this.messages = [];
          this.showCreateButton = true;
          this.loadAvailableUsers();
          return;
        }

        this.router.navigate(['/login']);
        return;
      }

      this.uid = user.uid;
      this.currentUserName = user.nombre || 'Sordomudo';
      this.loadAvailableUsers();

      this.conversationService.getActiveConversationForUser(this.uid).subscribe(conv => {
        if (conv && conv.id) {
          this.convId = conv.id;
          this.activeConversation = conv;
          this.loadMessages(conv.id);
          this.showCreateButton = false;
        } else {
          this.convId = null;
          this.activeConversation = null;
          this.messages = [];
          this.showCreateButton = true;
        }
      });
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    } catch {
      // ignore
    }
  }

  loadMessages(convId: string): void {
    this.conversationService.getMessages(convId).subscribe(msgs => {
      this.messages = msgs;
      this.shouldScroll = true;
    });
  }

  createSordomudoConversation(): void {
    if (!this.uid) return;
    
    // Mostrar diálogo de selección de usuario
    if (this.availableUsers.length === 0) {
      this.snack.open('No hay usuarios disponibles para crear chat.', 'OK', { duration: 2500 });
      return;
    }

    const dialogRef = this.dialog.open(UserSelectionDialog, {
      width: '400px',
      data: { users: this.availableUsers }
    });

    dialogRef.afterClosed().subscribe((selectedUser: any) => {
      if (selectedUser && selectedUser.uid) {
        this.selectedUser = selectedUser;
        this.createConversationWithUser(selectedUser.uid);
      }
    });
  }

  private createConversationWithUser(employeeUid: string): void {
    if (!this.uid) return;
    
    this.conversationService.createConversation([this.uid, employeeUid])
      .then(docRef => {
        const id = (docRef as any).id || (docRef as any)._path?.segments?.slice(-1)[0];
        if (id) {
          this.convId = id;
          this.activeConversation = {
            id,
            participants: [this.uid, employeeUid],
            participantName: this.selectedUser?.nombre || 'Conversación',
            lastMessage: '',
            updatedAtDate: new Date()
          };
          this.showCreateButton = false;
          this.snack.open(`Chat creado con ${this.selectedUser.nombre || 'usuario'}.`, 'OK', { duration: 2000 });
          this.loadMessages(id);
          this.loadConversationList();
        }
      })
      .catch((error: any) => {
        console.error('Error creando chat sordomudo:', error);
        this.snack.open('No se pudo crear el chat.', 'OK', { duration: 2500 });
      });
  }

  private loadAvailableUsers(): void {
    console.log('loadAvailableUsers called');
    this.conversationService.getAvailableUsers().subscribe(
      users => {
        console.log('Users loaded from Firestore:', users);
        this.availableUsers = users.filter(u => u.uid !== this.uid);
        console.log('Filtered available users:', this.availableUsers);
        this.loadConversationList();
        
        if (this.availableUsers.length === 0) {
          console.warn('No disponible users found after filtering');
        }
      },
      (error: any) => {
        console.error('Error loading available users in component:', error);
        console.error('Error stack:', error?.stack);
        this.snack.open('Error cargando usuarios disponibles.', 'OK', { duration: 2000 });
      }
    );
  }
 
  private loadConversationList(): void {
    if (!this.uid) {
      return;
    }

    this.conversationService.getConversationsForUser(this.uid).subscribe(convs => {
      this.conversations = convs.map(conv => {
        const otherUid = conv.participants?.find((participant: string) => participant !== this.uid);
        const participantName = this.availableUsers.find(u => u.uid === otherUid)?.nombre || 'Conversación';
        return {
          ...conv,
          participantName,
          updatedAtDate: conv.updatedAt?.toDate ? conv.updatedAt.toDate() : new Date(0)
        };
      }).sort((a, b) => b.updatedAtDate.getTime() - a.updatedAtDate.getTime());
    });
  }

  selectConversation(conversation: any): void {
    this.activeConversation = conversation;
    this.convId = conversation.id;
    this.loadMessages(conversation.id);
    this.showCreateButton = false;
  }

  send(): void {
    const messageText = this.text.trim();
    if (!messageText || !this.uid || !this.convId) return;

    if (this.editingMessage) {
      this.conversationService.updateMessage(this.convId, this.editingMessage.id, messageText)
        .then(() => {
          this.messages = this.messages.map(m => m.id === this.editingMessage.id ? { ...m, content: messageText } : m);
          this.text = '';
          this.editingMessage = null;
          this.shouldScroll = true;
          this.loadMessages(this.convId!);
          this.snack.open('Mensaje editado', 'OK', { duration: 1400 });
        })
        .catch((error: any) => {
          console.error('Error editando mensaje:', error);
          this.snack.open('No se pudo editar el mensaje.', 'OK', { duration: 2000 });
        });
      return;
    }

    const payload = { senderUid: this.uid, content: messageText };
    this.conversationService.sendMessage(this.convId, payload).then(() => {
      this.messages = [
        ...this.messages,
        {
          senderUid: this.uid,
          content: messageText,
          timestamp: new Date()
        }
      ];
      this.text = '';
      this.shouldScroll = true;
      this.loadMessages(this.convId!);
      this.snack.open('Mensaje enviado', 'OK', { duration: 1400 });
    }).catch((error: any) => {
      console.error('Error enviando mensaje:', error);
      this.snack.open('No se pudo enviar el mensaje.', 'OK', { duration: 2000 });
    });
  }

  editMessage(message: any): void {
    this.editingMessage = message;
    this.text = message.content;
  }

  selectMessage(message: any): void {
    this.selectedMessage = message;
  }

  cancelEdit(): void {
    this.editingMessage = null;
    this.text = '';
  }

  deleteMessage(messageId: string): void {
    if (!this.convId || !messageId) return;
    if (confirm('¿Eliminar este mensaje?')) {
      this.conversationService.deleteMessage(this.convId, messageId).then(() => {
        this.messages = this.messages.filter(m => m.id !== messageId);
        this.snack.open('Mensaje eliminado', 'OK', { duration: 1400 });
        this.loadMessages(this.convId!);
      }).catch((error: any) => {
        console.error('Error eliminando mensaje:', error);
        this.snack.open('No se pudo eliminar el mensaje.', 'OK', { duration: 2000 });
      });
    }
  }

  isMyMessage(senderUid: string): boolean {
    return senderUid === this.uid;
  }

  goBack(): void {
    this.router.navigate(['/sordomudo']);
  }

  enterSession(): void {
    this.sessionStarted = true;
    this.cameraStatus = 'En espera';
    this.snack.open('Sesión iniciada', 'OK', { duration: 1500 });
  }

  async startCamera(): Promise<void> {
    if (!this.sessionStarted) {
      this.snack.open('Inicia sesión primero', 'OK', { duration: 1500 });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      this.videoStream = stream;
      this.cameraActive = true;
      this.cameraStatus = 'Cámara activa';
      if (this.videoElement?.nativeElement) {
        this.videoElement.nativeElement.srcObject = stream;
        this.videoElement.nativeElement.play().catch(() => {});
      }
      this.snack.open('Cámara iniciada', 'OK', { duration: 1500 });
    } catch (error) {
      console.error('Error iniciando cámara:', error);
      this.snack.open('No se pudo iniciar la cámara.', 'OK', { duration: 2500 });
    }
  }

  stopCamera(): void {
    if (!this.sessionStarted) {
      this.snack.open('Inicia sesión primero', 'OK', { duration: 1500 });
      return;
    }

    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
      this.videoStream = null;
    }

    if (this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.srcObject = null;
    }

    this.cameraActive = false;
    this.cameraStatus = 'En espera';
    this.snack.open('Cámara detenida', 'OK', { duration: 1500 });
  }
}
