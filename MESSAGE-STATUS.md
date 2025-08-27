# Message Status Feature

## Tổng quan
Tính năng Message Status cho phép người dùng biết được trạng thái của tin nhắn đã gửi:
- **Đã gửi** (Sent): Tin nhắn đã được gửi thành công
- **Đã nhận** (Delivered): Tin nhắn đã được chuyển đến người nhận
- **Đã xem** (Read): Người nhận đã đọc tin nhắn

## Cách hoạt động

### 1. Message Status Icons
- **Một tick xám**: Đã gửi
- **Hai tick xám**: Đã nhận 
- **Hai tick xanh**: Đã xem

### 2. Tự động cập nhật status
- Khi gửi tin nhắn: Status = "sent"
- Khi người nhận vào chat: Status = "delivered"
- Khi người nhận xem tin nhắn (sau 1 giây): Status = "read"

### 3. Unread Count
- Hiển thị số tin nhắn chưa đọc bằng badge đỏ trong danh sách chat
- Badge sẽ biến mất khi người dùng đọc hết tin nhắn

## Firestore Schema

### Message Document
```typescript
{
  id: string;
  text: string;
  senderId: string;
  receiverId: string;
  timestamp: Date;
  chatId: string;
  status: 'sent' | 'delivered' | 'read';
  readAt?: Date;
}
```

### Chat Document
```typescript
{
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount?: number; // Tính toán thời gian thực
}
```

## Các hàm API mới

### `markMessagesAsRead(chatId, userId)`
Đánh dấu tất cả tin nhắn trong chat thành "read"

### `markMessagesAsDelivered(chatId, userId)`
Đánh dấu tin nhắn từ "sent" thành "delivered"

### `getUnreadCount(chatId, userId)`
Đếm số tin nhắn chưa đọc của user trong chat

## Components mới

### `MessageStatus.tsx`
Component hiển thị icon trạng thái tin nhắn với props:
- `status`: Trạng thái tin nhắn
- `isOwn`: Có phải tin nhắn của mình không
- `isDarkBackground`: Để điều chỉnh màu icon phù hợp

## Responsive Design
- Trên mobile: Chỉ hiển thị icon
- Trên desktop: Hiển thị cả icon và text
- Badge unread count responsive với kích thước phù hợp

## Tối ưu hiệu suất
- Debounce marking read messages (1 giây)
- Batch update multiple messages
- Efficient Firestore queries với composite indexes
