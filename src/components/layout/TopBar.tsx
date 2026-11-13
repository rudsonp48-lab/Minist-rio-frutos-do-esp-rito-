import { useState, useEffect } from 'react';
import { Search, X, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../../lib/ThemeContext';
import { Link, useLocation } from 'react-router-dom';
import NotificationCenter from '../NotificationCenter';
import { auth } from '../../lib/firebase';
import { subscribeToUserConversations } from '../../services/chatService';

export default function TopBar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const { themeColor } = useTheme();
  const location = useLocation();

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const unsub = subscribeToUserConversations(uid, (convs) => {
      const total = convs.reduce((acc, c) => acc + (c.unreadCounts?.[uid] || 0), 0);
      setUnreadChatCount(total);
    });
    return () => unsub();
  }, []);

  if (location.pathname.startsWith('/chat')) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-40 lg:hidden px-4 pt-4 pb-2 bg-gradient-to-b from-white/90 via-white/80 to-transparent dark:from-black/90 dark:via-black/80 dark:to-transparent backdrop-blur-sm pointer-events-none">
      <div className="flex items-center justify-end gap-2 pointer-events-auto">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-global-search'))}
          className="w-11 h-11 flex items-center justify-center bg-white/70 dark:bg-[#1C1C1E]/80 backdrop-blur-md rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.1)] border border-black/5 dark:border-white/10 active:scale-95 transition-transform text-black dark:text-white"
          title="Busca Global"
        >
          <Search className="w-5 h-5 text-white/80" />
        </button>
        <NotificationCenter />

        <Link
          to="/chat"
          className="w-11 h-11 flex items-center justify-center bg-white/70 dark:bg-[#1C1C1E]/80 backdrop-blur-md rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.1)] border border-black/5 dark:border-white/10 active:scale-95 transition-transform text-black dark:text-white relative"
          title="Chat da Comunidade"
        >
          <MessageSquare className="w-5 h-5 text-purple-400" />
          {unreadChatCount > 0 ? (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center shadow">
              {unreadChatCount > 99 ? '99+' : unreadChatCount}
            </span>
          ) : (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400/70" />
          )}
        </Link>

        <AnimatePresence>
          {isSearchOpen ? (
            <motion.div
              initial={{ width: 44, opacity: 0 }}
              animate={{ width: '100%', opacity: 1 }}
              exit={{ width: 44, opacity: 0 }}
              className="relative flex items-center bg-gray-100 dark:bg-[#1C1C1E] rounded-full px-4 h-11 border border-black/5 dark:border-white/10 shadow-sm"
            >
              <Search className="w-5 h-5 text-gray-500 mr-2 shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="Buscar mensagens, séries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-black dark:text-white text-sm"
              />
              <button onClick={() => setIsSearchOpen(false)} className="ml-2">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </motion.div>
          ) : (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSearchOpen(true)}
              className="w-11 h-11 flex items-center justify-center bg-white/70 dark:bg-[#1C1C1E]/80 backdrop-blur-md rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.1)] border border-black/5 dark:border-white/10 active:scale-95 transition-transform"
            >
              <Search className="w-5 h-5 text-black dark:text-white" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
