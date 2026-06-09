import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ConversationService } from '../../../core/services/conversation.service';
import { AuthService } from '../../../core/services/auth.service';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-conversation-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatListModule, MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule, MatCardModule, MatTooltipModule, FormsModule],
  templateUrl: './conversation-list.component.html',
  styleUrls: ['./conversation-list.component.scss']
})
export class ConversationListComponent implements OnInit {
  conversations: any[] = [];
  uid: string | null = null;
  showNewConvForm = false;
  newConvParticipant = '';

  constructor(private convService: ConversationService, private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.loadConversations();
  }

  loadConversations(): void {
    this.auth.getCurrentUser().subscribe(user => {
      if (!user) return;
      this.uid = user.uid;
      this.convService.getConversationsForUser(user.uid).subscribe(list => {
        this.conversations = list;
      });
    });
  }

  createConversation(): void {
    if (!this.newConvParticipant || !this.uid) return;
    this.convService.createConversation([this.uid, this.newConvParticipant]).then(() => {
      this.newConvParticipant = '';
      this.showNewConvForm = false;
      this.loadConversations();
    }).catch(err => console.error('Error creando conversación:', err));
  }

  toggleNewConvForm(): void {
    this.showNewConvForm = !this.showNewConvForm;
  }
}
