'use client';

import { useEffect, useState } from 'react';
import { 
  subscribeToUserStats, 
  subscribeToRecentUsers, 
  DashboardStats as UserStats, 
  RecentUser 
} from '@/lib/userService';
import { 
  subscribeToChatStats, 
  subscribeToUserActivity, 
  ChatStats, 
  UserActivity 
} from '@/lib/dashboardService';

interface DashboardStats extends UserStats {
  recentUsers: RecentUser[];
  chatStats?: ChatStats;
  topActiveUsers?: UserActivity[];
}

export default function AdminDashboardFeature() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalAdmins: 0,
    totalRegularUsers: 0,
    activeUsers: 0,
    todayRegistrations: 0,
    thisWeekRegistrations: 0,
    thisMonthRegistrations: 0,
    recentUsers: [],
  });
  const [chatStats, setChatStats] = useState<ChatStats | null>(null);
  const [topActiveUsers, setTopActiveUsers] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🚀 Setting up admin dashboard realtime listeners...');
    
    // Subscribe to user stats
    const unsubscribeUserStats = subscribeToUserStats((userStats) => {
      console.log('📊 User stats updated:', userStats);
      setStats(prev => ({ ...prev, ...userStats }));
      setLoading(false);
    });

    // Subscribe to recent users
    const unsubscribeRecentUsers = subscribeToRecentUsers((recentUsers) => {
      console.log('👥 Recent users updated:', recentUsers.length);
      setStats(prev => ({ ...prev, recentUsers }));
    }, 5);

    // Subscribe to chat stats
    const unsubscribeChatStats = subscribeToChatStats((stats) => {
      console.log('💬 Chat stats updated:', stats);
      setChatStats(stats);
    });

    // Subscribe to top active users
    const unsubscribeActiveUsers = subscribeToUserActivity((users) => {
      console.log('🏆 Top active users updated:', users.length);
      setTopActiveUsers(users);
    }, 5);

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up admin dashboard listeners...');
      unsubscribeUserStats();
      unsubscribeRecentUsers();
      unsubscribeChatStats();
      unsubscribeActiveUsers();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Tổng quan về hệ thống Chat App - Dữ liệu realtime
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tổng người dùng
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalUsers}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Người dùng hoạt động (24h)
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.activeUsers}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Admins */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Quản trị viên
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalAdmins}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Today Registrations */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Đăng ký hôm nay
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.todayRegistrations}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Stats */}
      {chatStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Tổng tin nhắn
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {chatStats.totalMessages}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h8V4a2 2 0 012 2v2z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Tin nhắn hôm nay
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {chatStats.todayMessages}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Chat hoạt động hôm nay
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {chatStats.activeChatsToday}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Người dùng mới nhất
            </h3>
            <div className="flow-root">
              <ul className="-my-5 divide-y divide-gray-200">
                {stats.recentUsers.map((user) => (
                  <li key={user.id} className="py-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {user.avatar ? (
                          <img className="h-8 w-8 rounded-full" src={user.avatar} alt={user.name} />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {user.name[0]?.toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate flex items-center">
                          {user.name}
                          {user.isNew && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Mới
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'ADMIN' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role === 'ADMIN' ? 'Admin' : 'User'}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Top Active Users */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Người dùng hoạt động nhất
            </h3>
            <div className="flow-root">
              <ul className="-my-5 divide-y divide-gray-200">
                {topActiveUsers.map((userActivity, index) => (
                  <li key={userActivity.userId} className="py-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 flex items-center">
                        <span className="text-lg font-bold text-gray-400 mr-2">
                          #{index + 1}
                        </span>
                        {userActivity.userAvatar ? (
                          <img className="h-8 w-8 rounded-full" src={userActivity.userAvatar} alt={userActivity.userName} />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {userActivity.userName[0]?.toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate flex items-center">
                          {userActivity.userName}
                          {userActivity.isActiveToday && (
                            <span className="ml-2 w-2 h-2 bg-green-400 rounded-full"></span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {userActivity.totalMessages} tin nhắn
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="text-xs text-gray-400">
                          {userActivity.lastMessageTime.toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
