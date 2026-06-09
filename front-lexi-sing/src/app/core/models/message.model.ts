export interface Message {
  id?: string;
  senderUid: string;
  content: string;
  timestamp: any; // Firestore Timestamp
  read?: boolean;
}

export interface Conversation {
  id?: string;
  participants: string[];
  lastMessage?: string;
  updatedAt?: any; // Firestore Timestamp
}
