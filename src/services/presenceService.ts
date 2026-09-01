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

// Real registered users only - No simulated/fake contacts
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

/**
 * Checks with high precision whether a user is currently Online
 * Validates both isOnline flag and recency of lastSeen heartbeat (< 2.5 minutes)
 */
export function isUserReallyOnline(user: ActiveUser): boolean {
  if (user.uid.startsWith('system-') || user.uid.startsWith('seed-')) {
    return false;
  }
  if (!user.isOnline) return false;
  if (!user.lastSeen) return !!user.isOnline;
  
  let lastSeenMs = 0;
  if (typeof user.lastSeen?.toDate === 'function') {
    lastSeenMs = user.lastSeen.toDate().getTime();
  } else if (typeof user.lastSeen?.seconds === 'number') {
    lastSeenMs = user.lastSeen.seconds * 1000;
  } else if (typeof user.lastSeen === 'number') {
    lastSeenMs = user.lastSeen;
  } else if (typeof user.lastSeen === 'string') {
    lastSeenMs = new Date(user.lastSeen).getTime();
  }

  if (!lastSeenMs || isNaN(lastSeenMs)) return !!user.isOnline;
  
  const now = Date.now();
  // Active within the last 2.5 minutes (150,000ms)
  return (now - lastSeenMs) < 150000;
}

/**
 * Formats a user's presence / last seen time in a beautiful, humanized manner
 */
export function formatUserLastSeen(user: ActiveUser): string {
  if (isUserReallyOnline(user)) {
    return 'Online agora';
  }

  if (!user.lastSeen) {
    return 'Offline';
  }

  let lastSeenDate: Date;
  if (typeof user.lastSeen?.toDate === 'function') {
    lastSeenDate = user.lastSeen.toDate();
  } else if (typeof user.lastSeen?.seconds === 'number') {
    lastSeenDate = new Date(user.lastSeen.seconds * 1000);
  } else if (typeof user.lastSeen === 'number') {
    lastSeenDate = new Date(user.lastSeen);
  } else if (typeof user.lastSeen === 'string') {
    lastSeenDate = new Date(user.lastSeen);
  } else {
    return 'Offline';
  }

  if (isNaN(lastSeenDate.getTime())) return 'Offline';

  const now = new Date();
  const diffMs = now.getTime() - lastSeenDate.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffMinutes < 1) {
    return 'Visto há instantes';
  }
  if (diffMinutes < 60) {
    return `Visto há ${diffMinutes} min`;
  }
  
  const isToday = now.toDateString() === lastSeenDate.toDateString();
  const timeStr = lastSeenDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) {
    return `Visto hoje às ${timeStr}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (yesterday.toDateString() === lastSeenDate.toDateString()) {
    return `Visto ontem às ${timeStr}`;
  }

  return `Visto em ${lastSeenDate.toLocaleDateString([], { day: '2-digit', month: '2-digit' })} às ${timeStr}`;
}

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

  // Heartbeat interval every 45 seconds while active
  const interval = setInterval(() => {
    if (document.visibilityState === 'visible') {
      updateUserPresence();
    }
  }, 45000);

  // User activity triggers immediate presence refresh throttled to 30s
  let lastActivityUpdate = Date.now();
  const handleUserActivity = () => {
    if (Date.now() - lastActivityUpdate > 30000) {
      lastActivityUpdate = Date.now();
      updateUserPresence();
    }
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      updateUserPresence();
    } else {
      // In background, record last seen timestamp
      updateUserPresence();
    }
  };

  const handleBeforeUnload = () => {
    setUserOffline();
  };

  window.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('beforeunload', handleBeforeUnload);
  window.addEventListener('touchstart', handleUserActivity, { passive: true });
  window.addEventListener('click', handleUserActivity, { passive: true });
  window.addEventListener('keydown', handleUserActivity, { passive: true });

  return () => {
    clearInterval(interval);
    window.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.removeEventListener('touchstart', handleUserActivity);
    window.removeEventListener('click', handleUserActivity);
    window.removeEventListener('keydown', handleUserActivity);
  };
}

/**
 * Subscribes to real-time active users from Firestore (Real members only)
 */
export function subscribeToActiveUsers(callback: (users: ActiveUser[]) => void) {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, limit(50));

  return onSnapshot(q, (snapshot) => {
    const currentUser = auth.currentUser;
    const currentUid = currentUser?.uid;
    const mergedMap = new Map<string, ActiveUser>();

    snapshot.docs.forEach((docSnapshot) => {
      const docId = docSnapshot.id;
      // Strictly exclude fake or system mock user IDs
      if (docId.startsWith('system-') || docId.startsWith('seed-') || docId.startsWith('user-sim-')) {
        return;
      }

      const data = docSnapshot.data();
      if (data.name || data.email || data.displayName) {
        let userPhoto = data.photoURL || data.avatarUrl || '';
        if (!userPhoto && docId === currentUid) {
          try {
            userPhoto = localStorage.getItem(`church_user_photo_${currentUid}`) || '';
          } catch {}
        }

        const realUser: ActiveUser = {
          uid: docId,
          name: data.displayName || data.name || data.email?.split('@')[0] || 'Membro',
          email: data.email || '',
          photoURL: userPhoto,
          isOnline: data.isOnline !== undefined ? data.isOnline : true,
          lastSeen: data.lastSeen,
          statusMessage: data.statusMessage || 'Em comunhão no aplicativo',
          role: data.role || (data.email === 'rudson.p48@gmail.com' ? 'Administrador' : 'Membro'),
          level: data.level || 1,
          xp: data.xp || 100,
          currentActivity: data.currentActivity || 'fellowship'
        };

        realUser.isOnline = isUserReallyOnline(realUser);
        mergedMap.set(docId, realUser);
      }
    });

    // Ensure current logged-in user is always present even before their first Firestore write
    if (currentUid && currentUser) {
      if (!mergedMap.has(currentUid)) {
        let photo = currentUser.photoURL || '';
        try {
          photo = photo || localStorage.getItem(`church_user_photo_${currentUid}`) || '';
        } catch {}
        
        mergedMap.set(currentUid, {
          uid: currentUid,
          name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Meu Perfil',
          email: currentUser.email || '',
          photoURL: photo,
          isOnline: true,
          statusMessage: 'Online agora',
          role: currentUser.email === 'rudson.p48@gmail.com' ? 'Administrador' : 'Membro',
          level: 1,
          xp: 100,
          currentActivity: 'fellowship'
        });
      }
    }

    // Sort: Current user first, then active/online members, then alphabetical
    const userList = Array.from(mergedMap.values()).map(u => ({
      ...u,
      isOnline: isUserReallyOnline(u)
    })).sort((a, b) => {
      if (a.uid === currentUid) return -1;
      if (b.uid === currentUid) return 1;
      if (a.isOnline && !b.isOnline) return -1;
      if (!a.isOnline && b.isOnline) return 1;
      return a.name.localeCompare(b.name);
    });

    callback(userList);
  }, (err) => {
    console.debug('[Presence] Snapshot fallback notice:', err);
    if (auth.currentUser) {
      const u = auth.currentUser;
      callback([{
        uid: u.uid,
        name: u.displayName || u.email?.split('@')[0] || 'Meu Perfil',
        email: u.email || '',
        photoURL: u.photoURL || '',
        isOnline: true,
        statusMessage: 'Online',
        role: u.email === 'rudson.p48@gmail.com' ? 'Administrador' : 'Membro',
        level: 1,
        xp: 100,
        currentActivity: 'fellowship'
      }]);
    } else {
      callback([]);
    }
  });
}
