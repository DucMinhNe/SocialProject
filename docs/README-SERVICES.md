# Realtime Services Documentation

Các service đã được tái cấu trúc để hỗ trợ **realtime data** với Firebase Firestore listeners, thay thế cho các API calls đơn lẻ.

## 📁 Service Structure

```
src/lib/
├── userService.ts      # Quản lý users realtime
├── dashboardService.ts # Analytics & dashboard metrics
├── adminService.ts     # Admin operations & logging
├── chat.ts            # Chat realtime (đã có)
└── auth.ts            # Authentication (đã có)
```

## 🔔 User Service (`userService.ts`)

### Core Features:
- **Realtime user stats** - Tự động cập nhật tổng users, admins, active users
- **Recent users tracking** - Theo dõi users mới đăng ký
- **Advanced filtering** - Search, role filter, sorting
- **CRUD operations** - Create, update, delete với logging
- **Bulk operations** - Thao tác hàng loạt

### Key Functions:
```typescript
// Realtime subscriptions
subscribeToUserStats(callback) // Dashboard stats
subscribeToRecentUsers(callback) // Users mới nhất  
subscribeToUsers(callback, options) // All users với filter
subscribeToUser(userId, callback) // Single user

// CRUD operations
createUser(userData) // Tạo user mới
updateUser(userId, updates) // Cập nhật user
deleteUser(userId) // Xóa user
bulkUpdateUsers(userIds, updates) // Cập nhật hàng loạt

// Search & utility
searchUsers(term, options) // Tìm kiếm không realtime
cleanupAllUserListeners() // Dọn dẹp listeners
```

### Usage Example:
```typescript
// Subscribe to realtime user stats
useEffect(() => {
  const unsubscribe = subscribeToUserStats((stats) => {
    console.log('Stats updated:', stats);
    setDashboardStats(stats);
  });
  
  return () => unsubscribe(); // Cleanup
}, []);
```

## 📊 Dashboard Service (`dashboardService.ts`)

### Core Features:
- **Chat statistics** - Tổng tin nhắn, chats hoạt động
- **User activity tracking** - Top active users, message counts
- **System metrics** - Performance monitoring (mock)
- **Combined dashboard metrics** - Tổng hợp tất cả data
- **Export functionality** - CSV export cho users & chats

### Key Functions:
```typescript
// Analytics subscriptions
subscribeToChatStats(callback) // Chat metrics
subscribeToUserActivity(callback) // User activity
subscribeToSystemMetrics(callback) // System health
subscribeToDashboardMetrics(callback) // Combined metrics

// Export functions
exportUserData() // Export users to CSV
exportChatData() // Export messages to CSV
cleanupAllAnalyticsListeners() // Cleanup
```

### Dashboard Metrics Structure:
```typescript
interface DashboardMetrics {
  userStats: {
    totalUsers: number;
    activeUsers: number;
    newUsersToday: number;
    adminUsers: number;
  };
  chatStats: ChatStats;
  topActiveUsers: UserActivity[];
  systemHealth: SystemMetrics;
}
```

## 🛡️ Admin Service (`adminService.ts`)

### Core Features:
- **Admin action logging** - Tự động log mọi thao tác admin
- **User banning system** - Ban/unban users với lý do
- **Message moderation** - Delete messages, handle reports
- **Realtime monitoring** - Theo dõi admin activities
- **Bulk operations** - Thao tác hàng loạt với users

### Key Functions:
```typescript
// Admin operations
banUser(adminId, adminName, userId, reason, duration?)
unbanUser(adminId, adminName, userId)
deleteMessage(adminId, adminName, messageId, reason)
bulkUserAction(adminId, adminName, userIds, action, data?)

// Monitoring & reporting
subscribeToAdminActions(callback) // Admin activity log
subscribeToBannedUsers(callback) // Banned users list
subscribeToReportedMessages(callback) // Message reports
subscribeToAdminStats(callback) // Admin dashboard stats

// Message reporting
reportMessage(messageId, reportedBy, reportedByName, reason)
reviewReportedMessage(reportId, adminId, status, notes?)

// Logging
logAdminAction(adminId, adminName, action, targetId, targetType, details)
```

### Admin Action Types:
```typescript
type AdminAction = 
  | 'CREATE_USER' 
  | 'UPDATE_USER' 
  | 'DELETE_USER' 
  | 'BULK_UPDATE' 
  | 'DELETE_MESSAGE' 
  | 'BAN_USER' 
  | 'UNBAN_USER';
```

## 🚀 Realtime Features

### Auto-cleanup Listeners
- Tất cả services tự động cleanup listeners khi component unmount
- Tránh memory leaks và duplicate subscriptions
- Cache management để tối ưu performance

### Error Handling
- Try-catch blocks cho tất cả operations
- Detailed console logging
- User-friendly error messages

### Performance Optimization
- Debounced search functions
- Efficient Firestore queries với indexes
- Client-side filtering cho complex searches
- Pagination support (có thể extend)

## 📈 Usage in Components

### Admin Dashboard:
```typescript
// AdminDashboardFeature.tsx
useEffect(() => {
  const unsubscribeUserStats = subscribeToUserStats(setUserStats);
  const unsubscribeChatStats = subscribeToChatStats(setChatStats);
  const unsubscribeActivity = subscribeToUserActivity(setTopUsers);
  
  return () => {
    unsubscribeUserStats();
    unsubscribeChatStats();
    unsubscribeActivity();
  };
}, []);
```

### User Management:
```typescript
// UserManagementFeature.tsx
useEffect(() => {
  const unsubscribe = subscribeToUsers(
    setUsers,
    {
      roleFilter: roleFilter === 'ALL' ? undefined : roleFilter,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    }
  );
  
  return () => unsubscribe();
}, [roleFilter]);
```

## 🔧 Benefits

### Before (Old Code):
- ❌ Manual `getDocs()` calls
- ❌ No realtime updates
- ❌ Manual refresh needed
- ❌ No action logging
- ❌ Basic CRUD only

### After (New Services):
- ✅ **Realtime data streams**
- ✅ **Auto-sync across clients**
- ✅ **Comprehensive logging**
- ✅ **Advanced filtering & search**
- ✅ **Bulk operations**
- ✅ **Performance optimized**
- ✅ **Memory leak prevention**
- ✅ **Error handling**

## 🎯 Next Steps

1. **Message Moderation UI** - Implement admin chat monitoring
2. **Advanced Analytics** - Charts, graphs cho dashboard
3. **Real Performance Monitoring** - Integrate với monitoring service
4. **Push Notifications** - Admin alerts cho important events
5. **Audit Trail** - Complete admin action history
6. **Role-based Permissions** - Granular admin permissions

## 📊 Firestore Collections

### New Collections Added:
```
/adminActions/{actionId}
/reportedMessages/{reportId}
```

### Enhanced Collections:
```
/users/{userId} - Added: banned, bannedAt, bannedBy, banReason
/messages/{messageId} - Enhanced với moderation
```

Các service này tạo nền tảng vững chắc cho admin dashboard với realtime data và comprehensive logging system! 🚀
