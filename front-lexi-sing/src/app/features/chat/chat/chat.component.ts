import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
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

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, RouterModule, MatInputModule, MatButtonModule, MatIconModule, MatMenuModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  
  convId!: string;
  messages: any[] = [];
  text = '';
  uid: string | null = null;
  currentUser: User | null = null;
  private shouldScroll = false;

  constructor(private route: ActivatedRoute, private convService: ConversationService, private auth: AuthService) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (!id) return;
      this.convId = id;
      this.auth.getCurrentUser().subscribe(user => {
        if (!user) return;
        this.uid = user.uid;
        this.currentUser = user;
        this.convService.getMessages(this.convId).subscribe(list => {
          this.messages = list;
          this.shouldScroll = true;
        });
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
    } catch (err) {
      // Error al hacer scroll
    }
  }

  send(): void {
    if (!this.text.trim() || !this.uid) return;
    const payload = { senderUid: this.uid, content: this.text };
    this.convService.sendMessage(this.convId, payload).then(() => {
      this.text = '';
      this.shouldScroll = true;
    });
  }

  deleteMessage(messageId: string): void {
    if (!this.convId || !messageId) return;
    if (confirm('¿Eliminar este mensaje?')) {
      this.convService.deleteMessage(this.convId, messageId).then(() => {
        // Mensaje eliminado
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
