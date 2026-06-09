import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ConversationService } from '../../../core/services/conversation.service';
import { AuthService } from '../../../core/services/auth.service';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-conversation-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatListModule, MatButtonModule],
  templateUrl: './conversation-list.component.html',
  styleUrls: ['./conversation-list.component.scss']
})
export class ConversationListComponent implements OnInit {
  conversations: any[] = [];
  uid: string | null = null;

  constructor(private convService: ConversationService, private auth: AuthService) {}

  ngOnInit(): void {
    this.auth.getCurrentUser().subscribe(user => {
      if (!user) return;
      this.uid = user.uid;
      this.convService.getConversationsForUser(user.uid).subscribe(list => {
        this.conversations = list;
      });
    });
  }
}
