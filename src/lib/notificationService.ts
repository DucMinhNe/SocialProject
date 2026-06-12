// Notification Service
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from './firebase';

// Web Push VAPID keys - lấy từ environment variables
const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_KEY || '';

// Modern browser detection
const isModernBrowser = () => {
  if (typeof window === 'undefined') return false;

  // Check for modern browser APIs
  const hasModernAPIs = 'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'fetch' in window &&
    'Promise' in window;

  // Check for specific browser versions
  const userAgent = navigator.userAgent;
  const isChrome = /Chrome\/(\d+)/.test(userAgent) && parseInt(RegExp.$1) >= 50;
  const isFirefox = /Firefox\/(\d+)/.test(userAgent) && parseInt(RegExp.$1) >= 44;
  const isSafari = /Safari\//.test(userAgent) && /Version\/(\d+)/.test(userAgent) && parseInt(RegExp.$1) >= 16;
  const isEdge = /Edg\/(\d+)/.test(userAgent) && parseInt(RegExp.$1) >= 79;

  return hasModernAPIs && (isChrome || isFirefox || isSafari || isEdge);
};

class NotificationService {
  private messaging: any = null;
  private registration: ServiceWorkerRegistration | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeMessaging();
    }
  }

  private async initializeMessaging() {
    console.log('🔧 Starting notification service initialization...');

    try {
      // Debug environment variables
      console.log('🔑 VAPID Key check:', {
        envVapidKey: process.env.NEXT_PUBLIC_VAPID_KEY,
        finalVapidKey: VAPID_KEY,
        vapidKeyLength: VAPID_KEY?.length
      });

      // Debug browser environment
      console.log('🌐 Browser environment:', {
        userAgent: navigator.userAgent,
        isSecureContext: window.isSecureContext,
        protocol: window.location.protocol,
        hostname: window.location.hostname,
        hasNotification: 'Notification' in window,
        hasServiceWorker: 'serviceWorker' in navigator,
        hasPushManager: 'PushManager' in window
      });

      // Check if browser supports all required APIs
      if (!this.isSupported()) {
        console.warn('⚠️ Browser does not support Firebase Messaging');
        return;
      }

      // Check if we're in a secure context (HTTPS or localhost)
      if (!window.isSecureContext) {
        console.warn('⚠️ Firebase Messaging requires secure context (HTTPS)');
        return;
      }

      console.log('✅ All checks passed, initializing Firebase Messaging...');

      // Initialize Firebase Messaging
      this.messaging = getMessaging(app);
      console.log('✅ Firebase Messaging initialized:', this.messaging);

      // Register service worker
      await this.registerServiceWorker();

      console.log('🔔 Notification service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize notification service:', error);
      if (error instanceof Error) {
        console.error('❌ Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      // Don't throw error, just log it
    }
  }

  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        console.log('✅ Service Worker registered:', this.registration);

        // Listen for service worker updates
        this.registration.addEventListener('updatefound', () => {
          console.log('🔄 Service Worker update found');
        });

      } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
        throw error;
      }
    } else {
      throw new Error('Service Worker not supported');
    }
  }

  // Request permission cho notifications
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    let permission = Notification.permission;

    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    console.log('🔔 Notification permission:', permission);
    
    // Tự động get FCM token khi permission được granted
    if (permission === 'granted') {
      console.log('🔄 Auto-requesting FCM token after permission granted...');
      try {
        const token = await this.getToken();
        if (token) {
          console.log('🎉 FCM token auto-retrieved successfully');
        }
      } catch (error) {
        console.warn('⚠️ Failed to auto-retrieve FCM token:', error);
      }
    }
    
    return permission;
  }

  // Lấy FCM token
  async getToken(): Promise<string | null> {
    if (!this.messaging || !this.registration) {
      console.warn('❌ Messaging not initialized - using fallback notification');
      return null;
    }

    try {
      const token = await getToken(this.messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: this.registration
      });
      console.log('🔑 FCM Token retrieved:', token);
      if (token) {
        console.log('🔑 FCM Token:', token);
        return token;
      } else {
        console.log('❌ No registration token available');
        return null;
      }
    } catch (error) {
      console.error('❌ An error occurred while retrieving token:', error);
      // Return null instead of throwing to allow fallback
      return null;
    }
  }

  // Setup foreground message listener
  setupForegroundListener(callback: (payload: any) => void) {
    if (!this.messaging) {
      console.warn('❌ Messaging not initialized - FCM foreground messages won\'t work');
      return;
    }

    try {
      onMessage(this.messaging, (payload) => {
        console.log('📨 Message received in foreground:', payload);

        // Show browser notification if page is not in focus
        if (document.hidden) {
          this.showLocalNotification(payload);
        }

        callback(payload);
      });
    } catch (error) {
      console.error('❌ Error setting up foreground listener:', error);
    }
  }

  // Show local notification
  private showLocalNotification(payload: any) {
    const { notification, data } = payload;

    if (Notification.permission === 'granted') {
      const notificationOptions = {
        body: notification?.body || 'Bạn có tin nhắn mới',
        icon: notification?.icon || '/favicon.ico',
        tag: data?.tag || 'chat-notification',
        requireInteraction: false,
        data: data || {}
      };

      new Notification(
        notification?.title || 'Chat App',
        notificationOptions
      );
    }
  }

  // Send test notification
  async sendTestNotification() {
    if (Notification.permission === 'granted') {
      const notification = new Notification('Test Notification', {
        body: 'Đây là thông báo test từ Chat App',
        icon: '/favicon.ico',
        tag: 'test'
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);
    }
  }

  // Send notification for new message
  async sendMessageNotification(senderName: string, messageText: string, chatId?: string) {
    if (Notification.permission === 'granted') {
      const notification = new Notification(`💬 ${senderName}`, {
        body: messageText,
        icon: '/favicon.ico',
        tag: chatId || 'new-message',
        requireInteraction: false,
        data: { chatId, senderName, messageText }
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        // Có thể thêm logic để chuyển đến chat cụ thể
        if (chatId) {
          console.log('Navigate to chat:', chatId);
        }
      };

      // Auto close after 8 seconds
      setTimeout(() => {
        notification.close();
      }, 8000);
    }
  }

  // Check if notifications are supported
  isSupported(): boolean {
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      return false;
    }

    // Use modern browser detection
    if (!isModernBrowser()) {
      console.warn('❌ Browser not modern enough for notifications');
      return false;
    }

    // Check for required APIs
    const hasNotification = 'Notification' in window;
    const hasServiceWorker = 'serviceWorker' in navigator;
    const hasPushManager = 'PushManager' in window;
    const isSecureContext = window.isSecureContext ||
      window.location.protocol === 'https:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    // Check browser support specifically for Firebase Messaging
    const hasFirebaseSupport = typeof indexedDB !== 'undefined' &&
      typeof BroadcastChannel !== 'undefined' &&
      typeof MessageChannel !== 'undefined';

    console.log('🔍 Browser support check:', {
      hasNotification,
      hasServiceWorker,
      hasPushManager,
      isSecureContext,
      hasFirebaseSupport,
      isModern: isModernBrowser(),
      userAgent: navigator.userAgent
    });

    return hasNotification && hasServiceWorker && hasPushManager && isSecureContext && hasFirebaseSupport;
  }

  // Get current permission status
  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  // Subscribe to push notifications
  async subscribeToPush() {
    if (!this.registration) {
      throw new Error('Service Worker not registered');
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_KEY       
      }); 

      console.log('✅ Push subscription:', subscription);
      return subscription;
    } catch (error) {
      console.error('❌ Failed to subscribe to push:', error);
      throw error;
    }
  }

  // Convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default NotificationService;
