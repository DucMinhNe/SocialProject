import { onSnapshot, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';
import { Message } from '@/types';

export class GlobalNotificationService {
  private unsubscribes: Map<string, () => void> = new Map();
  private lastMessageTimes: Map<string, number> = new Map();
  
  // Listen to all user's chats for new messages
  setupGlobalMessageListener(
    userId: string, 
    chatIds: string[], 
    onNewMessage: (chatId: string, message: Message, isFromCurrentChat: boolean) => void,
    currentChatId?: string
  ) {
    // Clean up existing listeners
    this.cleanup();
    
    chatIds.forEach(chatId => {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(1));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const messageData = change.doc.data();
            const message: Message = {
              id: change.doc.id,
              text: messageData.text,
              senderId: messageData.senderId,
              receiverId: messageData.receiverId,
              timestamp: messageData.timestamp?.toDate() || new Date(),
              chatId: chatId,
              status: messageData.status || 'sent'
            };
            
            // Check if this is a new message (not from page reload)
            const messageTime = message.timestamp.getTime();
            const lastMessageTime = this.lastMessageTimes.get(chatId) || 0;
            
            if (messageTime > lastMessageTime) {
              this.lastMessageTimes.set(chatId, messageTime);
              
              // Only notify for messages from other users
              if (message.senderId !== userId) {
                const isFromCurrentChat = chatId === currentChatId;
                onNewMessage(chatId, message, isFromCurrentChat);
              }
            }
          }
        });
      });
      
      this.unsubscribes.set(chatId, unsubscribe);
    });
  }
  
  cleanup() {
    this.unsubscribes.forEach(unsubscribe => unsubscribe());
    this.unsubscribes.clear();
  }
  
  updateCurrentChat(currentChatId?: string) {
    // This method can be called when user switches chats
    // to update the notification logic
  }
}

export const globalNotificationService = new GlobalNotificationService();
