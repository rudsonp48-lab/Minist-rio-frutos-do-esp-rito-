export interface BannerItem {
  id: number | string;
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  videoUrl?: string;
  badge?: string;
}

export const DEFAULT_BANNERS: BannerItem[] = [];

export const RECENT_ITEMS: any[] = [];

export const TESTIMONIALS: any[] = [];

export const PODCASTS: any[] = [];

export const CONTINUE_WATCHING: any[] = [];

export const GALLERY_IMAGES: any[] = [];
