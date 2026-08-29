import React, { useState, useRef, useEffect } from 'react';
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Sparkles, 
  Mic, 
  Square, 
  Send, 
  Check, 
  Volume2, 
  Flame, 
  Trash2, 
  CheckCircle2, 
  Smile, 
  Pin, 
  MoreHorizontal,
  Clock,
  UserCheck,
  AlertCircle,
  Image as ImageIcon,
  Film,
  Play,
  Pause,
  Maximize2,
  X,
  MapPin,
  Tag,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  CheckCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../lib/firebase';
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
  deleteDoc 
} from 'firebase/firestore';
import { notifyPrayerIntercession } from '../services/notificationService';
import VoicePrayerPlayer from './VoicePrayerPlayer';
import { VoiceRecorder, RecordedAudio } from '../services/audioRecorder';

export interface PrayerPostData {
  id: string;
  userId: string;
  userName: string;
  userRole?: string;
  userPhoto?: string;
  title?: string;
  content: string;
  category?: string;
  isAnonymous?: boolean;
  createdAt?: any;
  createdAtIso?: string;
  likes?: string[];
  commentsCount?: number;
  comments?: any[];
  audioUrl?: string;
  audioDuration?: number;
  imageUrl?: string;
  imageUrls?: string[];
  videoUrl?: string;
  videoType?: 'file' | 'youtube' | 'external';
  videoThumbnail?: string;
  answered?: boolean;
  testimony?: string;
  isPinned?: boolean;
  location?: string;
  tags?: string[];
}

interface SocialPrayerCardProps {
  prayer: PrayerPostData;
  onOpenAiAssistant?: (prayer: PrayerPostData) => void;
  onOpenTestimonyModal?: (prayer: PrayerPostData) => void;
  onTagClick?: (tag: string) => void;
}

const SPIRITUAL_REACTIONS = [
  { emoji: '❤️', label: 'Abençoado' },
  { emoji: '🙏', label: 'Amém' },
  { emoji: '🔥', label: 'Glória a Deus' },
  { emoji: '🕊️', label: 'Paz' },
  { emoji: '👏', label: 'Aleluia' },
];

export default function SocialPrayerCard({
  prayer,
  onOpenAiAssistant,
  onOpenTestimonyModal,
  onTagClick
}: SocialPrayerCardProps) {
  const currentUser = auth.currentUser;
  const isLiked = currentUser ? (prayer.likes || []).includes(currentUser.uid) : false;
  const isOwner = currentUser?.uid === prayer.userId;
  const isAdmin = currentUser?.email === 'rudson.p48@gmail.com';

  const [likesList, setLikesList] = useState<string[]>(prayer.likes || []);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentImageUrl, setCommentImageUrl] = useState<string | null>(null);
  const [commentsList, setCommentsList] = useState<any[]>(prayer.comments || []);
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [prayingFeedback, setPrayingFeedback] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);

  // Lightbox Media Viewer State
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  // Audio Recording for Comments
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState<RecordedAudio | null>(null);
  const recorderRef = useRef<VoiceRecorder | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // All photos array
  const allImages = (prayer.imageUrls && prayer.imageUrls.length > 0) 
    ? prayer.imageUrls 
    : prayer.imageUrl ? [prayer.imageUrl] : [];

  // Synchronize likes from props
  useEffect(() => {
    if (prayer.likes) setLikesList(prayer.likes);
  }, [prayer.likes]);

  // Real-time comments listener
  useEffect(() => {
    if (!prayer.id || prayer.id.startsWith('seed-')) {
      if (prayer.comments) setCommentsList(prayer.comments);
      return;
    }

    const commentsQuery = query(
      collection(db, 'prayers', prayer.id, 'comments'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      const liveComments = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      setCommentsList(liveComments);
    }, (err) => {
      console.debug('[SocialPrayerCard] Comments snapshot fallback:', err);
    });

    return () => unsubscribe();
  }, [prayer.id, prayer.comments]);

  // Toggle Like / Intercession
  const handleToggleLike = async () => {
    if (!currentUser) {
      alert('Faça login para curtir e interceder pelos irmãos.');
      return;
    }

    const newLiked = !isLiked;
    const updatedLikes = newLiked 
      ? [...likesList, currentUser.uid]
      : likesList.filter(id => id !== currentUser.uid);

    setLikesList(updatedLikes);

    if (newLiked) {
      setPrayingFeedback(true);
      setTimeout(() => setPrayingFeedback(false), 2000);
    }

    if (!prayer.id.startsWith('seed-')) {
      try {
        const prayerRef = doc(db, 'prayers', prayer.id);
        await updateDoc(prayerRef, {
          likes: newLiked ? arrayUnion(currentUser.uid) : arrayRemove(currentUser.uid)
        });

        if (newLiked && prayer.userId !== currentUser.uid) {
          notifyPrayerIntercession({
            prayerId: prayer.id,
            prayerTitle: prayer.title || prayer.content || 'Publicação',
            authorUid: prayer.userId,
            authorName: prayer.userName
          }).catch(console.error);
        }
      } catch (err) {
        console.error('Error toggling like:', err);
      }
    }
  };

  // Quick Emoji Reaction
  const handleQuickReaction = (reaction: string) => {
    setCommentText(prev => (prev ? `${prev} ${reaction}` : reaction));
    setShowComments(true);
  };

  // Start Comment Voice Recording
  const startCommentRecording = async () => {
    try {
      const recorder = new VoiceRecorder();
      recorderRef.current = recorder;
      await recorder.start();
      setIsRecordingAudio(true);
      setRecordingDuration(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone error:', err);
      alert('Não foi possível acessar o microfone.');
    }
  };

  const stopCommentRecording = async () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (!recorderRef.current) return;

    try {
      const audioResult = await recorderRef.current.stop();
      setRecordedAudio(audioResult);
      setIsRecordingAudio(false);
    } catch (err) {
      console.error('Error stopping recorder:', err);
      setIsRecordingAudio(false);
    }
  };

  const cancelCommentRecording = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (recorderRef.current) recorderRef.current.cancel();
    setIsRecordingAudio(false);
    setRecordedAudio(null);
    setRecordingDuration(0);
  };

  // Handle Comment Image Selection
  const handleCommentImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCommentImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Send Comment
  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Faça login para comentar nos posts.');
      return;
    }

    if (!commentText.trim() && !recordedAudio && !commentImageUrl) return;

    setIsSendingComment(true);
    const newComment = {
      userId: currentUser.uid,
      userName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Irmão em Cristo',
      userPhoto: currentUser.photoURL || '',
      content: commentText.trim(),
      audioUrl: recordedAudio ? recordedAudio.dataUrl : '',
      audioDuration: recordedAudio ? recordedAudio.durationSeconds : 0,
      imageUrl: commentImageUrl || '',
      createdAt: 'Agora mesmo'
    };

    if (prayer.id.startsWith('seed-')) {
      setCommentsList(prev => [...prev, { ...newComment, id: `c-${Date.now()}` }]);
      setCommentText('');
      setRecordedAudio(null);
      setCommentImageUrl(null);
      setIsSendingComment(false);
      return;
    }

    try {
      await addDoc(collection(db, 'prayers', prayer.id, 'comments'), {
        ...newComment,
        createdAt: serverTimestamp()
      });

      const prayerRef = doc(db, 'prayers', prayer.id);
      await updateDoc(prayerRef, {
        commentsCount: (commentsList.length || 0) + 1
      });

      setCommentText('');
      setRecordedAudio(null);
      setCommentImageUrl(null);
    } catch (err) {
      console.error('Error posting comment:', err);
    } finally {
      setIsSendingComment(false);
    }
  };

  // Delete Post
  const handleDeletePost = async () => {
    if (!confirm('Deseja excluir esta publicação da comunidade?')) return;
    try {
      if (!prayer.id.startsWith('seed-')) {
        await deleteDoc(doc(db, 'prayers', prayer.id));
      }
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  // Share Post on WhatsApp or Native Share
  const handleShare = () => {
    const postTitle = prayer.title || prayer.content.slice(0, 50);
    const shareText = `*${prayer.userName} compartilhou no Feed da Igreja:*\n\n"${postTitle}"\n\nConfira na Rede Social da Igreja: ${window.location.origin}/prayers`;
    
    if (navigator.share) {
      navigator.share({
        title: postTitle,
        text: shareText,
        url: window.location.href,
      }).catch(() => {});
    } else {
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
      window.open(whatsappUrl, '_blank');
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2500);
    }
  };

  // Helper for YouTube embed
  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11)
      ? `https://www.youtube-nocookie.com/embed/${match[2]}?autoplay=0&rel=0`
      : null;
  };

  const getCategoryBadge = (cat?: string) => {
    switch (cat) {
      case 'culto':
        return { label: '📸 Relato de Culto', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
      case 'video':
        return { label: '🎥 Vídeo & Louvor', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
      case 'noticia':
        return { label: '🌍 Mundo Cristão', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'urgente':
        return { label: '🚨 Causa Urgente', color: 'bg-red-500/20 text-red-300 border-red-500/30' };
      case 'saude':
        return { label: '🩺 Saúde & Cura', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
      case 'familia':
        return { label: '🏡 Família & Lar', color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' };
      case 'financas':
        return { label: '💼 Trabalho & Provisão', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      case 'agradecimento':
      case 'testemunho':
        return { label: '🎉 Testemunho', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' };
      case 'espiritual':
        return { label: '🕊️ Vida Espiritual', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
      default:
        return { label: '✨ Comunidade Gospel', color: 'bg-white/10 text-white/80 border-white/10' };
    }
  };

  const badge = getCategoryBadge(prayer.category);
  const ytEmbed = prayer.videoUrl ? getYouTubeEmbedUrl(prayer.videoUrl) : null;

  return (
    <article 
      id={`feed-post-${prayer.id}`}
      className={`rounded-[32px] bg-[#14141A] border transition-all duration-300 shadow-xl overflow-hidden ${
        prayer.isPinned 
          ? 'border-purple-500/40 bg-gradient-to-b from-[#181424] to-[#121217]' 
          : prayer.answered 
            ? 'border-amber-500/30 bg-gradient-to-b from-[#191512] to-[#121217]' 
            : 'border-white/10 hover:border-white/20'
      }`}
    >
      {/* Pinned / Victory Ribbon Top */}
      {prayer.isPinned && (
        <div className="px-6 py-1.5 bg-gradient-to-r from-purple-600/30 to-indigo-600/30 border-b border-purple-500/20 flex items-center justify-between text-[11px] font-bold text-purple-300">
          <span className="flex items-center gap-1.5">
            <Pin className="w-3.5 h-3.5 fill-purple-400 text-purple-400" />
            Publicação Fixada pela Liderança Pastoral
          </span>
          <span className="text-[10px] text-purple-400/70 uppercase tracking-widest">Destaque</span>
        </div>
      )}

      {prayer.answered && (
        <div className="px-6 py-1.5 bg-gradient-to-r from-amber-600/30 to-yellow-600/30 border-b border-amber-500/20 flex items-center justify-between text-[11px] font-bold text-amber-300">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
            Vitória Alcançada & Oração Respondida!
          </span>
          <span className="text-[10px] text-amber-400/80 uppercase tracking-widest">Testemunho</span>
        </div>
      )}

      {/* Main Card Content */}
      <div className="p-5 sm:p-7 space-y-4">
        {/* Header: Author Avatar, Name, Ministry Badge, Category & Time */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-rose-500 p-[2px] shadow-md shrink-0">
                {prayer.isAnonymous ? (
                  <div className="w-full h-full bg-[#1C1C24] rounded-[14px] flex items-center justify-center text-white/50">
                    <UserCheck className="w-5 h-5" />
                  </div>
                ) : prayer.userPhoto ? (
                  <img
                    src={prayer.userPhoto}
                    alt={prayer.userName}
                    className="w-full h-full object-cover rounded-[14px]"
                  />
                ) : (
                  <div className="w-full h-full bg-[#1C1C24] rounded-[14px] flex items-center justify-center font-bold text-white text-base">
                    {prayer.userName?.charAt(0) || '✝'}
                  </div>
                )}
              </div>
              {prayer.userRole?.includes('Pastor') && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 border-2 border-[#14141A] flex items-center justify-center text-[10px] text-black font-black" title="Liderança Pastoral">
                  ✝
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                  {prayer.isAnonymous ? 'Irmão(ã) em Cristo (Anônimo)' : prayer.userName}
                </h3>
                {prayer.userRole && !prayer.isAnonymous && (
                  <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-[10px] font-semibold text-white/70">
                    {prayer.userRole}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-white/40 mt-0.5 flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {prayer.createdAtIso ? new Date(prayer.createdAtIso).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Recente'}
                </span>
                {prayer.location && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-purple-300/80">
                      <MapPin className="w-3 h-3 text-purple-400" />
                      {prayer.location}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Action Badges & Menu */}
          <div className="flex items-center gap-2 shrink-0">
            <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1 ${badge.color}`}>
              {badge.label}
            </span>

            {(isOwner || isAdmin) && (
              <button
                onClick={handleDeletePost}
                className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
                title="Excluir post"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Post Title */}
        {prayer.title && (
          <h4 className="text-base sm:text-lg font-display font-bold text-white tracking-tight leading-snug">
            {prayer.title}
          </h4>
        )}

        {/* Post Text Content */}
        <p className="text-sm sm:text-base text-white/80 leading-relaxed font-normal whitespace-pre-line">
          {prayer.content}
        </p>

        {/* Tags Reel */}
        {prayer.tags && prayer.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {prayer.tags.map((tag, idx) => (
              <button
                key={idx}
                onClick={() => onTagClick && onTagClick(tag)}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-purple-500/20 border border-white/5 hover:border-purple-500/30 text-purple-300 text-xs font-medium transition-all"
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Photo(s) Media Gallery */}
        {allImages.length > 0 && (
          <div className="pt-2">
            {allImages.length === 1 ? (
              <div 
                onClick={() => setSelectedPhotoIndex(0)}
                className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 group cursor-pointer max-h-[480px]"
              >
                <img
                  src={allImages[0]}
                  alt="Foto do culto/evento"
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4">
                  <span className="text-xs text-white font-medium flex items-center gap-1.5 bg-black/60 px-3 py-1.5 rounded-xl backdrop-blur-md">
                    <Maximize2 className="w-3.5 h-3.5" /> Clique para ampliar foto
                  </span>
                </div>
              </div>
            ) : (
              <div className={`grid gap-2 rounded-2xl overflow-hidden ${
                allImages.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'
              }`}>
                {allImages.slice(0, 3).map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedPhotoIndex(idx)}
                    className="relative aspect-video sm:aspect-square bg-black/40 border border-white/10 overflow-hidden group cursor-pointer rounded-xl"
                  >
                    <img
                      src={img}
                      alt={`Foto ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    {idx === 2 && allImages.length > 3 && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white font-bold text-lg backdrop-blur-xs">
                        +{allImages.length - 3} fotos
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Video Player (YouTube Embed or Native Video) */}
        {prayer.videoUrl && (
          <div className="pt-2 rounded-2xl overflow-hidden border border-white/10 bg-black/60 aspect-video relative">
            {ytEmbed ? (
              <iframe
                src={ytEmbed}
                title={prayer.title || 'Vídeo Gospel'}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={prayer.videoUrl}
                controls
                poster={prayer.videoThumbnail || prayer.imageUrl}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        )}

        {/* Voice Audio Prayer Player */}
        {prayer.audioUrl && (
          <div className="pt-2">
            <VoicePrayerPlayer
              audioUrl={prayer.audioUrl}
              duration={prayer.audioDuration || 30}
              authorName={prayer.userName}
            />
          </div>
        )}

        {/* Testimony Highlight Box */}
        {prayer.testimony && (
          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              Testemunho de Fé da Vitória
            </div>
            <p className="text-xs sm:text-sm text-amber-200/90 italic leading-relaxed">
              "{prayer.testimony}"
            </p>
          </div>
        )}

        {/* Action Bar: Curtir/Interceder, Comentários, Assistente IA, Compartilhar */}
        <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Like & Comment Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleLike}
              className={`px-4 py-2 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all active:scale-95 shadow-md ${
                isLiked
                  ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-rose-950/40'
                  : 'bg-white/10 hover:bg-white/15 text-white/80 hover:text-white border border-white/10'
              }`}
            >
              <Heart className={`w-4 h-4 transition-transform ${isLiked ? 'fill-current scale-110' : ''}`} />
              <span>{isLiked ? 'Abençoado' : 'Curtir & Orar'}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-black/30 text-[11px]">
                {likesList.length}
              </span>
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className="px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/15 text-white/80 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all border border-white/10 active:scale-95"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Comentários</span>
              <span className="px-1.5 py-0.5 rounded-full bg-black/30 text-[11px]">
                {commentsList.length}
              </span>
            </button>

            {/* Quick Spiritual Emoji Reaction Bar */}
            <div className="hidden sm:flex items-center gap-1 pl-2">
              {SPIRITUAL_REACTIONS.map((r, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickReaction(r.emoji)}
                  title={`Reagir com ${r.label}`}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-sm transition-transform hover:scale-125"
                >
                  {r.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Right: AI Guidance, Mark Answered, Share */}
          <div className="flex items-center gap-1.5">
            {isOwner && !prayer.answered && onOpenTestimonyModal && (
              <button
                onClick={() => onOpenTestimonyModal(prayer)}
                className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1"
                title="Registrar testemunho de vitória"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Registrar Vitória</span>
              </button>
            )}

            {onOpenAiAssistant && (
              <button
                onClick={() => onOpenAiAssistant(prayer)}
                className="p-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 transition-all text-xs flex items-center gap-1"
                title="Orar com o Pastor e Assistente Teológico IA"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">Pastor IA</span>
              </button>
            )}

            <button
              onClick={handleShare}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
              title="Compartilhar no WhatsApp"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Praying Feedback Alert Toast */}
        <AnimatePresence>
          {prayingFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-between text-xs text-rose-200"
            >
              <span className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-400 fill-current" />
                Você curtiu e se uniu em oração! Notificação enviada para {prayer.userName}.
              </span>
              <Check className="w-4 h-4 text-rose-400" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Share Toast */}
        <AnimatePresence>
          {showShareToast && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2"
            >
              <CheckCheck className="w-4 h-4" /> Link do post copiado e aberto para compartilhar!
            </motion.div>
          )}
        </AnimatePresence>

        {/* Comments Drawer / Thread */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-4 border-t border-white/5 space-y-4"
            >
              {/* Comment Box Composer */}
              <form onSubmit={handleSendComment} className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-rose-500 p-[1.5px] shrink-0">
                    {currentUser?.photoURL ? (
                      <img src={currentUser.photoURL} alt="Eu" className="w-full h-full object-cover rounded-[10px]" />
                    ) : (
                      <div className="w-full h-full bg-black rounded-[10px] flex items-center justify-center font-bold text-xs text-white">
                        {currentUser?.displayName?.charAt(0) || '✝'}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 relative flex items-center">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Deixe uma palavra, versículo ou benção para o irmão..."
                      className="w-full bg-black/40 border border-white/10 rounded-2xl pl-4 pr-24 py-2.5 text-xs sm:text-sm text-white placeholder:text-white/30 outline-none focus:border-purple-500"
                    />

                    <div className="absolute right-2 flex items-center gap-1">
                      {/* Photo upload in comment */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleCommentImageUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-1.5 rounded-lg text-white/50 hover:text-white ${commentImageUrl ? 'text-purple-400' : ''}`}
                        title="Anexar foto no comentário"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                      </button>

                      {/* Microphone Voice Audio in Comment */}
                      {isRecordingAudio ? (
                        <button
                          type="button"
                          onClick={stopCommentRecording}
                          className="px-2 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-bold flex items-center gap-1 animate-pulse"
                        >
                          <Square className="w-3 h-3 fill-current" />
                          {recordingDuration}s
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={startCommentRecording}
                          className={`p-1.5 rounded-lg text-white/50 hover:text-emerald-400 ${recordedAudio ? 'text-emerald-400' : ''}`}
                          title="Gravar áudio de benção"
                        >
                          <Mic className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="submit"
                        disabled={isSendingComment || (!commentText.trim() && !recordedAudio && !commentImageUrl)}
                        className="p-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-30 transition-all"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Comment Photo Preview */}
                {commentImageUrl && (
                  <div className="relative inline-block ml-10 rounded-xl overflow-hidden border border-white/20">
                    <img src={commentImageUrl} alt="Anexo" className="w-20 h-20 object-cover" />
                    <button
                      type="button"
                      onClick={() => setCommentImageUrl(null)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Comment Audio Preview */}
                {recordedAudio && (
                  <div className="ml-10 p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between">
                    <span className="text-xs text-purple-200 flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                      Áudio gravado ({recordedAudio.durationSeconds}s)
                    </span>
                    <button
                      type="button"
                      onClick={cancelCommentRecording}
                      className="text-white/40 hover:text-white text-xs"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </form>

              {/* List of Existing Comments */}
              <div className="space-y-3 pt-2">
                {commentsList.length === 0 ? (
                  <p className="text-center py-4 text-xs text-white/40 italic">
                    Seja o primeiro a deixar uma palavra de fé e bênção neste post! 🙏
                  </p>
                ) : (
                  commentsList.map((comm) => (
                    <div key={comm.id} className="flex items-start gap-3 p-3 rounded-2xl bg-black/30 border border-white/5">
                      <div className="w-8 h-8 rounded-xl bg-white/10 shrink-0 overflow-hidden">
                        {comm.userPhoto ? (
                          <img src={comm.userPhoto} alt={comm.userName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-xs text-white/70">
                            {comm.userName?.charAt(0) || '✝'}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{comm.userName}</span>
                          <span className="text-[10px] text-white/40">{comm.createdAt}</span>
                        </div>

                        {comm.content && (
                          <p className="text-xs text-white/80 leading-relaxed whitespace-pre-line">
                            {comm.content}
                          </p>
                        )}

                        {comm.imageUrl && (
                          <div className="pt-1">
                            <img src={comm.imageUrl} alt="Foto no comentário" className="max-w-xs max-h-48 rounded-xl object-cover border border-white/10" />
                          </div>
                        )}

                        {comm.audioUrl && (
                          <div className="pt-1">
                            <VoicePrayerPlayer
                              audioUrl={comm.audioUrl}
                              duration={comm.audioDuration || 15}
                              authorName={comm.userName}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Lightbox Photo Viewer Modal */}
      <AnimatePresence>
        {selectedPhotoIndex !== null && allImages[selectedPhotoIndex] && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-lg p-4">
            <button
              onClick={() => setSelectedPhotoIndex(null)}
              className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white z-50 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {allImages.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedPhotoIndex((prev) => (prev! > 0 ? prev! - 1 : allImages.length - 1))}
                  className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white z-50"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <button
                  onClick={() => setSelectedPhotoIndex((prev) => (prev! < allImages.length - 1 ? prev! + 1 : 0))}
                  className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white z-50"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-5xl max-h-[85vh] flex flex-col items-center"
            >
              <img
                src={allImages[selectedPhotoIndex]}
                alt="Foto em alta resolução"
                className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/10"
              />
              <div className="mt-3 px-4 py-1.5 rounded-full bg-black/60 border border-white/10 text-xs text-white font-medium">
                {selectedPhotoIndex + 1} de {allImages.length} • {prayer.title || prayer.userName}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </article>
  );
}
