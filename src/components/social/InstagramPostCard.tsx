import React, { useState, useRef, useEffect } from 'react';
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Bookmark, 
  MoreHorizontal, 
  Send, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  Check, 
  MapPin, 
  Sparkles,
  Smile,
  Mic,
  Square
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../../lib/firebase';
import { 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  collection, 
  addDoc, 
  serverTimestamp, 
  onSnapshot, 
  query, 
  orderBy, 
  deleteDoc,
  increment
} from 'firebase/firestore';
import { SocialPost } from '../../services/socialService';

interface InstagramPostCardProps {
  post: SocialPost;
  onOpenStory?: (userId: string) => void;
  onTagClick?: (tag: string) => void;
}

export default function InstagramPostCard({
  post,
  onOpenStory,
  onTagClick
}: InstagramPostCardProps) {
  const currentUser = auth.currentUser;
  const isOwner = currentUser?.uid === post.userId;
  const isAdmin = currentUser?.email === 'rudson.p48@gmail.com';
  const isLiked = currentUser ? (post.likes || []).includes(currentUser.uid) : false;

  const [likesList, setLikesList] = useState<string[]>(post.likes || []);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);

  // Multi-image Carousel Index
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const allImages = (post.imageUrls && post.imageUrls.length > 0)
    ? post.imageUrls
    : post.imageUrl ? [post.imageUrl] : [];

  // Video playback
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastTapRef = useRef<number>(0);

  // Comments state
  const [showComments, setShowComments] = useState(false);
  const [commentsList, setCommentsList] = useState<any[]>(post.comments || []);
  const [commentText, setCommentText] = useState('');
  const [isSendingComment, setIsSendingComment] = useState(false);

  // Sync likes
  useEffect(() => {
    if (post.likes) setLikesList(post.likes);
  }, [post.likes]);

  // Subscribe to real-time comments for this post
  useEffect(() => {
    if (!post.id || post.id.startsWith('seed-')) {
      if (post.comments) setCommentsList(post.comments);
      return;
    }

    const q = query(
      collection(db, 'prayers', post.id, 'comments'),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const live = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setCommentsList(live);
    }, (err) => console.debug('Comments sub error:', err));

    return () => unsub();
  }, [post.id]);

  const handleMediaTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap -> Like with huge heart pop
      if (!isLiked) handleLikeToggle();
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 900);
    } else if (post.videoUrl) {
      // Single tap on video -> Play/Pause
      if (videoRef.current) {
        if (videoRef.current.paused) {
          videoRef.current.play();
          setIsPlaying(true);
        } else {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      }
    }
    lastTapRef.current = now;
  };

  const handleLikeToggle = async () => {
    if (!currentUser) return;
    const currentUid = currentUser.uid;
    const willLike = !likesList.includes(currentUid);

    // Optimistic UI
    const updatedLikes = willLike
      ? [...likesList, currentUid]
      : likesList.filter(id => id !== currentUid);
    setLikesList(updatedLikes);

    if (post.id && !post.id.startsWith('seed-')) {
      try {
        const postRef = doc(db, 'prayers', post.id);
        await updateDoc(postRef, {
          likes: willLike ? arrayUnion(currentUid) : arrayRemove(currentUid)
        });
      } catch (err) {
        console.error('Error toggling like:', err);
      }
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !currentUser) return;

    const textToSend = commentText.trim();
    setCommentText('');
    setIsSendingComment(true);

    const newCommentData = {
      userId: currentUser.uid,
      userName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Membro',
      userPhoto: currentUser.photoURL || '',
      userRole: currentUser.email === 'rudson.p48@gmail.com' ? 'Pastor / Administrador' : 'Membro',
      text: textToSend,
      createdAt: serverTimestamp(),
      createdAtIso: new Date().toISOString()
    };

    if (post.id && !post.id.startsWith('seed-')) {
      try {
        await addDoc(collection(db, 'prayers', post.id, 'comments'), newCommentData);
        await updateDoc(doc(db, 'prayers', post.id), {
          commentsCount: increment(1)
        });
      } catch (err) {
        console.error('Error adding comment:', err);
      } finally {
        setIsSendingComment(false);
      }
    } else {
      setCommentsList(prev => [...prev, { ...newCommentData, id: `local-${Date.now()}` }]);
      setIsSendingComment(false);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('Deseja realmente excluir esta publicação?')) return;
    if (post.id && !post.id.startsWith('seed-')) {
      try {
        await deleteDoc(doc(db, 'prayers', post.id));
      } catch (err) {
        console.error('Error deleting post:', err);
      }
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 2000);
  };

  const getTimeAgo = (createdAt: any) => {
    if (!createdAt) return 'Recentemente';
    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    const diff = (Date.now() - date.getTime()) / 1000 / 60; // minutes
    if (diff < 60) return `${Math.max(1, Math.floor(diff))}m`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  return (
    <article className="w-full bg-[#121217] border border-white/10 rounded-2xl md:rounded-[28px] overflow-hidden shadow-xl mb-4 transition-all">
      {/* 1. Header: Avatar + Username + Role + Three Dots */}
      <div className="p-3.5 sm:p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar with subtle gradient ring */}
          <div 
            onClick={() => onOpenStory && onOpenStory(post.userId)}
            className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 cursor-pointer flex-shrink-0"
          >
            <div className="w-full h-full rounded-full bg-black overflow-hidden p-[1px]">
              {post.userPhoto ? (
                <img
                  src={post.userPhoto}
                  alt={post.userName}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-purple-800 to-indigo-900 flex items-center justify-center text-white font-bold text-sm">
                  {post.userName[0]?.toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* User Details */}
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-white tracking-tight hover:underline cursor-pointer">
                {post.userName}
              </span>
              {post.userRole && (
                <span className="text-[10px] font-semibold text-amber-300 bg-amber-500/15 border border-amber-500/20 px-1.5 py-0.2 rounded-md">
                  {post.userRole.split('/')[0].trim()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-white/50">
              {post.location && (
                <span className="flex items-center gap-0.5 truncate max-w-[140px]">
                  <MapPin className="w-3 h-3 text-rose-400" />
                  {post.location}
                </span>
              )}
              <span>•</span>
              <span>{getTimeAgo(post.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Options Menu Button */}
        <div className="relative">
          <button
            onClick={() => setShowOptionsMenu(!showOptionsMenu)}
            className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {showOptionsMenu && (
            <div className="absolute right-0 top-10 w-44 bg-[#1C1C24] border border-white/10 rounded-2xl shadow-2xl py-1.5 z-30 space-y-0.5">
              <button
                onClick={() => {
                  handleShare();
                  setShowOptionsMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-xs text-white/80 hover:bg-white/10 flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Copiar Link do Post
              </button>
              {(isOwner || isAdmin) && (
                <button
                  onClick={() => {
                    handleDeletePost();
                    setShowOptionsMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir Publicação
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Media Section (Photos Carousel / Video) */}
      {(allImages.length > 0 || post.videoUrl) && (
        <div 
          onClick={handleMediaTap}
          className="relative w-full aspect-square sm:aspect-[4/3] bg-black overflow-hidden flex items-center justify-center cursor-pointer select-none"
        >
          {/* Video Player */}
          {post.videoUrl ? (
            <>
              <video
                ref={videoRef}
                src={post.videoUrl}
                autoPlay
                loop
                playsInline
                muted={isMuted}
                className="w-full h-full object-cover"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                }}
                className="absolute bottom-3 right-3 p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black transition-all z-10"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </>
          ) : allImages.length > 0 ? (
            /* Multi-Image Carousel */
            <>
              <img
                src={allImages[currentImageIndex]}
                alt="Post content"
                className="w-full h-full object-cover transition-transform duration-300"
              />

              {/* Carousel Arrows if multiple images */}
              {allImages.length > 1 && (
                <>
                  {currentImageIndex > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex(prev => prev - 1);
                      }}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black transition-all z-10"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}
                  {currentImageIndex < allImages.length - 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex(prev => prev + 1);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black transition-all z-10"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}

                  {/* Top Right Counter (e.g. 1/3) */}
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-bold text-white z-10">
                    {currentImageIndex + 1}/{allImages.length}
                  </div>
                </>
              )}
            </>
          ) : null}

          {/* Double Tap Heart Pop Animation */}
          <AnimatePresence>
            {showHeartBurst && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.3, opacity: 1 }}
                exit={{ scale: 1.8, opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
              >
                <Heart className="w-28 h-28 text-rose-500 fill-current drop-shadow-[0_0_20px_rgba(244,63,94,0.9)]" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Carousel Indicator Dots if multiple photos */}
      {allImages.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 py-2">
          {allImages.map((_, idx) => (
            <div
              key={idx}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                idx === currentImageIndex ? 'w-4 bg-purple-400' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      )}

      {/* 3. Action Buttons Row (Like, Comment, Direct, Save) */}
      <div className="p-3 sm:p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Like Heart */}
            <button
              onClick={handleLikeToggle}
              className={`transition-transform active:scale-125 ${
                likesList.includes(currentUser?.uid || '') ? 'text-rose-500' : 'text-white/80 hover:text-white'
              }`}
            >
              <Heart className={`w-6 h-6 ${likesList.includes(currentUser?.uid || '') ? 'fill-current' : ''}`} />
            </button>

            {/* Comment Bubble */}
            <button
              onClick={() => setShowComments(!showComments)}
              className="text-white/80 hover:text-white transition-transform active:scale-95"
            >
              <MessageSquare className="w-6 h-6" />
            </button>

            {/* Direct Airplane */}
            <button
              onClick={handleShare}
              className="text-white/80 hover:text-white transition-transform active:scale-95"
            >
              <Send className="w-6 h-6 rotate-12" />
            </button>
          </div>

          {/* Save / Bookmark Ribbon */}
          <button
            onClick={() => setIsSaved(!isSaved)}
            className={`transition-transform active:scale-95 ${
              isSaved ? 'text-amber-400' : 'text-white/80 hover:text-white'
            }`}
          >
            <Bookmark className={`w-6 h-6 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Likes Count */}
        <div className="mt-2 text-xs font-bold text-white">
          {likesList.length === 0 ? (
            <span className="text-white/60 font-normal">Seja o primeiro a curtir</span>
          ) : likesList.length === 1 ? (
            <span>1 curtida</span>
          ) : (
            <span>{likesList.length} curtidas</span>
          )}
        </div>

        {/* 4. Caption & Tags */}
        <div className="mt-1.5 text-xs text-white leading-relaxed">
          <span className="font-bold mr-1.5 hover:underline cursor-pointer">{post.userName}</span>
          <span className="text-white/90">
            {post.content && post.content.length > 140 && !showFullCaption ? (
              <>
                {post.content.slice(0, 140)}...
                <button
                  onClick={() => setShowFullCaption(true)}
                  className="text-white/50 font-semibold ml-1 hover:text-white"
                >
                  mais
                </button>
              </>
            ) : (
              post.content
            )}
          </span>

          {/* Hashtags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
              {post.tags.map((t, idx) => (
                <span
                  key={idx}
                  onClick={() => onTagClick && onTagClick(t)}
                  className="text-purple-400 hover:text-purple-300 font-semibold cursor-pointer"
                >
                  {t.startsWith('#') ? t : `#${t}`}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 5. View Comments Expander */}
        {commentsList.length > 0 && (
          <button
            onClick={() => setShowComments(!showComments)}
            className="mt-1 text-xs text-white/50 hover:text-white/80 block font-medium"
          >
            {showComments ? 'Ocultar comentários' : `Ver todos os ${commentsList.length} comentários`}
          </button>
        )}

        {/* Comments Box */}
        {showComments && (
          <div className="mt-3 pt-3 border-t border-white/10 space-y-2.5 max-h-48 overflow-y-auto scrollbar-hide">
            {commentsList.map((comm) => (
              <div key={comm.id} className="text-xs flex items-start gap-2">
                <span className="font-bold text-white shrink-0">{comm.userName}</span>
                <span className="text-white/80">{comm.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* 6. Quick Comment Input Bar */}
        <form onSubmit={handleAddComment} className="mt-3 pt-2.5 border-t border-white/5 flex items-center gap-2">
          {/* Quick Reaction Emojis */}
          <div className="flex items-center gap-1">
            {['❤️', '🙏', '🔥', '👏'].map(emoji => (
              <button
                key={emoji}
                type="button"
                onClick={() => setCommentText(prev => prev + emoji)}
                className="text-xs p-1 hover:scale-125 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Adicione um comentário..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="flex-1 bg-transparent text-xs text-white placeholder-white/40 outline-none"
          />

          {commentText.trim() && (
            <button
              type="submit"
              disabled={isSendingComment}
              className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors"
            >
              Publicar
            </button>
          )}
        </form>
      </div>

      {/* Share Toast */}
      {showShareToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-white text-black text-xs font-bold shadow-2xl animate-bounce">
          Link do post copiado!
        </div>
      )}
    </article>
  );
}
