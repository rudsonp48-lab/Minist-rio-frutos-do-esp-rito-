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
  Square,
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
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';
import { notifyPrayerIntercession, notifyPrayerTestimony } from '../services/notificationService';
import NotificationCenter from '../components/NotificationCenter';
import SocialPrayerCard, { PrayerPostData } from '../components/SocialPrayerCard';
import CreatePrayerPostModal from '../components/CreatePrayerPostModal';
import ActiveUsersWidget from '../components/ActiveUsersWidget';
import VoicePrayerPlayer from '../components/VoicePrayerPlayer';
import { INITIAL_COMMUNITY_PRAYERS } from '../lib/communityPrayersData';

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
  const [prayers, setPrayers] = useState<PrayerPostData[]>(INITIAL_COMMUNITY_PRAYERS);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState<'feed' | 'photos' | 'videos' | 'mine' | 'answered'>('feed');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Testimony Modal State
  const [testimonyModalPrayer, setTestimonyModalPrayer] = useState<PrayerPostData | null>(null);
  const [testimonyText, setTestimonyText] = useState('');
  const [isSavingTestimony, setIsSavingTestimony] = useState(false);

  const currentUser = auth.currentUser;

  useEffect(() => {
    const q = query(collection(db, 'prayers'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const firestorePrayers: PrayerPostData[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PrayerPostData));

      // Merge with initial community posts
      const existingIds = new Set(firestorePrayers.map(p => p.id));
      const merged = [
        ...firestorePrayers,
        ...INITIAL_COMMUNITY_PRAYERS.filter(p => !existingIds.has(p.id))
      ];

      setPrayers(merged);
      setLoading(false);
    }, (error) => {
      console.debug('[Prayers] Snapshot fallback:', error);
      setPrayers(INITIAL_COMMUNITY_PRAYERS);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const openAiPrayerAssistant = (prayer: PrayerPostData) => {
    window.dispatchEvent(new CustomEvent('open-ai-assistant', {
      detail: {
        mode: 'prayer',
        topic: `Intercessão pastoral: ${prayer.title || prayer.content}. Categoria: ${prayer.category || 'Geral'}`
      }
    }));
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

        // Broadcast testimony notification
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

  // Filter logic
  const filteredPrayers = prayers.filter((p) => {
    // 1. Tab filter
    if (activeTab === 'photos') {
      const hasPhoto = (p.imageUrls && p.imageUrls.length > 0) || !!p.imageUrl;
      if (!hasPhoto) return false;
    }
    if (activeTab === 'videos') {
      if (!p.videoUrl) return false;
    }
    if (activeTab === 'mine' && p.userId !== currentUser?.uid) return false;
    if (activeTab === 'answered' && !p.answered) return false;

    // 2. Category filter
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'oracao') {
        const isPrayerType = ['oracao', 'saude', 'familia', 'financas', 'espiritual', 'urgente'].includes(p.category || '');
        if (!isPrayerType) return false;
      } else if (p.category !== selectedCategory) {
        return false;
      }
    }

    // 3. Tag filter
    if (selectedTag && (!p.tags || !p.tags.includes(selectedTag))) {
      return false;
    }

    // 4. Search query
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

  const totalPrayersCount = prayers.length;
  const totalPhotosCount = prayers.filter(p => (p.imageUrls && p.imageUrls.length > 0) || !!p.imageUrl).length;
  const totalVideosCount = prayers.filter(p => !!p.videoUrl).length;
  const answeredCount = prayers.filter(p => p.answered).length;
  const totalLikes = prayers.reduce((acc, p) => acc + (p.likes?.length || 0), 0);

  return (
    <div className="min-h-screen bg-[#0E0E12] text-white pb-24">
      {/* Top Banner Header with Christian Social Network Identity */}
      <section className="relative pt-8 pb-10 px-4 sm:px-6 lg:px-8 border-b border-white/10 overflow-hidden bg-gradient-to-b from-[#1A122C] via-[#100F1A] to-[#0E0E12]">
        {/* Background glow effects */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-600/20 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute top-1/2 -right-24 w-80 h-80 bg-rose-600/15 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-500/20 to-rose-500/20 border border-purple-500/30 text-purple-200 text-xs font-bold uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
                Feed da Igreja & Rede Social Cristã
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black tracking-tight text-white">
                Comunidade & Notícias Gospel
              </h1>
              <p className="text-sm sm:text-base text-white/65 max-w-2xl leading-relaxed">
                Compartilhe fotos e vídeos dos cultos, relatos das células e batismos, novidades do mundo cristão e conecte-se com a congregação através de oração e comunhão.
              </p>
            </div>

            {/* Quick Summary Metric Cards */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3 shrink-0">
              <div className="p-3 sm:p-3.5 rounded-2xl bg-black/40 border border-white/10 text-center">
                <span className="block text-lg sm:text-xl font-black text-rose-400 font-mono">
                  {totalLikes}
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold text-white/50 uppercase tracking-wider">
                  Curtidas
                </span>
              </div>

              <div className="p-3 sm:p-3.5 rounded-2xl bg-black/40 border border-white/10 text-center">
                <span className="block text-lg sm:text-xl font-black text-purple-400 font-mono">
                  {totalPhotosCount}
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold text-white/50 uppercase tracking-wider">
                  Fotos
                </span>
              </div>

              <div className="p-3 sm:p-3.5 rounded-2xl bg-black/40 border border-white/10 text-center">
                <span className="block text-lg sm:text-xl font-black text-pink-400 font-mono">
                  {totalVideosCount}
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold text-white/50 uppercase tracking-wider">
                  Vídeos
                </span>
              </div>

              <div className="p-3 sm:p-3.5 rounded-2xl bg-black/40 border border-white/10 text-center">
                <span className="block text-lg sm:text-xl font-black text-amber-400 font-mono">
                  {answeredCount}
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold text-white/50 uppercase tracking-wider">
                  Vitórias
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Active Connected Users Reel */}
        <ActiveUsersWidget />

        {/* Search & Main Nav Tabs Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          {/* Main Feed Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#14141A] border border-white/10 w-full sm:w-auto overflow-x-auto scrollbar-hide">
            {[
              { id: 'feed', label: '🔥 Feed Geral', count: prayers.length },
              { id: 'photos', label: '📸 Fotos dos Cultos', count: totalPhotosCount },
              { id: 'videos', label: '🎥 Vídeos & Louvor', count: totalVideosCount },
              { id: 'mine', label: '👤 Meus Posts', count: currentUser ? prayers.filter(p => p.userId === currentUser.uid).length : 0 },
              { id: 'answered', label: '🎉 Testemunhos', count: answeredCount },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por fotos, relatos, irmãos..."
              className="w-full bg-[#14141A] border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white outline-none focus:border-purple-500 placeholder:text-white/30"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Horizontal Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {FEED_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setSelectedTag(null);
              }}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 flex items-center gap-1.5 ${
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
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-purple-600 text-white text-xs font-bold shrink-0">
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
          <main className="lg:col-span-8 space-y-4">
            {/* Social Post Quick Composer */}
            <div 
              className="p-4 sm:p-5 rounded-[28px] bg-[#14141A] border border-white/10 hover:border-purple-500/40 transition-all shadow-xl space-y-3"
            >
              <div 
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-3.5 cursor-pointer group"
              >
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-rose-500 p-[2px] shrink-0">
                  {currentUser?.photoURL ? (
                    <img src={currentUser.photoURL} alt="Eu" className="w-full h-full object-cover rounded-[13px]" />
                  ) : (
                    <div className="w-full h-full bg-black rounded-[13px] flex items-center justify-center font-bold text-sm text-white">
                      {currentUser?.displayName?.charAt(0) || '✝'}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <span className="text-xs sm:text-sm text-white/70 font-medium group-hover:text-white transition-colors block">
                    Olá {currentUser?.displayName?.split(' ')[0] || 'irmão(ã)'}, o que Deus fez no culto ou em sua vida hoje?
                  </span>
                  <span className="text-[11px] text-white/40 block">
                    Publique fotos, vídeos, notícias do mundo gospel ou peça oração
                  </span>
                </div>
              </div>

              {/* Action shortcuts */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5 flex-wrap">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-bold flex items-center gap-1.5 border border-purple-500/20 transition-all"
                >
                  <ImageIcon className="w-4 h-4 text-purple-400" />
                  <span>Postar Fotos</span>
                </button>

                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold flex items-center gap-1.5 border border-rose-500/20 transition-all"
                >
                  <Film className="w-4 h-4 text-rose-400" />
                  <span>Compartilhar Vídeo</span>
                </button>

                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-1.5 border border-emerald-500/20 transition-all"
                >
                  <Mic className="w-4 h-4 text-emerald-400" />
                  <span>Gravar Áudio</span>
                </button>

                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 ml-auto shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Publicar</span>
                </button>
              </div>
            </div>

            {/* Posts Stream */}
            {loading ? (
              <div className="text-center py-20 text-white/40 text-xs font-bold uppercase tracking-widest animate-pulse">
                Carregando publicações e fotos da igreja...
              </div>
            ) : filteredPrayers.length === 0 ? (
              <div className="p-12 rounded-[32px] bg-[#14141A]/70 border border-white/10 text-center space-y-3">
                <Heart className="w-12 h-12 text-white/20 mx-auto" />
                <h4 className="text-base font-bold text-white">Nenhuma publicação encontrada</h4>
                <p className="text-xs text-white/50 max-w-sm mx-auto">
                  {searchQuery 
                    ? `Nenhum resultado para "${searchQuery}". Tente outros termos.`
                    : 'Seja o primeiro a compartilhar fotos do culto, vídeos ou um relato edificante!'}
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold uppercase tracking-wider"
                >
                  Criar Primeira Publicação
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPrayers.map((prayer) => (
                  <SocialPrayerCard
                    key={prayer.id}
                    prayer={prayer}
                    onOpenAiAssistant={openAiPrayerAssistant}
                    onOpenTestimonyModal={(p) => setTestimonyModalPrayer(p)}
                    onTagClick={(tag) => setSelectedTag(tag)}
                  />
                ))}
              </div>
            )}
          </main>

          {/* Right Sidebar Column */}
          <aside className="lg:col-span-4 space-y-5">
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

            {/* Pastoral AI Instant Intercessor Card */}
            <div className="p-6 rounded-[28px] bg-[#141419] border border-white/10 space-y-3 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Pastor & Assistente IA</h4>
                  <p className="text-[11px] text-white/50">Aconselhamento e oração guiada</p>
                </div>
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                Precisa de uma oração imediata baseada nas Escrituras ou aconselhamento pastoral para confortar seu coração?
              </p>
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('open-ai-assistant', {
                    detail: {
                      mode: 'prayer',
                      topic: 'Oração pastoral por paz, renovação espiritual e direção de Deus'
                    }
                  }));
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-200 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                Iniciar Clamor com Pastor IA
              </button>
            </div>

            {/* Ministry Prayer Hotline / Pastoral Care */}
            <div className="p-6 rounded-[28px] bg-gradient-to-br from-rose-950/30 via-[#18141C] to-black border border-rose-500/20 shadow-xl space-y-3">
              <div className="flex items-center gap-2.5 text-rose-400 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                Gabinete Pastoral & SOS Oração
              </div>
              <p className="text-xs text-white/75 leading-relaxed">
                Se você está passando por uma situação confidencial ou de urgência familiar extrema, nossos pastores e intercessores estão prontos para orar com você.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-200 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Heart className="w-4 h-4 text-rose-400 fill-current" />
                Solicitar Oração Urgente
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* Create Post Modal */}
      <CreatePrayerPostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {/* Mark Answered / Add Testimony Modal */}
      <AnimatePresence>
        {testimonyModalPrayer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#16161D] border border-amber-500/30 rounded-[32px] p-6 sm:p-8 shadow-2xl relative"
            >
              <button
                onClick={() => setTestimonyModalPrayer(null)}
                className="absolute top-5 right-5 p-2 rounded-full bg-white/5 text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Compartilhar Testemunho de Fé</h3>
                  <p className="text-xs text-white/50">Celebre a vitória e edifique os irmãos</p>
                </div>
              </div>

              <form onSubmit={handleSaveTestimony} className="space-y-4">
                <p className="text-xs text-amber-200 bg-amber-950/30 p-3 rounded-xl border border-amber-500/20">
                  Publicação: "{testimonyModalPrayer.title || testimonyModalPrayer.content}"
                </p>

                <textarea
                  value={testimonyText}
                  onChange={(e) => setTestimonyText(e.target.value)}
                  placeholder="Conte como Deus operou neste pedido..."
                  rows={4}
                  className="w-full bg-black/50 border border-white/15 rounded-2xl p-4 text-sm text-white outline-none focus:border-amber-400 resize-none"
                  required
                />

                <button
                  type="submit"
                  disabled={isSavingTestimony || !testimonyText.trim()}
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {isSavingTestimony ? 'Salvando...' : 'Publicar Testemunho no Feed'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
