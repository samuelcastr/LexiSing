import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ConversationService } from '../../../core/services/conversation.service';
import { AuthService } from '../../../core/services/auth.service';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, RouterModule, MatInputModule, MatButtonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {
  convId!: string;
  messages: any[] = [];
  text = '';
  uid: string | null = null;

  constructor(private route: ActivatedRoute, private convService: ConversationService, private auth: AuthService) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (!id) return;
      this.convId = id;
      this.auth.getCurrentUser().subscribe(user => {
        if (!user) return;
        this.uid = user.uid;
        this.convService.getMessages(this.convId).subscribe(list => {
          this.messages = list;
        });
      });
    });
  }

  send() {
    if (!this.text || !this.uid) return;
    const payload = { senderUid: this.uid, content: this.text };
    this.convService.sendMessage(this.convId, payload).then(() => {
      this.text = '';
    });
  }

  deleteMessage(messageId: string) {
    if (!this.convId || !messageId) return;
    this.convService.deleteMessage(this.convId, messageId).then(() => {
      // opcional: mostrar notificación ligera o actualizar localmente
    });
  }
}
