import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { updateProfile, User } from 'firebase/auth';
import { getSafeAuthPhotoUrl } from '../lib/imageUtils';

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

  const trimmedName = data.displayName?.trim() || currentUser.email?.split('@')[0] || 'Irmão em Cristo';
  const cleanPhoto = data.photoURL?.trim() || '';

  // 1. Update Firebase Auth (with safe photoURL)
  try {
    const safeAuthPhoto = getSafeAuthPhotoUrl(trimmedName, cleanPhoto);
    await updateProfile(currentUser, {
      displayName: trimmedName,
      photoURL: safeAuthPhoto
    });
  } catch (authError) {
    console.warn('[UserService] Firebase Auth updateProfile notice:', authError);
    // Fallback: update display name only if photoURL caused an issue
    try {
      await updateProfile(currentUser, {
        displayName: trimmedName
      });
    } catch (e) {
      console.warn('[UserService] Secondary Auth displayName update notice:', e);
    }
  }

  // 2. Persist full profile to Firestore 'users' collection
  const userRef = doc(db, 'users', currentUser.uid);
  const firestoreData: any = {
    uid: currentUser.uid,
    name: trimmedName,
    displayName: trimmedName,
    email: currentUser.email || '',
    photoURL: cleanPhoto,
    avatarUrl: cleanPhoto,
    updatedAt: serverTimestamp()
  };

  if (data.bio !== undefined) firestoreData.bio = data.bio.trim();
  if (data.ministryRole !== undefined) firestoreData.ministryRole = data.ministryRole.trim();
  if (data.phoneNumber !== undefined) firestoreData.phoneNumber = data.phoneNumber.trim();
  if (data.favoriteVerse !== undefined) firestoreData.favoriteVerse = data.favoriteVerse.trim();

  await setDoc(userRef, firestoreData, { merge: true });
}

/**
 * Subscribes to real-time user profile data in Firestore
 */
export function subscribeToUserProfile(
  uid: string,
  callback: (profile: UserProfileData | null) => void
) {
  const userRef = doc(db, 'users', uid);
  return onSnapshot(
    userRef,
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as UserProfileData);
      } else {
        callback(null);
      }
    },
    (err) => {
      console.debug('[UserService] User profile snapshot fallback:', err);
      callback(null);
    }
  );
}
