import React, { useState } from 'react';
import { Search, Heart, MessageSquare, Film, Sparkles, TrendingUp, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SocialPost, SocialReel } from '../../services/socialService';

interface ExploreGridProps {
  posts: SocialPost[];
  reels: SocialReel[];
  onSelectPost: (post: SocialPost) => void;
  onSelectReel: (reel: SocialReel) => void;
}

const TRENDING_TAGS = [
  '#Culto',
  '#Louvor',
  '#Palavra',
  '#Jovens',
  '#Testemunho',
  '#Missões',
  '#Avivamento',
  '#Oração',
  '#Família'
];

export default function ExploreGrid({
  posts,
  reels,
  onSelectPost,
  onSelectReel
}: ExploreGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Combine media items into an explore grid
  const allMediaItems = [
    ...reels.map(r => ({
      id: r.id,
      type: 'reel' as const,
      mediaUrl: r.videoThumbnail || r.videoUrl,
      isVideo: true,
      likesCount: r.likes?.length || 0,
      commentsCount: r.commentsCount || 0,
      caption: r.caption,
      author: r.userName,
      tags: r.tags || [],
      original: r
    })),
    ...posts.filter(p => p.imageUrl || (p.imageUrls && p.imageUrls.length > 0) || p.videoUrl).map(p => ({
      id: p.id,
      type: 'post' as const,
      mediaUrl: p.imageUrl || (p.imageUrls && p.imageUrls[0]) || p.videoUrl || '',
      isVideo: Boolean(p.videoUrl),
      likesCount: p.likes?.length || 0,
      commentsCount: p.commentsCount || 0,
      caption: p.content,
      author: p.userName,
      tags: p.tags || [],
      original: p
    }))
  ];

  // Filter items
  const filteredItems = allMediaItems.filter(item => {
    if (selectedTag) {
      const matchTag = item.tags.some(t => t.toLowerCase() === selectedTag.toLowerCase());
      const matchCaption = item.caption.toLowerCase().includes(selectedTag.toLowerCase());
      if (!matchTag && !matchCaption) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchAuthor = item.author.toLowerCase().includes(q);
      const matchCaption = item.caption.toLowerCase().includes(q);
      const matchTag = item.tags.some(t => t.toLowerCase().includes(q));
      return matchAuthor || matchCaption || matchTag;
    }

    return true;
  });

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 px-2 sm:px-4 pb-12">
      {/* 1. Search Bar */}
      <div className="relative">
        <div className="flex items-center bg-[#15151D] border border-white/10 rounded-2xl px-4 py-3 shadow-inner focus-within:border-purple-500/50 transition-colors">
          <Search className="w-4 h-4 text-white/40 shrink-0 mr-3" />
          <input
            type="text"
            placeholder="Pesquisar publicações, pregações, tags ou irmãos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-white placeholder-white/40 outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 text-white/40 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Trending Tags Bar */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
        <button
          onClick={() => setSelectedTag(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${
            selectedTag === null
              ? 'bg-white text-black font-bold'
              : 'bg-white/5 hover:bg-white/10 text-white/70'
          }`}
        >
          Todos
        </button>
        {TRENDING_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${
              selectedTag === tag
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-white/5 hover:bg-white/10 text-white/70'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* 3. Explore Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 text-white/50 text-xs">
          Nenhuma publicação encontrada para a busca.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          {filteredItems.map((item, index) => {
            // Give every 6th item a 2x2 highlight tile to replicate Instagram explore style
            const isFeatured = index % 7 === 0;

            return (
              <div
                key={`${item.id}-${index}`}
                onClick={() => {
                  if (item.type === 'reel') {
                    onSelectReel(item.original as SocialReel);
                  } else {
                    onSelectPost(item.original as SocialPost);
                  }
                }}
                className={`relative group bg-neutral-900 rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer aspect-square ${
                  isFeatured ? 'col-span-2 row-span-2' : ''
                }`}
              >
                {/* Media element */}
                {item.isVideo ? (
                  <video
                    src={item.mediaUrl}
                    muted
                    playsInline
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <img
                    src={item.mediaUrl}
                    alt="Explore thumbnail"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}

                {/* Video / Reel badge top right */}
                {item.isVideo && (
                  <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 backdrop-blur-md text-white">
                    <Film className="w-3.5 h-3.5" />
                  </div>
                )}

                {/* Hover Overlay with Likes & Comments Count */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-bold text-xs">
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4 fill-current text-rose-500" />
                    <span>{item.likesCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4 fill-current text-white" />
                    <span>{item.commentsCount}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
