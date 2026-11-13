// Service Worker for App Frutos do Espírito - Push Notifications, Background Calls & Offline Cache
const CACHE_NAME = 'frutos-app-v3';
const OFFLINE_SHELL = ['/', '/index.html', '/manifest.json', '/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Cache static assets and Bible/app shell for offline reading during services
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('/index.html')))
    );
    return;
  }

  if (url.pathname.startsWith('/assets/') || url.pathname.endsWith('.json') || url.pathname.endsWith('.svg') || url.pathname.endsWith('.png')) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        });
      })
    );
  }
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
  const isDm = data.type === 'chat_dm' && data.senderUid;

  const notificationOptions = {
    body: data.body,
    icon: data.icon || '/icon.svg',
    badge: data.badge || '/icon.svg',
    tag: data.tag || (isCall ? `call_${data.callId || Date.now()}` : isDm ? `dm_${data.senderUid}` : `msg_${Date.now()}`),
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
      // If a window is already open, focus it and route smoothly via SPA postMessage
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if (targetUrl) {
            client.postMessage({ type: 'NAVIGATE_TO', url: targetUrl });
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
