// Service Worker for App Frutos do Espírito - Push Notifications & Background Calls
const CACHE_NAME = 'frutos-app-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.clients.claim()
  );
});

// Listen for Push events from Web Push server (Wake up device on lock screen)
self.addEventListener('push', (event) => {
  let data = {
    title: 'Ecclesia - Frutos do Espírito',
    body: 'Você recebeu uma nova mensagem no aplicativo.',
    icon: '/icon.svg',
    badge: '/icon.svg',
    url: '/chat',
    type: 'general',
    tag: 'push_' + Date.now()
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const isCall = data.type === 'call_incoming' || data.type === 'call_video' || data.type === 'call_audio';

  const notificationOptions = {
    body: data.body,
    icon: data.icon || '/icon.svg',
    badge: data.badge || '/icon.svg',
    tag: data.tag || (isCall ? `call_${data.callId || Date.now()}` : `msg_${Date.now()}`),
    renotify: true,
    requireInteraction: true, // Crucial for mobile lock screen visibility
    silent: false,
    timestamp: data.timestamp || Date.now(),
    vibrate: isCall ? [500, 250, 500, 250, 500, 250, 1000] : [300, 150, 300, 150, 450],
    data: {
      url: data.url || '/chat',
      callId: data.callId,
      type: data.type
    },
    actions: isCall ? [
      { action: 'answer', title: '📞 Atender' },
      { action: 'decline', title: '❌ Recusar' }
    ] : [
      { action: 'open', title: '💬 Abrir Mensagem' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, notificationOptions)
  );
});

// Listen for client postMessage to show local notification through service worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'TRIGGER_NOTIFICATION') {
    const { title, options } = event.data;
    event.waitUntil(
      self.registration.showNotification(title, {
        icon: '/icon.svg',
        badge: '/icon.svg',
        renotify: true,
        requireInteraction: true,
        vibrate: [300, 150, 300],
        ...options
      })
    );
  }
});

// Handle notification tap / action clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'decline') {
    return;
  }

  const notifData = event.notification.data || {};
  let targetUrl = notifData.url || '/chat';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client && targetUrl) {
            client.navigate(targetUrl);
          }
          return;
        }
      }
      // If no window is open, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
