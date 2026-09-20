import { Injectable } from '@angular/core';
import { Subscription, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ConversationService } from './conversation.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private currentUid: string | null = null;
  private activeConversationId: string | null = null;
  private conversationSubs = new Map<string, Subscription>();
  private conversationsSub?: Subscription;
  private audio: HTMLAudioElement | null = null;
  private destroy$ = new Subject<void>();

  constructor(private convService: ConversationService) {}

  start(uid: string): void {
    if (typeof window === 'undefined') return;
    this.stop();
    this.currentUid = uid;

    this.conversationsSub = this.convService.getConversationsForUser(uid)
      .pipe(takeUntil(this.destroy$))
      .subscribe(conversations => {
        const ids = new Set(conversations.map(c => c.id).filter(Boolean) as string[]);

        ids.forEach(id => {
          if (!this.conversationSubs.has(id)) {
            this.watchConversation(id);
          }
        });

        this.conversationSubs.forEach((_sub, id) => {
          if (!ids.has(id)) {
            this.unwatchConversation(id);
          }
        });
      });
  }

  stop(): void {
    this.currentUid = null;
    this.conversationsSub?.unsubscribe();
    this.conversationsSub = undefined;
    this.conversationSubs.forEach(sub => sub.unsubscribe());
    this.conversationSubs.clear();
  }

  setActiveConversation(convId: string | null): void {
    this.activeConversationId = convId;
  }

  private watchConversation(convId: string): void {
    let initial = true;

    const sub = this.convService.getMessageChanges(convId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(changes => {
        if (initial) {
          initial = false;
          return;
        }

        changes
          .filter(c => c?.type === 'added')
          .forEach(c => {
            const message = c.doc?.data?.();
            if (!message) return;
            if (!message.senderUid || message.senderUid === this.currentUid) return;
            if (this.shouldNotify(convId)) {
              this.playNotification();
            }
          });
      });

    this.conversationSubs.set(convId, sub);
  }

  private unwatchConversation(convId: string): void {
    const sub = this.conversationSubs.get(convId);
    if (sub) {
      sub.unsubscribe();
      this.conversationSubs.delete(convId);
    }
  }

  private shouldNotify(convId: string): boolean {
    if (convId !== this.activeConversationId) return true;
    return typeof document !== 'undefined' && document.hidden;
  }

  private playNotification(): void {
    if (typeof window === 'undefined') return;

    if (!this.audio) {
      this.audio = new Audio('assets/sounds/notification.mp3');
      this.audio.preload = 'auto';
    }

    this.audio.currentTime = 0;
    this.audio.play().catch(() => {});
  }
}