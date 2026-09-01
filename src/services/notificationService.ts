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
 * Requests browser permission for native Web Push Notifications
 */
export async function requestBrowserNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
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

    // Also trigger system background browser push notification
    triggerCallNotification({
      callerName: params.callerName,
      callType: params.callType,
      callId: params.callId,
      callerPhoto: params.callerPhoto
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


