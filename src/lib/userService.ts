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
  Timestamp,
  DocumentData,
  QuerySnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, UserRole } from '@/types';

// Types for dashboard
export interface DashboardStats {
  totalUsers: number;
  totalAdmins: number;
  totalRegularUsers: number;
  activeUsers: number;
  todayRegistrations: number;
  thisWeekRegistrations: number;
  thisMonthRegistrations: number;
}

export interface RecentUser extends User {
  isNew?: boolean;
}

// Cache để tránh duplicate listeners
const activeListeners = new Map<string, () => void>();

// Utility function để convert Firestore document thành User object
const convertDocToUser = (doc: any): User => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name || '',
    email: data.email || '',
    avatar: data.avatar || '',
    role: data.role || 'USER',
    createdAt: data.createdAt?.toDate() || new Date(),
    lastLogin: data.lastLogin?.toDate() || new Date(),
  };
};

// Service để lấy stats dashboard realtime
export const subscribeToUserStats = (
  callback: (stats: DashboardStats) => void
): (() => void) => {
  const listenerId = 'dashboard-stats';
  
  // Cleanup existing listener nếu có
  if (activeListeners.has(listenerId)) {
    activeListeners.get(listenerId)?.();
    activeListeners.delete(listenerId);
  }

  console.log('🔔 Setting up realtime dashboard stats listener...');

  const usersRef = collection(db, 'users');
  
  const unsubscribe = onSnapshot(
    usersRef,
    (snapshot: QuerySnapshot<DocumentData>) => {
      try {
        const users: User[] = [];
        
        snapshot.forEach((doc) => {
          users.push(convertDocToUser(doc));
        });

        // Tính toán stats
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const activeThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

        const stats: DashboardStats = {
          totalUsers: users.length,
          totalAdmins: users.filter(user => user.role === 'ADMIN').length,
          totalRegularUsers: users.filter(user => user.role === 'USER').length,
          activeUsers: users.filter(user => user.lastLogin >= activeThreshold).length,
          todayRegistrations: users.filter(user => user.createdAt >= todayStart).length,
          thisWeekRegistrations: users.filter(user => user.createdAt >= weekStart).length,
          thisMonthRegistrations: users.filter(user => user.createdAt >= monthStart).length,
        };

        console.log('📊 Dashboard stats updated:', stats);
        callback(stats);
      } catch (error) {
        console.error('❌ Error processing user stats:', error);
      }
    },
    (error) => {
      console.error('❌ Error in user stats listener:', error);
    }
  );

  activeListeners.set(listenerId, unsubscribe);
  return unsubscribe;
};

// Service để lấy recent users realtime
export const subscribeToRecentUsers = (
  callback: (users: RecentUser[]) => void,
  limitCount: number = 10
): (() => void) => {
  const listenerId = 'recent-users';
  
  // Cleanup existing listener nếu có
  if (activeListeners.has(listenerId)) {
    activeListeners.get(listenerId)?.();
    activeListeners.delete(listenerId);
  }

  console.log('🔔 Setting up realtime recent users listener...');

  const usersRef = collection(db, 'users');
  const q = query(
    usersRef,
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot: QuerySnapshot<DocumentData>) => {
      try {
        const users: RecentUser[] = [];
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        snapshot.forEach((doc) => {
          const user = convertDocToUser(doc);
          // Mark as new if registered today
          const recentUser: RecentUser = {
            ...user,
            isNew: user.createdAt >= todayStart
          };
          users.push(recentUser);
        });

        console.log(`👥 Recent users updated: ${users.length} users`);
        callback(users);
      } catch (error) {
        console.error('❌ Error processing recent users:', error);
      }
    },
    (error) => {
      console.error('❌ Error in recent users listener:', error);
    }
  );

  activeListeners.set(listenerId, unsubscribe);
  return unsubscribe;
};

// Service để lấy all users realtime với search và filter
export const subscribeToUsers = (
  callback: (users: User[]) => void,
  options?: {
    searchTerm?: string;
    roleFilter?: 'ALL' | UserRole;
    sortBy?: 'name' | 'email' | 'createdAt' | 'lastLogin';
    sortOrder?: 'asc' | 'desc';
  }
): (() => void) => {
  const listenerId = 'all-users';
  
  // Cleanup existing listener nếu có
  if (activeListeners.has(listenerId)) {
    activeListeners.get(listenerId)?.();
    activeListeners.delete(listenerId);
  }

  console.log('🔔 Setting up realtime users listener with options:', options);

  const usersRef = collection(db, 'users');
  let q = query(usersRef);

  // Apply role filter in query if specified
  if (options?.roleFilter && options.roleFilter !== 'ALL') {
    q = query(q, where('role', '==', options.roleFilter));
  }

  // Apply sorting
  if (options?.sortBy) {
    const order = options.sortOrder || 'asc';
    q = query(q, orderBy(options.sortBy, order));
  } else {
    // Default sort by creation date
    q = query(q, orderBy('createdAt', 'desc'));
  }

  const unsubscribe = onSnapshot(
    q,
    (snapshot: QuerySnapshot<DocumentData>) => {
      try {
        let users: User[] = [];
        
        snapshot.forEach((doc) => {
          users.push(convertDocToUser(doc));
        });

        // Apply search filter on client side (since Firestore doesn't support text search)
        if (options?.searchTerm && options.searchTerm.trim()) {
          const searchLower = options.searchTerm.toLowerCase().trim();
          users = users.filter(user => 
            user.name.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower)
          );
        }

        console.log(`👥 Users updated: ${users.length} users (filtered)`);
        callback(users);
      } catch (error) {
        console.error('❌ Error processing users:', error);
      }
    },
    (error) => {
      console.error('❌ Error in users listener:', error);
    }
  );

  activeListeners.set(listenerId, unsubscribe);
  return unsubscribe;
};

// Service để tạo user mới
export const createUser = async (userData: {
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}): Promise<string> => {
  try {
    console.log('👤 Creating new user:', userData.email);
    
    const docRef = await addDoc(collection(db, 'users'), {
      name: userData.name,
      email: userData.email,
      role: userData.role,
      avatar: userData.avatar || '',
      createdAt: Timestamp.now(),
      lastLogin: Timestamp.now(),
    });

    console.log('✅ User created successfully:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating user:', error);
    throw error;
  }
};

// Service để update user
export const updateUser = async (
  userId: string, 
  updates: Partial<{
    name: string;
    email: string;
    role: UserRole;
    avatar: string;
  }>
): Promise<void> => {
  try {
    console.log('📝 Updating user:', userId, updates);
    
    await updateDoc(doc(db, 'users', userId), {
      ...updates,
      updatedAt: Timestamp.now(),
    });

    console.log('✅ User updated successfully');
  } catch (error) {
    console.error('❌ Error updating user:', error);
    throw error;
  }
};

// Service để delete user
export const deleteUser = async (userId: string): Promise<void> => {
  try {
    console.log('🗑️ Deleting user:', userId);
    
    await deleteDoc(doc(db, 'users', userId));

    console.log('✅ User deleted successfully');
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    throw error;
  }
};

// Service để bulk update users
export const bulkUpdateUsers = async (
  userIds: string[],
  updates: Partial<{
    role: UserRole;
    avatar: string;
  }>
): Promise<void> => {
  try {
    console.log('📦 Bulk updating users:', userIds.length, 'users');
    
    const promises = userIds.map(userId => 
      updateDoc(doc(db, 'users', userId), {
        ...updates,
        updatedAt: Timestamp.now(),
      })
    );

    await Promise.all(promises);

    console.log('✅ Bulk update completed successfully');
  } catch (error) {
    console.error('❌ Error in bulk update:', error);
    throw error;
  }
};

// Service để search users (không realtime)
export const searchUsers = async (
  searchTerm: string,
  options?: {
    roleFilter?: UserRole;
    limit?: number;
  }
): Promise<User[]> => {
  try {
    console.log('🔍 Searching users:', searchTerm);
    
    const usersRef = collection(db, 'users');
    let q = query(usersRef);

    // Apply role filter if specified
    if (options?.roleFilter) {
      q = query(q, where('role', '==', options.roleFilter));
    }

    // Apply limit
    if (options?.limit) {
      q = query(q, limit(options.limit));
    }

    const snapshot = await getDocs(q);
    let users: User[] = [];
    
    snapshot.forEach((doc) => {
      users.push(convertDocToUser(doc));
    });

    // Filter by search term on client side
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      users = users.filter(user => 
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    }

    console.log(`🔍 Search completed: ${users.length} users found`);
    return users;
  } catch (error) {
    console.error('❌ Error searching users:', error);
    throw error;
  }
};

// Service để get single user by ID
export const subscribeToUser = (
  userId: string,
  callback: (user: User | null) => void
): (() => void) => {
  const listenerId = `user-${userId}`;
  
  // Cleanup existing listener nếu có
  if (activeListeners.has(listenerId)) {
    activeListeners.get(listenerId)?.();
    activeListeners.delete(listenerId);
  }

  console.log('🔔 Setting up realtime user listener for:', userId);

  const userDoc = doc(db, 'users', userId);

  const unsubscribe = onSnapshot(
    userDoc,
    (doc) => {
      try {
        if (doc.exists()) {
          const user = convertDocToUser(doc);
          callback(user);
        } else {
          callback(null);
        }
      } catch (error) {
        console.error('❌ Error processing user:', error);
        callback(null);
      }
    },
    (error) => {
      console.error('❌ Error in user listener:', error);
      callback(null);
    }
  );

  activeListeners.set(listenerId, unsubscribe);
  return unsubscribe;
};

// Cleanup function để dọn dẹp tất cả listeners
export const cleanupAllUserListeners = (): void => {
  console.log('🧹 Cleaning up all user service listeners...');
  
  activeListeners.forEach((unsubscribe, listenerId) => {
    console.log(`🧹 Cleaning up listener: ${listenerId}`);
    unsubscribe();
  });
  
  activeListeners.clear();
  console.log('✅ All user service listeners cleaned up');
};

// Export tất cả functions
export default {
  subscribeToUserStats,
  subscribeToRecentUsers,
  subscribeToUsers,
  subscribeToUser,
  createUser,
  updateUser,
  deleteUser,
  bulkUpdateUsers,
  searchUsers,
  cleanupAllUserListeners,
};
