import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  doc, 
  getDocs,
  Timestamp,
  DocumentData,
  QuerySnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, Message } from '@/types';

// Types for dashboard analytics
export interface ChatStats {
  totalMessages: number;
  totalChats: number;
  todayMessages: number;
  thisWeekMessages: number;
  thisMonthMessages: number;
  averageMessagesPerDay: number;
  activeChatsToday: number;
}

export interface UserActivity {
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  totalMessages: number;
  lastMessageTime: Date;
  isActiveToday: boolean;
}

export interface SystemMetrics {
  uptime: number;
  totalInteractions: number;
  errorRate: number;
  responseTime: number;
}

export interface DashboardMetrics {
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

// Cache cho analytics listeners
const analyticsListeners = new Map<string, () => void>();

// Utility functions
const convertMessageDoc = (doc: any) => {
  const data = doc.data();
  return {
    id: doc.id,
    text: data.text,
    senderId: data.senderId,
    receiverId: data.receiverId,
    timestamp: data.timestamp?.toDate() || new Date(),
    status: data.status || 'sent',
    chatId: data.chatId,
  };
};

// Service để lấy chat statistics realtime
export const subscribeToChatStats = (
  callback: (stats: ChatStats) => void
): (() => void) => {
  const listenerId = 'chat-stats';
  
  // Cleanup existing listener
  if (analyticsListeners.has(listenerId)) {
    analyticsListeners.get(listenerId)?.();
    analyticsListeners.delete(listenerId);
  }

  console.log('🔔 Setting up realtime chat stats listener...');

  const messagesRef = collection(db, 'messages');
  
  const unsubscribe = onSnapshot(
    messagesRef,
    async (snapshot: QuerySnapshot<DocumentData>) => {
      try {
        const messages: any[] = [];
        const chatIds = new Set<string>();
        
        snapshot.forEach((doc) => {
          const message = convertMessageDoc(doc);
          messages.push(message);
          if (message.chatId) {
            chatIds.add(message.chatId);
          }
        });

        // Calculate time ranges
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // Filter messages by time
        const todayMessages = messages.filter(m => m.timestamp >= todayStart);
        const weekMessages = messages.filter(m => m.timestamp >= weekStart);
        const monthMessages = messages.filter(m => m.timestamp >= monthStart);

        // Calculate active chats today
        const activeChatIds = new Set();
        todayMessages.forEach(m => {
          if (m.chatId) activeChatIds.add(m.chatId);
        });

        // Calculate average messages per day (last 30 days)
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const last30DaysMessages = messages.filter(m => m.timestamp >= thirtyDaysAgo);
        const averageMessagesPerDay = Math.round(last30DaysMessages.length / 30);

        const stats: ChatStats = {
          totalMessages: messages.length,
          totalChats: chatIds.size,
          todayMessages: todayMessages.length,
          thisWeekMessages: weekMessages.length,
          thisMonthMessages: monthMessages.length,
          averageMessagesPerDay,
          activeChatsToday: activeChatIds.size,
        };

        console.log('💬 Chat stats updated:', stats);
        callback(stats);
      } catch (error) {
        console.error('❌ Error processing chat stats:', error);
      }
    },
    (error) => {
      console.error('❌ Error in chat stats listener:', error);
    }
  );

  analyticsListeners.set(listenerId, unsubscribe);
  return unsubscribe;
};

// Service để lấy user activity realtime
export const subscribeToUserActivity = (
  callback: (activities: UserActivity[]) => void,
  limitCount: number = 10
): (() => void) => {
  const listenerId = 'user-activity';
  
  // Cleanup existing listener
  if (analyticsListeners.has(listenerId)) {
    analyticsListeners.get(listenerId)?.();
    analyticsListeners.delete(listenerId);
  }

  console.log('🔔 Setting up realtime user activity listener...');

  // Lắng nghe cả messages và users
  const messagesRef = collection(db, 'messages');
  const usersRef = collection(db, 'users');

  let messagesData: any[] = [];
  let usersData: User[] = [];
  let messagesLoaded = false;
  let usersLoaded = false;

  const processActivityData = () => {
    if (!messagesLoaded || !usersLoaded) return;

    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Group messages by sender
      const userMessageCounts = new Map<string, number>();
      const userLastMessage = new Map<string, Date>();

      messagesData.forEach(message => {
        const count = userMessageCounts.get(message.senderId) || 0;
        userMessageCounts.set(message.senderId, count + 1);

        const lastTime = userLastMessage.get(message.senderId);
        if (!lastTime || message.timestamp > lastTime) {
          userLastMessage.set(message.senderId, message.timestamp);
        }
      });

      // Create activity objects
      const activities: UserActivity[] = [];
      
      usersData.forEach(user => {
        const messageCount = userMessageCounts.get(user.id) || 0;
        const lastMessageTime = userLastMessage.get(user.id) || user.createdAt;
        const isActiveToday = lastMessageTime >= todayStart;

        if (messageCount > 0) { // Only include users who have sent messages
          activities.push({
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            userAvatar: user.avatar,
            totalMessages: messageCount,
            lastMessageTime,
            isActiveToday,
          });
        }
      });

      // Sort by total messages and limit
      activities.sort((a, b) => b.totalMessages - a.totalMessages);
      const limitedActivities = activities.slice(0, limitCount);

      console.log(`📊 User activity updated: ${limitedActivities.length} active users`);
      callback(limitedActivities);
    } catch (error) {
      console.error('❌ Error processing user activity:', error);
    }
  };

  // Listen to messages
  const unsubscribeMessages = onSnapshot(
    messagesRef,
    (snapshot: QuerySnapshot<DocumentData>) => {
      messagesData = [];
      snapshot.forEach((doc) => {
        messagesData.push(convertMessageDoc(doc));
      });
      messagesLoaded = true;
      processActivityData();
    },
    (error) => {
      console.error('❌ Error in messages listener for activity:', error);
    }
  );

  // Listen to users
  const unsubscribeUsers = onSnapshot(
    usersRef,
    (snapshot: QuerySnapshot<DocumentData>) => {
      usersData = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        usersData.push({
          id: doc.id,
          name: data.name || '',
          email: data.email || '',
          avatar: data.avatar || '',
          role: data.role || 'USER',
          createdAt: data.createdAt?.toDate() || new Date(),
          lastLogin: data.lastLogin?.toDate() || new Date(),
        });
      });
      usersLoaded = true;
      processActivityData();
    },
    (error) => {
      console.error('❌ Error in users listener for activity:', error);
    }
  );

  // Combine cleanup functions
  const cleanup = () => {
    unsubscribeMessages();
    unsubscribeUsers();
  };

  analyticsListeners.set(listenerId, cleanup);
  return cleanup;
};

// Service để lấy system metrics (mock data, có thể integrate với monitoring service)
export const subscribeToSystemMetrics = (
  callback: (metrics: SystemMetrics) => void
): (() => void) => {
  const listenerId = 'system-metrics';
  
  // Cleanup existing listener
  if (analyticsListeners.has(listenerId)) {
    analyticsListeners.get(listenerId)?.();
    analyticsListeners.delete(listenerId);
  }

  console.log('🔔 Setting up system metrics monitoring...');

  // Simulate system metrics (trong thực tế sẽ lấy từ monitoring service)
  const updateMetrics = () => {
    const metrics: SystemMetrics = {
      uptime: Math.floor(Math.random() * 100), // Mock uptime percentage
      totalInteractions: Math.floor(Math.random() * 10000),
      errorRate: Math.random() * 5, // Mock error rate percentage
      responseTime: Math.floor(Math.random() * 200) + 50, // Mock response time in ms
    };

    callback(metrics);
  };

  // Update metrics every 30 seconds
  updateMetrics(); // Initial call
  const interval = setInterval(updateMetrics, 30000);

  const cleanup = () => {
    clearInterval(interval);
  };

  analyticsListeners.set(listenerId, cleanup);
  return cleanup;
};

// Service để lấy combined dashboard metrics
export const subscribeToDashboardMetrics = (
  callback: (metrics: DashboardMetrics) => void
): (() => void) => {
  const listenerId = 'dashboard-metrics';
  
  // Cleanup existing listener
  if (analyticsListeners.has(listenerId)) {
    analyticsListeners.get(listenerId)?.();
    analyticsListeners.delete(listenerId);
  }

  console.log('🔔 Setting up complete dashboard metrics listener...');

  let userStats: any = null;
  let chatStats: ChatStats | null = null;
  let topActiveUsers: UserActivity[] = [];
  let systemHealth: SystemMetrics | null = null;

  const processMetrics = () => {
    if (userStats && chatStats && systemHealth) {
      const metrics: DashboardMetrics = {
        userStats,
        chatStats,
        topActiveUsers,
        systemHealth,
      };

      callback(metrics);
    }
  };

  // Subscribe to user stats
  const unsubscribeUsers = onSnapshot(
    collection(db, 'users'),
    (snapshot: QuerySnapshot<DocumentData>) => {
      try {
        const users: User[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          users.push({
            id: doc.id,
            name: data.name || '',
            email: data.email || '',
            avatar: data.avatar || '',
            role: data.role || 'USER',
            createdAt: data.createdAt?.toDate() || new Date(),
            lastLogin: data.lastLogin?.toDate() || new Date(),
          });
        });

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const activeThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        userStats = {
          totalUsers: users.length,
          activeUsers: users.filter(u => u.lastLogin >= activeThreshold).length,
          newUsersToday: users.filter(u => u.createdAt >= todayStart).length,
          adminUsers: users.filter(u => u.role === 'ADMIN').length,
        };

        processMetrics();
      } catch (error) {
        console.error('❌ Error processing user stats for dashboard:', error);
      }
    }
  );

  // Subscribe to chat stats
  const unsubscribeChatStats = subscribeToChatStats((stats) => {
    chatStats = stats;
    processMetrics();
  });

  // Subscribe to user activity
  const unsubscribeActivity = subscribeToUserActivity((activities) => {
    topActiveUsers = activities;
    processMetrics();
  });

  // Subscribe to system metrics
  const unsubscribeSystem = subscribeToSystemMetrics((metrics) => {
    systemHealth = metrics;
    processMetrics();
  });

  // Combine cleanup
  const cleanup = () => {
    unsubscribeUsers();
    unsubscribeChatStats();
    unsubscribeActivity();
    unsubscribeSystem();
  };

  analyticsListeners.set(listenerId, cleanup);
  return cleanup;
};

// Service để export data (CSV format)
export const exportUserData = async (): Promise<string> => {
  try {
    console.log('📊 Exporting user data...');
    
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    let csvContent = 'ID,Name,Email,Role,Created At,Last Login\n';
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate().toISOString() || '';
      const lastLogin = data.lastLogin?.toDate().toISOString() || '';
      
      csvContent += `${doc.id},"${data.name || ''}","${data.email || ''}","${data.role || 'USER'}","${createdAt}","${lastLogin}"\n`;
    });

    console.log('✅ User data exported successfully');
    return csvContent;
  } catch (error) {
    console.error('❌ Error exporting user data:', error);
    throw error;
  }
};

// Service để export chat data
export const exportChatData = async (): Promise<string> => {
  try {
    console.log('💬 Exporting chat data...');
    
    const messagesRef = collection(db, 'messages');
    const snapshot = await getDocs(messagesRef);
    
    let csvContent = 'ID,Sender ID,Receiver ID,Text,Timestamp,Status,Chat ID\n';
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const timestamp = data.timestamp?.toDate().toISOString() || '';
      
      csvContent += `${doc.id},"${data.senderId || ''}","${data.receiverId || ''}","${(data.text || '').replace(/"/g, '""')}","${timestamp}","${data.status || 'sent'}","${data.chatId || ''}"\n`;
    });

    console.log('✅ Chat data exported successfully');
    return csvContent;
  } catch (error) {
    console.error('❌ Error exporting chat data:', error);
    throw error;
  }
};

// Cleanup function
export const cleanupAllAnalyticsListeners = (): void => {
  console.log('🧹 Cleaning up all analytics listeners...');
  
  analyticsListeners.forEach((cleanup, listenerId) => {
    console.log(`🧹 Cleaning up analytics listener: ${listenerId}`);
    cleanup();
  });
  
  analyticsListeners.clear();
  console.log('✅ All analytics listeners cleaned up');
};

export default {
  subscribeToChatStats,
  subscribeToUserActivity,
  subscribeToSystemMetrics,
  subscribeToDashboardMetrics,
  exportUserData,
  exportChatData,
  cleanupAllAnalyticsListeners,
};
