import { db, auth } from '../lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';

export interface ActiveUser {
  uid: string;
  name: string;
  email?: string;
  photoURL?: string;
  isOnline: boolean;
  lastSeen?: any;
  statusMessage?: string;
  role?: string;
  level?: number;
  xp?: number;
  currentActivity?: 'praying' | 'reading_bible' | 'listening_worship' | 'fellowship' | 'studying';
}

const DEFAULT_COMMUNITY_MEMBERS: ActiveUser[] = [
  {
    uid: 'system-pastor-marcos',
    name: 'Pr. Marcos Silva',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    isOnline: true,
    statusMessage: 'Intercedendo pelas famílias da congregação 🙏',
    role: 'Pastor Presidente',
    level: 12,
    xp: 4800,
    currentActivity: 'praying'
  },
  {
    uid: 'system-pra-sarah',
    name: 'Pra. Sarah Oliveira',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    isOnline: true,
    statusMessage: 'Preparando estudo bíblico de quinta-feira 📖',
    role: 'Pastora de Ensino',
    level: 10,
    xp: 3950,
    currentActivity: 'studying'
  },
  {
    uid: 'system-lucas-worship',
    name: 'Lucas Alencar',
    photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    isOnline: true,
    statusMessage: 'Ouvindo Web Rádio & Louvores 🎶',
    role: 'Ministério de Louvor',
    level: 7,
    xp: 2400,
    currentActivity: 'listening_worship'
  },
  {
    uid: 'system-carolina-mendes',
    name: 'Carolina Mendes',
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    isOnline: true,
    statusMessage: 'Lendo Salmos e clamando no Mural ✨',
    role: 'Intercessora',
    level: 8,
    xp: 2900,
    currentActivity: 'praying'
  },
  {
    uid: 'system-joao-lider',
    name: 'João Batista',
    photoURL: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
    isOnline: true,
    statusMessage: 'Em comunhão com a célula Betel 👥',
    role: 'Líder de Célula',
    level: 9,
    xp: 3400,
    currentActivity: 'fellowship'
  }
];

/**
 * Updates the current user's presence state in Firestore
 */
export async function updateUserPresence(statusMessage?: string, currentActivity?: ActiveUser['currentActivity']) {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const userRef = doc(db, 'users', user.uid);
    const updateData: any = {
      uid: user.uid,
      name: user.displayName || user.email?.split('@')[0] || 'Irmão em Cristo',
      email: user.email || '',
      isOnline: true,
      lastSeen: serverTimestamp(),
      lastSeenIso: new Date().toISOString()
    };

    if (statusMessage) updateData.statusMessage = statusMessage;
    if (currentActivity) updateData.currentActivity = currentActivity;

    await setDoc(userRef, updateData, { merge: true });
  } catch (err) {
    console.debug('[Presence] Failed to update user presence:', err);
  }
}

/**
 * Marks the current user as offline
 */
export async function setUserOffline() {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      isOnline: false,
      lastSeen: serverTimestamp()
    });
  } catch (err) {
    console.debug('[Presence] Failed to set offline status:', err);
  }
}

/**
 * Initializes a presence heartbeat that keeps user status online
 */
export function startPresenceHeartbeat() {
  const user = auth.currentUser;
  if (!user) return () => {};

  // Immediately update presence
  updateUserPresence();

  // Heartbeat interval every 2 minutes
  const interval = setInterval(() => {
    if (document.visibilityState === 'visible') {
      updateUserPresence();
    }
  }, 120000);

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      updateUserPresence();
    }
  };

  const handleBeforeUnload = () => {
    // Attempt best-effort offline notification
    setUserOffline();
  };

  window.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('beforeunload', handleBeforeUnload);

  return () => {
    clearInterval(interval);
    window.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}

/**
 * Subscribes to real-time active users from Firestore
 */
export function subscribeToActiveUsers(callback: (users: ActiveUser[]) => void) {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, limit(20));

  return onSnapshot(q, (snapshot) => {
    const currentUid = auth.currentUser?.uid;
    const firestoreUsers: ActiveUser[] = [];

    snapshot.docs.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      if (data.name || data.email) {
        let userPhoto = data.photoURL || data.avatarUrl || '';
        if (!userPhoto && docSnapshot.id === currentUid) {
          try {
            userPhoto = localStorage.getItem(`church_user_photo_${currentUid}`) || '';
          } catch {}
        }

        firestoreUsers.push({
          uid: docSnapshot.id,
          name: data.name || data.displayName || data.email?.split('@')[0] || 'Membro',
          email: data.email,
          photoURL: userPhoto,
          isOnline: data.isOnline !== undefined ? data.isOnline : true,
          lastSeen: data.lastSeen,
          statusMessage: data.statusMessage || 'Em comunhão no aplicativo',
          role: data.role || (data.email === 'rudson.p48@gmail.com' ? 'Administrador' : 'Membro'),
          level: data.level || 5,
          xp: data.xp || 1200,
          currentActivity: data.currentActivity || 'fellowship'
        });
      }
    });

    // Merge with default community leaders so the community is always rich and active
    const mergedMap = new Map<string, ActiveUser>();

    // Add default community leaders
    DEFAULT_COMMUNITY_MEMBERS.forEach(m => {
      mergedMap.set(m.uid, m);
    });

    // Overwrite / add real Firestore users
    firestoreUsers.forEach(u => {
      mergedMap.set(u.uid, u);
    });

    // Ensure current user is at the top if logged in
    const userList = Array.from(mergedMap.values()).sort((a, b) => {
      if (a.uid === currentUid) return -1;
      if (b.uid === currentUid) return 1;
      if (a.isOnline && !b.isOnline) return -1;
      if (!a.isOnline && b.isOnline) return 1;
      return (b.level || 0) - (a.level || 0);
    });

    callback(userList);
  }, (err) => {
    console.debug('[Presence] Snapshot fallback:', err);
    callback(DEFAULT_COMMUNITY_MEMBERS);
  });
}
