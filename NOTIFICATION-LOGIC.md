# Notification Logic - Smart Behavior

## Vấn đề đã sửa

**Trước đây**: Thông báo hiển thị ngay cả khi người dùng đang xem chat, gây khó chịu và không có ý nghĩa.

**Bây giờ**: Thông báo chỉ hiển thị khi người dùng KHÔNG đang xem chat (tab bị ẩn hoặc cửa sổ không focus).

## Logic hoạt động

### 1. Kiểm tra điều kiện cơ bản
- Tin nhắn từ người khác (không phải tin nhắn của mình)
- Tin nhắn mới (trong vòng 30 giây)
- Người dùng đã bật thông báo

### 2. Kiểm tra trạng thái focus
- `document.hidden = true`: Tab không được xem → **HIỂN THỊ** thông báo
- `document.hidden = false`: Tab đang được xem → **KHÔNG HIỂN THỊ** thông báo

### 3. Âm thanh thông báo
- Chỉ phát âm thanh khi tab không được focus (`document.hidden = true`)
- Tránh phát âm thanh khi người dùng đang xem chat

## Ví dụ thực tế

### Scenario 1: Người dùng đang xem chat
```
User A đang xem chat với User B
User B gửi tin nhắn mới
→ KHÔNG hiển thị notification (vì đang xem rồi)
→ KHÔNG phát âm thanh
```

### Scenario 2: Người dùng chuyển sang tab khác
```
User A chuyển sang tab Facebook
User B gửi tin nhắn mới cho User A
→ HIỂN THỊ notification 
→ PHÁT âm thanh
```

### Scenario 3: Người dùng minimize cửa sổ
```
User A minimize cửa sổ browser
User B gửi tin nhắn mới
→ HIỂN THỊ notification
→ PHÁT âm thanh
```

## Code implementation

### ChatInterface.tsx
```tsx
// Chỉ kiểm tra điều kiện cơ bản, không kiểm tra document.hidden
if (latestMessage.senderId !== user.uid && notificationsEnabled && isRecentMessage) {
  showMessageNotification(/* ... */);
}
```

### useNotifications.ts
```tsx
// Hook tự kiểm tra document.hidden để quyết định hiển thị
const showMessageNotification = useCallback((senderName, message, avatar) => {
  // Chỉ hiển thị notification và phát âm thanh khi tab không focus
  if (document.hidden) {
    // Show notification & play sound
  } else {
    // Skip notification - user is actively viewing
  }
}, []);
```

## Lợi ích

1. **UX tốt hơn**: Không spam notification khi đang xem
2. **Tiết kiệm tài nguyên**: Không tạo notification không cần thiết
3. **Logic rõ ràng**: Separation of concerns - ChatInterface kiểm tra message, useNotifications kiểm tra focus
4. **Dễ test**: Có thể test focus/blur behavior riêng biệt
