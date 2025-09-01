import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { notificationService } from '@/lib/notificationService';

interface NotificationSettings {
  notificationsEnabled: boolean;
  messageNotifications: boolean;
  soundEnabled: boolean;
  fcmToken: string | null;
}

export function useNotifications() {
  const [user] = useAuthState(auth);
  const [settings, setSettings] = useState<NotificationSettings>({
    notificationsEnabled: false,
    messageNotifications: true,
    soundEnabled: true,
    fcmToken: null
  });

  useEffect(() => {
    if (!user) return;

    // Subscribe to user's notification settings
    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          setSettings({
            notificationsEnabled: userData.notificationsEnabled || false,
            messageNotifications: userData.messageNotifications !== false,
            soundEnabled: userData.soundEnabled !== false,
            fcmToken: userData.fcmToken || null
          });
        }
      }
    );

    return () => unsubscribe();
  }, [user]);

  const playNotificationSound = useCallback(() => {
    try {
      // Create a simple notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  }, []);

  // Setup FCM foreground listener
  useEffect(() => {
    if (settings.notificationsEnabled) {
      notificationService.setupForegroundListener((payload) => {
        console.log('📨 Received notification:', payload);
        
        // Show notification if tab is not focused
        if (document.hidden && settings.messageNotifications) {
          // FCM will handle this automatically
        }
        
        // Play sound if enabled
        if (settings.soundEnabled) {
          playNotificationSound();
        }
      });
    }
  }, [settings.notificationsEnabled, settings.messageNotifications, settings.soundEnabled, playNotificationSound]);

  const showMessageNotification = useCallback((senderName: string, message: string, senderAvatar?: string) => {
    if (!settings.notificationsEnabled || !settings.messageNotifications) {
      console.log('🔕 Notifications disabled or message notifications off');
      return;
    }

    console.log('🔔 Showing message notification:', { senderName, message });

    // Always show notification (the caller will decide when to call this)
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(`💬 ${senderName}`, {
        body: message,
        icon: senderAvatar || '/favicon.ico',
        tag: 'chat-message',
        requireInteraction: false,
        data: {
          senderId: senderName,
          timestamp: Date.now()
        }
      });

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Focus window when notification is clicked
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }

    // Play sound if enabled (regardless of tab focus for global notifications)
    if (settings.soundEnabled) {
      console.log('🔊 Playing notification sound');
      playNotificationSound();
    }
  }, [settings.notificationsEnabled, settings.messageNotifications, settings.soundEnabled, playNotificationSound]);

  return useMemo(() => ({
    settings,
    showMessageNotification,
    isEnabled: settings.notificationsEnabled
  }), [settings, showMessageNotification]);
}
