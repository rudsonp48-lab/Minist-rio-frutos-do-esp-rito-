export interface PrayerComment {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  content?: string;
  audioUrl?: string;
  audioDuration?: number;
  imageUrl?: string;
  createdAt: string;
  likes?: string[];
}

export type PostCategoryType = 
  | 'culto' 
  | 'noticia' 
  | 'video' 
  | 'oracao' 
  | 'testemunho' 
  | 'saude' 
  | 'familia' 
  | 'financas' 
  | 'espiritual' 
  | 'urgente' 
  | 'agradecimento' 
  | 'geral';

export interface CommunityPrayerPost {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  userPhoto?: string;
  title: string;
  content: string;
  category: PostCategoryType | string;
  isAnonymous: boolean;
  createdAtIso: string;
  likes: string[];
  commentsCount?: number;
  comments?: PrayerComment[];
  imageUrl?: string;
  imageUrls?: string[];
  videoUrl?: string;
  videoType?: 'file' | 'youtube' | 'external';
  videoThumbnail?: string;
  audioUrl?: string;
  audioDuration?: number;
  answered?: boolean;
  testimony?: string;
  isPinned?: boolean;
  location?: string;
  tags?: string[];
}

// Clean and reset: No AI generated publications or fake seeds
export const INITIAL_COMMUNITY_PRAYERS: CommunityPrayerPost[] = [];
