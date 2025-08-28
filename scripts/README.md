# Admin Scripts

Các script để quản lý quyền admin trong ứng dụng Chat App.

## Script cập nhật quyền admin

### Cách sử dụng:

1. **Tạo tài khoản admin trước:**
   - Mở ứng dụng và truy cập `/auth/register`
   - Đăng ký với email: `admin@gmail.com`
   - Hoàn thành quá trình đăng ký

2. **Chạy script cập nhật quyền:**
   ```bash
   npm run update-admin
   ```

3. **Kiểm tra kết quả:**
   - Đăng nhập lại với tài khoản `admin@gmail.com`
   - Truy cập `/admin` để vào trang quản trị

### Các file script:

- `update-admin-simple.js` - Script JavaScript đơn giản (được sử dụng bởi npm script)
- `update-admin.js` - Script với environment variables
- `update-admin.ts` - Script TypeScript

### Script sẽ thực hiện:

- ✅ Tìm kiếm tài khoản với email `admin@gmail.com`
- ✅ Kiểm tra role hiện tại
- ✅ Cập nhật role thành `ADMIN` nếu chưa phải
- ✅ Hiển thị thông báo kết quả

### Lưu ý:

- Tài khoản phải tồn tại trong Firestore trước khi chạy script
- Script sẽ không tạo tài khoản mới, chỉ cập nhật role
- Cần đảm bảo Firestore rules cho phép cập nhật role

### Troubleshooting:

**Nếu gặp lỗi "permission-denied":**
- Kiểm tra Firestore rules
- Đảm bảo rules cho phép cập nhật field `role`

**Nếu không tìm thấy tài khoản:**
- Đăng ký tài khoản `admin@gmail.com` qua ứng dụng trước
- Kiểm tra collection `users` trong Firestore console

### Firestore Rules cần thiết:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Cho phép cập nhật role (có thể cần điều chỉnh theo nhu cầu bảo mật)
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }
  }
}
```
