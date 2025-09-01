'use client';

import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '@/lib/notificationService';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';

interface NotificationSettingsProps {
  onClose?: () => void;
}

export default function NotificationSettings({ onClose }: NotificationSettingsProps) {
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    notificationsEnabled: false,
    messageNotifications: true,
    soundEnabled: true,
    fcmToken: null as string | null
  });
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const loadNotificationSettings = useCallback(async () => {
    if (!user) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setSettings({
          notificationsEnabled: userData.notificationsEnabled || false,
          messageNotifications: userData.messageNotifications !== false, // default true
          soundEnabled: userData.soundEnabled !== false, // default true
          fcmToken: userData.fcmToken || null
        });
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadNotificationSettings();
    }
    setPermission(notificationService.getPermissionStatus());
  }, [user, loadNotificationSettings]);

  const requestNotificationPermission = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      // Request permission
      const newPermission = await notificationService.requestPermission();
      setPermission(newPermission);
      
      if (newPermission === 'granted') {
        // Get FCM token
        const token = await notificationService.getToken();
        
        if (token && user) {
          // Save to Firestore
          await updateDoc(doc(db, 'users', user.uid), {
            notificationsEnabled: true,
            fcmToken: token,
            updatedAt: new Date()
          });
          
          setSettings(prev => ({
            ...prev,
            notificationsEnabled: true,
            fcmToken: token
          }));
          
          setMessage({ type: 'success', text: '✅ Thông báo đã được bật thành công!' });
        }
      } else {
        setMessage({ type: 'error', text: '❌ Bạn đã từ chối quyền thông báo' });
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      setMessage({ type: 'error', text: 'Lỗi khi bật thông báo: ' + (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const toggleNotifications = async () => {
    if (!user) return;
    
    if (!settings.notificationsEnabled && permission !== 'granted') {
      // Need to request permission first
      await requestNotificationPermission();
      return;
    }
    
    setLoading(true);
    try {
      const newEnabled = !settings.notificationsEnabled;
      
      await updateDoc(doc(db, 'users', user.uid), {
        notificationsEnabled: newEnabled,
        updatedAt: new Date()
      });
      
      setSettings(prev => ({
        ...prev,
        notificationsEnabled: newEnabled
      }));
      
      setMessage({ 
        type: 'success', 
        text: newEnabled ? '✅ Thông báo đã được bật' : '🔕 Thông báo đã được tắt' 
      });
    } catch (error) {
      console.error('Error toggling notifications:', error);
      setMessage({ type: 'error', text: 'Lỗi khi cập nhật cài đặt' });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: boolean) => {
    if (!user) return;
    
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        [key]: value,
        updatedAt: new Date()
      });
      
      setSettings(prev => ({
        ...prev,
        [key]: value
      }));
    } catch (error) {
      console.error('Error updating setting:', error);
    }
  };

  const sendTestNotification = () => {
    if (settings.notificationsEnabled && permission === 'granted') {
      notificationService.sendTestNotification();
      setMessage({ type: 'success', text: '🧪 Test notification đã gửi!' });
    } else {
      setMessage({ type: 'error', text: 'Vui lòng bật thông báo trước' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5 5-5M7.188 7.188L9 6l5.657 5.657-1.414 1.414L9 8.829 7.188 7.188z" />
            </svg>
            Cài đặt thông báo
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl font-bold p-1"
            >
              ×
            </button>
          )}
        </div>

        {/* Main Toggle */}
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-medium text-gray-900">Push Notifications</h3>
                <p className="text-sm text-gray-600">
                  Nhận thông báo khi có tin nhắn mới
                </p>
              </div>
              <button
                onClick={toggleNotifications}
                disabled={loading}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                  settings.notificationsEnabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            
            {/* Permission Status */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Trạng thái:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                permission === 'granted' 
                  ? 'bg-green-100 text-green-800' 
                  : permission === 'denied' 
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {permission === 'granted' ? '✅ Đã cấp quyền' : 
                 permission === 'denied' ? '❌ Bị từ chối' : 
                 '⏳ Chưa xin quyền'}
              </span>
            </div>
          </div>

          {/* Detailed Settings */}
          {settings.notificationsEnabled && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Chi tiết cài đặt</h4>
              
              {/* Message Notifications */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <span className="text-sm font-medium text-gray-900">Tin nhắn mới</span>
                  <p className="text-xs text-gray-500">Thông báo khi có tin nhắn</p>
                </div>
                <button
                  onClick={() => updateSetting('messageNotifications', !settings.messageNotifications)}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    settings.messageNotifications ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      settings.messageNotifications ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Sound */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <span className="text-sm font-medium text-gray-900">Âm thanh</span>
                  <p className="text-xs text-gray-500">Phát âm thanh khi có thông báo</p>
                </div>
                <button
                  onClick={() => updateSetting('soundEnabled', !settings.soundEnabled)}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    settings.soundEnabled ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      settings.soundEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Test Button */}
              <button
                onClick={sendTestNotification}
                className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                🧪 Gửi thông báo test
              </button>
            </div>
          )}

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

          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Đóng
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
