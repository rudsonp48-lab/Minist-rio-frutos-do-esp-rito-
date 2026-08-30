import React, { useState, useEffect, useRef } from 'react';
import { X, Heart, Send, ChevronLeft, ChevronRight, Pause, Play, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../../lib/firebase';
import { UserStoryGroup, UserStory, markStoryViewed, toggleStoryLike } from '../../services/socialService';
import { sendChatMessage } from '../../services/chatService';

interface StoryViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyGroups: UserStoryGroup[];
  initialGroupIndex?: number;
}

export default function StoryViewerModal({
  isOpen,
  onClose,
  storyGroups,
  initialGroupIndex = 0
}: StoryViewerModalProps) {
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [sentFeedback, setSentFeedback] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressIntervalRef = useRef<any>(null);

  const currentGroup = storyGroups[groupIndex];
  const currentStory: UserStory | undefined = currentGroup?.stories[storyIndex];
  const currentUser = auth.currentUser;

  // Reset indices when modal opens
  useEffect(() => {
    if (isOpen) {
      setGroupIndex(initialGroupIndex);
      setStoryIndex(0);
      setProgress(0);
      setIsPaused(false);
    }
  }, [isOpen, initialGroupIndex]);

  // Mark story as viewed
  useEffect(() => {
    if (isOpen && currentStory?.id) {
      markStoryViewed(currentStory.id);
    }
  }, [isOpen, currentStory?.id]);

  // Handle Progress Timer
  useEffect(() => {
    if (!isOpen || !currentStory || isPaused) return;

    const duration = currentStory.mediaType === 'video' ? 12000 : 5000;
    const intervalTime = 50;
    const increment = (intervalTime / duration) * 100;

    setProgress(0);
    clearInterval(progressIntervalRef.current);

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressIntervalRef.current);
          handleNextStory();
          return 0;
        }
        return prev + increment;
      });
    }, intervalTime);

    return () => clearInterval(progressIntervalRef.current);
  }, [isOpen, groupIndex, storyIndex, isPaused, currentStory]);

  if (!isOpen || !currentGroup || !currentStory) return null;

  const isLiked = currentUser ? (currentStory.likes || []).includes(currentUser.uid) : false;

  const handleNextStory = () => {
    if (storyIndex < currentGroup.stories.length - 1) {
      setStoryIndex(prev => prev + 1);
      setProgress(0);
    } else if (groupIndex < storyGroups.length - 1) {
      setGroupIndex(prev => prev + 1);
      setStoryIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrevStory = () => {
    if (storyIndex > 0) {
      setStoryIndex(prev => prev - 1);
      setProgress(0);
    } else if (groupIndex > 0) {
      setGroupIndex(prev => prev - 1);
      const prevStories = storyGroups[groupIndex - 1].stories;
      setStoryIndex(prevStories.length - 1);
      setProgress(0);
    }
  };

  const handleLike = async () => {
    if (!currentStory?.id) return;
    await toggleStoryLike(currentStory.id);
  };

  const handleSendReaction = async (reaction: string) => {
    if (!currentUser || !currentGroup.userId) return;
    try {
      const channelId = `dm_${[currentUser.uid, currentGroup.userId].sort().join('_')}`;
      await sendChatMessage({
        channelId,
        text: `Reagiu ao seu Story: ${reaction} "${currentStory.caption || 'Publicação'}"`,
        isDirectMessage: true,
        participants: [currentUser.uid, currentGroup.userId]
      });
      setSentFeedback(true);
      setTimeout(() => setSentFeedback(false), 2000);
    } catch (e) {
      console.debug('Error sending reaction:', e);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !currentUser || !currentGroup.userId) return;

    setIsSendingReply(true);
    try {
      const channelId = `dm_${[currentUser.uid, currentGroup.userId].sort().join('_')}`;
      await sendChatMessage({
        channelId,
        text: `Respondendo ao Story: ${replyText.trim()}`,
        isDirectMessage: true,
        participants: [currentUser.uid, currentGroup.userId]
      });
      setReplyText('');
      setSentFeedback(true);
      setTimeout(() => setSentFeedback(false), 2000);
    } catch (e) {
      console.error('Error sending story reply:', e);
    } finally {
      setIsSendingReply(false);
    }
  };

  const getTimeAgo = (createdAt: any) => {
    if (!createdAt) return 'Recentemente';
    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    const diff = (Date.now() - date.getTime()) / 1000 / 60; // in minutes
    if (diff < 60) return `${Math.max(1, Math.floor(diff))}m atrás`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours}h atrás`;
    return '1d atrás';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center select-none overflow-hidden">
      {/* Desktop Prev Button */}
      <button
        onClick={handlePrevStory}
        disabled={groupIndex === 0 && storyIndex === 0}
        className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 items-center justify-center text-white transition-all disabled:opacity-30 disabled:pointer-events-none z-50"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      {/* Desktop Next Button */}
      <button
        onClick={handleNextStory}
        disabled={groupIndex === storyGroups.length - 1 && storyIndex === currentGroup.stories.length - 1}
        className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 items-center justify-center text-white transition-all disabled:opacity-30 disabled:pointer-events-none z-50"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Main Story Phone Canvas Container */}
      <div 
        className="relative w-full h-full max-w-[440px] max-h-[880px] md:h-[92vh] bg-black md:rounded-[36px] overflow-hidden flex flex-col justify-between shadow-2xl border border-white/10"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Media Background */}
        <div className="absolute inset-0 z-0 bg-neutral-950 flex items-center justify-center">
          {currentStory.mediaType === 'video' ? (
            <video
              ref={videoRef}
              src={currentStory.mediaUrl}
              autoPlay
              playsInline
              loop
              muted={isMuted}
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={currentStory.mediaUrl}
              alt="Story"
              className="w-full h-full object-cover"
            />
          )}
          {/* Subtle gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/80 pointer-events-none" />
        </div>

        {/* Tap Left / Right Hotspots */}
        <div className="absolute inset-0 z-10 grid grid-cols-2">
          <div 
            onClick={(e) => {
              e.stopPropagation();
              handlePrevStory();
            }} 
            className="h-full cursor-pointer" 
          />
          <div 
            onClick={(e) => {
              e.stopPropagation();
              handleNextStory();
            }} 
            className="h-full cursor-pointer" 
          />
        </div>

        {/* Top Header System */}
        <div className="relative z-20 p-4 pt-5 space-y-3">
          {/* Progress Bars */}
          <div className="flex items-center gap-1.5 w-full">
            {currentGroup.stories.map((s, idx) => {
              let fillPercent = 0;
              if (idx < storyIndex) fillPercent = 100;
              else if (idx === storyIndex) fillPercent = progress;

              return (
                <div key={s.id || idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-75 ease-linear rounded-full"
                    style={{ width: `${fillPercent}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* User Info & Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-amber-400 to-rose-500">
                <img
                  src={currentGroup.userPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={currentGroup.userName}
                  className="w-full h-full object-cover rounded-full bg-neutral-800"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white tracking-tight drop-shadow-md">
                    {currentGroup.userName}
                  </span>
                  <span className="text-[11px] text-white/70 font-medium">
                    {getTimeAgo(currentStory.createdAt)}
                  </span>
                </div>
                {currentGroup.userRole && (
                  <span className="text-[10px] text-amber-300 font-semibold uppercase tracking-wider block">
                    {currentGroup.userRole}
                  </span>
                )}
              </div>
            </div>

            {/* Top Action Icons */}
            <div className="flex items-center gap-2">
              {currentStory.mediaType === 'video' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted(!isMuted);
                  }}
                  className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-all"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPaused(!isPaused);
                }}
                className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-all"
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Center / Bottom Caption Content */}
        <div className="relative z-20 p-4 space-y-4">
          {currentStory.caption && (
            <div className="bg-black/60 backdrop-blur-md rounded-2xl p-3 border border-white/10 text-white text-sm leading-relaxed shadow-lg">
              <p>{currentStory.caption}</p>
            </div>
          )}

          {/* Quick Spiritual Reactions */}
          <div className="flex items-center justify-around py-1 bg-black/40 backdrop-blur-md rounded-full px-2 border border-white/10">
            {['🙏 Amém', '❤️ Glória', '🔥 Fogo', '🕊️ Paz', '👏 Aleluia'].map((r) => {
              const [emoji, label] = r.split(' ');
              return (
                <button
                  key={r}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSendReaction(r);
                  }}
                  className="px-2 py-1 rounded-full text-xs text-white/90 hover:scale-110 active:scale-95 transition-transform flex items-center gap-1"
                >
                  <span>{emoji}</span>
                  <span className="text-[10px] hidden sm:inline">{label}</span>
                </button>
              );
            })}
          </div>

          {/* Reply Bar */}
          <form onSubmit={handleSendReply} className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Responder a ${currentGroup.userName.split(' ')[0]}...`}
                className="w-full bg-black/60 backdrop-blur-md border border-white/20 rounded-full px-4 py-2.5 text-xs text-white placeholder-white/50 outline-none focus:border-white/60 transition-all"
              />
              {sentFeedback && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-emerald-400 font-bold animate-pulse">
                  Enviado!
                </span>
              )}
            </div>

            {replyText.trim() ? (
              <button
                type="submit"
                disabled={isSendingReply}
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform"
              >
                <Send className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLike();
                }}
                className={`w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center transition-transform active:scale-125 ${
                  isLiked ? 'text-rose-500' : 'text-white'
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
