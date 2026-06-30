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

export interface Conversation {
  id?: string;
  participants: string[];
  lastMessage?: string;
  updatedAt?: any; // Firestore Timestamp
}
