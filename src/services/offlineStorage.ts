export interface OfflineItem {
  id: string;
  title: string;
  category: 'sermon' | 'podcast' | 'devotional' | 'bible';
  url: string;
  author?: string;
  duration?: string;
  savedAt: string;
  sizeMb?: number;
}

const STORAGE_KEY = 'ecclesia_offline_media';

export function getOfflineMedia(): OfflineItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveMediaOffline(item: Omit<OfflineItem, 'savedAt'>): boolean {
  try {
    const current = getOfflineMedia();
    if (current.some(i => i.id === item.id)) return true;

    const newItem: OfflineItem = {
      ...item,
      savedAt: new Date().toISOString()
    };

    const updated = [newItem, ...current];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('offline-media-updated'));
    return true;
  } catch (err) {
    console.error('Error saving media offline:', err);
    return false;
  }
}

export function removeOfflineMedia(id: string): void {
  try {
    const current = getOfflineMedia();
    const filtered = current.filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent('offline-media-updated'));
  } catch (err) {
    console.error('Error removing offline media:', err);
  }
}

export function isMediaDownloaded(id: string): boolean {
  const current = getOfflineMedia();
  return current.some(i => i.id === id);
}
