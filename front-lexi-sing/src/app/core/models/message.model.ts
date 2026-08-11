export interface Message {
  id?: string;
  senderUid: string;
  content: string;
  timestamp: any; // Firestore Timestamp
  read?: boolean;
  edited?: boolean;
  deleted?: boolean;
  deletedAt?: any;
  editedAt?: any;
}

export type { Conversation } from './conversation.model';
