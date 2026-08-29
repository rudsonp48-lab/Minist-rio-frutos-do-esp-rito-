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

export const compressImage = (file: File, maxDim: number = 1000, quality: number = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > height && width > maxDim) {
          height *= maxDim / width;
          width = maxDim;
        } else if (height > maxDim) {
          width *= maxDim / height;
          height = maxDim;
        }
        
        canvas.width = Math.round(width);
        canvas.height = Math.round(height);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

/**
 * Compresses an image specifically for user profile avatars (square cropped & optimized)
 */
export const compressAvatar = (file: File, size: number = 320, quality: number = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Calculate square crop from center
        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;

        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);

        // Export as optimized jpeg
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
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

