# Chat App - Ứng dụng Chat Realtime

Ứng dụng chat realtime được xây dựng với Next.js, Firebase và TailwindCSS, giống như Messenger.

## Tính năng

- ✅ Đăng nhập/Đăng ký bằng email và mật khẩu
- ✅ Đăng nhập bằng Google
- ✅ Tìm kiếm người dùng theo email hoặc tên
- ✅ Chat realtime 1-1 giữa 2 người
- ✅ Giao diện đẹp với danh sách chat bên trái và khung chat bên phải
- ✅ Lưu trữ thông tin user với avatar
- ✅ Hiển thị trạng thái online/offline

## Cấu hình Firebase

### Bước 1: Tạo dự án Firebase

1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Tạo dự án mới
3. Bật Authentication và chọn phương thức đăng nhập:
   - Email/Password
   - Google
4. Tạo Firestore Database
5. Cấu hình Security Rules cho Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null; // Cho phép đọc để tìm kiếm user
    }
    
    // Messages collection
    match /messages/{messageId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.senderId || 
         request.auth.uid == resource.data.receiverId);
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.senderId;
    }
    
    // Chats collection
    match /chats/{chatId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.participants;
      allow create: if request.auth != null && 
        request.auth.uid in request.resource.data.participants;
    }
  }
}
```

### Bước 2: Cấu hình ứng dụng

1. Trong Firebase Console, vào Project Settings > General
2. Cuộn xuống phần "Your apps" và chọn "Web app" (</>)
3. Đăng ký app và copy config
4. Cập nhật file `src/lib/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

## Chạy ứng dụng

```bash
# Cài đặt dependencies
npm install

# Chạy development server
npm run dev
```

Truy cập http://localhost:3000 để sử dụng ứng dụng.

## Cấu trúc Database

### Collection: users
```
{
  id: string,           // UID của Firebase Auth
  name: string,         // Tên hiển thị
  email: string,        // Email
  avatar: string,       // URL avatar (optional)
  createdAt: Date,      // Ngày tạo tài khoản
  lastLogin: Date       // Lần đăng nhập cuối
}
```

### Collection: chats
```
{
  id: string,                    // ID chat (userId1_userId2)
  participants: string[],        // Array chứa 2 user IDs
  lastMessage: string,          // Tin nhắn cuối cùng
  lastMessageTime: Date         // Thời gian tin nhắn cuối
}
```

### Collection: messages
```
{
  id: string,           // ID tin nhắn
  text: string,         // Nội dung tin nhắn
  senderId: string,     // ID người gửi
  receiverId: string,   // ID người nhận
  chatId: string,       // ID của chat
  timestamp: Date       // Thời gian gửi
}
```

## Sử dụng

1. **Đăng ký/Đăng nhập**: Có thể dùng email/password hoặc Google
2. **Tìm kiếm**: Gõ email hoặc tên người dùng vào ô tìm kiếm
3. **Bắt đầu chat**: Click vào user từ kết quả tìm kiếm
4. **Chat**: Gõ tin nhắn và Enter hoặc click "Gửi"
5. **Danh sách chat**: Xem tất cả cuộc trò chuyện ở sidebar bên trái

## Technologies

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: TailwindCSS
- **Backend**: Firebase (Auth + Firestore)
- **Real-time**: Firestore Realtime Listeners
- **Deployment**: Vercel (recommended)

## Deploy

Để deploy lên Vercel:

```bash
npm run build
```

Sau đó push lên GitHub và connect với Vercel.
