import React, { useState, useRef, useEffect } from 'react';
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Bookmark, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Music, 
  Plus, 
  ChevronUp, 
  ChevronDown, 
  Send, 
  X, 
  UserCheck, 
  Sparkles,
  MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../../lib/firebase';
import { 
  SocialReel, 
  ReelComment, 
  toggleReelLike, 
  subscribeToReelComments, 
  addReelComment 
} from '../../services/socialService';

interface ReelsViewerProps {
  reels: SocialReel[];
  onOpenCreateReel: () => void;
}

export default function ReelsViewer({
  reels,
  onOpenCreateReel
}: ReelsViewerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [savedReels, setSavedReels] = useState<Set<string>>(new Set());
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  
  // Comments Drawer State
  const [commentsReelId, setCommentsReelId] = useState<string | null>(null);
  const [commentsList, setCommentsList] = useState<ReelComment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSendingComment, setIsSendingComment] = useState(false);

  // Share Toast
  const [showShareToast, setShowShareToast] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const lastTapRef = useRef<number>(0);

  const currentUser = auth.currentUser;
  const currentReel = reels[activeIndex];

  // Subscribe to comments when drawer opens
  useEffect(() => {
    if (!commentsReelId) return;
    const unsub = subscribeToReelComments(commentsReelId, (comments) => {
      setCommentsList(comments);
    });
    return () => unsub();
  }, [commentsReelId]);

  // Video play/pause management on active index change
  useEffect(() => {
    videoRefs.current.forEach((vid, idx) => {
      if (!vid) return;
      if (idx === activeIndex) {
        vid.currentTime = 0;
        vid.play().catch(e => console.debug('Reel autoplay error:', e));
        setIsPlaying(true);
      } else {
        vid.pause();
      }
    });
  }, [activeIndex, reels.length]);

  const handleNextReel = () => {
    if (activeIndex < reels.length - 1) {
      setActiveIndex(prev => prev + 1);
    }
  };

  const handlePrevReel = () => {
    if (activeIndex > 0) {
      setActiveIndex(prev => prev - 1);
    }
  };

  const handleVideoTap = (reel: SocialReel) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap -> Like
      handleLike(reel);
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 900);
    } else {
      // Single tap -> Play/Pause
      const video = videoRefs.current[activeIndex];
      if (video) {
        if (video.paused) {
          video.play();
          setIsPlaying(true);
        } else {
          video.pause();
          setIsPlaying(false);
        }
      }
    }
    lastTapRef.current = now;
  };

  const handleLike = async (reel: SocialReel) => {
    if (!reel.id) return;
    await toggleReelLike(reel.id);
  };

  const toggleSave = (reelId: string) => {
    setSavedReels(prev => {
      const next = new Set(prev);
      if (next.has(reelId)) next.delete(reelId);
      else next.add(reelId);
      return next;
    });
  };

  const toggleFollow = (userId: string) => {
    setFollowedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentsReelId || !newCommentText.trim() || isSendingComment) return;

    setIsSendingComment(true);
    try {
      await addReelComment(commentsReelId, newCommentText.trim());
      setNewCommentText('');
    } catch (err) {
      console.error('Error adding comment to reel:', err);
    } finally {
      setIsSendingComment(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 2500);
  };

  // If no reels yet, show an engaging empty/welcome state
  if (reels.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white mx-auto shadow-xl shadow-rose-500/20">
          <svg viewBox="0 0 24 24" className="w-10 h-10" fill="currentColor">
            <polygon points="10 8 16 12 10 16 10 8" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Reels da Comunidade</h3>
          <p className="text-sm text-white/60 mt-1">
            Seja o primeiro a publicar um vídeo de louvor, pregação ou momento especial da igreja!
          </p>
        </div>
        <button
          onClick={onOpenCreateReel}
          className="px-6 py-3 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-sm font-bold text-white shadow-lg active:scale-95 transition-all inline-flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Criar Primeiro Reel
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[calc(100vh-120px)] max-h-[820px] flex items-center justify-center select-none overflow-hidden my-1">
      {/* Desktop Up / Down Controls */}
      <div className="hidden lg:flex flex-col gap-3 absolute right-6 top-1/2 -translate-y-1/2 z-40">
        <button
          onClick={handlePrevReel}
          disabled={activeIndex === 0}
          className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-all disabled:opacity-30 disabled:pointer-events-none active:scale-90"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
        <button
          onClick={handleNextReel}
          disabled={activeIndex === reels.length - 1}
          className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-all disabled:opacity-30 disabled:pointer-events-none active:scale-90"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      </div>

      {/* Main Reels Mobile / Desktop Phone Viewport */}
      <div 
        ref={containerRef}
        className="relative w-full h-full max-w-[420px] bg-black rounded-none md:rounded-[36px] overflow-hidden border-0 md:border md:border-white/10 shadow-2xl flex flex-col justify-between"
      >
        {/* Top Overlay Bar */}
        <div className="absolute top-0 inset-x-0 z-30 p-4 pt-5 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            <span className="text-lg font-extrabold text-white tracking-tight">Reels</span>
          </div>

          <div className="flex items-center gap-3 pointer-events-auto">
            <button
              onClick={onOpenCreateReel}
              className="px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-xs font-bold text-white flex items-center gap-1.5 transition-all active:scale-95 shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              Novo Reel
            </button>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-all"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Video Canvas */}
        <div 
          onClick={() => currentReel && handleVideoTap(currentReel)}
          className="relative w-full h-full bg-neutral-950 flex items-center justify-center cursor-pointer"
        >
          <video
            ref={(el) => { videoRefs.current[activeIndex] = el; }}
            src={currentReel.videoUrl}
            loop
            playsInline
            muted={isMuted}
            className="w-full h-full object-cover"
          />

          {/* Pause overlay icon if user paused */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
              <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white shadow-2xl">
                <Play className="w-8 h-8 ml-1" />
              </div>
            </div>
          )}

          {/* Double Tap Big Heart Burst */}
          <AnimatePresence>
            {showHeartBurst && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.3, opacity: 1 }}
                exit={{ scale: 1.8, opacity: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
              >
                <Heart className="w-32 h-32 text-rose-500 fill-current drop-shadow-[0_0_24px_rgba(244,63,94,0.9)]" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom gradient shadow for readable text */}
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
        </div>

        {/* Right Floating Actions Column */}
        <div className="absolute right-3.5 bottom-16 z-30 flex flex-col items-center gap-4 text-white">
          {/* Like Button */}
          {(() => {
            const isLiked = currentUser ? currentReel.likes?.includes(currentUser.uid) : false;
            return (
              <button
                onClick={() => handleLike(currentReel)}
                className="flex flex-col items-center gap-1 group active:scale-125 transition-transform"
              >
                <div className={`p-2.5 rounded-full backdrop-blur-md ${
                  isLiked ? 'bg-rose-500/20 text-rose-500' : 'bg-black/40 text-white'
                }`}>
                  <Heart className={`w-7 h-7 ${isLiked ? 'fill-current' : ''}`} />
                </div>
                <span className="text-xs font-bold drop-shadow">
                  {(currentReel.likes?.length || 0) + (isLiked ? 0 : 0)}
                </span>
              </button>
            );
          })()}

          {/* Comments Button */}
          <button
            onClick={() => setCommentsReelId(currentReel.id)}
            className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
          >
            <div className="p-2.5 rounded-full bg-black/40 backdrop-blur-md text-white">
              <MessageSquare className="w-7 h-7" />
            </div>
            <span className="text-xs font-bold drop-shadow">
              {currentReel.commentsCount || 0}
            </span>
          </button>

          {/* Direct / Share Button */}
          <button
            onClick={handleShare}
            className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
          >
            <div className="p-2.5 rounded-full bg-black/40 backdrop-blur-md text-white">
              <Share2 className="w-7 h-7" />
            </div>
            <span className="text-xs font-bold drop-shadow">Compartilhar</span>
          </button>

          {/* Bookmark / Save Button */}
          <button
            onClick={() => toggleSave(currentReel.id)}
            className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
          >
            <div className={`p-2.5 rounded-full backdrop-blur-md ${
              savedReels.has(currentReel.id) ? 'bg-amber-500/20 text-amber-400' : 'bg-black/40 text-white'
            }`}>
              <Bookmark className={`w-7 h-7 ${savedReels.has(currentReel.id) ? 'fill-current' : ''}`} />
            </div>
          </button>

          {/* Rotating Vinyl Audio Disc */}
          <div className="w-10 h-10 rounded-full border-2 border-white/30 overflow-hidden bg-neutral-900 flex items-center justify-center animate-spin [animation-duration:5s] shadow-lg">
            <Music className="w-5 h-5 text-amber-300" />
          </div>
        </div>

        {/* Bottom Info Section */}
        <div className="absolute inset-x-0 bottom-4 z-30 px-4 pr-16 space-y-2 pointer-events-auto">
          {/* User info & Follow */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full p-[1.5px] bg-gradient-to-tr from-amber-400 to-rose-500 flex-shrink-0">
              <img
                src={currentReel.userPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={currentReel.userName}
                className="w-full h-full object-cover rounded-full bg-neutral-800"
              />
            </div>
            <span className="text-sm font-bold text-white drop-shadow truncate">
              {currentReel.userName}
            </span>

            {currentUser?.uid !== currentReel.userId && (
              <button
                onClick={() => toggleFollow(currentReel.userId)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${
                  followedUsers.has(currentReel.userId)
                    ? 'bg-white/20 border-white/30 text-white'
                    : 'bg-white text-black border-white hover:bg-white/90'
                }`}
              >
                {followedUsers.has(currentReel.userId) ? 'Abençoado' : 'Seguir'}
              </button>
            )}
          </div>

          {/* Caption */}
          <p className="text-xs text-white/90 leading-relaxed drop-shadow line-clamp-2">
            {currentReel.caption}
          </p>

          {/* Tags */}
          {currentReel.tags && currentReel.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {currentReel.tags.map((t, idx) => (
                <span key={idx} className="text-[11px] font-semibold text-blue-300 drop-shadow">
                  {t.startsWith('#') ? t : `#${t}`}
                </span>
              ))}
            </div>
          )}

          {/* Music Ticker */}
          <div className="flex items-center gap-2 text-[11px] text-white/80 font-medium">
            <Music className="w-3.5 h-3.5 animate-pulse text-amber-300" />
            <span className="truncate">{currentReel.musicTitle || 'Louvor & Adoração Oficial'}</span>
          </div>
        </div>
      </div>

      {/* Slide-up Comments Drawer */}
      <AnimatePresence>
        {commentsReelId && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-[#16161D] border-t border-white/10 rounded-t-[32px] max-h-[70vh] flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-white" />
                  <span className="text-sm font-bold text-white">Comentários ({commentsList.length})</span>
                </div>
                <button
                  onClick={() => setCommentsReelId(null)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Comments List */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-hide">
                {commentsList.length === 0 ? (
                  <div className="text-center py-10 text-white/40 text-xs">
                    Nenhum comentário ainda. Seja o primeiro a comentar com uma palavra de bênção!
                  </div>
                ) : (
                  commentsList.map((comm) => (
                    <div key={comm.id} className="flex gap-3 text-xs">
                      <div className="w-8 h-8 rounded-full bg-neutral-800 overflow-hidden flex-shrink-0">
                        {comm.userPhoto ? (
                          <img src={comm.userPhoto} alt={comm.userName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white font-bold bg-purple-900">
                            {comm.userName[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <span className="font-bold text-white">{comm.userName}</span>
                        <p className="text-white/80 leading-relaxed">{comm.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Input */}
              <form onSubmit={handleSendComment} className="p-3 border-t border-white/10 flex items-center gap-2 bg-[#101015]">
                <input
                  type="text"
                  placeholder="Escreva um comentário edificante..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-xs text-white placeholder-white/40 outline-none focus:border-white/40 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!newCommentText.trim() || isSendingComment}
                  className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shadow-md active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-transform"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Share Toast */}
      {showShareToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-white text-black text-xs font-bold shadow-2xl animate-bounce">
          Link do Reel copiado para compartilhamento!
        </div>
      )}
    </div>
  );
}
