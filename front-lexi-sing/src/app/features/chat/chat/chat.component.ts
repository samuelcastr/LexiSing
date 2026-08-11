import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ConversationService } from '../../../core/services/conversation.service';
import { AuthService } from '../../../core/services/auth.service';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { User } from '../../../core/models/user.model';
import { ErrorService } from '../../../core/services/error.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, RouterModule, MatInputModule, MatButtonModule, MatIconModule, MatMenuModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  
  convId!: string;
  messages: any[] = [];
  text = '';
  uid: string | null = null;
  currentUser: User | null = null;
  editingMessage: any | null = null;
  private sending = false;
  private shouldScroll = false;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private convService: ConversationService,
    private auth: AuthService,
    private errorService: ErrorService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('id');
      if (!id) return;
      this.convId = id;
      this.messages = [];
      this.auth.getCurrentUser().pipe(takeUntil(this.destroy$)).subscribe(user => {
        if (!user) return;
        this.uid = user.uid;
        this.currentUser = user;
        this.convService.getMessages(this.convId).pipe(takeUntil(this.destroy$)).subscribe(list => {
          this.messages = list.filter(msg => !msg.deleted);
          this.shouldScroll = true;
        });
      });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
    } catch (err) {
      // Error al hacer scroll
    }
  }

  send(): void {
    if (this.sending || !this.text.trim() || !this.uid) return;

    this.sending = true;

    if (this.editingMessage) {
      const editedId = this.editingMessage.id;
      const newContent = this.text.trim();
      this.text = '';
      this.editingMessage = null;
      this.convService.editMessage(this.convId, editedId, newContent).then(() => {
        this.messages = this.messages.map(m =>
          m.id === editedId ? { ...m, content: newContent, edited: true } : m
        );
      }).catch(error => {
        this.errorService.mostrarError(error, 'Error al editar el mensaje.');
      }).finally(() => {
        this.sending = false;
      });
      return;
    }

    const payload = { senderUid: this.uid, content: this.text.trim() };
    this.text = '';
    this.convService.sendMessage(this.convId, payload).then(() => {
      this.shouldScroll = true;
    }).finally(() => {
      this.sending = false;
    });
  }

  editMessage(msg: any): void {
    this.editingMessage = msg;
    this.text = msg.content;
  }

  cancelEdit(): void {
    this.editingMessage = null;
    this.text = '';
  }

  deleteMessage(messageId: string): void {
    if (!this.convId || !messageId) return;
    if (confirm('¿Eliminar este mensaje?')) {
      this.convService.deleteMessage(this.convId, messageId).then(() => {
        this.messages = this.messages.filter(m => m.id !== messageId);
      });
    }
  }

  isMyMessage(senderUid: string): boolean {
    return senderUid === this.uid;
  }

  getMessageTime(timestamp: any): string {
    if (!timestamp || !timestamp.toDate) return '';
    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    return date.toLocaleDateString();
  }
}
