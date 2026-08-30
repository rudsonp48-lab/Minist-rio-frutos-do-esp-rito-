import React from 'react';
import { motion } from 'motion/react';
import { useTheme } from '../../lib/ThemeContext';

export type SocialTabType = 'feed' | 'reels' | 'direct' | 'explore';

interface InstagramSocialBarProps {
  activeTab: SocialTabType;
  onTabChange: (tab: SocialTabType) => void;
  unreadDirectsCount?: number;
}

export default function InstagramSocialBar({
  activeTab,
  onTabChange,
  unreadDirectsCount = 0
}: InstagramSocialBarProps) {
  const { themeColor } = useTheme();

  return (
    <div className="w-full bg-[#0A0A0C]/90 backdrop-blur-xl border-b border-white/10 sticky top-0 z-30 transition-all duration-300">
      <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-around">
        {/* 1. Home / Feed Icon */}
        <button
          id="social-tab-feed"
          onClick={() => onTabChange('feed')}
          aria-label="Feed Principal"
          className="relative flex items-center justify-center p-2.5 rounded-full transition-all duration-200 active:scale-90 group"
        >
          <svg 
            viewBox="0 0 24 24" 
            className={`w-6 h-6 transition-all duration-200 ${
              activeTab === 'feed' 
                ? 'text-white scale-110' 
                : 'text-white/50 group-hover:text-white/80'
            }`}
            fill={activeTab === 'feed' ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={activeTab === 'feed' ? '0' : '2'}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 9.5L12 2.5L21 9.5V20C21 20.5523 20.5523 21 20 21H15C14.4477 21 14 20.5523 14 20V14C14 13.4477 13.5523 13 13 13H11C10.4477 13 10 13.4477 10 14V20C10 20.5523 9.55228 21 9 21H4C3.44772 21 3 20.5523 3 20V9.5Z" />
          </svg>
          
          {activeTab === 'feed' && (
            <motion.div
              layoutId="social-nav-active-pill"
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
        </button>

        {/* 2. Reels Icon (Exact Instagram Reels Icon with Rounded Square and Play triangle) */}
        <button
          id="social-tab-reels"
          onClick={() => onTabChange('reels')}
          aria-label="Reels de Vídeo"
          className="relative flex items-center justify-center p-2.5 rounded-full transition-all duration-200 active:scale-90 group"
        >
          <div className={`relative transition-all duration-200 ${
            activeTab === 'reels' ? 'scale-110' : 'group-hover:scale-105'
          }`}>
            <svg 
              viewBox="0 0 24 24" 
              className={`w-6 h-6 ${
                activeTab === 'reels' 
                  ? 'text-white' 
                  : 'text-white/50 group-hover:text-white/80'
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Outer rounded rectangle */}
              <rect x="2.5" y="2.5" width="19" height="19" rx="6" />
              {/* Internal reels film slash and play triangle */}
              <polygon points="10 8 16 12 10 16 10 8" fill={activeTab === 'reels' ? 'currentColor' : 'none'} />
            </svg>
          </div>

          {activeTab === 'reels' && (
            <motion.div
              layoutId="social-nav-active-pill"
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
        </button>

        {/* 3. Direct Messages Icon (Instagram Direct Paperplane) */}
        <button
          id="social-tab-direct"
          onClick={() => onTabChange('direct')}
          aria-label="Mensagens Diretas / Chat"
          className="relative flex items-center justify-center p-2.5 rounded-full transition-all duration-200 active:scale-90 group"
        >
          <svg 
            viewBox="0 0 24 24" 
            className={`w-6 h-6 transition-all duration-200 ${
              activeTab === 'direct' 
                ? 'text-white scale-110' 
                : 'text-white/50 group-hover:text-white/80'
            }`}
            fill={activeTab === 'direct' ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={activeTab === 'direct' ? '0' : '2'}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" />
          </svg>

          {unreadDirectsCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center shadow-lg animate-pulse">
              {unreadDirectsCount > 9 ? '9+' : unreadDirectsCount}
            </span>
          )}

          {activeTab === 'direct' && (
            <motion.div
              layoutId="social-nav-active-pill"
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
        </button>

        {/* 4. Search / Explore Icon (Instagram Search / Lupa) */}
        <button
          id="social-tab-explore"
          onClick={() => onTabChange('explore')}
          aria-label="Explorar e Pesquisar"
          className="relative flex items-center justify-center p-2.5 rounded-full transition-all duration-200 active:scale-90 group"
        >
          <svg 
            viewBox="0 0 24 24" 
            className={`w-6 h-6 transition-all duration-200 ${
              activeTab === 'explore' 
                ? 'text-white scale-110 stroke-[2.5]' 
                : 'text-white/50 group-hover:text-white/80'
            }`}
            fill="none"
            stroke="currentColor"
            strokeWidth={activeTab === 'explore' ? '2.5' : '2'}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          {activeTab === 'explore' && (
            <motion.div
              layoutId="social-nav-active-pill"
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
        </button>
      </div>
    </div>
  );
}
