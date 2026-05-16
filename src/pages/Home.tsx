import { motion, AnimatePresence } from 'motion/react';
import { Play, Calendar, BookOpen, Radio, Mic, ChevronRight, Share2, Heart, Tv, Settings, Church, CreditCard, QrCode, Copy, CheckCircle2, ChevronLeft, Zap, Bell, Search, Globe, Activity, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { checkChannelLive, YouTubeVideo } from '../services/youtube';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';
import { Logo } from '../components/Logo';

const DEFAULT_BANNERS = [
  { id: 1, title: 'Conferência Profética', subtitle: 'Live Experience', image: 'https://images.unsplash.com/photo-1510076857177-7470076d4098?auto=format&fit=crop&q=80&w=1600' },
  { id: 2, title: 'Atlas Digital', subtitle: 'Nova Série', image: 'https://images.unsplash.com/photo-1544427920-c49ccfb85579?auto=format&fit=crop&q=80&w=1600' }
];

const RECENT_ITEMS = [
  { id: 1, title: 'Culto de Domingo', category: 'LIVE', img: 'https://images.unsplash.com/photo-1544427920-c49ccfb85579' },
  { id: 2, title: 'Adoração e Fogo', category: 'MUSIC', img: 'https://images.unsplash.com/photo-1510076857177-7470076d4098' },
  { id: 3, title: 'Nexus Podcast', category: 'AUDIO', img: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7' },
  { id: 4, title: 'Seminário Vida', category: 'TEACHING', img: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3' }
];

export default function Home() {
  const [liveStream, setLiveStream] = useState<YouTubeVideo | null>(null);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [currentRecent, setCurrentRecent] = useState(0);
  const [config, setConfig] = useState<any>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [givingMethod, setGivingMethod] = useState<'pix' | 'card'>('pix');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'app_config', 'main'), (snapshot) => {
      if (snapshot.exists()) setConfig(snapshot.data());
    }, (error) => handleFirestoreError(error, OperationType.GET, 'app_config/main'));
    return () => unsubscribe();
  }, []);

  const banners = config?.banners?.length > 0 ? config.banners : DEFAULT_BANNERS;

  useEffect(() => {
    const timer = setInterval(() => setCurrentBanner(prev => (prev + 1) % banners.length), 6000);
    return () => clearInterval(timer);
  }, [banners.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentRecent(prev => {
        const next = (prev + 1) % RECENT_ITEMS.length;
        if (scrollRef.current) {
          const itemWidth = scrollRef.current.children[0].clientWidth;
          scrollRef.current.scrollTo({ left: itemWidth * next, behavior: 'smooth' });
        }
        return next;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleCopyPix = () => {
    navigator.clipboard.writeText(config?.pixKey || 'ecclesia@pix.church');
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
  };

  return (
    <div className="min-h-screen pt-12 pb-32 px-6 space-y-8 max-w-lg mx-auto">
      {/* iOS Header */}
      <header className="flex items-center justify-center py-2 pb-6">
        <Logo className="scale-125 origin-center transition-transform" />
      </header>

      {/* Featured Banner Card */}
      <section className="relative overflow-hidden ios-shadow group w-full">
        <div className="w-full h-[65vh] min-h-[500px] max-h-[850px] rounded-[2.5rem] overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentBanner}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <img 
                src={banners[currentBanner]?.image} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[10s]" 
                alt="Banner"
              />
              <div className="absolute inset-x-0 bottom-0 p-8 pt-20 bg-gradient-to-t from-black via-black/40 to-transparent">
                <span className="ios-pill mb-4 inline-block bg-white/20 border-white/40 text-white backdrop-blur-md">DESTAQUE</span>
                <h2 className="text-4xl font-bold tracking-tighter text-white leading-[0.9] mb-6">
                  {banners[currentBanner]?.title}
                </h2>
                <Link 
                  to="/media"
                  className="h-14 bg-[var(--theme-color,#007AFF)] text-white px-8 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all text-sm"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Sintonizar Now
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Verse of the Day - Filling Gaps */}
      <section className="ios-card p-6 bg-gradient-to-br from-[var(--theme-color,#007AFF)]/10 to-[#FF2D55]/10 border-[var(--theme-color)]/20 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-[var(--theme-color,#007AFF)] fill-current" />
          <span className="text-[11px] font-bold text-[var(--theme-color,#007AFF)] uppercase tracking-widest leading-none">Palavra do Dia</span>
        </div>
        <blockquote className="text-lg font-bold tracking-tight text-white leading-snug">
          "Pois onde estiverem dois ou três reunidos em meu nome, ali eu estou no meio deles."
        </blockquote>
        <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest">— Mateus 18:20</p>
      </section>

      {/* Recent Media Horizontal Scroll Carousel */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold tracking-tight">Recentes</h3>
          <Link to="/media" className="text-[13px] font-semibold text-[var(--theme-color,#007AFF)]">Ver Tudo</Link>
        </div>
        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6 snap-x snap-mandatory"
        >
          {RECENT_ITEMS.map((item, idx) => (
            <motion.div 
              key={item.id} 
              className={`min-w-[80%] sm:min-w-[60%] space-y-2 snap-center transition-all ${currentRecent === idx ? 'opacity-100 scale-100' : 'opacity-60 scale-95'}`}
            >
              <div className="aspect-[16/9] rounded-[1.5rem] overflow-hidden ios-shadow relative">
                <img src={item.img} className="w-full h-full object-cover" alt="Recent" />
                <div className="absolute top-3 left-3">
                  <span className="text-[8px] font-bold bg-black/40 backdrop-blur-md px-2 py-1 rounded-md text-white border border-white/20">{item.category}</span>
                </div>
              </div>
              <h4 className="text-[13px] font-bold tracking-tight truncate px-1">{item.title}</h4>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Bento Grid Core */}
      <section className="grid grid-cols-2 gap-4">
        {/* Bible - Primary Action */}
        <Link to="/bible" className="col-span-2 p-8 ios-card flex items-center justify-between group bg-gradient-to-br from-[var(--theme-color)]/20 to-transparent border-[var(--theme-color)]/30">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--theme-color,#007AFF)] to-[#FF2D55] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-white">Bíblia Sagrada</h3>
            <p className="text-xs text-zinc-500 font-medium">Estudo Completo</p>
          </div>
          <ChevronRight className="w-8 h-8 text-[var(--theme-color)]" />
        </Link>

        {/* Notes / Blocos de Notas */}
        <Link to="/notes" className="col-span-2 p-6 ios-card flex items-center justify-between group bg-[#FF9500]/10 border-[#FF9500]/20">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-[#FF9500] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
               <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
             </div>
             <div>
               <h3 className="text-xl font-bold tracking-tight text-white">Anotações</h3>
               <p className="text-xs text-[#FF9500] font-medium mt-0.5">Meus Estudos</p>
             </div>
          </div>
          <ChevronRight className="w-6 h-6 text-[#FF9500]" />
        </Link>
        
        {/* Media Control */}
        <Link to="/media" className="p-6 ios-card flex flex-col justify-between aspect-square group border-[var(--theme-color)]/10 hover:border-[var(--theme-color)]/30 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-[var(--theme-color)] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Radio className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-white">Rádio Web</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">AO VIVO</span>
            </div>
          </div>
        </Link>

        {/* Calendar / Matrix */}
        <Link to="/events" className="p-6 ios-card flex flex-col justify-between aspect-square group">
          <div className="w-12 h-12 rounded-2xl bg-[#FF2D55] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-white">Agenda</h3>
            <p className="text-xs text-zinc-500 mt-1">Nossos Cultos</p>
          </div>
        </Link>
      </section>

      {/* Fintech Contribution */}
      <section className="pb-12" id="donate">
        <div className="ios-card bg-black/5 dark:bg-[#1C1C1E] p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
               <Heart className="w-6 h-6 text-[var(--theme-color)] fill-current" />
            </div>
            <div className="text-right">
              <span className="text-[#8E8E93] text-[10px] font-bold uppercase tracking-widest">Dízimos e Ofertas</span>
              <p className="text-[var(--theme-color)] text-xs font-mono">Gateway Ativo</p>
            </div>
          </div>
          
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-white">Semear e Contribuir</h2>
            <p className="text-sm text-zinc-500">Faça sua contribuição de forma segura e rápida.</p>
          </div>

          {/* Tabs */}
          <div className="flex bg-black/10 dark:bg-white/5 p-1 rounded-xl">
            <button 
              onClick={() => setGivingMethod('pix')}
              className={`flex-1 py-3 px-4 text-xs font-bold rounded-lg transition-all ${givingMethod === 'pix' ? 'bg-white text-black shadow-sm' : 'text-[#8E8E93]'}`}
            >
              PIX
            </button>
            <button 
              onClick={() => setGivingMethod('card')}
              className={`flex-1 py-3 px-4 text-xs font-bold rounded-lg transition-all ${givingMethod === 'card' ? 'bg-white text-black shadow-sm' : 'text-[#8E8E93]'}`}
            >
              Cartão
            </button>
          </div>

          {givingMethod === 'pix' ? (
            <div className="space-y-4">
              <div className="p-4 bg-white/5 border border-white/5 inline-block mx-auto rounded-2xl">
                 <QrCode className="w-40 h-40 text-white opacity-80" />
              </div>
              <button 
                onClick={handleCopyPix}
                className="w-full h-14 bg-[var(--theme-color)] text-white rounded-xl flex items-center justify-center gap-2 font-bold active:scale-95 transition-all"
              >
                {copiedPix ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                <span>{copiedPix ? 'Chave Copiada!' : 'Copiar Chave PIX'}</span>
              </button>
              <p className="text-[10px] font-mono text-[#8E8E93] text-center mt-2">{config?.pixKey || 'contato@frutosdoespirito.com.br'}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-center text-[#8E8E93] mb-4">Em breve aceitaremos cartões de crédito via portal de doações.</p>
              <button disabled className="w-full h-14 bg-white/10 text-[#8E8E93] rounded-xl flex items-center justify-center gap-2 font-bold opacity-50 cursor-not-allowed">
                <CreditCard className="w-5 h-5" />
                <span>Pagar com Cartão</span>
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
