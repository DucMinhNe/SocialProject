// Firebase Cloud Messaging Service Worker
// Use latest stable version
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Check if Firebase is available
if (typeof firebase === 'undefined') {
  console.error('[sw.js] Firebase not loaded');
} else {
  console.log('[sw.js] Firebase loaded successfully');
}

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAHAOyPJ4is6uauz4e2-IP0n_3X9woWqoM",
  authDomain: "learnproject-507da.firebaseapp.com",
  projectId: "learnproject-507da",
  storageBucket: "learnproject-507da.firebasestorage.app",
  messagingSenderId: "267265385958",
  appId: "1:267265385958:web:4e97a946726387e0fe6227"
};

// Initialize Firebase
try {
  firebase.initializeApp(firebaseConfig);
  console.log('[sw.js] Firebase initialized successfully');
} catch (error) {
  console.error('[sw.js] Firebase initialization failed:', error);
}

// Retrieve an instance of Firebase Messaging so that it can handle background messages
let messaging;
try {
  messaging = firebase.messaging();
  console.log('[sw.js] Firebase Messaging initialized');
} catch (error) {
  console.error('[sw.js] Firebase Messaging initialization failed:', error);
}

// Handle background messages
if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    console.log('[sw.js] Received background message:', payload);

    // Customize notification here
    const notificationTitle = payload.notification?.title || 'Chat App';
    const notificationOptions = {
      body: payload.notification?.body || 'Bạn có tin nhắn mới',
      icon: payload.notification?.icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: payload.data?.tag || 'chat-notification',
      data: payload.data || {},
      requireInteraction: false,
      actions: [
        {
          action: 'open',
          title: 'Mở chat',
          icon: '/favicon.ico'
        },
        {
          action: 'close',
          title: 'Đóng',
          icon: '/favicon.ico'
        }
      ]
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
  });
} else {
  console.warn('[sw.js] Firebase Messaging not available - background messages will not work');
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[sw.js] Notification click received.');

  event.notification.close();

  if (event.action === 'open') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Check if there is already a window/tab open with the target URL
        for (const client of clientList) {
          // If yes, focus the window/tab
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // If not, open a new window/tab
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Handle push event
self.addEventListener('push', (event) => {
  console.log('[sw.js] Push received:', event);

  if (event.data) {
    const payload = event.data.json();
    console.log('[sw.js] Push payload:', payload);

    const notificationTitle = payload.notification?.title || 'Chat App';
    const notificationOptions = {
      body: payload.notification?.body || 'Bạn có tin nhắn mới',
      icon: payload.notification?.icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: payload.data?.tag || 'push-notification',
      data: payload.data || {},
      requireInteraction: false
    };

    event.waitUntil(
      self.registration.showNotification(notificationTitle, notificationOptions)
    );
  }
});

// Basic service worker install/activate events
self.addEventListener('install', (event) => {
  console.log('[sw.js] Service worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[sw.js] Service worker activating...');
  event.waitUntil(self.clients.claim());
});

console.log('[sw.js] Service Worker loaded successfully');
