import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  Timestamp,
  DocumentData,
  QuerySnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, BlueTick, BlueTickStatus } from '@/types';
import { logAdminAction } from './adminService';

// Cache for blue tick listeners
const blueTickListeners = new Map<string, () => void>();

// Service để request blue tick
export const requestBlueTick = async (
  userId: string,
  reason: string
): Promise<void> => {
  try {
    console.log('📝 Requesting blue tick for user:', userId);
    
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      blueTick: {
        status: 'PENDING',
        reason: reason.trim(),
        requestedAt: Timestamp.now(),
      }
    });

    console.log('✅ Blue tick request submitted successfully');
  } catch (error) {
    console.error('❌ Error requesting blue tick:', error);
    throw error;
  }
};

// Service để admin approve/reject blue tick
export const processBlueTick = async (
  userId: string,
  adminId: string,
  adminName: string,
  status: 'VERIFIED' | 'REJECTED',
  processedReason?: string
): Promise<void> => {
  try {
    console.log(`📝 Processing blue tick for user ${userId}: ${status}`);
    
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      blueTick: {
        status,
        processedBy: adminId,
        processedAt: Timestamp.now(),
        processedReason: processedReason || '',
      }
    });

    // Log admin action
    await logAdminAction(
      adminId,
      adminName,
      status === 'VERIFIED' ? 'APPROVE_BLUE_TICK' : 'REJECT_BLUE_TICK',
      userId,
      'USER',
      `${status === 'VERIFIED' ? 'Approved' : 'Rejected'} blue tick request${processedReason ? ': ' + processedReason : ''}`,
      { status, processedReason }
    );

    console.log('✅ Blue tick processed successfully');
  } catch (error) {
    console.error('❌ Error processing blue tick:', error);
    throw error;
  }
};

// Service để subscribe pending blue tick requests
export const subscribeToPendingBlueTickRequests = (
  callback: (users: User[]) => void
): (() => void) => {
  const listenerId = 'pending-blue-tick-requests';
  
  if (blueTickListeners.has(listenerId)) {
    blueTickListeners.get(listenerId)?.();
    blueTickListeners.delete(listenerId);
  }

  console.log('🔔 Setting up realtime pending blue tick requests listener...');

  const usersRef = collection(db, 'users');
  const q = query(
    usersRef,
    where('blueTick.status', '==', 'PENDING'),
    orderBy('blueTick.requestedAt', 'desc')
  );

  const unsubscribe = onSnapshot(
    q,
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
            blueTick: {
              status: data.blueTick?.status || 'PENDING',
              reason: data.blueTick?.reason || '',
              requestedAt: data.blueTick?.requestedAt?.toDate() || new Date(),
              processedBy: data.blueTick?.processedBy,
              processedAt: data.blueTick?.processedAt?.toDate(),
              processedReason: data.blueTick?.processedReason,
            },
            createdAt: data.createdAt?.toDate() || new Date(),
            lastLogin: data.lastLogin?.toDate() || new Date(),
          });
        });

        console.log(`📋 Pending blue tick requests updated: ${users.length} requests`);
        callback(users);
      } catch (error) {
        console.error('❌ Error processing pending blue tick requests:', error);
      }
    },
    (error) => {
      console.error('❌ Error in pending blue tick requests listener:', error);
    }
  );

  blueTickListeners.set(listenerId, unsubscribe);
  return unsubscribe;
};

// Service để subscribe processed blue tick requests
export const subscribeToProcessedBlueTickRequests = (
  callback: (users: User[]) => void
): (() => void) => {
  const listenerId = 'processed-blue-tick-requests';
  
  if (blueTickListeners.has(listenerId)) {
    blueTickListeners.get(listenerId)?.();
    blueTickListeners.delete(listenerId);
  }

  console.log('🔔 Setting up realtime processed blue tick requests listener...');

  const usersRef = collection(db, 'users');
  const q = query(
    usersRef,
    where('blueTick.status', 'in', ['VERIFIED', 'REJECTED']),
    orderBy('blueTick.processedAt', 'desc')
  );

  const unsubscribe = onSnapshot(
    q,
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
            blueTick: {
              status: data.blueTick?.status || 'PENDING',
              reason: data.blueTick?.reason || '',
              requestedAt: data.blueTick?.requestedAt?.toDate() || new Date(),
              processedBy: data.blueTick?.processedBy,
              processedAt: data.blueTick?.processedAt?.toDate(),
              processedReason: data.blueTick?.processedReason,
            },
            createdAt: data.createdAt?.toDate() || new Date(),
            lastLogin: data.lastLogin?.toDate() || new Date(),
          });
        });

        console.log(`📋 Processed blue tick requests updated: ${users.length} requests`);
        callback(users);
      } catch (error) {
        console.error('❌ Error processing processed blue tick requests:', error);
      }
    },
    (error) => {
      console.error('❌ Error in processed blue tick requests listener:', error);
    }
  );

  blueTickListeners.set(listenerId, unsubscribe);
  return unsubscribe;
};

// Service để get blue tick stats
export const subscribeToBlueTickStats = (
  callback: (stats: {
    totalRequests: number;
    pendingRequests: number;
    verifiedRequests: number;
    rejectedRequests: number;
    todayRequests: number;
  }) => void
): (() => void) => {
  const listenerId = 'blue-tick-stats';
  
  if (blueTickListeners.has(listenerId)) {
    blueTickListeners.get(listenerId)?.();
    blueTickListeners.delete(listenerId);
  }

  console.log('🔔 Setting up realtime blue tick stats listener...');

  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('blueTick.status', '!=', null));

  const unsubscribe = onSnapshot(
    q,
    (snapshot: QuerySnapshot<DocumentData>) => {
      try {
        const users: User[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.blueTick) {
            users.push({
              id: doc.id,
              name: data.name || '',
              email: data.email || '',
              avatar: data.avatar || '',
              role: data.role || 'USER',
              blueTick: {
                status: data.blueTick.status,
                reason: data.blueTick.reason || '',
                requestedAt: data.blueTick.requestedAt?.toDate() || new Date(),
                processedBy: data.blueTick.processedBy,
                processedAt: data.blueTick.processedAt?.toDate(),
                processedReason: data.blueTick.processedReason,
              },
              createdAt: data.createdAt?.toDate() || new Date(),
              lastLogin: data.lastLogin?.toDate() || new Date(),
            });
          }
        });

        // Calculate stats
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const stats = {
          totalRequests: users.length,
          pendingRequests: users.filter(u => u.blueTick?.status === 'PENDING').length,
          verifiedRequests: users.filter(u => u.blueTick?.status === 'VERIFIED').length,
          rejectedRequests: users.filter(u => u.blueTick?.status === 'REJECTED').length,
          todayRequests: users.filter(u => u.blueTick?.requestedAt && u.blueTick.requestedAt >= todayStart).length,
        };

        console.log('📊 Blue tick stats updated:', stats);
        callback(stats);
      } catch (error) {
        console.error('❌ Error processing blue tick stats:', error);
      }
    },
    (error) => {
      console.error('❌ Error in blue tick stats listener:', error);
    }
  );

  blueTickListeners.set(listenerId, unsubscribe);
  return unsubscribe;
};

// Cleanup function
export const cleanupAllBlueTickListeners = (): void => {
  console.log('🧹 Cleaning up all blue tick listeners...');
  
  blueTickListeners.forEach((cleanup, listenerId) => {
    console.log(`🧹 Cleaning up blue tick listener: ${listenerId}`);
    cleanup();
  });
  
  blueTickListeners.clear();
  console.log('✅ All blue tick listeners cleaned up');
};

export default {
  requestBlueTick,
  processBlueTick,
  subscribeToPendingBlueTickRequests,
  subscribeToProcessedBlueTickRequests,
  subscribeToBlueTickStats,
  cleanupAllBlueTickListeners,
};
