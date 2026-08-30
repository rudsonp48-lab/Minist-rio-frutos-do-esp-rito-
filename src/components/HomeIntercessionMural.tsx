import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Send, 
  Sparkles, 
  ChevronRight, 
  Flame, 
  Plus, 
  Users, 
  Check, 
  X, 
  Mic,
  MessageSquareHeart,
  Search,
  Filter,
  Volume2,
  Image as ImageIcon,
  Film,
  Globe,
  Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { db, auth } from '../lib/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  limit 
} from 'firebase/firestore';
import SocialPrayerCard, { PrayerPostData } from './SocialPrayerCard';
import CreatePrayerPostModal from './CreatePrayerPostModal';
import { INITIAL_COMMUNITY_PRAYERS } from '../lib/communityPrayersData';
import { getCachedUserPhoto } from '../services/userService';

const CATEGORY_TABS = [
  { id: 'all', label: '🔥 Todos os Posts' },
  { id: 'culto', label: '📸 Relatos de Cultos' },
  { id: 'video', label: '🎥 Vídeos & Louvor' },
  { id: 'noticia', label: '🌍 Notícias Gospel' },
  { id: 'oracao', label: '🙏 Oração & Clamor' },
  { id: 'agradecimento', label: '🎉 Testemunhos' },
];

export default function HomeIntercessionMural() {
  const [prayers, setPrayers] = useState<PrayerPostData[]>(INITIAL_COMMUNITY_PRAYERS);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [testimonyModalPrayer, setTestimonyModalPrayer] = useState<PrayerPostData | null>(null);
  const [testimonyText, setTestimonyText] = useState('');
  const [isSavingTestimony, setIsSavingTestimony] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'prayers'), orderBy('createdAt', 'desc'), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const firestoreList: PrayerPostData[] = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as PrayerPostData));

      // Combine with initial starter prayers so community is always vibrant
      const existingIds = new Set(firestoreList.map(p => p.id));
      const combined = [
        ...firestoreList,
        ...INITIAL_COMMUNITY_PRAYERS.filter(p => !existingIds.has(p.id))
      ];

      setPrayers(combined);
      setLoading(false);
    }, (err) => {
      console.debug('[HomeIntercessionMural] Snapshot error:', err);
      setPrayers(INITIAL_COMMUNITY_PRAYERS);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const openAiPrayer = (prayer: PrayerPostData) => {
    window.dispatchEvent(new CustomEvent('open-ai-assistant', {
      detail: {
        mode: 'prayer',
        topic: `Intercessão e reflexão pastoral por: ${prayer.title || prayer.content}. Categoria: ${prayer.category || 'Geral'}`
      }
    }));
  };

  const handleSaveTestimony = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testimonyModalPrayer || !testimonyText.trim()) return;

    setIsSavingTestimony(true);
    try {
      if (!testimonyModalPrayer.id.startsWith('seed-')) {
        await updateDoc(doc(db, 'prayers', testimonyModalPrayer.id), {
          answered: true,
          testimony: testimonyText.trim()
        });
      }
      setTestimonyModalPrayer(null);
      setTestimonyText('');
    } catch (err) {
      console.error('Error saving testimony:', err);
    } finally {
      setIsSavingTestimony(false);
    }
  };

  const filteredPrayers = prayers.filter(p => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'oracao') {
      return ['oracao', 'saude', 'familia', 'financas', 'espiritual', 'urgente'].includes(p.category || '');
    }
    return p.category === selectedCategory;
  });

  const totalLikes = prayers.reduce((acc, p) => acc + (p.likes?.length || 0), 0);
  const currentUser = auth.currentUser;

  return (
    <section id="intercession-mural-section" className="w-full relative space-y-6">
      {/* Header with Title and Global Stats */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-2">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-rose-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 shadow-lg">
            <MessageSquareHeart className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-white">
                Feed da Igreja & Comunidade
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-rose-400" />
                {totalLikes} Curtidas & Clamores
              </span>
            </div>
            <p className="text-xs text-white/50">
              Fotos dos cultos, vídeos, notícias do mundo gospel, pedidos de oração e testemunhos da igreja
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-purple-950/50 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            Criar Post
          </button>

          <Link
            to="/prayers"
            className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-all active:scale-95"
          >
            Feed Completo <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Social Post Quick Composer Card */}
      <div 
        className="p-4 sm:p-5 rounded-[28px] bg-[#14141A] border border-white/10 hover:border-purple-500/40 transition-all shadow-xl space-y-3"
      >
        <div 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-3.5 cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-rose-500 p-[2px] shrink-0">
            {(() => {
              const myPhoto = (currentUser?.uid ? getCachedUserPhoto(currentUser.uid) : '') || currentUser?.photoURL;
              return myPhoto ? (
                <img src={myPhoto} alt="Eu" className="w-full h-full object-cover rounded-[13px]" />
              ) : (
                <div className="w-full h-full bg-black rounded-[13px] flex items-center justify-center font-bold text-sm text-white">
                  {currentUser?.displayName?.charAt(0) || '✝'}
                </div>
              );
            })()}
          </div>
          <div className="flex-1">
            <span className="text-xs sm:text-sm text-white/70 font-medium group-hover:text-white transition-colors block">
              O que está acontecendo no culto ou no seu ministério hoje, {currentUser?.displayName?.split(' ')[0] || 'irmão(ã)'}?
            </span>
            <span className="text-[11px] text-white/40 block">
              Poste fotos, vídeos, relatos e notícias gospel
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5 flex-wrap">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-bold flex items-center gap-1.5 border border-purple-500/20 transition-all"
          >
            <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
            <span>Fotos</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold flex items-center gap-1.5 border border-rose-500/20 transition-all"
          >
            <Film className="w-3.5 h-3.5 text-rose-400" />
            <span>Vídeo</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-1.5 border border-emerald-500/20 transition-all"
          >
            <Mic className="w-3.5 h-3.5 text-emerald-400" />
            <span>Áudio</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold flex items-center gap-1 ml-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Publicar</span>
          </button>
        </div>
      </div>

      {/* Category Chips Reel */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6 lg:mx-0 lg:px-0">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
              selectedCategory === tab.id
                ? 'bg-white text-black border-white shadow-lg'
                : 'bg-[#141419] text-white/70 hover:text-white border-white/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Social Feed List */}
      <div className="space-y-4">
        {filteredPrayers.slice(0, 5).map((prayer) => (
          <SocialPrayerCard
            key={prayer.id}
            prayer={prayer}
            onOpenAiAssistant={openAiPrayer}
            onOpenTestimonyModal={(p) => {
              setTestimonyModalPrayer(p);
            }}
          />
        ))}
      </div>

      {/* View All Bottom Banner */}
      <div className="text-center pt-2">
        <Link
          to="/prayers"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-bold uppercase tracking-wider transition-all active:scale-95 shadow-lg"
        >
          <span>Acessar Feed Completo da Igreja & Notícias Gospel</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Create Prayer Modal */}
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
                  <h3 className="text-lg font-bold text-white">Compartilhar Testemunho</h3>
                  <p className="text-xs text-white/50">Edifique a fé da congregação com sua vitória</p>
                </div>
              </div>

              <form onSubmit={handleSaveTestimony} className="space-y-4">
                <p className="text-xs text-amber-200 bg-amber-950/30 p-3 rounded-xl border border-amber-500/20">
                  Publicação: "{testimonyModalPrayer.title || testimonyModalPrayer.content}"
                </p>

                <textarea
                  value={testimonyText}
                  onChange={(e) => setTestimonyText(e.target.value)}
                  placeholder="Escreva como Deus operou neste pedido..."
                  rows={4}
                  className="w-full bg-black/50 border border-white/15 rounded-2xl p-4 text-sm text-white outline-none focus:border-amber-400 resize-none"
                  required
                />

                <button
                  type="submit"
                  disabled={isSavingTestimony || !testimonyText.trim()}
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {isSavingTestimony ? 'Salvando...' : 'Publicar Testemunho no Mural'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
