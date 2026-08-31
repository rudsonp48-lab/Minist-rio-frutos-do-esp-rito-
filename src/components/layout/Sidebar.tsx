import { Link, useLocation } from 'react-router-dom';
import { User } from 'firebase/auth';
import { 
  Church, Home, BookOpen, Radio, Calendar, Heart, 
  Map, Headphones, Users, User as UserIcon, 
  Settings, Info, Shield, Search, MessageSquare, Download 
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { useTheme } from '../../lib/ThemeContext';
import NotificationCenter from '../NotificationCenter';

interface SidebarProps {
  user: User | null;
  isAdmin: boolean;
}

export default function Sidebar({ user, isAdmin }: SidebarProps) {
  const location = useLocation();
  const { themeColor, churchName, logoUrl } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const menuItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/bible', label: 'Bíblia', icon: BookOpen },
    { to: '/live', label: 'Cultos Ao Vivo', icon: Radio },
    { to: '/events', label: 'Agenda', icon: Calendar },
    { to: '/prayers', label: 'Feed Social & Oração', icon: Heart },
    { to: '/chat', label: 'Chat da Comunidade', icon: MessageSquare },
    { to: '/notes', label: 'Bloco de Notas', icon: BookOpen },
    { to: '/gallery', label: 'Estudos Bíblicos', icon: Map },
    { to: '/devotional', label: 'Devocionais', icon: BookOpen },
    { to: '/media', label: 'Louvores', icon: Headphones },
    { to: '/podcast', label: 'Podcast', icon: Radio },
    { to: '/cells', label: 'Células', icon: Users },
  ];

  const bottomItems = [
    { to: '/profile', label: 'Área do Membro', icon: UserIcon },
    { to: '/settings', label: 'Configurações', icon: Settings },
    { to: '/about', label: 'Sobre a Igreja', icon: Info },
  ];

  if (isAdmin) {
    bottomItems.unshift({ to: '/admin', label: 'Painel Admin', icon: Shield });
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[280px] bg-white/70 dark:bg-[#1C1C1E]/70 backdrop-blur-[40px] border-r border-black/5 dark:border-white/[0.04] z-40 hidden lg:flex flex-col overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
      {/* Header */}
      <div className="p-8 pb-4 relative z-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 overflow-hidden">
          {logoUrl ? (
            <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
              <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain drop-shadow-md dark:mix-blend-screen" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
              <Church className="w-5 h-5 text-black dark:text-white" />
            </div>
          )}
          <div className="flex flex-col overflow-hidden">
            <span 
              className="text-lg font-serif tracking-widest text-black dark:text-white uppercase truncate"
              style={{ fontFamily: '"Playfair Display", "Cinzel", serif' }}
            >
              {churchName || 'ECCLESIA'}
            </span>
            <span className="text-[10px] font-medium text-black/40 dark:text-white/40 tracking-[0.2em] uppercase">Ministério</span>
          </div>
        </div>

        <NotificationCenter />
      </div>

      <div className="px-6 py-2 relative z-10">
        <div className="flex items-center bg-black/5 dark:bg-white/5 rounded-full px-3 h-10 border border-black/5 dark:border-white/5 transition-colors group focus-within:border-black/20 dark:focus-within:border-white/20">
          <Search className="w-4 h-4 text-black/40 dark:text-white/40 shrink-0 group-focus-within:text-[var(--theme-color)] transition-colors" />
          <input
            type="text"
            placeholder="Pesquisar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-black dark:text-white text-sm ml-2 placeholder-black/40 dark:placeholder-white/40"
          />
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scrollbar-hide relative z-10">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                isActive ? "text-black dark:text-white font-semibold" : "text-black/60 dark:text-white/50 hover:text-black dark:hover:text-white"
              )}
            >
              {isActive && (
                <div 
                  className="absolute inset-0 opacity-10 dark:opacity-20 rounded-xl" 
                  style={{ backgroundColor: themeColor || '#8A2BE2' }} 
                />
              )}
              {isActive && (
                <div 
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 rounded-r-full" 
                  style={{ backgroundColor: themeColor || '#8A2BE2' }} 
                />
              )}
              <Icon 
                className={cn(
                  "w-5 h-5 transition-transform duration-300",
                  isActive ? "scale-110" : "group-hover:scale-110"
                )} 
                style={isActive ? { color: themeColor || '#8A2BE2' } : {}}
              />
              <span className="text-[14px] tracking-wide">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Divider */}
      <div className="px-8 py-2 relative z-10">
        <div className="h-[1px] w-full bg-black/5 dark:bg-white/5" />
      </div>

      {/* Bottom Navigation */}
      <div className="px-4 pb-8 space-y-1 relative z-10">
        <button
          onClick={() => {
            localStorage.removeItem('church_app_install_dismissed');
            window.location.reload();
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 font-medium"
        >
          <Download className="w-5 h-5 text-emerald-500 transition-transform group-hover:scale-110" />
          <span className="text-[14px] tracking-wide">Baixar Aplicativo</span>
        </button>

        {bottomItems.map((item) => {
          const isActive = location.pathname === item.to;
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                isActive ? "text-black dark:text-white bg-black/5 dark:bg-white/5 font-semibold" : "text-black/60 dark:text-white/50 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-black dark:text-white" : "")} />
              <span className="text-[14px] tracking-wide">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
