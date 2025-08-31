'use client';

import { useState, useEffect } from 'react';
import { User, Gender } from '@/types';
import { updateUserProfile, getUserById } from '@/lib/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import BlueTickVerification from './BlueTickVerification';
import BlueTickBadge from './BlueTickBadge';

interface ProfileProps {
  onClose: () => void;
}

export default function Profile({ onClose }: ProfileProps) {
  const [user, loading] = useAuthState(auth);
  const [userData, setUserData] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    avatar: '',
    phone: '',
    dateOfBirth: '',
    gender: '' as Gender | ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showBlueTickModal, setShowBlueTickModal] = useState(false);

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        setIsLoading(true);
        try {
          const userInfo = await getUserById(user.uid);
          if (userInfo) {
            setUserData(userInfo);
            setFormData({
              name: userInfo.name || '',
              avatar: userInfo.avatar || '',
              phone: userInfo.phone || '',
              dateOfBirth: userInfo.dateOfBirth ? userInfo.dateOfBirth.toISOString().split('T')[0] : '',
              gender: userInfo.gender || ''
            });
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          setMessage({ type: 'error', text: 'Không thể tải thông tin người dùng' });
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadUserData();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userData) return;

    setIsUpdating(true);
    setMessage(null);

    try {
      // Validate name
      if (!formData.name.trim()) {
        throw new Error('Tên không được để trống');
      }

      // Validate avatar URL if provided
      if (formData.avatar && !isValidUrl(formData.avatar)) {
        throw new Error('URL avatar không hợp lệ');
      }

      await updateUserProfile(user.uid, {
        name: formData.name.trim(),
        avatar: formData.avatar.trim(),
        phone: formData.phone.trim() || undefined,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined,
        gender: formData.gender as Gender || undefined
      });

      // Update local state
      setUserData(prev => prev ? {
        ...prev,
        name: formData.name.trim(),
        avatar: formData.avatar.trim(),
        phone: formData.phone.trim() || undefined,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined,
        gender: formData.gender as Gender || undefined
      } : null);

      setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsUpdating(false);
    }
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const getAvatarFallback = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  if (loading || isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Đang tải...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-sm md:max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <h2 className="text-lg md:text-xl font-semibold text-gray-800">Thông tin cá nhân</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold p-1"
          >
            ×
          </button>
        </div>

        {userData && (
          <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
            {/* Avatar Preview */}
            <div className="flex justify-center mb-4 md:mb-6">
              <div className="relative">
                {formData.avatar ? (
                  <img
                    src={formData.avatar}
                    alt="Avatar"
                    className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-4 border-gray-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling!.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div 
                  className={`w-16 h-16 md:w-20 md:h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-lg md:text-xl font-semibold border-4 border-gray-200 ${formData.avatar ? 'hidden' : ''}`}
                >
                  {getAvatarFallback(formData.name || userData.name)}
                </div>
                
                {/* Blue Tick Badge */}
                {userData.blueTick?.status === 'VERIFIED' && (
                  <div className="absolute -bottom-1 -right-1">
                    <BlueTickBadge isVerified={true} size="md" />
                  </div>
                )}
              </div>
            </div>

            {/* Blue Tick Section */}
            <div className="mb-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <BlueTickBadge isVerified={true} size="xl" />
                    <div>
                      <h4 className="font-medium text-blue-800">Tick xanh</h4>
                      <p className="text-sm text-blue-600">
                        {userData.blueTick?.status === 'VERIFIED' 
                          ? 'Tài khoản đã được xác minh' 
                          : userData.blueTick?.status === 'PENDING'
                          ? 'Đang chờ xét duyệt'
                          : userData.blueTick?.status === 'REJECTED'
                          ? 'Yêu cầu bị từ chối'
                          : 'Xác minh tài khoản của bạn'
                        }
                      </p>
                    </div>
                  </div>
                  
                  {(!userData.blueTick?.status || userData.blueTick.status === 'REJECTED') && (
                    <button
                      type="button"
                      onClick={() => setShowBlueTickModal(true)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                    >
                      {userData.blueTick?.status === 'REJECTED' ? 'Gửi lại' : 'Xin cấp'}
                    </button>
                  )}

                  {userData.blueTick?.status === 'PENDING' && (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-md">
                      Chờ duyệt
                    </span>
                  )}

                  {userData.blueTick?.status === 'VERIFIED' && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-md">
                      Đã xác minh
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={userData.email}
                disabled
                className="w-full p-2 md:p-3 text-sm md:text-base border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên hiển thị *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full p-2 md:p-3 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
                placeholder="Nhập tên hiển thị"
              />
            </div>

            {/* Avatar URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL Avatar
              </label>
              <input
                type="url"
                name="avatar"
                value={formData.avatar}
                onChange={handleInputChange}
                className="w-full p-2 md:p-3 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
                placeholder="https://example.com/avatar.jpg"
              />
              <p className="text-xs text-gray-500 mt-1">
                Để trống để sử dụng avatar mặc định (chữ cái đầu tên)
              </p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full p-2 md:p-3 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
                placeholder="0901234567"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày sinh
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                className="w-full p-2 md:p-3 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giới tính
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full p-2 md:p-3 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              >
                <option value="">Chọn giới tính</option>
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>

            {/* Message */}
            {message && (
              <div className={`p-3 rounded-lg ${
                message.type === 'success' 
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : 'bg-red-100 text-red-700 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-3 md:pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm md:text-base border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className={`flex-1 px-4 py-2 text-sm md:text-base rounded-lg text-white transition-colors ${
                  isUpdating
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isUpdating ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    <span className="hidden sm:inline">Đang lưu...</span>
                    <span className="sm:hidden">Lưu...</span>
                  </div>
                ) : (
                  <>
                    <span className="hidden sm:inline">Lưu thay đổi</span>
                    <span className="sm:hidden">Lưu</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Blue Tick Verification Modal */}
        {showBlueTickModal && userData && (
          <BlueTickVerification
            user={userData}
            onClose={() => setShowBlueTickModal(false)}
            onSuccess={() => {
              setMessage({ type: 'success', text: 'Yêu cầu tick xanh đã được gửi!' });
              // Reload user data to get updated blueTick status
              if (user) {
                getUserById(user.uid).then(updatedUser => {
                  if (updatedUser) {
                    setUserData(updatedUser);
                  }
                });
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
