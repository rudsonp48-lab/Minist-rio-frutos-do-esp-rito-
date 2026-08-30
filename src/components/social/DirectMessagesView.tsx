import React, { useState, useEffect } from 'react';
import { Search, Send, MessageSquare, Plus, User as UserIcon, Circle, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../lib/firebase';
import { collection, query, limit, onSnapshot } from 'firebase/firestore';
import { 
  subscribeToUserConversations, 
  ConversationSummary, 
  getDirectMessageChannelId,
  markConversationAsRead 
} from '../../services/chatService';
import { ActiveUser, subscribeToActiveUsers } from '../../services/presenceService';

interface DirectUser {
  uid: string;
  name: string;
  photoURL?: string;
  email?: string;
  role?: string;
  isOnline?: boolean;
  lastMessage?: string;
  lastMessageSenderId?: string;
  lastMessageIso?: string;
  unread?: number;
  lastTime?: number;
}

export default function DirectMessagesView() {
  const navigate = useNavigate();
  const currentUser = auth.currentUser;
  const [searchQuery, setSearchQuery] = useState('');
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to community members
  useEffect(() => {
    const unsubscribeUsers = subscribeToActiveUsers((users) => {
      setActiveUsers(users.filter(u => u.uid !== currentUser?.uid));
      setLoading(false);
    });
    return () => unsubscribeUsers();
  }, [currentUser?.uid]);

  // Subscribe to conversations for real-time order and unread badges
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribeConvs = subscribeToUserConversations(currentUser.uid, (convs) => {
      setConversations(convs);
    });
    return () => unsubscribeConvs();
  }, [currentUser?.uid]);

  const formatTime = (isoString?: string) => {
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

  // Merge users and conversations, placing latest message at the top
  const processedUsers: DirectUser[] = activeUsers.map(user => {
    const dmId = currentUser ? getDirectMessageChannelId(currentUser.uid, user.uid) : '';
    const conv = conversations.find(c => 
      c.id === dmId || 
      (c.participants && c.participants.includes(user.uid) && c.participants.includes(currentUser?.uid || ''))
    );
    const unread = (conv?.unreadCounts && currentUser?.uid) ? (conv.unreadCounts[currentUser.uid] || 0) : 0;
    const lastTime = conv?.lastMessageIso ? new Date(conv.lastMessageIso).getTime() : 0;

    return {
      uid: user.uid,
      name: user.name,
      photoURL: user.photoURL,
      email: user.email,
      role: user.role,
      isOnline: user.isOnline,
      lastMessage: conv?.lastMessage || '',
      lastMessageSenderId: conv?.lastMessageSenderId || '',
      lastMessageIso: conv?.lastMessageIso,
      unread,
      lastTime
    };
  }).filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.lastMessage && u.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()))
  ).sort((a, b) => {
    // 1. Most recent message conversation moves to top
    if (a.lastTime > 0 || b.lastTime > 0) {
      return (b.lastTime || 0) - (a.lastTime || 0);
    }
    // 2. Online status
    if (a.isOnline !== b.isOnline) {
      return a.isOnline ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  const handleOpenChat = (user: DirectUser) => {
    if (currentUser) {
      const dmId = getDirectMessageChannelId(currentUser.uid, user.uid);
      markConversationAsRead(dmId, currentUser.uid);
    }
    navigate(`/chat?dm=${user.uid}`);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 px-2 sm:px-4 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-[#14141A] border border-white/10 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-rose-500 flex items-center justify-center text-white shadow-md">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Direct & Mensagens</h3>
            <p className="text-xs text-white/50">Converse em particular com os irmãos da congregação</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/chat')}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Abrir Chat
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Pesquisar mensagens ou irmãos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#14141A] border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/40 outline-none focus:border-purple-500 transition-colors shadow-sm"
        />
      </div>

      {/* Active Users List with dynamic sorting */}
      <div className="bg-[#14141A] border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5 shadow-xl">
        {loading ? (
          <div className="p-8 text-center text-xs text-white/40 animate-pulse">
            Carregando contatos...
          </div>
        ) : processedUsers.length === 0 ? (
          <div className="p-8 text-center text-xs text-white/40">
            Nenhum membro encontrado.
          </div>
        ) : (
          processedUsers.map((user) => {
            const hasUnread = (user.unread || 0) > 0;
            const isSentByMe = user.lastMessageSenderId === currentUser?.uid;
            const timeLabel = formatTime(user.lastMessageIso);

            return (
              <div
                key={user.uid}
                onClick={() => handleOpenChat(user)}
                className={`p-3.5 sm:p-4 flex items-center justify-between cursor-pointer transition-all group ${
                  hasUnread 
                    ? 'bg-purple-950/25 hover:bg-purple-900/35 border-l-4 border-l-purple-500' 
                    : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <div className={`w-11 h-11 rounded-full p-[2px] overflow-hidden ${
                      hasUnread 
                        ? 'bg-gradient-to-tr from-rose-500 via-purple-500 to-amber-400 animate-pulse ring-2 ring-purple-500/40' 
                        : 'bg-neutral-800 border border-white/10'
                    }`}>
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-purple-800 to-indigo-900 flex items-center justify-center text-white font-bold text-sm rounded-full">
                          {user.name[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    {user.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-black" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className={`text-sm truncate group-hover:text-purple-300 transition-colors ${
                        hasUnread ? 'font-black text-white' : 'font-bold text-white/90'
                      }`}>
                        {user.name}
                      </h4>
                      {user.role && (
                        <span className="text-[10px] text-white/40 shrink-0 hidden sm:inline">
                          • {user.role.split(' ')[0]}
                        </span>
                      )}
                    </div>
                    
                    <p className={`text-xs truncate max-w-[200px] sm:max-w-xs ${
                      hasUnread ? 'text-purple-200 font-semibold' : 'text-white/50'
                    }`}>
                      {user.lastMessage ? (
                        <span>
                          {isSentByMe && <span className="text-white/40 font-normal">Você: </span>}
                          {user.lastMessage}
                        </span>
                      ) : (
                        user.isOnline ? 'Online agora' : 'Membro da congregação'
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  {timeLabel && (
                    <span className={`text-[11px] ${hasUnread ? 'text-purple-400 font-bold' : 'text-white/40'}`}>
                      {timeLabel}
                    </span>
                  )}
                  
                  {hasUnread && (
                    <span className="px-2 py-0.5 min-w-[20px] text-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-black shadow-md shadow-purple-500/40 animate-pulse">
                      {user.unread}
                    </span>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenChat(user);
                    }}
                    className="p-2 rounded-full bg-white/5 group-hover:bg-purple-600 text-white/70 group-hover:text-white transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
