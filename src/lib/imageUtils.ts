export interface ChristianAvatarPreset {
  id: string;
  label: string;
  role: string;
  url: string;
}

export const CHRISTIAN_AVATAR_PRESETS: ChristianAvatarPreset[] = [
  {
    id: 'pastor-1',
    label: 'Pastor / Líder',
    role: 'Pastor',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250'
  },
  {
    id: 'pastora-1',
    label: 'Pastora / Ministra',
    role: 'Pastora',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
  },
  {
    id: 'levita-1',
    label: 'Levita / Louvor',
    role: 'Ministério de Louvor',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250'
  },
  {
    id: 'intercessora-1',
    label: 'Intercessora / Oração',
    role: 'Intercessão',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250'
  },
  {
    id: 'lider-celula-1',
    label: 'Líder de Célula',
    role: 'Líder de Célula',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250'
  },
  {
    id: 'jovem-1',
    label: 'Jovem Cristão',
    role: 'Mocidade',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250'
  },
  {
    id: 'jovem-2',
    label: 'Jovem Cristã',
    role: 'Mocidade',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=250'
  },
  {
    id: 'diacono-1',
    label: 'Diácono / Servo',
    role: 'Diaconia',
    url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=250'
  }
];

/**
 * Converts a File object directly to a Base64 Data URL string safely
 */
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve((reader.result as string) || '');
    };
    reader.onerror = () => {
      resolve('');
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Compresses an image file with multiple fail-safes.
 * Always resolves to a valid base64 data URL (either compressed or original fallback).
 * Supports ALL formats: JPG, PNG, WEBP, GIF (animated preserved), HEIC, HEIF, AVIF, BMP, SVG, TIFF.
 */
export const compressImage = async (file: File, maxDim: number = 1080, quality: number = 0.8): Promise<string> => {
  // Step 1: Always obtain the raw data URL first as an absolute guarantee
  const rawDataUrl = await fileToDataUrl(file);
  if (!rawDataUrl) return '';

  const fileName = (file.name || '').toLowerCase();
  const fileType = (file.type || '').toLowerCase();

  // For GIFs (preserve animation) and SVGs (vector), return raw data URL directly
  if (fileType.includes('gif') || fileName.endsWith('.gif') || fileType.includes('svg') || fileName.endsWith('.svg')) {
    return rawDataUrl;
  }

  // Step 2: Try Canvas compression for JPG, PNG, WEBP, HEIC, AVIF, BMP, TIFF
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          if (!width || !height) {
            resolve(rawDataUrl);
            return;
          }

          if (width > height && width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }

          canvas.width = Math.max(1, Math.round(width));
          canvas.height = Math.max(1, Math.round(height));

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawDataUrl);
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const compressedUrl = canvas.toDataURL('image/jpeg', quality);
          if (compressedUrl && compressedUrl.length > 50) {
            resolve(compressedUrl);
          } else {
            resolve(rawDataUrl);
          }
        } catch (e) {
          console.warn('Canvas processing error, using raw image:', e);
          resolve(rawDataUrl);
        }
      };

      img.onerror = () => {
        resolve(rawDataUrl);
      };

      img.src = rawDataUrl;
    } catch (err) {
      console.warn('Image compression fallback triggered:', err);
      resolve(rawDataUrl);
    }
  });
};

/**
 * Compresses an image specifically for user profile avatars (square cropped & optimized)
 */
export const compressAvatar = async (file: File, size: number = 320, quality: number = 0.8): Promise<string> => {
  if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
    try {
      const bitmap = await createImageBitmap(file);
      const { width, height } = bitmap;
      if (width > 0 && height > 0) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          const minDim = Math.min(width, height);
          const startX = (width - minDim) / 2;
          const startY = (height - minDim) / 2;
          ctx.drawImage(bitmap, startX, startY, minDim, minDim, 0, 0, size, size);
          bitmap.close();
          return canvas.toDataURL('image/jpeg', quality);
        }
      }
      bitmap.close();
    } catch (e) {
      console.warn('Avatar createImageBitmap failed:', e);
    }
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return resolve('');

      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            const width = img.naturalWidth || img.width;
            const height = img.naturalHeight || img.height;
            const minDim = Math.min(width, height);
            const startX = (width - minDim) / 2;
            const startY = (height - minDim) / 2;
            ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
            return resolve(canvas.toDataURL('image/jpeg', quality));
          }
          resolve(dataUrl);
        } catch {
          resolve(dataUrl);
        }
      };

      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    };

    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
};

/**
 * Returns a safe URL for Firebase Auth photoURL (which has a 2048 character limit).
 * If photoUrl is an HTTP/HTTPS url, it returns it directly.
 * If photoUrl is a large data URI or undefined, it generates a clean UI avatar URL.
 */
export const getSafeAuthPhotoUrl = (nameOrEmail: string, photoUrl?: string): string => {
  if (photoUrl && photoUrl.startsWith('http') && photoUrl.length < 1500) {
    return photoUrl;
  }
  const cleanName = encodeURIComponent((nameOrEmail || 'Membro').trim());
  return `https://ui-avatars.com/api/?name=${cleanName}&background=8A2BE2&color=fff&size=200&bold=true`;
};

