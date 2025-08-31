export type UserRole = 'USER' | 'ADMIN';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

// Import BlueTick types
export type BlueTickStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface BlueTick {
  status: BlueTickStatus;   // Trạng thái yêu cầu
  reason: string;           // Lý do xin cấp tick
  requestedAt: Date;        // Thời điểm user gửi yêu cầu

  processedBy?: string;     // Admin xử lý
  processedAt?: Date;       // Thời điểm xử lý
  processedReason?: string; // Ghi chú lý do (duyệt hoặc từ chối)
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string; // URL của avatar
  password?: string; // Không lưu password trong Firestore khi đăng nhập bằng Google
  role: UserRole; // Role của user
  blueTick?: BlueTick; // Optional blue tick information
  
  // New fields
  phone?: string; // Số điện thoại
  dateOfBirth?: Date; // Ngày sinh
  gender?: Gender; // Giới tính
  
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