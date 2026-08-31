// Service Worker for App Frutos do Espírito - Push Notifications & Background Calls
const CACHE_NAME = 'frutos-app-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.clients.claim()
  );
});

// Listen for Push events from Web Push server (if configured)
self.addEventListener('push', (event) => {
  let data = {
    title: 'Frutos do Espírito',
    body: 'Você tem uma nova mensagem ou chamada.',
    icon: '/icon.svg',
    badge: '/icon.svg',
    url: '/chat',
    type: 'general'
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      data = { ...data, ...payload };
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const isCall = data.type === 'call_incoming' || data.type === 'call_video' || data.type === 'call_audio';

  const notificationOptions = {
    body: data.body,
    icon: data.icon || '/icon.svg',
    badge: data.badge || '/icon.svg',
    tag: data.tag || (isCall ? 'incoming_call' : 'chat_message'),
    renotify: true,
    requireInteraction: isCall, // keep on screen if it's a phone/video call until answered
    vibrate: isCall ? [500, 200, 500, 200, 500, 200, 1000] : [200, 100, 200],
    data: {
      url: data.url || '/chat',
      callId: data.callId
    },
    actions: isCall ? [
      { action: 'answer', title: '📞 Atender' },
      { action: 'decline', title: '❌ Recusar' }
    ] : [
      { action: 'open', title: '💬 Abrir Conversa' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, notificationOptions)
  );
});

// Handle notification tap / action clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notifData = event.notification.data || {};
  const targetUrl = notifData.url || '/chat';

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
