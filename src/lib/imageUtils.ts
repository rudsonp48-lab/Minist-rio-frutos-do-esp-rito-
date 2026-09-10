export interface ChristianAvatarPreset {
  id: string;
  label: string;
  role: string;
  url: string;
}

const makeSvgAvatar = (bg: string, symbol: string) => 
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="${encodeURIComponent(bg)}"/><text x="50" y="58" font-size="38" text-anchor="middle" dominant-baseline="middle" fill="white">${encodeURIComponent(symbol)}</text></svg>`;

export const CHRISTIAN_AVATAR_PRESETS: ChristianAvatarPreset[] = [
  {
    id: 'lider-1',
    label: 'Líder / Pastor',
    role: 'Pastor',
    url: makeSvgAvatar('#4f46e5', '✝')
  },
  {
    id: 'louvor-1',
    label: 'Louvor / Levita',
    role: 'Louvor',
    url: makeSvgAvatar('#9333ea', '🎵')
  },
  {
    id: 'oracao-1',
    label: 'Intercessão / Oração',
    role: 'Intercessão',
    url: makeSvgAvatar('#059669', '🕊️')
  },
  {
    id: 'mocidade-1',
    label: 'Mocidade / Jovens',
    role: 'Mocidade',
    url: makeSvgAvatar('#d97706', '🔥')
  },
  {
    id: 'diaconia-1',
    label: 'Diácono / Servo',
    role: 'Diaconia',
    url: makeSvgAvatar('#0284c7', '🤝')
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

