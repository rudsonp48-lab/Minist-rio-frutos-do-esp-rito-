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
  Sparkles, 
  ArrowLeft, 
  MoreVertical, 
  Plus, 
  X, 
  Heart, 
  Flame, 
  ShieldCheck, 
  Check, 
  PhoneCall, 
  ChevronRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { 
  CHAT_CHANNELS, 
  ChatChannel, 
  ChatMessage, 
  subscribeToChatMessages, 
  sendChatMessage, 
  getDirectMessageChannelId,
  BibleVerseSnippet 
} from '../services/chatService';
import { ActiveUser, subscribeToActiveUsers } from '../services/presenceService';
import ChatMessageBubble from '../components/chat/ChatMessageBubble';
import VoiceMessageRecorder from '../components/chat/VoiceMessageRecorder';
import BibleVersePickerModal from '../components/chat/BibleVersePickerModal';
import { useTheme } from '../lib/ThemeContext';

export default function Chat() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { themeColor } = useTheme();

  // Navigation / Selection State
  const initialChannel = searchParams.get('channel') || 'general';
  const initialDmUser = searchParams.get('dm') || searchParams.get('user');

  const [activeChannelId, setActiveChannelId] = useState<string>(
    initialDmUser 
      ? (initialDmUser === 'ai_pastor' ? 'dm_ai_pastor' : getDirectMessageChannelId(auth.currentUser?.uid || 'guest', initialDmUser))
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

  // Community users state
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUser = auth.currentUser;

  // Subscribe to active community members
  useEffect(() => {
    const unsubUsers = subscribeToActiveUsers((users) => {
      setActiveUsers(users);
      if (initialDmUser && initialDmUser !== 'ai_pastor') {
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
      if (dmParam === 'ai_pastor') {
        setActiveChannelId('dm_ai_pastor');
        setActiveDmUser({
          uid: 'system_ai_pastor',
          name: 'Pastor Virtual IA 🕊️',
          photoURL: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
          isOnline: true,
          role: 'Aconselhamento Teológico & Pastoral',
          statusMessage: 'Disponível 24/7 para orar e aconselhar'
        });
      } else {
        const dmId = getDirectMessageChannelId(currentUser?.uid || 'guest', dmParam);
        setActiveChannelId(dmId);
        const targetUser = activeUsers.find(u => u.uid === dmParam);
        if (targetUser) setActiveDmUser(targetUser);
      }
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
  };

  const handleSelectAIPastor = () => {
    setActiveChannelId('dm_ai_pastor');
    setActiveDmUser({
      uid: 'system_ai_pastor',
      name: 'Pastor Virtual IA 🕊️',
      photoURL: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
      isOnline: true,
      role: 'Aconselhamento Teológico & Pastoral',
      statusMessage: 'Disponível 24/7 para orar e aconselhar'
    });
    setSearchParams({ dm: 'ai_pastor' });
    setShowMobileList(false);
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
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-6 h-[calc(100vh-100px)] lg:h-[calc(100vh-60px)] flex flex-col">
      {/* Container Box */}
      <div className="flex-1 bg-[#0E0E12] border border-white/10 rounded-[28px] sm:rounded-[36px] shadow-2xl overflow-hidden flex relative">
        
        {/* ========================================================= */}
        {/* LEFT SIDEBAR: CHANNELS & DIRECT MESSAGES                  */}
        {/* ========================================================= */}
        <div className={`w-full md:w-80 lg:w-96 bg-[#13131A] border-r border-white/10 flex flex-col shrink-0 ${
          showMobileList ? 'flex' : 'hidden md:flex'
        }`}>
          {/* Top User Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[var(--theme-color)] to-indigo-600 p-[2px] shadow-md">
                {currentUser?.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt="Perfil"
                    className="w-full h-full object-cover rounded-[14px]"
                  />
                ) : (
                  <div className="w-full h-full bg-black rounded-[14px] flex items-center justify-center font-bold text-white text-sm">
                    {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0)?.toUpperCase() || 'M'}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white leading-tight">
                  Chat da Comunidade
                </h3>
                <p className="text-[11px] text-white/50">Rede Social Ecclesia</p>
              </div>
            </div>

            <button
              onClick={() => setShowMembersModal(true)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors flex items-center gap-1 text-xs font-bold"
              title="Nova conversa com membro"
            >
              <Plus className="w-4 h-4 text-[var(--theme-color)]" />
              <span className="hidden sm:inline">Conversar</span>
            </button>
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
              Irmãos ({otherMembers.length + 1})
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
                {/* AI Pastor Direct Chat Button */}
                <button
                  onClick={handleSelectAIPastor}
                  className={`w-full p-3 rounded-2xl text-left flex items-center gap-3 transition-all mb-2 ${
                    activeChannelId === 'dm_ai_pastor'
                      ? 'bg-gradient-to-r from-amber-500/20 to-purple-600/20 border border-amber-400/40 text-white shadow-lg'
                      : 'bg-black/30 hover:bg-white/5 border border-white/5 text-white/80'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-indigo-600 p-[2px]">
                      <img
                        src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200"
                        alt="Pastor IA"
                        className="w-full h-full object-cover rounded-[14px]"
                      />
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-400 border border-black flex items-center justify-center text-[9px]">
                      ✨
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-amber-300 truncate">
                        Pastor Virtual IA 🕊️
                      </h4>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold">
                        24/7
                      </span>
                    </div>
                    <p className="text-[11px] text-white/60 truncate">
                      Aconselhamento bíblico e oração
                    </p>
                  </div>
                </button>

                {/* Other community members */}
                {otherMembers.filter(u => 
                  u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (u.role && u.role.toLowerCase().includes(searchQuery.toLowerCase()))
                ).map((member) => {
                  const isCurrent = activeDmUser?.uid === member.uid;
                  return (
                    <button
                      key={member.uid}
                      onClick={() => handleSelectDm(member)}
                      className={`w-full p-2.5 rounded-2xl text-left flex items-center gap-3 transition-all ${
                        isCurrent
                          ? 'bg-white/15 border border-white/15 text-white shadow-md'
                          : 'hover:bg-white/5 text-white/70 hover:text-white'
                      }`}
                    >
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
                          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#13131A]" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-white truncate">
                            {member.name}
                          </h4>
                          {member.role && (
                            <span className="text-[9px] text-white/40 truncate">
                              {member.role.split(' ')[0]}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-white/50 truncate">
                          {member.statusMessage || (member.isOnline ? 'Online na igreja' : 'Ausente')}
                        </p>
                      </div>
                    </button>
                  );
                })}
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
          {/* Header Bar */}
          <div className="p-3.5 sm:p-4 border-b border-white/10 flex items-center justify-between bg-[#121218]/90 backdrop-blur-md relative z-10">
            <div className="flex items-center gap-3">
              {/* Mobile Back Button to Channels list */}
              <button
                onClick={() => setShowMobileList(true)}
                className="md:hidden p-2 rounded-xl bg-white/5 text-white/80 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              {activeDmUser ? (
                <>
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-2xl p-[2px] shadow-md ${
                      activeDmUser.uid === 'system_ai_pastor'
                        ? 'bg-gradient-to-tr from-amber-400 to-indigo-600'
                        : 'bg-gradient-to-tr from-purple-500 to-emerald-400'
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
                    {activeDmUser.isOnline && (
                      <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-black" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      {activeDmUser.name}
                      {activeDmUser.role && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 text-white/60 font-semibold hidden sm:inline">
                          {activeDmUser.role}
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-emerald-400">
                      {activeDmUser.uid === 'system_ai_pastor' ? 'Pastor & Conselheiro IA Online' : (activeDmUser.statusMessage || 'Membro do Corpo de Cristo')}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-xl shadow-md">
                    {currentChannelMeta?.icon || '🕊️'}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      #{currentChannelMeta?.name || 'Comunhão'}
                      {currentChannelMeta?.badge && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                          {currentChannelMeta.badge}
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-white/50 truncate max-w-xs sm:max-w-md">
                      {currentChannelMeta?.description}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Quick Actions in Header */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsBiblePickerOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                title="Inserir Versículo Bíblico"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Palavra</span>
              </button>

              <Link
                to="/prayers"
                className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-300 text-xs font-bold flex items-center gap-1.5 transition-colors hidden sm:flex"
              >
                <Heart className="w-3.5 h-3.5 text-rose-400 fill-current" />
                <span>Mural Oração</span>
              </Link>
            </div>
          </div>

          {/* ========================================================= */}
          {/* MESSAGES SCROLL CONTAINER                                 */}
          {/* ========================================================= */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-1 relative">
            {/* Background glowing ambient light */}
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
                    placeholder={
                      activeDmUser?.uid === 'system_ai_pastor'
                        ? 'Peça aconselhamento, tire dúvidas bíblicas ou peça uma oração...'
                        : 'Digite sua mensagem de fé e comunhão...'
                    }
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

              {/* Pastor IA option */}
              <button
                onClick={() => {
                  handleSelectAIPastor();
                  setShowMembersModal(false);
                }}
                className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 to-purple-600/20 border border-amber-400/40 text-left flex items-center gap-3.5 mb-3 transition-all hover:scale-[1.02]"
              >
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-indigo-600 p-[2px] shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200"
                    alt="Pastor IA"
                    className="w-full h-full object-cover rounded-[14px]"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-amber-300">Pastor Virtual IA 🕊️</h4>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold">24h</span>
                  </div>
                  <p className="text-[11px] text-white/60">Aconselhamento bíblico confidencial e orações</p>
                </div>
              </button>

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
                          {member.role || 'Membro'} • <span className="text-emerald-400">{member.statusMessage}</span>
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
    </div>
  );
}
