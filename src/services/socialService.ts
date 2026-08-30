import { db, auth } from '../lib/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  setDoc,
  deleteDoc,
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp,
  getDocs,
  getDoc,
  arrayUnion,
  arrayRemove,
  increment
} from 'firebase/firestore';

export interface UserStory {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  userRole?: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
  createdAt: any;
  createdAtIso?: string;
  expiresAt?: any;
  viewers?: string[];
  likes?: string[];
}

export interface UserStoryGroup {
  userId: string;
  userName: string;
  userPhoto?: string;
  userRole?: string;
  hasUnseen: boolean;
  stories: UserStory[];
  latestTimestamp: number;
}

export interface SocialReel {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  userRole?: string;
  videoUrl: string;
  videoThumbnail?: string;
  caption: string;
  musicTitle?: string;
  tags?: string[];
  likes: string[];
  commentsCount: number;
  sharesCount?: number;
  createdAt: any;
  createdAtIso?: string;
}

export interface ReelComment {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  text: string;
  createdAt: any;
  createdAtIso?: string;
  likes?: string[];
}

export interface SocialPost {
  id: string;
  userId: string;
  userName: string;
  userRole?: string;
  userPhoto?: string;
  title?: string;
  content: string;
  category?: string;
  isAnonymous?: boolean;
  createdAt?: any;
  createdAtIso?: string;
  likes?: string[];
  commentsCount?: number;
  comments?: any[];
  audioUrl?: string;
  audioDuration?: number;
  imageUrl?: string;
  imageUrls?: string[];
  videoUrl?: string;
  videoType?: 'file' | 'youtube' | 'external';
  videoThumbnail?: string;
  answered?: boolean;
  testimony?: string;
  isPinned?: boolean;
  location?: string;
  tags?: string[];
  isReel?: boolean;
}

/**
 * Real-time subscription to active stories
 */
export function subscribeToStories(callback: (groups: UserStoryGroup[]) => void) {
  const currentUid = auth.currentUser?.uid;
  const q = query(
    collection(db, 'stories'),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  return onSnapshot(q, (snapshot) => {
    const stories: UserStory[] = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    } as UserStory));

    // Group stories by userId
    const groupsMap = new Map<string, UserStoryGroup>();

    stories.forEach(story => {
      const existing = groupsMap.get(story.userId);
      const isSeen = currentUid && story.viewers && story.viewers.includes(currentUid);

      if (!existing) {
        groupsMap.set(story.userId, {
          userId: story.userId,
          userName: story.userName,
          userPhoto: story.userPhoto,
          userRole: story.userRole,
          hasUnseen: !isSeen,
          stories: [story],
          latestTimestamp: story.createdAt?.toMillis?.() || Date.now()
        });
      } else {
        existing.stories.push(story);
        if (!isSeen) existing.hasUnseen = true;
      }
    });

    // Convert map to array with current user first, then unseen stories first
    const groups = Array.from(groupsMap.values()).sort((a, b) => {
      if (a.userId === currentUid) return -1;
      if (b.userId === currentUid) return 1;
      if (a.hasUnseen && !b.hasUnseen) return -1;
      if (!a.hasUnseen && b.hasUnseen) return 1;
      return b.latestTimestamp - a.latestTimestamp;
    });

    callback(groups);
  }, (err) => {
    console.debug('[SocialService] Error fetching stories:', err);
    callback([]);
  });
}

/**
 * Publish a new story
 */
export async function createStory(params: {
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
}) {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const storyData = {
    userId: user.uid,
    userName: user.displayName || user.email?.split('@')[0] || 'Membro',
    userPhoto: user.photoURL || '',
    userRole: user.email === 'rudson.p48@gmail.com' ? 'Pastor / Administrador' : 'Membro da Igreja',
    mediaUrl: params.mediaUrl,
    mediaType: params.mediaType,
    caption: params.caption || '',
    createdAt: serverTimestamp(),
    createdAtIso: new Date().toISOString(),
    viewers: [user.uid],
    likes: []
  };

  const docRef = await addDoc(collection(db, 'stories'), storyData);
  return docRef.id;
}

/**
 * Mark story as viewed
 */
export async function markStoryViewed(storyId: string) {
  const user = auth.currentUser;
  if (!user || !storyId) return;

  try {
    const storyRef = doc(db, 'stories', storyId);
    await updateDoc(storyRef, {
      viewers: arrayUnion(user.uid)
    });
  } catch (err) {
    console.debug('[SocialService] Error marking story viewed:', err);
  }
}

/**
 * Like / React to a story
 */
export async function toggleStoryLike(storyId: string) {
  const user = auth.currentUser;
  if (!user || !storyId) return;

  try {
    const storyRef = doc(db, 'stories', storyId);
    const snap = await getDoc(storyRef);
    if (!snap.exists()) return;

    const data = snap.data();
    const likes: string[] = data.likes || [];
    const isLiked = likes.includes(user.uid);

    await updateDoc(storyRef, {
      likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
    });
  } catch (err) {
    console.error('[SocialService] Error liking story:', err);
  }
}

/**
 * Real-time subscription to Reels
 */
export function subscribeToReels(callback: (reels: SocialReel[]) => void) {
  const q = query(
    collection(db, 'reels'),
    orderBy('createdAt', 'desc'),
    limit(40)
  );

  return onSnapshot(q, (snapshot) => {
    const reelsList: SocialReel[] = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    } as SocialReel));

    callback(reelsList);
  }, (err) => {
    console.debug('[SocialService] Error fetching reels:', err);
    callback([]);
  });
}

/**
 * Publish a new Reel
 */
export async function createReel(params: {
  videoUrl: string;
  videoThumbnail?: string;
  caption: string;
  musicTitle?: string;
  tags?: string[];
}) {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const reelData = {
    userId: user.uid,
    userName: user.displayName || user.email?.split('@')[0] || 'Membro',
    userPhoto: user.photoURL || '',
    userRole: user.email === 'rudson.p48@gmail.com' ? 'Pastor / Administrador' : 'Membro da Igreja',
    videoUrl: params.videoUrl,
    videoThumbnail: params.videoThumbnail || '',
    caption: params.caption,
    musicTitle: params.musicTitle || 'Louvor & Adoração Oficial',
    tags: params.tags || ['#Ecclesia', '#Louvor', '#ReelsGospel'],
    likes: [],
    commentsCount: 0,
    sharesCount: 0,
    createdAt: serverTimestamp(),
    createdAtIso: new Date().toISOString()
  };

  const docRef = await addDoc(collection(db, 'reels'), reelData);

  // Also mirror into main feed so it immediately shows everywhere
  try {
    await addDoc(collection(db, 'prayers'), {
      userId: user.uid,
      userName: reelData.userName,
      userPhoto: reelData.userPhoto,
      userRole: reelData.userRole,
      title: '🎬 Novo Reel Publicado',
      content: params.caption,
      category: 'video',
      videoUrl: params.videoUrl,
      videoType: 'file',
      tags: params.tags || ['#Reels'],
      likes: [],
      commentsCount: 0,
      isReel: true,
      reelId: docRef.id,
      createdAt: serverTimestamp(),
      createdAtIso: new Date().toISOString()
    });
  } catch (e) {
    console.debug('[SocialService] Error mirroring reel to feed:', e);
  }

  return docRef.id;
}

/**
 * Toggle like on a Reel
 */
export async function toggleReelLike(reelId: string) {
  const user = auth.currentUser;
  if (!user || !reelId) return;

  try {
    const reelRef = doc(db, 'reels', reelId);
    const snap = await getDoc(reelRef);
    if (!snap.exists()) return;

    const data = snap.data();
    const likes: string[] = data.likes || [];
    const isLiked = likes.includes(user.uid);

    await updateDoc(reelRef, {
      likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
    });
  } catch (err) {
    console.error('[SocialService] Error liking reel:', err);
  }
}

/**
 * Subscribe to Reel comments
 */
export function subscribeToReelComments(reelId: string, callback: (comments: ReelComment[]) => void) {
  const q = query(
    collection(db, 'reels', reelId, 'comments'),
    orderBy('createdAt', 'asc'),
    limit(50)
  );

  return onSnapshot(q, (snapshot) => {
    const list: ReelComment[] = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    } as ReelComment));

    callback(list);
  }, (err) => {
    console.debug('[SocialService] Error fetching reel comments:', err);
    callback([]);
  });
}

/**
 * Add comment to a Reel
 */
export async function addReelComment(reelId: string, text: string) {
  const user = auth.currentUser;
  if (!user || !text.trim()) return;

  const commentData = {
    userId: user.uid,
    userName: user.displayName || user.email?.split('@')[0] || 'Membro',
    userPhoto: user.photoURL || '',
    text: text.trim(),
    createdAt: serverTimestamp(),
    createdAtIso: new Date().toISOString(),
    likes: []
  };

  await addDoc(collection(db, 'reels', reelId, 'comments'), commentData);

  // Increment comments count on reel document
  const reelRef = doc(db, 'reels', reelId);
  await updateDoc(reelRef, {
    commentsCount: increment(1)
  });
}
