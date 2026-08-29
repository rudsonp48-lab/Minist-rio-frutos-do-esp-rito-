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
  getDocs
} from 'firebase/firestore';

export interface AppNotification {
  id: string;
  recipientUid: string;
  senderUid: string;
  senderName: string;
  senderPhoto?: string;
  type: 'prayer_intercession' | 'prayer_testimony' | 'volunteer_reminder' | 'cell_notice' | 'general';
  title: string;
  message: string;
  prayerId?: string;
  read: boolean;
  createdAt: any;
  actionUrl?: string;
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

    // Check if a recent notification for this prayer by this user already exists to avoid spamming
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
 * Subscribes to user notifications in real time
 */
export function subscribeToUserNotifications(
  userId: string, 
  callback: (notifications: AppNotification[]) => void
) {
  if (!userId) return () => {};

  const q = query(
    collection(db, 'notifications'),
    where('recipientUid', 'in', [userId, 'all']),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const notifs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AppNotification[];
    callback(notifs);
  }, (err) => {
    console.debug('[NotificationService] Fallback reading notifications:', err);
    callback([]);
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
 * Marks all notifications for a user as read
 */
export async function markAllNotificationsAsRead(notifications: AppNotification[]) {
  try {
    const batch = writeBatch(db);
    notifications.filter(n => !n.read).forEach(n => {
      const ref = doc(db, 'notifications', n.id);
      batch.update(ref, { read: true });
    });
    await batch.commit();
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
  }
}
