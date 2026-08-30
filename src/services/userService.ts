import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';

export interface UserProfileData {
  uid: string;
  name: string;
  displayName: string;
  email: string;
  photoURL?: string;
  avatarUrl?: string;
  bio?: string;
  ministryRole?: string;
  phoneNumber?: string;
  favoriteVerse?: string;
  isOnline?: boolean;
  role?: string;
  level?: number;
  xp?: number;
  updatedAt?: any;
}

/**
 * Gets cached user photo from localStorage if available
 */
export function getCachedUserPhoto(uid: string): string {
  if (!uid) return '';
  try {
    return localStorage.getItem(`church_user_photo_${uid}`) || 
           localStorage.getItem(`user_avatar_${uid}`) || '';
  } catch {
    return '';
  }
}

/**
 * Saves and updates user profile data across Firestore and Firebase Auth
 */
export async function saveUserProfile(data: {
  displayName: string;
  photoURL?: string;
  bio?: string;
  ministryRole?: string;
  phoneNumber?: string;
  favoriteVerse?: string;
}): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Usuário não autenticado.');

  const trimmedName = data.displayName?.trim() || currentUser.displayName || currentUser.email?.split('@')[0] || 'Irmão em Cristo';
  const cleanPhoto = data.photoURL !== undefined ? data.photoURL.trim() : '';

  // 1. Immediately cache photo locally for fast offline/instant rendering
  if (cleanPhoto) {
    try {
      localStorage.setItem(`church_user_photo_${currentUser.uid}`, cleanPhoto);
      localStorage.setItem(`user_avatar_${currentUser.uid}`, cleanPhoto);
      localStorage.setItem(`church_user_name_${currentUser.uid}`, trimmedName);
    } catch (storageErr) {
      console.debug('[UserService] LocalStorage cache notice:', storageErr);
    }
  }

  // 2. Update Firebase Auth (safely handle photoURL)
  try {
    const authPhotoToSet = cleanPhoto && cleanPhoto.startsWith('http') && cleanPhoto.length < 1500
      ? cleanPhoto
      : undefined;

    await updateProfile(currentUser, {
      displayName: trimmedName,
      ...(authPhotoToSet ? { photoURL: authPhotoToSet } : {})
    });
  } catch (authError) {
    console.warn('[UserService] Firebase Auth updateProfile notice:', authError);
    // Fallback: update display name only
    try {
      await updateProfile(currentUser, {
        displayName: trimmedName
      });
    } catch (e) {
      console.warn('[UserService] Secondary Auth update notice:', e);
    }
  }

  // 3. Persist full profile to Firestore 'users' collection with high durability
  const userRef = doc(db, 'users', currentUser.uid);
  const firestoreData: any = {
    uid: currentUser.uid,
    name: trimmedName,
    displayName: trimmedName,
    email: currentUser.email || '',
    updatedAt: serverTimestamp()
  };

  if (cleanPhoto) {
    firestoreData.photoURL = cleanPhoto;
    firestoreData.avatarUrl = cleanPhoto;
  }
  if (data.bio !== undefined) firestoreData.bio = data.bio.trim();
  if (data.ministryRole !== undefined) firestoreData.ministryRole = data.ministryRole.trim();
  if (data.phoneNumber !== undefined) firestoreData.phoneNumber = data.phoneNumber.trim();
  if (data.favoriteVerse !== undefined) firestoreData.favoriteVerse = data.favoriteVerse.trim();

  await setDoc(userRef, firestoreData, { merge: true });
}

/**
 * Subscribes to real-time user profile data in Firestore with local cache fallback
 */
export function subscribeToUserProfile(
  uid: string,
  callback: (profile: UserProfileData | null) => void
) {
  if (!uid) {
    callback(null);
    return () => {};
  }

  // Immediately invoke callback with cached data to avoid visual lag
  const cachedPhoto = getCachedUserPhoto(uid);
  const currentUser = auth.currentUser;
  if (cachedPhoto && currentUser && currentUser.uid === uid) {
    callback({
      uid,
      name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Membro',
      displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Membro',
      email: currentUser.email || '',
      photoURL: cachedPhoto,
      avatarUrl: cachedPhoto
    });
  }

  const userRef = doc(db, 'users', uid);
  return onSnapshot(
    userRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfileData;
        const currentCached = getCachedUserPhoto(uid);
        const resolvedPhoto = data.photoURL || data.avatarUrl || currentCached || '';
        
        if (resolvedPhoto && (!data.photoURL || !data.avatarUrl)) {
          data.photoURL = resolvedPhoto;
          data.avatarUrl = resolvedPhoto;
        }
        
        if (resolvedPhoto && uid === auth.currentUser?.uid) {
          try {
            localStorage.setItem(`church_user_photo_${uid}`, resolvedPhoto);
            localStorage.setItem(`user_avatar_${uid}`, resolvedPhoto);
          } catch {}
        }

        callback(data);
      } else {
        const fallbackCached = getCachedUserPhoto(uid);
        if (fallbackCached && currentUser && currentUser.uid === uid) {
          callback({
            uid,
            name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Membro',
            displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Membro',
            email: currentUser.email || '',
            photoURL: fallbackCached,
            avatarUrl: fallbackCached
          });
        } else {
          callback(null);
        }
      }
    },
    (err) => {
      console.debug('[UserService] User profile snapshot fallback:', err);
      const fallbackCached = getCachedUserPhoto(uid);
      if (fallbackCached && currentUser && currentUser.uid === uid) {
        callback({
          uid,
          name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Membro',
          displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Membro',
          email: currentUser.email || '',
          photoURL: fallbackCached,
          avatarUrl: fallbackCached
        });
      } else {
        callback(null);
      }
    }
  );
}
