import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  X, 
  Heart, 
  Sparkles, 
  CornerDownRight, 
  Check, 
  Loader2, 
  ExternalLink,
  Volume2,
  VolumeX,
  ShieldCheck,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { 
  AppNotification, 
  subscribeToUserNotifications, 
  markNotificationAsRead,
  playNotificationChime,
  triggerBrowserNotification,
  requestBrowserNotificationPermission
} from '../services/notificationService';
import { sendChatMessage } from '../services/chatService';

export default function TopNotificationBanner() {
  const [activeNotification, setActiveNotification] = useState<AppNotification | null>(null);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replySuccess, setReplySuccess] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [permissionRequested, setPermissionRequested] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = auth.currentUser;
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);
  const previousNotifIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  // Request browser notification permission once user interacts
  useEffect(() => {
    if (!permissionRequested && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        // We will prompt on first banner arrival or click
        setPermissionRequested(true);
      }
    }
  }, [permissionRequested]);

  // Subscribe to incoming notifications
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToUserNotifications(currentUser.uid, (notifs) => {
      if (isInitialLoadRef.current) {
        previousNotifIdsRef.current = new Set(notifs.map(n => n.id));
        isInitialLoadRef.current = false;
        return;
      }

      // Find if there's any new unread notification specifically for this user
      const incoming = notifs.find(
        n => !previousNotifIdsRef.current.has(n.id) && 
             !n.read && 
             n.senderUid !== currentUser.uid &&
             (n.recipientUid === currentUser.uid || n.recipientUid === 'all')
      );

      if (incoming) {
        // If user is currently in the active chat with this sender/channel, don't show intrusive banner
        const searchParams = new URLSearchParams(location.search);
        const currentDm = searchParams.get('dm');
        const currentChannel = searchParams.get('channel');

        const isCurrentlyInThisChat = 
          location.pathname === '/chat' && 
          ((currentDm && incoming.senderUid === currentDm) || 
           (currentChannel && incoming.channelId === currentChannel));

        if (!isCurrentlyInThisChat) {
          triggerNotificationDisplay(incoming);
        }
      }

      previousNotifIdsRef.current = new Set(notifs.map(n => n.id));
    });

    return () => {
      unsubscribe();
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [currentUser?.uid, location.pathname, location.search, isSoundMuted]);

  // Listen for local custom chat events (e.g. simulated messages or background dispatch)
  useEffect(() => {
    const handleLocalEvent = (e: any) => {
      const detail = e.detail;
      if (!detail) return;
    };
    window.addEventListener('app-chat-message-notification', handleLocalEvent);
    return () => window.removeEventListener('app-chat-message-notification', handleLocalEvent);
  }, []);

  const triggerNotificationDisplay = (notif: AppNotification) => {
    setActiveNotification(notif);
    setIsReplying(false);
    setReplyText('');
    setReplySuccess(false);

    // 1. Play harmonic audio chime
    if (!isSoundMuted) {
      playNotificationChime();
    }

    // 2. Haptic vibration feedback for mobile devices
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([60, 40, 60]);
      }
    } catch {}

    // 3. Browser Desktop / Web Push Notification
    triggerBrowserNotification(notif.title || 'Nova mensagem no Ecclesia', {
      body: notif.message,
      icon: notif.senderPhoto || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=128',
      tag: notif.id
    });

    // 4. Set auto-dismiss timer (7 seconds)
    resetAutoDismissTimer();
  };

  const resetAutoDismissTimer = () => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = setTimeout(() => {
      // Don't auto-dismiss if user is typing a reply
      setActiveNotification(curr => {
        return curr;
      });
      closeBanner();
    }, 7500);
  };

  const closeBanner = () => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    setActiveNotification(null);
    setIsReplying(false);
    setReplyText('');
  };

  const handleBannerClick = async () => {
    if (!activeNotification) return;

    // Mark as read in Firestore
    await markNotificationAsRead(activeNotification.id);

    const actionUrl = activeNotification.actionUrl || 
      (activeNotification.isDirect 
        ? `/chat?dm=${activeNotification.senderUid}` 
        : activeNotification.channelId 
          ? `/chat?channel=${activeNotification.channelId}` 
          : '/chat');

    closeBanner();
    navigate(actionUrl);
  };

  const handleSendQuickReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeNotification || isSendingReply) return;

    setIsSendingReply(true);
    try {
      const channelId = activeNotification.channelId || `dm_${activeNotification.senderUid}_${currentUser?.uid}`;
      const isDirect = activeNotification.isDirect !== false;

      await sendChatMessage({
        channelId,
        text: replyText.trim(),
        isDirectMessage: isDirect,
        participants: isDirect ? [currentUser?.uid || '', activeNotification.senderUid] : undefined
      });

      await markNotificationAsRead(activeNotification.id);
      setReplySuccess(true);
      setReplyText('');

      setTimeout(() => {
        setIsSendingReply(false);
        closeBanner();
      }, 1000);
    } catch (err) {
      console.error('Error sending quick reply from top banner:', err);
      setIsSendingReply(false);
    }
  };

  if (!activeNotification) return null;

  const isChatType = activeNotification.type === 'chat_dm' || activeNotification.type === 'chat_message' || activeNotification.isDirect;
  const senderDisplayName = activeNotification.senderName || 'Irmão(ã) da Igreja';
  const senderPhoto = activeNotification.senderPhoto;

  return (
    <div className="fixed top-3 left-0 right-0 z-[99999] flex justify-center px-3 sm:px-4 pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeNotification.id}
          initial={{ opacity: 0, y: -45, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.94 }}
          transition={{ type: 'spring', stiffness: 450, damping: 28 }}
          onMouseEnter={() => {
            // Pause auto-dismiss timer on hover
            if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
          }}
          onMouseLeave={() => {
            if (!isReplying) resetAutoDismissTimer();
          }}
          className="pointer-events-auto w-full max-w-lg bg-[#141419]/95 border border-white/15 rounded-[26px] shadow-[0_20px_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl overflow-hidden ring-1 ring-white/10"
        >
          {/* Top Progress bar glow */}
          <div className="h-1 w-full bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 animate-pulse" />

          <div className="p-3.5 sm:p-4">
            {/* Header Content Row */}
            <div 
              onClick={handleBannerClick}
              className="flex items-start gap-3 cursor-pointer group"
            >
              {/* Avatar with status indicator */}
              <div className="relative shrink-0">
                {senderPhoto ? (
                  <img 
                    src={senderPhoto} 
                    alt={senderDisplayName} 
                    className="w-11 h-11 rounded-full object-cover border-2 border-[var(--theme-color)] shadow-md"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-purple-700 to-indigo-600 border-2 border-[var(--theme-color)] flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {senderDisplayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#141419] shadow-sm" />
              </div>

              {/* Message Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-bold text-white tracking-tight group-hover:text-[var(--theme-color)] transition-colors truncate">
                      {senderDisplayName}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-[10px] font-bold text-purple-300 uppercase tracking-wider">
                      {activeNotification.isDirect ? 'Mensagem Direta' : 'Chat'}
                    </span>
                  </div>

                  {/* Actions: Sound toggle & Close */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSoundMuted(!isSoundMuted);
                      }}
                      className="p-1 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                      title={isSoundMuted ? 'Desmutar Som' : 'Mutar Som'}
                    >
                      {isSoundMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeBanner();
                      }}
                      className="p-1 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                      title="Fechar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Message Body */}
                <p className="text-xs text-white/90 font-medium line-clamp-2 mt-0.5 leading-relaxed">
                  {activeNotification.message}
                </p>

                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-white/50">
                  <span>Toque para abrir a conversa completa</span>
                </div>
              </div>
            </div>

            {/* Inline Quick Reply / Interactive Buttons */}
            {isChatType && (
              <div className="mt-3 pt-3 border-t border-white/10 flex flex-col gap-2">
                {!isReplying ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsReplying(true);
                        if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
                      }}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[var(--theme-color)]" />
                      Responder Agora
                    </button>

                    <button
                      type="button"
                      onClick={handleBannerClick}
                      className="py-1.5 px-3 rounded-xl bg-[var(--theme-color)] hover:brightness-110 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Abrir Chat
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSendQuickReply} className="flex items-center gap-2">
                    <input
                      type="text"
                      autoFocus
                      placeholder={`Responder para ${senderDisplayName.split(' ')[0]}...`}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      disabled={isSendingReply || replySuccess}
                      className="flex-1 bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[var(--theme-color)]"
                    />

                    <button
                      type="submit"
                      disabled={!replyText.trim() || isSendingReply || replySuccess}
                      className="px-3.5 py-2 rounded-xl bg-[var(--theme-color)] hover:brightness-110 text-white text-xs font-bold flex items-center gap-1 shadow-md disabled:opacity-40 transition-all"
                    >
                      {isSendingReply ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : replySuccess ? (
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>{replySuccess ? 'Enviado!' : 'Enviar'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsReplying(false);
                        resetAutoDismissTimer();
                      }}
                      className="p-2 text-white/50 hover:text-white text-xs font-bold"
                    >
                      Cancelar
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
