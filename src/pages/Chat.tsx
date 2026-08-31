import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Mic, 
  Image as ImageIcon, 
  BookOpen, 
  Smile, 
  Search, 
  Users, 
  ArrowLeft, 
  Plus, 
  X, 
  Heart, 
  Phone, 
  Video, 
  UserCheck,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams, Link } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { requestNotificationPermission } from '../services/notificationService';
import { 
  CHAT_CHANNELS, 
  ChatChannel, 
  ChatMessage, 
  subscribeToChatMessages, 
  sendChatMessage, 
  getDirectMessageChannelId,
  subscribeToUserConversations,
  markConversationAsRead,
  ConversationSummary,
  BibleVerseSnippet 
} from '../services/chatService';
import { ActiveUser, subscribeToActiveUsers, isUserReallyOnline, formatUserLastSeen } from '../services/presenceService';
import { getCachedUserPhoto } from '../services/userService';
import ChatMessageBubble from '../components/chat/ChatMessageBubble';
import VoiceMessageRecorder from '../components/chat/VoiceMessageRecorder';
import BibleVersePickerModal from '../components/chat/BibleVersePickerModal';
import CallRoomModal from '../components/chat/CallRoomModal';
import DirectCallModal from '../components/chat/DirectCallModal';
import { CallSession, createDirectCall } from '../services/callService';
import { useTheme } from '../lib/ThemeContext';

export default function Chat() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { themeColor } = useTheme();

  // Navigation / Selection State
  const initialChannel = searchParams.get('channel') || 'general';
  const initialDmUser = searchParams.get('dm') || searchParams.get('user');

  const [activeChannelId, setActiveChannelId] = useState<string>(
    initialDmUser 
      ? getDirectMessageChannelId(auth.currentUser?.uid || 'guest', initialDmUser)
      : initialChannel
  );

  const [activeDmUser, setActiveDmUser] = useState<ActiveUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Modals & Panels
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [isBiblePickerOpen, setIsBiblePickerOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showMobileList, setShowMobileList] = useState(!initialDmUser && !searchParams.get('channel'));
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'channels' | 'direct'>('channels');
  const [presenceFilter, setPresenceFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [hasNotificationPermission, setHasNotificationPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission === 'granted' : false
  );

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setHasNotificationPermission(granted);
  };

  // Direct 1-on-1 Call State (Instagram Style)
  const [activeDirectCall, setActiveDirectCall] = useState<CallSession | null>(null);

  // Group Channel Call Modal State (Audio & Video calling up to 20 people)
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video'>('video');
  const [callTitle, setCallTitle] = useState('');

  // Community users state
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUser = auth.currentUser;

  // Subscribe to real-time conversations list for contact sorting
  useEffect(() => {
    if (!currentUser) return;
    const unsubConvs = subscribeToUserConversations(currentUser.uid, (convs) => {
      setConversations(convs);
    });
    return () => unsubConvs();
  }, [currentUser?.uid]);

  // Subscribe to active community members
  useEffect(() => {
    const unsubUsers = subscribeToActiveUsers((users) => {
      setActiveUsers(users);
      if (initialDmUser) {
        const found = users.find(u => u.uid === initialDmUser);
        if (found) setActiveDmUser(found);
      }
    });
    return () => unsubUsers();
  }, [initialDmUser]);

  // Handle URL query parameter changes
  useEffect(() => {
    const channelParam = searchParams.get('channel');
    const dmParam = searchParams.get('dm') || searchParams.get('user');

    if (dmParam) {
      const dmId = getDirectMessageChannelId(currentUser?.uid || 'guest', dmParam);
      setActiveChannelId(dmId);
      const targetUser = activeUsers.find(u => u.uid === dmParam);
      if (targetUser) setActiveDmUser(targetUser);
      setActiveTab('direct');
      setShowMobileList(false);
    } else if (channelParam) {
      setActiveChannelId(channelParam);
      setActiveDmUser(null);
      setActiveTab('channels');
      setShowMobileList(false);
    }
  }, [searchParams, currentUser, activeUsers]);

  // Subscribe to real-time chat messages
  useEffect(() => {
    if (!activeChannelId) return;

    const unsub = subscribeToChatMessages(activeChannelId, (chatMsgs) => {
      setMessages(chatMsgs);
      scrollToBottom();
    });

    return () => unsub();
  }, [activeChannelId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSelectChannel = (channel: ChatChannel) => {
    setActiveChannelId(channel.id);
    setActiveDmUser(null);
    setSearchParams({ channel: channel.id });
    setShowMobileList(false);
  };

  const handleSelectDm = (targetUser: ActiveUser) => {
    if (!currentUser) return;
    const dmId = getDirectMessageChannelId(currentUser.uid, targetUser.uid);
    setActiveChannelId(dmId);
    setActiveDmUser(targetUser);
    setSearchParams({ dm: targetUser.uid });
    setShowMobileList(false);
    setShowMembersModal(false);
    markConversationAsRead(dmId, currentUser.uid);
  };

  const handleBackToContacts = () => {
    setShowMobileList(true);
    setActiveDmUser(null);
    setSearchParams({});
  };

  const formatRelativeChatTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24 && date.getDate() === now.getDate()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (diffHours < 48) return 'Ontem';
    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
  };

  const handleStartCall = async (type: 'audio' | 'video') => {
    if (activeDmUser) {
      try {
        // Direct 1-on-1 Call (Instagram Style)
        const session = await createDirectCall({
          receiverUid: activeDmUser.uid,
          receiverName: activeDmUser.name,
          receiverPhoto: activeDmUser.photoURL,
          type,
          channelId: activeChannelId
        });
        setActiveDirectCall(session);
      } catch (err) {
        console.error('Error starting direct 1-on-1 call:', err);
      }
    } else {
      // Group Channel Call
      setCallType(type);
      setCallTitle(`#${currentChannelMeta?.name || 'Comunhão da Igreja'}`);
      setIsCallModalOpen(true);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !selectedImage) || isSending) return;

    try {
      setIsSending(true);
      const textToSend = inputText.trim();
      const imageToSend = selectedImage;

      setInputText('');
      setSelectedImage(null);

      await sendChatMessage({
        channelId: activeChannelId,
        text: textToSend,
        imageUrl: imageToSend || undefined,
        replyTo: replyingTo ? {
          id: replyingTo.id,
          senderName: replyingTo.senderName,
          text: replyingTo.text?.slice(0, 80) || 'Mensagem'
        } : undefined,
        isDirectMessage: !!activeDmUser,
        participants: activeDmUser && currentUser ? [currentUser.uid, activeDmUser.uid] : undefined
      });

      setReplyingTo(null);
      scrollToBottom();
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendVoice = async (audioUrl: string, duration: number) => {
    try {
      setIsVoiceRecording(false);
      await sendChatMessage({
        channelId: activeChannelId,
        text: '🎤 Mensagem de Áudio & Clamor',
        audioUrl,
        audioDuration: duration,
        isDirectMessage: !!activeDmUser,
        participants: activeDmUser && currentUser ? [currentUser.uid, activeDmUser.uid] : undefined
      });
      scrollToBottom();
    } catch (err) {
      console.error('Error sending voice message:', err);
    }
  };

  const handleSelectVerse = async (verse: BibleVerseSnippet) => {
    try {
      await sendChatMessage({
        channelId: activeChannelId,
        text: `📖 Compartilhou uma passagem bíblica: ${verse.reference}`,
        bibleVerse: verse,
        isDirectMessage: !!activeDmUser,
        participants: activeDmUser && currentUser ? [currentUser.uid, activeDmUser.uid] : undefined
      });
      scrollToBottom();
    } catch (err) {
      console.error('Error sharing verse:', err);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      setSelectedImage(loadEvt.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const currentChannelMeta = CHAT_CHANNELS.find(c => c.id === activeChannelId);
  const otherMembers = activeUsers.filter(u => u.uid !== currentUser?.uid);

  return (
    <div className="w-full max-w-7xl mx-auto px-0 sm:px-4 py-0 sm:py-6 h-[100dvh] lg:h-[calc(100vh-60px)] flex flex-col">
      {/* Container Box */}
      <div className="flex-1 bg-[#0E0E12] border-0 sm:border sm:border-white/10 rounded-none sm:rounded-[36px] shadow-2xl overflow-hidden flex relative">
        
        {/* ========================================================= */}
        {/* LEFT SIDEBAR: CHANNELS & DIRECT MESSAGES                  */}
        {/* ========================================================= */}
        <div className={`w-full md:w-80 lg:w-96 bg-[#13131A] border-r border-white/10 flex flex-col shrink-0 ${
          showMobileList ? 'flex' : 'hidden md:flex'
        }`}>
          {/* Top User Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[var(--theme-color)] to-indigo-600 p-[2px] shadow-md shrink-0">
                {(() => {
                  const myUser = activeUsers.find(u => u.uid === currentUser?.uid);
                  const myPhoto = myUser?.photoURL || (currentUser?.uid ? getCachedUserPhoto(currentUser.uid) : '') || currentUser?.photoURL;
                  return myPhoto ? (
                    <img
                      src={myPhoto}
                      alt="Perfil"
                      className="w-full h-full object-cover rounded-[14px]"
                    />
                  ) : (
                    <div className="w-full h-full bg-black rounded-[14px] flex items-center justify-center font-bold text-white text-sm">
                      {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0)?.toUpperCase() || 'M'}
                    </div>
                  );
                })()}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white leading-tight">
                  Chat da Comunidade
                </h3>
                <p className="text-[11px] text-white/50">Igreja & Comunhão</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors flex items-center gap-1 text-xs font-bold border border-white/10"
                title="Voltar ao Início do App"
              >
                <ArrowLeft className="w-4 h-4 text-purple-400" />
                <span className="text-xs">Início</span>
              </Link>
              <button
                onClick={() => setShowMembersModal(true)}
                className="p-2 rounded-xl bg-[var(--theme-color)]/20 hover:bg-[var(--theme-color)]/30 text-white transition-colors flex items-center gap-1 text-xs font-bold border border-[var(--theme-color)]/30"
                title="Nova conversa com membro"
              >
                <Plus className="w-4 h-4 text-[var(--theme-color)]" />
                <span className="hidden sm:inline">Conversar</span>
              </button>
            </div>
          </div>

          {/* Tab switcher: Canais vs Mensagens Diretas */}
          <div className="p-3 border-b border-white/5 flex gap-2">
            <button
              onClick={() => setActiveTab('channels')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'channels'
                  ? 'bg-white/10 text-white border border-white/10 shadow-sm'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Canais ({CHAT_CHANNELS.length})
            </button>
            <button
              onClick={() => setActiveTab('direct')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'direct'
                  ? 'bg-white/10 text-white border border-white/10 shadow-sm'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Irmãos ({otherMembers.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="px-3 py-2">
            <div className="relative">
              <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeTab === 'channels' ? 'Buscar canal...' : 'Buscar irmão(ã)...'}
                className="w-full bg-black/40 border border-white/10 rounded-2xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-[var(--theme-color)] placeholder:text-white/30"
              />
            </div>
          </div>

          {/* Quick Online / Offline Presence Filter for Direct Messages */}
          {activeTab === 'direct' && (() => {
            const onlineCount = otherMembers.filter(m => isUserReallyOnline(m)).length;
            const offlineCount = otherMembers.length - onlineCount;
            return (
              <div className="px-3 pb-2 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setPresenceFilter('all')}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all shrink-0 ${
                    presenceFilter === 'all'
                      ? 'bg-white/20 text-white border border-white/20 shadow-sm'
                      : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Todos ({otherMembers.length})
                </button>
                <button
                  onClick={() => setPresenceFilter('online')}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                    presenceFilter === 'online'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'bg-white/5 text-white/50 hover:text-emerald-400 hover:bg-white/10'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Online ({onlineCount})
                </button>
                <button
                  onClick={() => setPresenceFilter('offline')}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                    presenceFilter === 'offline'
                      ? 'bg-zinc-700/40 text-zinc-300 border border-zinc-500/30 shadow-sm'
                      : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                  Offline ({offlineCount})
                </button>
              </div>
            );
          })()}

          {/* Background Notification Enable Alert Banner for Mobile & Lock Screen Alerts */}
          {!hasNotificationPermission && (
            <div className="mx-3 mb-2 p-2.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between gap-2 shadow-sm">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-xl bg-purple-500/20 text-purple-300 shrink-0">
                  <Bell className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-white leading-tight">Receber chamadas fora do app</p>
                  <p className="text-[10px] text-white/50 truncate">Ative notificações no celular</p>
                </div>
              </div>
              <button
                onClick={handleEnableNotifications}
                className="px-2.5 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold shrink-0 transition-colors shadow"
              >
                Ativar
              </button>
            </div>
          )}

          {/* Online Brothers Horizontal Story Reel (Only on Direct tab & 'all'/'online' filter) */}
          {activeTab === 'direct' && presenceFilter !== 'offline' && !searchQuery && (() => {
            const onlineList = otherMembers.filter(m => isUserReallyOnline(m));
            if (onlineList.length === 0) return null;
            return (
              <div className="px-3 py-2 border-b border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Irmãos Online Agora ({onlineList.length})
                  </span>
                </div>
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
                  {onlineList.map(member => (
                    <button
                      key={`story_${member.uid}`}
                      onClick={() => handleSelectDm(member)}
                      className="flex flex-col items-center gap-1 shrink-0 group focus:outline-none"
                    >
                      <div className="relative">
                        <div className="w-11 h-11 rounded-2xl p-[2px] bg-gradient-to-tr from-emerald-400 via-teal-400 to-cyan-400 group-hover:scale-105 transition-transform shadow-md">
                          {member.photoURL ? (
                            <img
                              src={member.photoURL}
                              alt={member.name}
                              className="w-full h-full object-cover rounded-[14px]"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#161622] rounded-[14px] flex items-center justify-center font-bold text-white text-xs">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#13131A] ring-1 ring-emerald-400/50 flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-white/80 max-w-[54px] truncate text-center group-hover:text-emerald-300">
                        {member.name.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Channels / DMs List */}
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 scrollbar-hide">
            {activeTab === 'channels' ? (
              <>
                {CHAT_CHANNELS.filter(c => 
                  c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  c.description.toLowerCase().includes(searchQuery.toLowerCase())
                ).map((channel) => {
                  const isCurrent = activeChannelId === channel.id && !activeDmUser;
                  return (
                    <button
                      key={channel.id}
                      onClick={() => handleSelectChannel(channel)}
                      className={`w-full p-3 rounded-2xl text-left flex items-start gap-3 transition-all ${
                        isCurrent
                          ? 'bg-white/15 border border-white/15 text-white shadow-md'
                          : 'hover:bg-white/5 text-white/70 hover:text-white'
                      }`}
                    >
                      <span className="text-xl shrink-0 mt-0.5">{channel.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h4 className="text-xs font-bold text-white truncate">
                            #{channel.name}
                          </h4>
                          {channel.badge && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-white/10 text-white/60 font-semibold shrink-0">
                              {channel.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-white/50 truncate leading-snug">
                          {channel.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </>
            ) : (
              <>
                {/* Other community members dynamically filtered and sorted with presence */}
                {(() => {
                  const processedMembers = otherMembers.map((member) => {
                    const dmId = currentUser ? getDirectMessageChannelId(currentUser.uid, member.uid) : '';
                    const conv = conversations.find(c => 
                      c.id === dmId || 
                      (c.participants && c.participants.includes(member.uid) && c.participants.includes(currentUser?.uid || ''))
                    );
                    const unreadCount = (conv?.unreadCounts && currentUser?.uid) ? (conv.unreadCounts[currentUser.uid] || 0) : 0;
                    const lastTime = conv?.lastMessageIso ? new Date(conv.lastMessageIso).getTime() : 0;
                    const isOnline = isUserReallyOnline(member);
                    return {
                      member,
                      conv,
                      unreadCount,
                      lastTime,
                      isOnline,
                      lastMessage: conv?.lastMessage || '',
                      lastMessageSenderId: conv?.lastMessageSenderId || '',
                      lastMessageIso: conv?.lastMessageIso
                    };
                  }).filter(({ member, lastMessage, isOnline }) => {
                    // Presence filter
                    if (presenceFilter === 'online' && !isOnline) return false;
                    if (presenceFilter === 'offline' && isOnline) return false;

                    // Search filter
                    return (
                      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (member.role && member.role.toLowerCase().includes(searchQuery.toLowerCase())) ||
                      lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
                    );
                  }).sort((a, b) => {
                    // Highest priority: Unread messages
                    if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
                    if (b.unreadCount > 0 && a.unreadCount === 0) return 1;
                    // Next priority: Most recent message conversation
                    if (a.lastTime > 0 || b.lastTime > 0) {
                      return b.lastTime - a.lastTime;
                    }
                    // Next priority: Online users
                    if (a.isOnline !== b.isOnline) {
                      return a.isOnline ? -1 : 1;
                    }
                    return a.member.name.localeCompare(b.member.name);
                  });

                  if (processedMembers.length === 0) {
                    return (
                      <div className="p-6 text-center text-xs text-white/40">
                        {presenceFilter === 'online' 
                          ? 'Nenhum irmão online no momento' 
                          : presenceFilter === 'offline'
                            ? 'Nenhum irmão offline'
                            : 'Nenhum irmão encontrado'}
                      </div>
                    );
                  }

                  return processedMembers.map(({ member, unreadCount, lastMessage, lastMessageSenderId, lastMessageIso, isOnline }) => {
                    const isCurrent = activeDmUser?.uid === member.uid;
                    const isSentByMe = lastMessageSenderId === currentUser?.uid;
                    const hasUnread = unreadCount > 0 && !isCurrent;
                    const timeLabel = formatRelativeChatTime(lastMessageIso);
                    const lastSeenText = formatUserLastSeen(member);

                    return (
                      <button
                        key={member.uid}
                        onClick={() => handleSelectDm(member)}
                        className={`w-full p-2.5 rounded-2xl text-left flex items-center gap-3 transition-all relative ${
                          isCurrent
                            ? 'bg-white/15 border border-white/15 text-white shadow-md'
                            : hasUnread
                              ? 'bg-purple-950/30 hover:bg-purple-900/40 border border-purple-500/30 text-white'
                              : 'hover:bg-white/5 text-white/70 hover:text-white border border-transparent'
                        }`}
                      >
                        <div className="relative shrink-0">
                          <div className={`w-10 h-10 rounded-2xl p-[2px] ${
                            hasUnread 
                              ? 'bg-gradient-to-tr from-rose-500 via-purple-500 to-amber-400 animate-pulse ring-2 ring-purple-500/50' 
                              : isOnline
                                ? 'bg-gradient-to-tr from-emerald-400 to-cyan-400'
                                : 'bg-zinc-700'
                          }`}>
                            {member.photoURL ? (
                              <img
                                src={member.photoURL}
                                alt={member.name}
                                className="w-full h-full object-cover rounded-[14px]"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-full h-full bg-black rounded-[14px] flex items-center justify-center font-bold text-white text-xs">
                                {member.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          {isOnline ? (
                            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#13131A] ring-1 ring-emerald-400/50 flex items-center justify-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            </span>
                          ) : (
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-zinc-600 border-2 border-[#13131A]" title="Offline" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <h4 className={`text-xs truncate ${hasUnread ? 'font-black text-white' : 'font-bold text-white/90'}`}>
                              {member.name}
                            </h4>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {timeLabel ? (
                                <span className={`text-[10px] ${hasUnread ? 'text-purple-300 font-bold' : 'text-white/40'}`}>
                                  {timeLabel}
                                </span>
                              ) : isOnline ? (
                                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                  Online
                                </span>
                              ) : (
                                <span className="text-[9px] text-white/30">
                                  Offline
                                </span>
                              )}
                              {hasUnread && (
                                <span className="px-1.5 py-0.5 min-w-[18px] text-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[9px] font-black shadow-md shadow-purple-500/30">
                                  {unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <p className={`text-[11px] truncate leading-tight ${
                            hasUnread 
                              ? 'text-purple-200 font-semibold' 
                              : lastMessage 
                                ? 'text-white/60' 
                                : isOnline 
                                  ? 'text-emerald-400/80' 
                                  : 'text-white/40'
                          }`}>
                            {lastMessage ? (
                              <span>
                                {isSentByMe ? <span className="text-white/40 font-normal">Você: </span> : null}
                                {lastMessage}
                              </span>
                            ) : (
                              <span>
                                {isOnline ? (
                                  <span className="text-emerald-400 font-medium">🟢 {member.statusMessage || 'Online agora'}</span>
                                ) : (
                                  <span>⚫ {lastSeenText}</span>
                                )}
                              </span>
                            )}
                          </p>
                        </div>
                      </button>
                    );
                  });
                })()}
              </>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT MAIN CHAT CONVERSATION AREA                         */}
        {/* ========================================================= */}
        <div className={`flex-1 flex flex-col bg-[#0B0B0E] relative ${
          showMobileList ? 'hidden md:flex' : 'flex'
        }`}>
          {/* Header Bar with Video & Audio Calling Buttons */}
          <div className="p-3 sm:p-4 border-b border-white/10 flex items-center justify-between bg-[#121218]/95 backdrop-blur-md relative z-10 gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Back to Contacts / Channels Button */}
              <button
                onClick={handleBackToContacts}
                className="px-2.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center gap-1.5 transition-all shadow-sm border border-white/15 shrink-0 group"
                title="Voltar para a lista de contatos"
              >
                <ArrowLeft className="w-4 h-4 text-purple-400 group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-xs font-bold">Voltar</span>
              </button>

              {activeDmUser ? (() => {
                const isOnline = isUserReallyOnline(activeDmUser);
                const lastSeenText = formatUserLastSeen(activeDmUser);
                return (
                  <>
                    <div className="relative shrink-0">
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl p-[2px] shadow-md ${
                        isOnline 
                          ? 'bg-gradient-to-tr from-emerald-400 to-cyan-400' 
                          : 'bg-zinc-700'
                      }`}>
                        {activeDmUser.photoURL ? (
                          <img
                            src={activeDmUser.photoURL}
                            alt={activeDmUser.name}
                            className="w-full h-full object-cover rounded-[14px]"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full bg-black rounded-[14px] flex items-center justify-center font-bold text-white text-sm">
                            {activeDmUser.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      {isOnline ? (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 sm:w-3.5 h-3 sm:h-3.5 rounded-full bg-emerald-500 border-2 border-black ring-1 ring-emerald-400/50 flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        </span>
                      ) : (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-zinc-600 border-2 border-black" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5 truncate">
                        <span className="truncate">{activeDmUser.name}</span>
                        {activeDmUser.role && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 text-white/60 font-semibold hidden md:inline shrink-0">
                            {activeDmUser.role}
                          </span>
                        )}
                      </h3>
                      {isOnline ? (
                        <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                          <span className="truncate">Online agora {activeDmUser.statusMessage ? `• ${activeDmUser.statusMessage}` : ''}</span>
                        </p>
                      ) : (
                        <p className="text-[11px] text-white/50 flex items-center gap-1 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 shrink-0" />
                          <span className="truncate">{lastSeenText}</span>
                        </p>
                      )}
                    </div>
                  </>
                );
              })() : (
                <>
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/10 flex items-center justify-center text-lg sm:text-xl shadow-md shrink-0">
                    {currentChannelMeta?.icon || '🕊️'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5 truncate">
                      <span className="truncate">#{currentChannelMeta?.name || 'Comunhão'}</span>
                      {currentChannelMeta?.badge && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30 hidden sm:inline">
                          {currentChannelMeta.badge}
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-white/50 truncate max-w-[160px] sm:max-w-xs md:max-w-md">
                      {currentChannelMeta?.description}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Calling Options & Close Button */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Normal Audio Call Button */}
              <button
                onClick={() => handleStartCall('audio')}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                title="Iniciar Chamada de Voz"
              >
                <Phone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Chamada</span>
              </button>

              {/* Video Call Button (up to 20 people) */}
              <button
                onClick={() => handleStartCall('video')}
                className="p-2 sm:px-3.5 sm:py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-purple-950/40 active:scale-95"
                title="Iniciar Chamada de Vídeo (Até 20 pessoas)"
              >
                <Video className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Vídeo</span>
              </button>

              {/* Bible Verse Shortcut */}
              <button
                onClick={() => setIsBiblePickerOpen(true)}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 text-xs font-bold items-center gap-1.5 transition-colors hidden md:flex"
                title="Inserir Versículo Bíblico"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Palavra</span>
              </button>

              {/* Exit / Close Chat back to Home */}
              <Link
                to="/"
                className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-all flex items-center justify-center border border-white/10"
                title="Sair do Chat e voltar para o Início"
              >
                <X className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* ========================================================= */}
          {/* MESSAGES SCROLL CONTAINER                                 */}
          {/* ========================================================= */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-1 relative">
            {/* Background ambient light */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />

            {/* Channel Welcome Banner */}
            <div className="text-center py-6 px-4 mb-4 rounded-3xl bg-white/[0.02] border border-white/5 max-w-lg mx-auto">
              <span className="text-3xl mb-2 block">{currentChannelMeta?.icon || '🕊️'}</span>
              <h4 className="text-sm font-bold text-white mb-1">
                {activeDmUser ? `Conversa com ${activeDmUser.name}` : `Canal #${currentChannelMeta?.name}`}
              </h4>
              <p className="text-xs text-white/50">
                {activeDmUser 
                  ? 'Este é o início do seu histórico de mensagens e comunhão.' 
                  : currentChannelMeta?.description || 'Bem-vindo ao chat da congregação! Edifiquem-se em amor e oração mútua.'}
              </p>
            </div>

            {/* List of Messages */}
            {messages.map((msg) => (
              <ChatMessageBubble
                key={msg.id}
                message={msg}
                onReply={(m) => setReplyingTo(m)}
                isAdmin={currentUser?.email === 'rudson.p48@gmail.com'}
              />
            ))}

            <div ref={messagesEndRef} />
          </div>

          {/* ========================================================= */}
          {/* MESSAGE INPUT CONTAINER                                   */}
          {/* ========================================================= */}
          <div className="p-3 sm:p-4 border-t border-white/10 bg-[#121218]/95 relative z-20">
            
            {/* Replying Banner */}
            <AnimatePresence>
              {replyingTo && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mb-2 px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-amber-400 font-bold">Respondendo a {replyingTo.senderName}:</span>
                    <span className="text-white/60 truncate">{replyingTo.text || 'Mídia / Versículo'}</span>
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="p-1 text-white/50 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Image Preview Banner */}
            <AnimatePresence>
              {selectedImage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="mb-2 p-2 rounded-xl bg-black/60 border border-white/10 flex items-center gap-3 w-fit"
                >
                  <img src={selectedImage} alt="Anexo" className="w-12 h-12 object-cover rounded-lg" />
                  <span className="text-xs text-white/80 font-medium">Foto selecionada</span>
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Voice Recorder Mode vs Normal Input Bar */}
            {isVoiceRecording ? (
              <VoiceMessageRecorder
                onSendVoice={handleSendVoice}
                onCancel={() => setIsVoiceRecording(false)}
              />
            ) : (
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />

                {/* Attach Image Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                  title="Enviar foto ou imagem"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>

                {/* Bible Verse Picker Button */}
                <button
                  type="button"
                  onClick={() => setIsBiblePickerOpen(true)}
                  className="p-2.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 transition-colors"
                  title="Compartilhar versículo bíblico"
                >
                  <BookOpen className="w-5 h-5" />
                </button>

                {/* Voice Note Button */}
                <button
                  type="button"
                  onClick={() => setIsVoiceRecording(true)}
                  className="p-2.5 rounded-2xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 transition-colors"
                  title="Gravar áudio de clamor"
                >
                  <Mic className="w-5 h-5" />
                </button>

                {/* Text Input Field */}
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Digite sua mensagem de fé e comunhão..."
                    className="w-full h-12 bg-black/50 border border-white/15 rounded-2xl pl-4 pr-10 text-sm text-white placeholder:text-white/30 outline-none focus:border-[var(--theme-color)] transition-colors"
                  />
                  {/* Quick Christian Emoji Button */}
                  <button
                    type="button"
                    onClick={() => setInputText(prev => prev + ' 🙏')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm opacity-60 hover:opacity-100 transition-opacity"
                    title="Adicionar oração"
                  >
                    🙏
                  </button>
                </div>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={(!inputText.trim() && !selectedImage) || isSending}
                  className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white flex items-center justify-center shadow-lg shadow-purple-950/50 active:scale-95 transition-all shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ALL CONGREGATION MEMBERS MODAL (FOR NEW DIRECT MESSAGE)   */}
      {/* ========================================================= */}
      <AnimatePresence>
        {showMembersModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#15151D] border border-white/15 rounded-[32px] p-6 shadow-2xl relative max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Iniciar Conversa Direta</h3>
                    <p className="text-xs text-white/50">Selecione um irmão(ã) para conversar em privado</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMembersModal(false)}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Members List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {otherMembers.map((member) => (
                  <button
                    key={member.uid}
                    onClick={() => handleSelectDm(member)}
                    className="w-full p-3 rounded-2xl bg-black/40 hover:bg-white/5 border border-white/10 flex items-center justify-between gap-3 text-left transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-emerald-400 p-[2px]">
                          {member.photoURL ? (
                            <img
                              src={member.photoURL}
                              alt={member.name}
                              className="w-full h-full object-cover rounded-[14px]"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full bg-black rounded-[14px] flex items-center justify-center font-bold text-white text-xs">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        {member.isOnline && (
                          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-black" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{member.name}</h4>
                        <p className="text-[11px] text-white/50 truncate">
                          {member.role || 'Membro'} • <span className="text-emerald-400">{member.statusMessage || (member.isOnline ? 'Online' : 'Membro')}</span>
                        </p>
                      </div>
                    </div>

                    <span className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold shrink-0">
                      Conversar
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bible Verse Picker Drawer Modal */}
      <BibleVersePickerModal
        isOpen={isBiblePickerOpen}
        onClose={() => setIsBiblePickerOpen(false)}
        onSelectVerse={handleSelectVerse}
      />

      {/* Direct 1-on-1 Instagram-Style Call Modal */}
      {activeDirectCall && (
        <DirectCallModal
          isOpen={!!activeDirectCall}
          onClose={() => setActiveDirectCall(null)}
          callSession={activeDirectCall}
          isInitiator={true}
        />
      )}

      {/* Call Room Modal (Chamada em Grupo para canais com até 20 pessoas) */}
      <CallRoomModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        roomTitle={callTitle}
        initialType={callType}
        availableUsers={activeUsers}
        onSendMessage={(text) => {
          sendChatMessage({
            channelId: activeChannelId,
            text,
            isDirectMessage: !!activeDmUser,
            participants: activeDmUser && currentUser ? [currentUser.uid, activeDmUser.uid] : undefined
          }).catch(console.error);
        }}
      />
    </div>
  );
}
