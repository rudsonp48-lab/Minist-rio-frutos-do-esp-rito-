import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Send, 
  CheckCircle2, 
  Search, 
  Filter, 
  MessageSquare, 
  Plus, 
  ChevronRight, 
  Sparkles, 
  Share2, 
  Flame, 
  Mic, 
  Check, 
  X,
  Users,
  Volume2, 
  BookOpen, 
  Pin, 
  TrendingUp, 
  ShieldCheck, 
  Award, 
  Radio, 
  Clock, 
  Image as ImageIcon, 
  Film, 
  Globe, 
  Church, 
  Tag, 
  Newspaper, 
  Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { getCachedUserPhoto } from '../services/userService';
import { 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  orderBy, 
  serverTimestamp, 
  updateDoc, 
  doc, 
  arrayUnion, 
  arrayRemove 
} from 'firebase/firestore';
import { notifyPrayerIntercession, notifyPrayerTestimony } from '../services/notificationService';
import NotificationCenter from '../components/NotificationCenter';
import InstagramSocialBar, { SocialTabType } from '../components/social/InstagramSocialBar';
import StoriesBar from '../components/social/StoriesBar';
import StoryViewerModal from '../components/social/StoryViewerModal';
import CreateStoryModal from '../components/social/CreateStoryModal';
import ReelsViewer from '../components/social/ReelsViewer';
import CreateReelModal from '../components/social/CreateReelModal';
import InstagramPostCard from '../components/social/InstagramPostCard';
import ExploreGrid from '../components/social/ExploreGrid';
import DirectMessagesView from '../components/social/DirectMessagesView';
import CreatePrayerPostModal from '../components/CreatePrayerPostModal';
import ActiveUsersWidget from '../components/ActiveUsersWidget';
import { INITIAL_COMMUNITY_PRAYERS } from '../lib/communityPrayersData';
import { 
  UserStoryGroup, 
  SocialReel, 
  SocialPost, 
  subscribeToStories, 
  subscribeToReels 
} from '../services/socialService';

const FEED_CATEGORIES = [
  { id: 'all', label: 'Todos os Posts', emoji: '✨' },
  { id: 'culto', label: 'Cultos & Relatos', emoji: '📸' },
  { id: 'video', label: 'Vídeos & Louvor', emoji: '🎥' },
  { id: 'noticia', label: 'Mundo Cristão & Missões', emoji: '🌍' },
  { id: 'oracao', label: 'Pedidos de Oração', emoji: '🙏' },
  { id: 'saude', label: 'Saúde & Cura', emoji: '🩺' },
  { id: 'familia', label: 'Família & Lar', emoji: '🏡' },
  { id: 'financas', label: 'Trabalho & Provisão', emoji: '💼' },
  { id: 'espiritual', label: 'Vida Espiritual', emoji: '🕊️' },
  { id: 'agradecimento', label: 'Testemunhos', emoji: '🎉' },
];

const GOSPEL_NEWS_HIGHLIGHTS = [
  {
    id: 'n1',
    title: 'Cruzada no Sertão reúne mais de 10 mil pessoas em noite de clamor e milagres',
    source: 'Missões Nacionais',
    time: 'Hoje',
    tag: '#Avivamento'
  },
  {
    id: 'n2',
    title: 'Juventude cristã bate recorde de doação de sangue e alimentos na semana da Páscoa',
    source: 'Gospel News',
    time: 'Ontem',
    tag: '#AçãoSocial'
  },
  {
    id: 'n3',
    title: 'Novo documentário sobre tradução da Bíblia para línguas indígenas é lançado',
    source: 'Tradução Bíblica',
    time: '2 dias atrás',
    tag: '#Palavra'
  }
];

export default function Prayers() {
  // Social Navigation Tab: 'feed' | 'reels' | 'direct' | 'explore'
  const [socialTab, setSocialTab] = useState<SocialTabType>('feed');

  // Posts State
  const [prayers, setPrayers] = useState<SocialPost[]>(INITIAL_COMMUNITY_PRAYERS as SocialPost[]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Modals State
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [showCreateStoryModal, setShowCreateStoryModal] = useState(false);
  const [showCreateReelModal, setShowCreateReelModal] = useState(false);

  // Stories State
  const [storyGroups, setStoryGroups] = useState<UserStoryGroup[]>([]);
  const [selectedStoryGroup, setSelectedStoryGroup] = useState<UserStoryGroup | null>(null);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);

  // Reels State
  const [reels, setReels] = useState<SocialReel[]>([]);

  // Testimony Modal
  const [testimonyModalPrayer, setTestimonyModalPrayer] = useState<SocialPost | null>(null);
  const [testimonyText, setTestimonyText] = useState('');
  const [isSavingTestimony, setIsSavingTestimony] = useState(false);

  const currentUser = auth.currentUser;

  // Real-time Posts Subscription
  useEffect(() => {
    const q = query(collection(db, 'prayers'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const firestorePrayers: SocialPost[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SocialPost));

      // Merge with initial community posts
      const existingIds = new Set(firestorePrayers.map(p => p.id));
      const merged = [
        ...firestorePrayers,
        ...(INITIAL_COMMUNITY_PRAYERS as SocialPost[]).filter(p => !existingIds.has(p.id))
      ];

      setPrayers(merged);
      setLoading(false);
    }, (error) => {
      console.debug('[Prayers] Snapshot fallback:', error);
      setPrayers(INITIAL_COMMUNITY_PRAYERS as SocialPost[]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time Stories Subscription
  useEffect(() => {
    const unsub = subscribeToStories((groups) => {
      // Fallback sample story group if empty
      if (groups.length === 0) {
        setStoryGroups([
          {
            userId: 'seed-pastor-marcos',
            userName: 'Pr. Marcos Silva',
            userPhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
            userRole: 'Pastor Presidente',
            hasUnseen: true,
            latestTimestamp: Date.now(),
            stories: [
              {
                id: 'sample-s1',
                userId: 'seed-pastor-marcos',
                userName: 'Pr. Marcos Silva',
                userPhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
                userRole: 'Pastor Presidente',
                mediaUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800',
                mediaType: 'image',
                caption: '🔥 Que presença gloriosa de Deus em nosso culto da família ontem!',
                createdAt: new Date()
              }
            ]
          },
          {
            userId: 'seed-louvor',
            userName: 'Ministério de Louvor',
            userPhoto: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=150',
            userRole: 'Louvor & Adoração',
            hasUnseen: true,
            latestTimestamp: Date.now() - 3600000,
            stories: [
              {
                id: 'sample-s2',
                userId: 'seed-louvor',
                userName: 'Ministério de Louvor',
                userPhoto: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=150',
                userRole: 'Louvor & Adoração',
                mediaUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
                mediaType: 'image',
                caption: 'Ensaio geral para o congresso de jovens! Deus é fiel.',
                createdAt: new Date()
              }
            ]
          }
        ]);
      } else {
        setStoryGroups(groups);
      }
    });

    return () => unsub();
  }, []);

  // Real-time Reels Subscription
  useEffect(() => {
    const unsub = subscribeToReels((reelsData) => {
      if (reelsData.length === 0) {
        // Sample reels for preview
        setReels([
          {
            id: 'sample-reel-1',
            userId: 'seed-user-reels',
            userName: 'Ministério de Louvor',
            userPhoto: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=150',
            userRole: 'Louvor & Adoração',
            videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-guitarist-playing-acoustic-guitar-41130-large.mp4',
            caption: '🎶 "Tu és Santo, poderoso e digno de todo louvor!" Momento marcante no culto de domingo.',
            musicTitle: 'Santo Espírito És Bem-Vindo Aqui',
            tags: ['#Culto', '#Louvor', '#Ecclesia'],
            likes: ['seed1', 'seed2', 'seed3'],
            commentsCount: 8,
            createdAt: new Date()
          },
          {
            id: 'sample-reel-2',
            userId: 'seed-pastor',
            userName: 'Pr. Marcos Silva',
            userPhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
            userRole: 'Pastor Presidente',
            videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-holding-a-bible-in-the-church-43187-large.mp4',
            caption: '📖 "Confia no Senhor de todo o teu coração..." Uma palavra de paz e ânimo para a sua semana!',
            musicTitle: 'Voz da Esperança & Fé',
            tags: ['#Palavra', '#Devocional', '#Avivamento'],
            likes: ['seed1', 'seed4'],
            commentsCount: 12,
            createdAt: new Date()
          }
        ]);
      } else {
        setReels(reelsData);
      }
    });

    return () => unsub();
  }, []);

  // Filtered Posts Logic
  const filteredPrayers = prayers.filter((p) => {
    // 1. Category filter
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'oracao') {
        const isPrayerType = ['oracao', 'saude', 'familia', 'financas', 'espiritual', 'urgente'].includes(p.category || '');
        if (!isPrayerType) return false;
      } else if (p.category !== selectedCategory) {
        return false;
      }
    }

    // 2. Tag filter
    if (selectedTag && (!p.tags || !p.tags.includes(selectedTag))) {
      return false;
    }

    // 3. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = p.title?.toLowerCase().includes(q);
      const contentMatch = p.content.toLowerCase().includes(q);
      const nameMatch = p.userName.toLowerCase().includes(q);
      const categoryMatch = p.category?.toLowerCase().includes(q);
      const locationMatch = p.location?.toLowerCase().includes(q);
      const tagMatch = p.tags?.some(t => t.toLowerCase().includes(q));
      return titleMatch || contentMatch || nameMatch || categoryMatch || locationMatch || tagMatch;
    }

    return true;
  });

  const handleOpenStory = (group: UserStoryGroup, index = 0) => {
    setSelectedStoryGroup(group);
    setSelectedStoryIndex(index);
  };

  const handleSaveTestimony = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testimonyModalPrayer || !testimonyText.trim() || !currentUser) return;

    setIsSavingTestimony(true);
    try {
      if (!testimonyModalPrayer.id.startsWith('seed-')) {
        const prayerRef = doc(db, 'prayers', testimonyModalPrayer.id);
        await updateDoc(prayerRef, {
          answered: true,
          testimony: testimonyText.trim()
        });

        await notifyPrayerTestimony({
          prayerId: testimonyModalPrayer.id,
          testimony: testimonyText.trim(),
          authorName: testimonyModalPrayer.userName
        });
      } else {
        testimonyModalPrayer.answered = true;
        testimonyModalPrayer.testimony = testimonyText.trim();
      }

      setTestimonyModalPrayer(null);
      setTestimonyText('');
    } catch (err) {
      console.error('Error saving testimony:', err);
    } finally {
      setIsSavingTestimony(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0E] text-white pb-24">
      {/* 1. Instagram-Style Top Social Navigation Bar (Home, Reels, Direct, Search) */}
      <InstagramSocialBar
        activeTab={socialTab}
        onTabChange={(tab) => setSocialTab(tab)}
      />

      {/* Render Active Social View */}
      {socialTab === 'reels' ? (
        /* Reels View (Instagram Reels Tab) */
        <div className="max-w-xl mx-auto px-2 sm:px-4 pt-2">
          <ReelsViewer
            reels={reels}
            onOpenCreateReel={() => setShowCreateReelModal(true)}
          />
        </div>
      ) : socialTab === 'direct' ? (
        /* Direct Messages View (Instagram Direct Tab) */
        <div className="max-w-2xl mx-auto px-2 sm:px-4 pt-4">
          <DirectMessagesView />
        </div>
      ) : socialTab === 'explore' ? (
        /* Explore & Search View (Instagram Search Tab) */
        <div className="max-w-4xl mx-auto px-2 sm:px-4 pt-4">
          <ExploreGrid
            posts={prayers}
            reels={reels}
            onSelectPost={(p) => {
              setSocialTab('feed');
              setSearchQuery(p.userName);
            }}
            onSelectReel={(r) => {
              setSocialTab('reels');
            }}
          />
        </div>
      ) : (
        /* 2. Main Instagram Feed View */
        <div className="w-full">
          {/* Stories Tray Carousel (Instagram Stories Bar) */}
          <StoriesBar
            storyGroups={storyGroups}
            onOpenStory={(group) => handleOpenStory(group)}
            onCreateStory={() => setShowCreateStoryModal(true)}
          />

          {/* Feed Container */}
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 space-y-6">
            {/* Active Connected Users Reel */}
            <ActiveUsersWidget />

            {/* Category Chips Bar */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
              {FEED_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSelectedTag(null);
                  }}
                  className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 flex items-center gap-1.5 ${
                    selectedCategory === cat.id && !selectedTag
                      ? 'bg-white text-black border-white shadow-lg'
                      : 'bg-[#141419] text-white/70 hover:text-white border-white/10'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              ))}

              {selectedTag && (
                <div className="flex items-center gap-1 px-3 py-1 rounded-2xl bg-purple-600 text-white text-xs font-bold shrink-0">
                  <span>Filtro: {selectedTag}</span>
                  <button onClick={() => setSelectedTag(null)} className="p-0.5 hover:bg-white/20 rounded-full">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* 2-Column Responsive Layout: Feed (Left 65%) + Gospel & Pastoral Sidebar (Right 35%) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Main Feed Column */}
              <main className="lg:col-span-8 max-w-xl mx-auto lg:max-w-none w-full space-y-4">
                {/* Social Quick Composer Card */}
                <div className="p-4 rounded-2xl sm:rounded-[28px] bg-[#121217] border border-white/10 shadow-xl space-y-3">
                  <div 
                    onClick={() => setShowCreatePostModal(true)}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 shrink-0">
                      {(() => {
                        const myPhoto = (currentUser?.uid ? getCachedUserPhoto(currentUser.uid) : '') || currentUser?.photoURL;
                        return myPhoto ? (
                          <img src={myPhoto} alt="Eu" className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <div className="w-full h-full bg-black rounded-full flex items-center justify-center font-bold text-xs text-white">
                            {currentUser?.displayName?.charAt(0) || '✝'}
                          </div>
                        );
                      })()}
                    </div>

                    <div className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 group-hover:border-white/25 transition-colors">
                      <span className="text-xs text-white/50 group-hover:text-white/80 transition-colors">
                        O que Deus colocou no seu coração hoje?
                      </span>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center justify-between gap-1 pt-2 border-t border-white/5 flex-wrap">
                    <button
                      onClick={() => setShowCreatePostModal(true)}
                      className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <ImageIcon className="w-4 h-4 text-purple-400" />
                      <span>Postar Foto</span>
                    </button>

                    <button
                      onClick={() => setShowCreateReelModal(true)}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <Film className="w-4 h-4 text-rose-400" />
                      <span>Gravar Reel</span>
                    </button>

                    <button
                      onClick={() => setShowCreateStoryModal(true)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Novo Story</span>
                    </button>

                    <button
                      onClick={() => setShowCreatePostModal(true)}
                      className="px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white text-xs font-bold flex items-center gap-1.5 ml-auto shadow-md active:scale-95 transition-transform"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Publicar</span>
                    </button>
                  </div>
                </div>

                {/* Posts Feed */}
                {loading ? (
                  <div className="text-center py-20 text-white/40 text-xs font-bold uppercase tracking-widest animate-pulse">
                    Atualizando feed em tempo real...
                  </div>
                ) : filteredPrayers.length === 0 ? (
                  <div className="p-12 rounded-[32px] bg-[#14141A]/70 border border-white/10 text-center space-y-3">
                    <Heart className="w-12 h-12 text-white/20 mx-auto" />
                    <h4 className="text-base font-bold text-white">Nenhuma publicação encontrada</h4>
                    <p className="text-xs text-white/50 max-w-sm mx-auto">
                      {searchQuery 
                        ? `Nenhum resultado para "${searchQuery}".`
                        : 'Seja o primeiro a compartilhar fotos do culto, vídeos ou um relato edificante!'}
                    </p>
                    <button
                      onClick={() => setShowCreatePostModal(true)}
                      className="px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-rose-600 text-white text-xs font-bold uppercase tracking-wider shadow-lg"
                    >
                      Criar Primeira Publicação
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredPrayers.map((post) => (
                      <InstagramPostCard
                        key={post.id}
                        post={post}
                        onOpenStory={(userId) => {
                          const group = storyGroups.find(g => g.userId === userId);
                          if (group) handleOpenStory(group);
                        }}
                        onTagClick={(tag) => setSelectedTag(tag)}
                      />
                    ))}
                  </div>
                )}
              </main>

              {/* Right Sidebar Column */}
              <aside className="lg:col-span-4 space-y-5 hidden lg:block">
                {/* Daily Faith Scripture Card */}
                <div className="p-6 rounded-[28px] bg-gradient-to-br from-purple-950/50 via-[#181424] to-black border border-purple-500/20 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 blur-2xl rounded-full pointer-events-none" />
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider mb-2">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    Palavra de Comunhão & Fé
                  </div>
                  <blockquote className="text-sm font-serif italic text-white/90 leading-relaxed mb-3">
                    "E perseveravam na doutrina dos apóstolos, e na comunhão, e no partir do pão, e nas orações. Em cada alma havia temor, e muitas maravilhas e sinais se faziam."
                  </blockquote>
                  <cite className="text-xs font-bold text-amber-400 not-italic block">
                    — Atos 2:42-43
                  </cite>
                </div>

                {/* Christian Gospel News Box */}
                <div className="p-6 rounded-[28px] bg-[#141419] border border-white/10 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                      <Globe className="w-4 h-4" />
                      Mundo Cristão em Foco
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                      Gospel
                    </span>
                  </div>

                  <div className="space-y-3">
                    {GOSPEL_NEWS_HIGHLIGHTS.map((item) => (
                      <div key={item.id} className="p-3 rounded-2xl bg-black/30 border border-white/5 space-y-1.5 hover:border-emerald-500/30 transition-colors">
                        <span className="text-xs font-bold text-white leading-snug block">
                          {item.title}
                        </span>
                        <div className="flex items-center justify-between text-[10px] text-white/40 pt-1">
                          <span className="text-emerald-400 font-medium">{item.source} • {item.time}</span>
                          <span className="text-purple-300">{item.tag}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pastoral Care & Intercession Box */}
                <div className="p-6 rounded-[28px] bg-gradient-to-br from-rose-950/30 via-[#18141C] to-black border border-rose-500/20 shadow-xl space-y-3">
                  <div className="flex items-center gap-2.5 text-rose-400 text-xs font-bold uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4" />
                    Gabinete Pastoral & SOS Oração
                  </div>
                  <p className="text-xs text-white/75 leading-relaxed">
                    Se você está passando por uma situação confidencial ou de urgência familiar, nossos pastores estão prontos para interceder com você.
                  </p>
                  <div className="pt-1">
                    <button
                      onClick={() => setShowCreatePostModal(true)}
                      className="w-full py-2.5 px-4 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-200 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <Heart className="w-4 h-4 text-rose-400 fill-current" />
                      Solicitar Oração Pastoral
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreatePrayerPostModal
        isOpen={showCreatePostModal}
        onClose={() => setShowCreatePostModal(false)}
      />

      <CreateStoryModal
        isOpen={showCreateStoryModal}
        onClose={() => setShowCreateStoryModal(false)}
      />

      <CreateReelModal
        isOpen={showCreateReelModal}
        onClose={() => setShowCreateReelModal(false)}
      />

      {/* Story Viewer Modal */}
      {selectedStoryGroup && (
        <StoryViewerModal
          isOpen={Boolean(selectedStoryGroup)}
          onClose={() => setSelectedStoryGroup(null)}
          storyGroups={storyGroups}
          initialGroupIndex={storyGroups.findIndex(g => g.userId === selectedStoryGroup.userId)}
        />
      )}
    </div>
  );
}
