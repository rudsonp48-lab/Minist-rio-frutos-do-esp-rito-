import { useState, useEffect, useRef } from 'react';
import { Camera, Heart, MessageCircle, Share2, Plus, Loader2, Zap, Globe, Target, ChevronLeft, LayoutGrid, ImagePlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { compressImage } from '../lib/imageUtils';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';
import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';

interface Photo {
  id: string;
  url: string;
  image?: string;
  category: string;
  likes: number;
  user: string;
  userId: string;
  type?: 'image' | 'video' | string;
  createdAt: any;
}

function GalleryItem({ photo, handleLike }: { photo: Photo, handleLike: (id: string) => void }) {
  const [showHeart, setShowHeart] = useState(false);

  const onDoubleTap = () => {
    handleLike(photo.id);
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 1000);
  };

  const isVideo = photo.type === 'video' || (photo.url && typeof photo.url === 'string' && (photo.url.includes('.mp4') || photo.url.includes('video%2F')));

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="ios-card aspect-[4/5] md:aspect-square group relative overflow-hidden"
      onDoubleClick={onDoubleTap}
    >
      {isVideo ? (
        <video src={photo.url || photo.image || undefined} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 pointer-events-none" autoPlay muted loop playsInline />
      ) : (
        <img src={photo.url || photo.image || undefined} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 pointer-events-none select-none" alt="Gallery" />
      )}
      
      {/* Interactive Heart Animation Overlay for Double Tap */}
      <AnimatePresence>
        {showHeart && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1.5 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          >
             <Heart className="w-16 h-16 text-white fill-white drop-shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end justify-between text-white drop-shadow-md pb-4 pt-12">
        <button 
          onClick={(e) => { e.stopPropagation(); handleLike(photo.id); }}
          className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2 py-1 rounded-full text-[10px] font-bold active:scale-90 transition-transform"
        >
          <Heart className={`w-3 h-3 ${photo.likes > 0 ? 'fill-red-500 text-red-500' : ''}`} />
          {photo.likes}
        </button>
        <span className="text-[10px] text-white/80 font-medium">@{photo.user}</span>
      </div>
    </motion.div>
  );
}

export default function Gallery() {
  const [activeCategory, setActiveCategory] = useState('Tudo');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Form states
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [category, setCategory] = useState('Cultos');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setPhotos(DEFAULT_PHOTOS);
        setLoading(false);
        return;
      }
      const q = query(collection(db, 'photos'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const photoData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Photo[];
        setPhotos(photoData.length > 0 ? photoData : DEFAULT_PHOTOS);
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'photos');
        setLoading(false);
      });
      return () => unsubscribe();
    });
    return () => unsubAuth();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !auth.currentUser) return;

    setIsUploading(true);
    try {
      if (file.type.startsWith('video/')) {
        alert("Upload de vídeos não é suportado no momento.");
        return;
      }
      
      const downloadUrl = await compressImage(file);
      
      const fileType = 'image';

      // 2. Save metadata to Firestore
      await addDoc(collection(db, 'photos'), {
        url: downloadUrl,
        category,
        likes: 0,
        user: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Membro',
        userId: auth.currentUser.uid,
        type: fileType,
        createdAt: serverTimestamp()
      });
      
      setFile(null);
      setPreviewUrl(null);
      setShowUploadModal(false);
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Falha no upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleLike = async (photoId: string) => {
    try {
      await updateDoc(doc(db, 'photos', photoId), {
        likes: increment(1)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `photos/${photoId}`);
    }
  };

  const filteredPhotos = photos.filter(p => (activeCategory === 'Tudo' || p.category === activeCategory) && (p.url || p.image));

  return (
    <div className="min-h-screen pb-32">
      {/* iOS Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-40 ios-glass border-b border-black/[0.05] dark:border-white/[0.05] flex items-center justify-between px-6 h-16">
        <Link to="/" className="flex items-center gap-1 text-[var(--theme-color)] font-medium transition-opacity active:opacity-50">
          <ChevronLeft className="w-6 h-6" />
          <span>Ecclesia</span>
        </Link>
        <h1 className="text-[17px] font-bold tracking-tight absolute left-1/2 -translate-x-1/2">Galeria</h1>
        <div className="w-10"></div>
      </nav>

      <div className="pt-24 px-6 space-y-8 max-w-lg mx-auto">
        <header>
          <div className="flex items-center gap-2 mb-2">
            <LayoutGrid className="w-5 h-5 text-[#8E8E93]" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#8E8E93]">Acervo Digital</span>
          </div>
          <h2 className="text-4xl font-bold tracking-tighter">Momentos Sacros</h2>
        </header>

        {/* Categories Bar */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
          {['Tudo', 'Cultos', 'Jovens', 'Eventos', 'Música'].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                activeCategory === cat 
                  ? 'bg-black dark:bg-white text-white dark:text-black' 
                  : 'bg-black/5 dark:bg-white/5 text-[#8E8E93]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Photos Grid */}
        <div className="grid grid-cols-2 gap-4">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="aspect-square rounded-[2rem] bg-black/5 dark:bg-white/5 animate-pulse" />
            ))
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredPhotos.map((photo) => (
                <GalleryItem key={photo.id} photo={photo} handleLike={handleLike} />
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}

const DEFAULT_PHOTOS = [
  { id: '1', url: 'https://images.unsplash.com/photo-1544427920-c49ccfb85579', category: 'Cultos', likes: 12, user: 'Ecclesia', userId: 'system', createdAt: null },
  { id: '2', url: 'https://images.unsplash.com/photo-1510076857177-7470076d4098', category: 'Eventos', likes: 24, user: 'Ecclesia', userId: 'system', createdAt: null },
  { id: '3', url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7', category: 'Jovens', likes: 48, user: 'Ecclesia', userId: 'system', createdAt: null },
  { id: '4', url: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3', category: 'Cultos', likes: 33, user: 'Ecclesia', userId: 'system', createdAt: null },
];
