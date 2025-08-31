import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  getDocs,
  writeBatch,
  Timestamp,
  DocumentData,
  QuerySnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, UserRole, Message } from '@/types';

// Types for admin operations
export interface AdminAction {
  id: string;
  adminId: string;
  adminName: string;
  action: 'CREATE_USER' | 'UPDATE_USER' | 'DELETE_USER' | 'BULK_UPDATE' | 'DELETE_MESSAGE' | 'BAN_USER' | 'UNBAN_USER' | 'APPROVE_BLUE_TICK' | 'REJECT_BLUE_TICK';
  targetId: string;
  targetType: 'USER' | 'MESSAGE' | 'CHAT';
  details: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface BannedUser extends User {
  bannedAt: Date;
  bannedBy: string;
  banReason: string;
  banDuration?: number; // in days, undefined = permanent
}

export interface ReportedMessage {
  id: string;
  messageId: string;
  message: Message;
  reportedBy: string;
  reportedByName: string;
  reason: string;
  reportedAt: Date;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
}

export interface AdminStats {
  totalActions: number;
  todayActions: number;
  bannedUsers: number;
  reportedMessages: number;
  pendingReports: number;
}

// Cache for admin listeners
const adminListeners = new Map<string, () => void>();

// Utility function to convert admin action doc
const convertAdminActionDoc = (doc: any): AdminAction => {
  const data = doc.data();
  return {
    id: doc.id,
    adminId: data.adminId,
    adminName: data.adminName,
    action: data.action,
    targetId: data.targetId,
    targetType: data.targetType,
    details: data.details,
    timestamp: data.timestamp?.toDate() || new Date(),
    metadata: data.metadata || {},
  };
};

// Service để log admin actions
export const logAdminAction = async (
  adminId: string,
  adminName: string,
  action: AdminAction['action'],
  targetId: string,
  targetType: AdminAction['targetType'],
  details: string,
  metadata?: Record<string, any>
): Promise<void> => {
  try {
    console.log('📝 Logging admin action:', { action, targetId, details });
    
    await addDoc(collection(db, 'adminActions'), {
      adminId,
      adminName,
      action,
      targetId,
      targetType,
      details,
      timestamp: Timestamp.now(),
      metadata: metadata || {},
    });

    console.log('✅ Admin action logged successfully');
  } catch (error) {
    console.error('❌ Error logging admin action:', error);
    throw error;
  }
};

// Service để subscribe admin actions realtime
export const subscribeToAdminActions = (
  callback: (actions: AdminAction[]) => void,
  limitCount: number = 50
): (() => void) => {
  const listenerId = 'admin-actions';
  
  if (adminListeners.has(listenerId)) {
    adminListeners.get(listenerId)?.();
    adminListeners.delete(listenerId);
  }

  console.log('🔔 Setting up realtime admin actions listener...');

  const actionsRef = collection(db, 'adminActions');
  const q = query(
    actionsRef,
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot: QuerySnapshot<DocumentData>) => {
      try {
        const actions: AdminAction[] = [];
        
        snapshot.forEach((doc) => {
          actions.push(convertAdminActionDoc(doc));
        });

        console.log(`📋 Admin actions updated: ${actions.length} actions`);
        callback(actions);
      } catch (error) {
        console.error('❌ Error processing admin actions:', error);
      }
    },
    (error) => {
      console.error('❌ Error in admin actions listener:', error);
    }
  );

  adminListeners.set(listenerId, unsubscribe);
  return unsubscribe;
};

// Service để ban user
export const banUser = async (
  adminId: string,
  adminName: string,
  userId: string,
  reason: string,
  duration?: number // days
): Promise<void> => {
  try {
    console.log('🚫 Banning user:', userId, 'Reason:', reason);
    
    const batch = writeBatch(db);

    // Update user với ban info
    const userRef = doc(db, 'users', userId);
    batch.update(userRef, {
      banned: true,
      bannedAt: Timestamp.now(),
      bannedBy: adminId,
      banReason: reason,
      banDuration: duration,
    });

    // Log admin action
    const actionRef = doc(collection(db, 'adminActions'));
    batch.set(actionRef, {
      adminId,
      adminName,
      action: 'BAN_USER',
      targetId: userId,
      targetType: 'USER',
      details: `Banned user for: ${reason}${duration ? ` (${duration} days)` : ' (permanent)'}`,
      timestamp: Timestamp.now(),
      metadata: { reason, duration },
    });

    await batch.commit();

    console.log('✅ User banned successfully');
  } catch (error) {
    console.error('❌ Error banning user:', error);
    throw error;
  }
};

// Service để unban user
export const unbanUser = async (
  adminId: string,
  adminName: string,
  userId: string
): Promise<void> => {
  try {
    console.log('✅ Unbanning user:', userId);
    
    const batch = writeBatch(db);

    // Remove ban from user
    const userRef = doc(db, 'users', userId);
    batch.update(userRef, {
      banned: false,
      bannedAt: null,
      bannedBy: null,
      banReason: null,
      banDuration: null,
      unbannedAt: Timestamp.now(),
      unbannedBy: adminId,
    });

    // Log admin action
    const actionRef = doc(collection(db, 'adminActions'));
    batch.set(actionRef, {
      adminId,
      adminName,
      action: 'UNBAN_USER',
      targetId: userId,
      targetType: 'USER',
      details: 'User unbanned',
      timestamp: Timestamp.now(),
    });

    await batch.commit();

    console.log('✅ User unbanned successfully');
  } catch (error) {
    console.error('❌ Error unbanning user:', error);
    throw error;
  }
};

// Service để subscribe banned users
export const subscribeToBannedUsers = (
  callback: (users: BannedUser[]) => void
): (() => void) => {
  const listenerId = 'banned-users';
  
  if (adminListeners.has(listenerId)) {
    adminListeners.get(listenerId)?.();
    adminListeners.delete(listenerId);
  }

  console.log('🔔 Setting up realtime banned users listener...');

  const usersRef = collection(db, 'users');
  const q = query(
    usersRef,
    where('banned', '==', true),
    orderBy('bannedAt', 'desc')
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot: QuerySnapshot<DocumentData>) => {
      try {
        const bannedUsers: BannedUser[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          bannedUsers.push({
            id: doc.id,
            name: data.name || '',
            email: data.email || '',
            avatar: data.avatar || '',
            role: data.role || 'USER',
            createdAt: data.createdAt?.toDate() || new Date(),
            lastLogin: data.lastLogin?.toDate() || new Date(),
            bannedAt: data.bannedAt?.toDate() || new Date(),
            bannedBy: data.bannedBy || '',
            banReason: data.banReason || '',
            banDuration: data.banDuration,
          });
        });

        console.log(`🚫 Banned users updated: ${bannedUsers.length} users`);
        callback(bannedUsers);
      } catch (error) {
        console.error('❌ Error processing banned users:', error);
      }
    },
    (error) => {
      console.error('❌ Error in banned users listener:', error);
    }
  );

  adminListeners.set(listenerId, unsubscribe);
  return unsubscribe;
};

// Service để delete message (admin)
export const deleteMessage = async (
  adminId: string,
  adminName: string,
  messageId: string,
  reason: string
): Promise<void> => {
  try {
    console.log('🗑️ Admin deleting message:', messageId);
    
    const batch = writeBatch(db);

    // Delete message
    const messageRef = doc(db, 'messages', messageId);
    batch.delete(messageRef);

    // Log admin action
    const actionRef = doc(collection(db, 'adminActions'));
    batch.set(actionRef, {
      adminId,
      adminName,
      action: 'DELETE_MESSAGE',
      targetId: messageId,
      targetType: 'MESSAGE',
      details: `Message deleted for: ${reason}`,
      timestamp: Timestamp.now(),
      metadata: { reason },
    });

    await batch.commit();

    console.log('✅ Message deleted successfully');
  } catch (error) {
    console.error('❌ Error deleting message:', error);
    throw error;
  }
};

// Service để report message
export const reportMessage = async (
  messageId: string,
  reportedBy: string,
  reportedByName: string,
  reason: string
): Promise<void> => {
  try {
    console.log('🚨 Reporting message:', messageId);
    
    await addDoc(collection(db, 'reportedMessages'), {
      messageId,
      reportedBy,
      reportedByName,
      reason,
      reportedAt: Timestamp.now(),
      status: 'PENDING',
    });

    console.log('✅ Message reported successfully');
  } catch (error) {
    console.error('❌ Error reporting message:', error);
    throw error;
  }
};

// Service để subscribe reported messages
export const subscribeToReportedMessages = (
  callback: (reports: ReportedMessage[]) => void
): (() => void) => {
  const listenerId = 'reported-messages';
  
  if (adminListeners.has(listenerId)) {
    adminListeners.get(listenerId)?.();
    adminListeners.delete(listenerId);
  }

  console.log('🔔 Setting up realtime reported messages listener...');

  const reportsRef = collection(db, 'reportedMessages');
  const q = query(
    reportsRef,
    orderBy('reportedAt', 'desc')
  );

  const unsubscribe = onSnapshot(
    q,
    async (snapshot: QuerySnapshot<DocumentData>) => {
      try {
        const reports: ReportedMessage[] = [];
        
        // Get all message IDs to fetch message details
        const messageIds = new Set<string>();
        snapshot.forEach((doc) => {
          const data = doc.data();
          messageIds.add(data.messageId);
        });

        // Fetch message details
        const messageDetails = new Map<string, Message>();
        if (messageIds.size > 0) {
          const messagesRef = collection(db, 'messages');
          const messagesSnapshot = await getDocs(messagesRef);
          
          messagesSnapshot.forEach((doc) => {
            if (messageIds.has(doc.id)) {
              const data = doc.data();
              messageDetails.set(doc.id, {
                id: doc.id,
                text: data.text,
                senderId: data.senderId,
                receiverId: data.receiverId,
                timestamp: data.timestamp?.toDate() || new Date(),
                status: data.status || 'sent',
                chatId: data.chatId,
              });
            }
          });
        }

        snapshot.forEach((doc) => {
          const data = doc.data();
          const message = messageDetails.get(data.messageId);
          
          if (message) {
            reports.push({
              id: doc.id,
              messageId: data.messageId,
              message,
              reportedBy: data.reportedBy,
              reportedByName: data.reportedByName,
              reason: data.reason,
              reportedAt: data.reportedAt?.toDate() || new Date(),
              status: data.status || 'PENDING',
              reviewedBy: data.reviewedBy,
              reviewedAt: data.reviewedAt?.toDate(),
              reviewNotes: data.reviewNotes,
            });
          }
        });

        console.log(`🚨 Reported messages updated: ${reports.length} reports`);
        callback(reports);
      } catch (error) {
        console.error('❌ Error processing reported messages:', error);
      }
    },
    (error) => {
      console.error('❌ Error in reported messages listener:', error);
    }
  );

  adminListeners.set(listenerId, unsubscribe);
  return unsubscribe;
};

// Service để review reported message
export const reviewReportedMessage = async (
  reportId: string,
  adminId: string,
  adminName: string,
  status: 'REVIEWED' | 'RESOLVED' | 'DISMISSED',
  notes?: string
): Promise<void> => {
  try {
    console.log('👀 Reviewing reported message:', reportId);
    
    await updateDoc(doc(db, 'reportedMessages', reportId), {
      status,
      reviewedBy: adminId,
      reviewedAt: Timestamp.now(),
      reviewNotes: notes || '',
    });

    // Log admin action
    await logAdminAction(
      adminId,
      adminName,
      'REVIEW_REPORT' as any,
      reportId,
      'MESSAGE',
      `Report ${status.toLowerCase()}: ${notes || 'No notes'}`,
      { status, notes }
    );

    console.log('✅ Report reviewed successfully');
  } catch (error) {
    console.error('❌ Error reviewing report:', error);
    throw error;
  }
};

// Service để get admin stats
export const subscribeToAdminStats = (
  callback: (stats: AdminStats) => void
): (() => void) => {
  const listenerId = 'admin-stats';
  
  if (adminListeners.has(listenerId)) {
    adminListeners.get(listenerId)?.();
    adminListeners.delete(listenerId);
  }

  console.log('🔔 Setting up realtime admin stats listener...');

  let actionsData: AdminAction[] = [];
  let bannedData: BannedUser[] = [];
  let reportsData: ReportedMessage[] = [];
  let actionsLoaded = false;
  let bannedLoaded = false;
  let reportsLoaded = false;

  const processStats = () => {
    if (!actionsLoaded || !bannedLoaded || !reportsLoaded) return;

    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const stats: AdminStats = {
        totalActions: actionsData.length,
        todayActions: actionsData.filter(a => a.timestamp >= todayStart).length,
        bannedUsers: bannedData.length,
        reportedMessages: reportsData.length,
        pendingReports: reportsData.filter(r => r.status === 'PENDING').length,
      };

      callback(stats);
    } catch (error) {
      console.error('❌ Error processing admin stats:', error);
    }
  };

  // Subscribe to admin actions
  const unsubscribeActions = subscribeToAdminActions((actions) => {
    actionsData = actions;
    actionsLoaded = true;
    processStats();
  });

  // Subscribe to banned users
  const unsubscribeBanned = subscribeToBannedUsers((users) => {
    bannedData = users;
    bannedLoaded = true;
    processStats();
  });

  // Subscribe to reported messages
  const unsubscribeReports = subscribeToReportedMessages((reports) => {
    reportsData = reports;
    reportsLoaded = true;
    processStats();
  });

  const cleanup = () => {
    unsubscribeActions();
    unsubscribeBanned();
    unsubscribeReports();
  };

  adminListeners.set(listenerId, cleanup);
  return cleanup;
};

// Service để bulk actions với users
export const bulkUserAction = async (
  adminId: string,
  adminName: string,
  userIds: string[],
  action: 'BAN' | 'UNBAN' | 'DELETE' | 'UPDATE_ROLE',
  data?: {
    reason?: string;
    duration?: number;
    newRole?: UserRole;
  }
): Promise<void> => {
  try {
    console.log(`📦 Bulk ${action} for ${userIds.length} users`);
    
    const batch = writeBatch(db);
    
    userIds.forEach((userId) => {
      const userRef = doc(db, 'users', userId);
      
      switch (action) {
        case 'BAN':
          batch.update(userRef, {
            banned: true,
            bannedAt: Timestamp.now(),
            bannedBy: adminId,
            banReason: data?.reason || 'Bulk ban',
            banDuration: data?.duration,
          });
          break;
          
        case 'UNBAN':
          batch.update(userRef, {
            banned: false,
            bannedAt: null,
            bannedBy: null,
            banReason: null,
            banDuration: null,
            unbannedAt: Timestamp.now(),
            unbannedBy: adminId,
          });
          break;
          
        case 'DELETE':
          batch.delete(userRef);
          break;
          
        case 'UPDATE_ROLE':
          if (data?.newRole) {
            batch.update(userRef, {
              role: data.newRole,
              updatedAt: Timestamp.now(),
              updatedBy: adminId,
            });
          }
          break;
      }
    });

    // Log bulk action
    const actionRef = doc(collection(db, 'adminActions'));
    batch.set(actionRef, {
      adminId,
      adminName,
      action: 'BULK_UPDATE',
      targetId: 'MULTIPLE',
      targetType: 'USER',
      details: `Bulk ${action} for ${userIds.length} users`,
      timestamp: Timestamp.now(),
      metadata: { action, userIds, ...data },
    });

    await batch.commit();

    console.log(`✅ Bulk ${action} completed successfully`);
  } catch (error) {
    console.error(`❌ Error in bulk ${action}:`, error);
    throw error;
  }
};

// Cleanup function
export const cleanupAllAdminListeners = (): void => {
  console.log('🧹 Cleaning up all admin listeners...');
  
  adminListeners.forEach((cleanup, listenerId) => {
    console.log(`🧹 Cleaning up admin listener: ${listenerId}`);
    cleanup();
  });
  
  adminListeners.clear();
  console.log('✅ All admin listeners cleaned up');
};

export default {
  logAdminAction,
  subscribeToAdminActions,
  banUser,
  unbanUser,
  subscribeToBannedUsers,
  deleteMessage,
  reportMessage,
  subscribeToReportedMessages,
  reviewReportedMessage,
  subscribeToAdminStats,
  bulkUserAction,
  cleanupAllAdminListeners,
};
