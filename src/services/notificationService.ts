import { db, auth } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  serverTimestamp, 
  updateDoc, 
  doc, 
  writeBatch,
  getDocs,
  limit
} from 'firebase/firestore';

export interface AppNotification {
  id: string;
  recipientUid: string;
  senderUid: string;
  senderName: string;
  senderPhoto?: string;
  type: 'chat_dm' | 'chat_message' | 'call_incoming' | 'call_missed' | 'prayer_intercession' | 'prayer_testimony' | 'volunteer_reminder' | 'cell_notice' | 'general';
  title: string;
  message: string;
  channelId?: string;
  isDirect?: boolean;
  callId?: string;
  callType?: 'audio' | 'video';
  prayerId?: string;
  read: boolean;
  createdAt: any;
  createdAtIso?: string;
  actionUrl?: string;
}

/**
 * Plays a pleasant celestial crystal chime chord using Web Audio API
 */
export function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Harmonic celestial chime sequence (E6, G#6, B6, E7)
    const freqs = [1318.51, 1661.22, 1975.53, 2637.02];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = ctx.currentTime + idx * 0.07;
      const duration = 0.55;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.12, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    });
  } catch (e) {
    console.debug('[NotificationService] Audio chime playback notice:', e);
  }
}

/**
 * Helper to convert base64 VAPID public key to Uint8Array
 */
function urlB64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Subscribes this browser/device to Web Push notifications via Service Worker
 * Ensures notifications can wake up the phone and show on lock screen
 */
export async function subscribeToPushService(userId?: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.debug('[Push] Web Push is not supported in this browser environment');
    return false;
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    if (!reg.pushManager) {
      console.debug('[Push] PushManager not available on registration');
      return false;
    }

    // Fetch VAPID public key from backend
    const res = await fetch('/api/notifications/vapid-public-key');
    if (!res.ok) {
      console.warn('[Push] Failed to fetch VAPID key');
      return false;
    }
    const { publicKey } = await res.json();
    if (!publicKey) return false;

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const appKey = urlB64ToUint8Array(publicKey);
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appKey
      });
    }

    if (sub) {
      const activeUserId = userId || auth.currentUser?.uid || 'guest';
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeUserId,
          subscription: sub.toJSON()
        })
      });
      localStorage.setItem('church_push_enabled', 'true');
      console.log('[Push] Push subscription synced with server for user:', activeUserId);
      return true;
    }
  } catch (err) {
    console.warn('[Push] Error subscribing to push notifications:', err);
  }
  return false;
}

/**
 * Sends a push notification through our server's Web Push endpoint
 * This guarantees delivery to backgrounded apps and locked phone screens!
 */
export async function sendPushNotificationToServer(params: {
  recipientUid: string;
  senderUid?: string;
  title: string;
  body: string;
  icon?: string;
  url?: string;
  type?: string;
  callId?: string;
  delaySeconds?: number;
}) {
  try {
    await fetch('/api/notifications/send-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientUid: params.recipientUid,
        senderUid: params.senderUid || auth.currentUser?.uid,
        title: params.title,
        body: params.body,
        icon: params.icon || '/icon.svg',
        badge: '/icon.svg',
        url: params.url || '/chat',
        type: params.type || 'general',
        callId: params.callId,
        delaySeconds: params.delaySeconds || 0
      })
    });
  } catch (e) {
    console.warn('[Push] Error sending push via backend:', e);
  }
}

/**
 * Test lock-screen notification with a customizable delay (default 5s).
 * User taps, locks phone screen, and in 5s the push notification wakes up the phone!
 */
export async function testLockScreenNotification(delaySeconds = 5): Promise<{ success: boolean; message: string }> {
  if (typeof window === 'undefined') return { success: false, message: 'Navegador não suporta' };

  if (Notification.permission !== 'granted') {
    const granted = await requestBrowserNotificationPermission();
    if (!granted) {
      return { success: false, message: 'Permissão de notificação negada no navegador' };
    }
  } else {
    await subscribeToPushService();
  }

  const currentUser = auth.currentUser;
  const targetId = currentUser?.uid || 'all';

  try {
    const res = await fetch('/api/notifications/send-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientUid: targetId,
        senderUid: 'system',
        title: '🕊️ Ministério Frutos do Espírito',
        body: 'Notificação com tela bloqueada recebida com sucesso! Toque para abrir.',
        icon: '/icon.svg',
        badge: '/icon.svg',
        url: '/chat',
        type: 'test_notification',
        delaySeconds
      })
    });

    if (res.ok) {
      return {
        success: true,
        message: `Teste disparado! Bloqueie a tela do seu celular agora. A notificação chegará em ${delaySeconds} segundos!`
      };
    }
  } catch (e: any) {
    return { success: false, message: e?.message || 'Erro ao conectar ao servidor de push' };
  }

  return { success: true, message: `Bloqueie a tela agora! Disparando em ${delaySeconds}s.` };
}

/**
 * Requests browser permission for native Web Push Notifications and registers subscription
 */
export async function requestBrowserNotificationPermission(userId?: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') {
    await subscribeToPushService(userId);
    return true;
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await subscribeToPushService(userId);
      return true;
    }
    return false;
  } catch (err) {
    console.debug('Notification permission request error:', err);
    return false;
  }
}

export const requestNotificationPermission = requestBrowserNotificationPermission;

/**
 * Dispatches a high-priority native call notification with vibration and action buttons
 */
export async function triggerCallNotification(params: {
  callerName: string;
  callType: 'audio' | 'video';
  callId: string;
  callerPhoto?: string;
}) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const title = params.callType === 'video' 
    ? `📹 Chamada de Vídeo de ${params.callerName}` 
    : `📞 Chamada de Voz de ${params.callerName}`;

  const body = `Tocando no Frutos do Espírito... Toque para atender.`;
  const icon = params.callerPhoto || '/icon.svg';

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body,
          icon,
          badge: '/icon.svg',
          tag: `call_${params.callId}`,
          renotify: true,
          requireInteraction: true,
          vibrate: [500, 200, 500, 200, 500, 200, 1000],
          data: {
            url: `/chat`,
            callId: params.callId,
            type: 'call_incoming'
          },
          actions: [
            { action: 'answer', title: '📞 Atender' },
            { action: 'decline', title: '❌ Recusar' }
          ]
        } as any);
        return;
      }
    }

    const notif = new Notification(title, {
      body,
      icon,
      tag: `call_${params.callId}`,
      requireInteraction: true
    } as any);
    notif.onclick = () => {
      window.focus();
    };
  } catch (e) {
    console.debug('[NotificationService] Call notification dispatch notice:', e);
  }
}

/**
 * Dispatches a native browser desktop/mobile notification if supported and permitted
 */
export async function triggerBrowserNotification(title: string, options?: NotificationOptions) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        if (reg && reg.showNotification) {
          await reg.showNotification(title, {
            icon: '/icon.svg',
            badge: '/icon.svg',
            vibrate: [200, 100, 200],
            ...options
          } as any);
          return;
        }
      }

      const notif = new Notification(title, {
        icon: '/icon.svg',
        ...options
      });
      notif.onclick = () => {
        window.focus();
      };
    } catch (e) {
      console.debug('[NotificationService] Browser notification notice:', e);
    }
  }
}

/**
 * Sends a notification when someone sends a Chat message or Direct Message
 */
export async function notifyChatMessage(params: {
  recipientUid: string;
  senderUid: string;
  senderName: string;
  senderPhoto?: string;
  channelId: string;
  channelName?: string;
  message: string;
  isDirect?: boolean;
}) {
  const currentUser = auth.currentUser;
  // Prevent sending notification to self
  if (currentUser && currentUser.uid === params.recipientUid) return;

  try {
    const notificationsRef = collection(db, 'notifications');
    const isDirect = !!params.isDirect;
    const title = isDirect 
      ? `💬 Mensagem de ${params.senderName}`
      : `💬 ${params.senderName} em #${params.channelName || 'Comunhão'}`;

    const actionUrl = isDirect 
      ? `/chat?dm=${params.senderUid}` 
      : `/chat?channel=${params.channelId}`;

    await addDoc(notificationsRef, {
      recipientUid: params.recipientUid,
      senderUid: params.senderUid,
      senderName: params.senderName,
      senderPhoto: params.senderPhoto || '',
      type: isDirect ? 'chat_dm' : 'chat_message',
      title,
      message: params.message.slice(0, 120),
      channelId: params.channelId,
      isDirect,
      read: false,
      createdAt: serverTimestamp(),
      actionUrl
    });

    // Send Web Push notification to wake device and show on lock screen
    sendPushNotificationToServer({
      recipientUid: params.recipientUid,
      senderUid: params.senderUid,
      title,
      body: params.message.slice(0, 140),
      icon: params.senderPhoto || '/icon.svg',
      url: actionUrl,
      type: isDirect ? 'chat_dm' : 'chat_message'
    });

    // Also trigger local event for instant UI awareness
    window.dispatchEvent(new CustomEvent('app-chat-message-notification', {
      detail: {
        senderName: params.senderName,
        message: params.message,
        channelId: params.channelId,
        actionUrl
      }
    }));
  } catch (error) {
    console.error('Error sending chat notification:', error);
  }
}

/**
 * Notifies the author of a prayer request that another user is praying for them
 */
export async function notifyPrayerIntercession(params: {
  prayerId: string;
  prayerTitle: string;
  authorUid: string;
  authorName: string;
}) {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  // Don't send notification if the user is praying for their own request
  if (currentUser.uid === params.authorUid) return;

  try {
    const senderName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Um irmão(ã)';
    const senderPhoto = currentUser.photoURL || '';

    const notificationsRef = collection(db, 'notifications');
    
    await addDoc(notificationsRef, {
      recipientUid: params.authorUid,
      senderUid: currentUser.uid,
      senderName,
      senderPhoto,
      type: 'prayer_intercession',
      title: '🙏 Intercessão por Você!',
      message: `${senderName} acabou de interceder pelo seu pedido: "${params.prayerTitle.slice(0, 45)}${params.prayerTitle.length > 45 ? '...' : ''}"`,
      prayerId: params.prayerId,
      read: false,
      createdAt: serverTimestamp(),
      actionUrl: '/prayers'
    });

    // Dispatch Web Push to alert author even with screen locked
    sendPushNotificationToServer({
      recipientUid: params.authorUid,
      senderUid: currentUser.uid,
      title: '🙏 Intercessão por Você!',
      body: `${senderName} acabou de interceder pelo seu pedido: "${params.prayerTitle.slice(0, 50)}"`,
      icon: senderPhoto || '/icon.svg',
      url: '/prayers',
      type: 'prayer_intercession'
    });

    // Trigger local sound or custom event for responsive feedback
    window.dispatchEvent(new CustomEvent('app-notification-sent', {
      detail: { recipientUid: params.authorUid, senderName }
    }));
  } catch (error) {
    console.error('Error sending prayer notification:', error);
  }
}

/**
 * Notifies when a prayer author marks a prayer as answered with a testimony
 */
export async function notifyPrayerTestimony(params: {
  prayerId: string;
  testimony: string;
  authorName: string;
}) {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  try {
    const notificationsRef = collection(db, 'notifications');
    await addDoc(notificationsRef, {
      recipientUid: 'all', // Broadcast style or visible to intercessors
      senderUid: currentUser.uid,
      senderName: params.authorName,
      type: 'prayer_testimony',
      title: '🎉 Oração Respondida!',
      message: `${params.authorName} compartilhou uma bênção: "${params.testimony.slice(0, 60)}..."`,
      prayerId: params.prayerId,
      read: false,
      createdAt: serverTimestamp(),
      actionUrl: '/prayers'
    });

    // Broadcast Web Push to church members
    sendPushNotificationToServer({
      recipientUid: 'all',
      senderUid: currentUser.uid,
      title: '🎉 Oração Respondida!',
      body: `${params.authorName} compartilhou uma bênção: "${params.testimony.slice(0, 70)}..."`,
      icon: '/icon.svg',
      url: '/prayers',
      type: 'prayer_testimony'
    });
  } catch (error) {
    console.error('Error sending testimony notification:', error);
  }
}

/**
 * Sends a high-priority notification when a user initiates a 1-on-1 audio/video call
 */
export async function notifyCallIncoming(params: {
  recipientUid: string;
  callerUid: string;
  callerName: string;
  callerPhoto?: string;
  callId: string;
  callType: 'audio' | 'video';
}) {
  const currentUser = auth.currentUser;
  if (currentUser && currentUser.uid === params.recipientUid) return;

  try {
    const notificationsRef = collection(db, 'notifications');
    const isVideo = params.callType === 'video';
    const title = isVideo 
      ? `📹 Chamada de Vídeo de ${params.callerName}` 
      : `📞 Chamada de Voz de ${params.callerName}`;

    await addDoc(notificationsRef, {
      recipientUid: params.recipientUid,
      senderUid: params.callerUid,
      senderName: params.callerName,
      senderPhoto: params.callerPhoto || '',
      type: 'call_incoming',
      title,
      message: `Chamada ${isVideo ? 'de vídeo' : 'de voz'} ao vivo. Toque para atender.`,
      callId: params.callId,
      callType: params.callType,
      read: false,
      createdAt: serverTimestamp(),
      createdAtIso: new Date().toISOString(),
      actionUrl: '/chat'
    });

    // Trigger local system background notification
    triggerCallNotification({
      callerName: params.callerName,
      callType: params.callType,
      callId: params.callId,
      callerPhoto: params.callerPhoto
    });

    // Dispatch Web Push so remote device rings on lock screen
    sendPushNotificationToServer({
      recipientUid: params.recipientUid,
      senderUid: params.callerUid,
      title,
      body: `Chamada ${isVideo ? 'de vídeo' : 'de voz'} ao vivo de ${params.callerName}. Toque para atender.`,
      icon: params.callerPhoto || '/icon.svg',
      url: '/chat',
      type: 'call_incoming',
      callId: params.callId
    });
  } catch (error) {
    console.error('[NotificationService] Error sending call incoming notification:', error);
  }
}

/**
 * Sends a notification when a call was missed or declined
 */
export async function notifyCallMissed(params: {
  recipientUid: string;
  callerUid: string;
  callerName: string;
  callerPhoto?: string;
  callType: 'audio' | 'video';
}) {
  try {
    const notificationsRef = collection(db, 'notifications');
    const isVideo = params.callType === 'video';
    const title = isVideo 
      ? `📹 Chamada de Vídeo Perdida` 
      : `📞 Chamada de Voz Perdida`;

    await addDoc(notificationsRef, {
      recipientUid: params.recipientUid,
      senderUid: params.callerUid,
      senderName: params.callerName,
      senderPhoto: params.callerPhoto || '',
      type: 'call_missed',
      title,
      message: `Você perdeu uma chamada de ${params.callerName}.`,
      callType: params.callType,
      read: false,
      createdAt: serverTimestamp(),
      createdAtIso: new Date().toISOString(),
      actionUrl: `/chat?dm=${params.callerUid}`
    });

    // Push alert for missed call
    sendPushNotificationToServer({
      recipientUid: params.recipientUid,
      senderUid: params.callerUid,
      title,
      body: `Você perdeu uma chamada de ${params.callerName}.`,
      icon: params.callerPhoto || '/icon.svg',
      url: `/chat?dm=${params.callerUid}`,
      type: 'call_missed'
    });
  } catch (error) {
    console.error('[NotificationService] Error sending call missed notification:', error);
  }
}

/**
 * Subscribes to user notifications in real time with high reliability and in-memory sorting
 */
export function subscribeToUserNotifications(
  userId: string, 
  callback: (notifications: AppNotification[]) => void
) {
  if (!userId) return () => {};

  // Query notifications for this user or broadcast 'all'
  // Note: We avoid composite index dependency by sorting in-memory
  const q = query(
    collection(db, 'notifications'),
    where('recipientUid', 'in', [userId, 'all']),
    limit(60)
  );

  return onSnapshot(q, (snapshot) => {
    const notifs = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data
      };
    }) as AppNotification[];

    // Sort descending by timestamp or iso string
    notifs.sort((a, b) => {
      const getMillis = (item: any) => {
        if (item.createdAt?.toMillis) return item.createdAt.toMillis();
        if (item.createdAt?.seconds) return item.createdAt.seconds * 1000;
        if (item.createdAtIso) return new Date(item.createdAtIso).getTime();
        return 0;
      };
      return getMillis(b) - getMillis(a);
    });

    callback(notifs);
  }, (err) => {
    console.debug('[NotificationService] Error in composite query, using direct fallback:', err);
    // Direct single-value fallback query
    const fallbackQ = query(
      collection(db, 'notifications'),
      where('recipientUid', '==', userId),
      limit(40)
    );
    return onSnapshot(fallbackQ, (snapshot) => {
      const notifs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as AppNotification[];
      notifs.sort((a: any, b: any) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      callback(notifs);
    }, (fallbackErr) => {
      console.debug('[NotificationService] Fallback reading notifications failed:', fallbackErr);
      callback([]);
    });
  });
}

/**
 * Marks a notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const notifRef = doc(db, 'notifications', notificationId);
    await updateDoc(notifRef, { read: true });
  } catch (err) {
    console.error('Error marking notification as read:', err);
  }
}

/**
 * Deletes all notifications for a user to zero them out
 */
export async function deleteAllUserNotifications(notifications: AppNotification[]) {
  try {
    const batch = writeBatch(db);
    notifications.forEach(n => {
      const ref = doc(db, 'notifications', n.id);
      batch.delete(ref);
    });
    await batch.commit();
  } catch (err) {
    console.error('Error deleting all notifications:', err);
  }
}


