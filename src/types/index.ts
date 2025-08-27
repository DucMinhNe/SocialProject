export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string; // URL của avatar
  password?: string; // Không lưu password trong Firestore khi đăng nhập bằng Google
  createdAt: Date;
  lastLogin: Date;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  receiverId: string;
  timestamp: Date;
  chatId: string;
  status: 'sent' | 'delivered' | 'read'; // Trạng thái tin nhắn
  readAt?: Date; // Thời gian đọc tin nhắn
}

export interface Chat {
  id: string;
  participants: string[]; // Array of user IDs
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount?: number; // Số tin nhắn chưa đọc
}
