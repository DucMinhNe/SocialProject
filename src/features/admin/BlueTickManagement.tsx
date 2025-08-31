'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { 
  subscribeToPendingBlueTickRequests,
  subscribeToProcessedBlueTickRequests,
  subscribeToBlueTickStats,
  processBlueTick
} from '@/lib/blueTickService';
import { User } from '@/types';
import BlueTickBadge from '@/components/BlueTickBadge';

interface BlueTickManagementProps {
  activeTab: 'pending' | 'processed';
  onTabChange: (tab: 'pending' | 'processed') => void;
}

export default function BlueTickManagement({ activeTab, onTabChange }: BlueTickManagementProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [pendingRequests, setPendingRequests] = useState<User[]>([]);
  const [processedRequests, setProcessedRequests] = useState<User[]>([]);
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    verifiedRequests: 0,
    rejectedRequests: 0,
    todayRequests: 0,
  });
  const [loading, setLoading] = useState(true);
  const [processingUser, setProcessingUser] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processAction, setProcessAction] = useState<'VERIFIED' | 'REJECTED'>('VERIFIED');
  const [processReason, setProcessReason] = useState('');

  // Get current user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to data
  useEffect(() => {
    const unsubscribePending = subscribeToPendingBlueTickRequests((requests) => {
      setPendingRequests(requests);
      setLoading(false);
    });

    const unsubscribeProcessed = subscribeToProcessedBlueTickRequests((requests) => {
      setProcessedRequests(requests);
    });

    const unsubscribeStats = subscribeToBlueTickStats((statsData) => {
      setStats(statsData);
    });

    return () => {
      unsubscribePending();
      unsubscribeProcessed();
      unsubscribeStats();
    };
  }, []);

  const handleProcessRequest = async () => {
    if (!selectedUser || !currentUser) return;

    setProcessingUser(selectedUser.id);

    try {
      await processBlueTick(
        selectedUser.id,
        currentUser.uid,
        currentUser.displayName || currentUser.email || 'Admin',
        processAction,
        processReason.trim()
      );

      setShowProcessModal(false);
      setSelectedUser(null);
      setProcessReason('');
    } catch (error) {
      console.error('Error processing blue tick:', error);
      alert('Có lỗi xảy ra khi xử lý yêu cầu');
    } finally {
      setProcessingUser(null);
    }
  };

  const openProcessModal = (user: User, action: 'VERIFIED' | 'REJECTED') => {
    setSelectedUser(user);
    setProcessAction(action);
    setProcessReason('');
    setShowProcessModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý tick xanh</h1>
        <p className="mt-1 text-sm text-gray-600">
          Xét duyệt và quản lý yêu cầu tick xanh từ người dùng
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Tổng yêu cầu</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalRequests}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Chờ duyệt</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.pendingRequests}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Đã duyệt</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.verifiedRequests}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Từ chối</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.rejectedRequests}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Hôm nay</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.todayRequests}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex flex-wrap gap-2 sm:gap-0 sm:space-x-8">
          <button
            onClick={() => onTabChange('pending')}
            className={`py-2 px-3 sm:px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'pending'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Chờ duyệt ({stats.pendingRequests})
          </button>
          <button
            onClick={() => onTabChange('processed')}
            className={`py-2 px-3 sm:px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'processed'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Đã xử lý ({stats.verifiedRequests + stats.rejectedRequests})
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'pending' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Yêu cầu chờ duyệt
            </h3>
            
            {pendingRequests.length > 0 ? (
              <div className="space-y-4">
                {pendingRequests.map((user) => (
                  <div key={user.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {user.avatar ? (
                            <img className="h-12 w-12 rounded-full" src={user.avatar} alt={user.name} />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-gray-400 flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                {user.name[0]?.toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              Chờ duyệt
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          <p className="text-xs text-gray-400">
                            Gửi lúc: {user.blueTick?.requestedAt.toLocaleString('vi-VN')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openProcessModal(user, 'VERIFIED')}
                          disabled={processingUser === user.id}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50"
                        >
                          Duyệt
                        </button>
                        <button
                          onClick={() => openProcessModal(user, 'REJECTED')}
                          disabled={processingUser === user.id}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50"
                        >
                          Từ chối
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-700">
                        <strong>Lý do:</strong> {user.blueTick?.reason}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Không có yêu cầu nào đang chờ duyệt</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'processed' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Yêu cầu đã xử lý
            </h3>
            
            {processedRequests.length > 0 ? (
              <div className="space-y-4">
                {processedRequests.map((user) => (
                  <div key={user.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0 relative">
                          {user.avatar ? (
                            <img className="h-12 w-12 rounded-full" src={user.avatar} alt={user.name} />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-gray-400 flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                {user.name[0]?.toUpperCase()}
                              </span>
                            </div>
                          )}
                          {user.blueTick?.status === 'VERIFIED' && (
                            <div className="absolute -bottom-1 -right-1">
                              <BlueTickBadge isVerified={true} size="md" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              user.blueTick?.status === 'VERIFIED' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {user.blueTick?.status === 'VERIFIED' ? 'Đã duyệt' : 'Từ chối'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          <p className="text-xs text-gray-400">
                            Xử lý lúc: {user.blueTick?.processedAt?.toLocaleString('vi-VN')}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 space-y-2">
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-700">
                          <strong>Lý do yêu cầu:</strong> {user.blueTick?.reason}
                        </p>
                      </div>
                      
                      {user.blueTick?.processedReason && (
                        <div className="p-3 bg-blue-50 rounded-md">
                          <p className="text-sm text-blue-700">
                            <strong>Ghi chú admin:</strong> {user.blueTick.processedReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Chưa có yêu cầu nào được xử lý</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Process Modal */}
      {showProcessModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {processAction === 'VERIFIED' ? 'Duyệt tick xanh' : 'Từ chối tick xanh'}
              </h3>
              
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <p className="text-sm"><strong>Người dùng:</strong> {selectedUser.name}</p>
                <p className="text-sm"><strong>Email:</strong> {selectedUser.email}</p>
                <p className="text-sm"><strong>Lý do yêu cầu:</strong> {selectedUser.blueTick?.reason}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {processAction === 'VERIFIED' ? 'Ghi chú (tùy chọn)' : 'Lý do từ chối *'}
                </label>
                <textarea
                  value={processReason}
                  onChange={(e) => setProcessReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-500"
                  placeholder={processAction === 'VERIFIED' 
                    ? 'Ghi chú về việc duyệt tick xanh...'
                    : 'Vui lòng nhập lý do từ chối...'
                  }
                  required={processAction === 'REJECTED'}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleProcessRequest}
                  disabled={processingUser === selectedUser.id || (processAction === 'REJECTED' && !processReason.trim())}
                  className={`flex-1 font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
                    processAction === 'VERIFIED'
                      ? 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500'
                      : 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
                  }`}
                >
                  {processingUser === selectedUser.id ? 'Đang xử lý...' : 
                   processAction === 'VERIFIED' ? 'Duyệt' : 'Từ chối'}
                </button>
                <button
                  onClick={() => setShowProcessModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
