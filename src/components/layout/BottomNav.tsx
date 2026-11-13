import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Play, MessageSquare, User } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../lib/ThemeContext';
import { auth } from '../../lib/firebase';
import { subscribeToUserConversations } from '../../services/chatService';

export default function BottomNav() {
  const location = useLocation();
  const { themeColor } = useTheme();
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const unsub = subscribeToUserConversations(uid, (convs) => {
      const total = convs.reduce((acc, c) => acc + (c.unreadCounts?.[uid] || 0), 0);
      setUnreadChatCount(total);
    });
    return () => unsub();
  }, []);

  // Hide BottomNav in Chat to prevent interference with conversation view and input bar
  if (location.pathname.startsWith('/chat')) {
    return null;
  }

  const navItems = [
    { path: '/', icon: Home, label: 'Início' },
    { path: '/bible', icon: BookOpen, label: 'Bíblia' },
    { path: '/media', icon: Play, label: 'Mídia' },
    { path: '/chat', icon: MessageSquare, label: 'Chat', badge: unreadChatCount },
    { path: '/profile', icon: User, label: 'Membro' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom lg:hidden px-3 pb-3 pt-1 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none flex justify-center">
      <div className="pointer-events-auto bg-[#16161D]/95 backdrop-blur-2xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.65)] rounded-3xl w-full max-w-[430px] px-2 py-1.5">
        <div className="relative grid grid-cols-5 gap-1 items-center">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 py-1.5 rounded-2xl transition-all duration-200 active:scale-95",
                  isActive ? "font-bold" : "text-white/55 hover:text-white font-medium"
                )}
                style={isActive ? { color: themeColor, backgroundColor: `${themeColor}1F` } : {}}
              >
                <div className="relative">
                  <Icon className={cn("w-5 h-5 transition-transform duration-200", isActive ? "scale-105" : "")} strokeWidth={isActive ? 2.2 : 1.7} />
                  {item.badge && item.badge > 0 ? (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center shadow">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  ) : null}
                </div>
                <span className="text-[11px] leading-none tracking-tight">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className="absolute -bottom-0.5 w-4 h-0.5 rounded-full"
                    style={{ backgroundColor: themeColor }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
