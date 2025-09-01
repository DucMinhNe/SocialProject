# Logic Notification Đã Được Sửa

## Vấn Đề Trước Đây
- Thông báo chỉ xuất hiện khi đang ở TRONG chat đã chọn
- Không có thông báo khi ở ngoài hoặc khi có tin nhắn từ chat khác
- Logic notification bị sai: "bấm vào đoạn chat mới thông báo"

## Logic Notification Mới (Đúng)

### 🎯 Nguyên Tắc Chính
1. **Khi ở ngoài** (chưa chọn chat nào): Hiển thị thông báo cho TẤT CẢ tin nhắn mới
2. **Khi ở trong chat A**: Chỉ hiển thị thông báo cho tin nhắn từ chat B, C... (KHÔNG phải chat A đang xem)

### 📋 Implementation Details

#### GlobalNotificationService
- Listen tất cả chats của user đồng thời
- Phát hiện tin nhắn mới từ bất kỳ chat nào
- Xác định chat hiện tại để quyết định có hiển thị thông báo hay không

```typescript
// Logic quyết định hiển thị thông báo
const shouldShowNotification = !selectedChat || !isFromCurrentChat;

if (shouldShowNotification) {
  showMessageNotification(senderName, message, avatar);
}
```

#### Chat Interface Updates
- Loại bỏ logic notification cũ từ `getMessages` useEffect
- Thêm global listener cho tất cả chats
- Dependency array bao gồm `selectedChat?.id` để update khi chuyển chat

#### Notification Hook Updates
- Loại bỏ logic chỉ hiển thị khi `document.hidden`
- Luôn hiển thị notification khi được gọi (global logic sẽ quyết định)
- Phát âm thanh bất kể tab focus (vì logic đã được xử lý ở level cao hơn)

## Scenarios Testing

### ✅ Scenario 1: Ở ngoài (chưa chọn chat)
- User A gửi tin nhắn → ✅ Hiển thị thông báo
- User B gửi tin nhắn → ✅ Hiển thị thông báo
- Kết quả: Thấy tất cả thông báo từ mọi chat

### ✅ Scenario 2: Đang trong chat với User A
- User A gửi tin nhắn → ❌ KHÔNG hiển thị thông báo (đang xem rồi)
- User B gửi tin nhắn → ✅ Hiển thị thông báo (từ chat khác)
- Kết quả: Chỉ thấy thông báo từ chat khác, không thấy từ chat đang xem

### ✅ Scenario 3: Chuyển từ chat A sang chat B
- Cleanup listener của chat A
- Setup listener mới với chat B là current
- Logic notification update accordingly

## Files Modified

### 1. `/src/lib/globalNotificationService.ts` (NEW)
- Service quản lý notification toàn cục
- Listen tất cả chats đồng thời
- Cleanup và setup listeners

### 2. `/src/components/ChatInterface.tsx`
- Import globalNotificationService
- Setup global listener với chats array
- Loại bỏ logic notification cũ trong getMessages useEffect
- Dependency array được tối ưu

### 3. `/src/hooks/useNotifications.ts`
- Loại bỏ document.hidden check trong showMessageNotification
- Luôn phát âm thanh khi có notification (logic đã được xử lý global)
- Simplified notification logic

## Debug Console Logs

### Global Message Detection
```
🌍 Global message detected: {
  chatId: "user1_user2",
  senderId: "user2", 
  isFromCurrentChat: false,
  currentChatId: "user1_user3",
  senderName: "User 2",
  message: "Hello!"
}
```

### Notification Decision
```
🔔 Showing global notification for: User 2
// hoặc
🔕 Skipping notification - user is viewing this chat
```

## Performance Considerations
- Multiple Firestore listeners (một cho mỗi chat)
- Cleanup listeners khi component unmount
- Optimize với limit(1) để chỉ lấy tin nhắn mới nhất
- Use Map để track last message times

## Next Steps
- [ ] Test với nhiều chats
- [ ] Test chuyển đổi giữa các chats
- [ ] Test notification permissions
- [ ] Test khi app ở background
- [ ] Monitor Firestore read usage
