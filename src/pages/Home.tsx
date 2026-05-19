import { motion, AnimatePresence } from 'motion/react';
import { Play, Calendar, BookOpen, Radio, Search, User, Heart, Edit3, Edit, ChevronRight, Copy, CheckCircle2, QrCode, CreditCard, Bell, HandHeart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';
import { Logo } from '../components/Logo';
import { useTheme } from '../lib/ThemeContext';

const DEFAULT_BANNERS = [
  { id: 1, title: 'Conferência Profética', subtitle: 'Uma experiência de avivamento inesquecível', image: 'https://images.unsplash.com/photo-1510076857177-7470076d4098?auto=format&fit=crop&q=80&w=1600' },
  { id: 2, title: 'Nova Série', subtitle: 'Atlas Digital: Descobrindo a Verdade', image: 'https://images.unsplash.com/photo-1544427920-c49ccfb85579?auto=format&fit=crop&q=80&w=1600' }
];

const DEVOCIONAL = {
  title: "A Paz que Excede",
  verse: "E a paz de Deus, que excede todo o entendimento, guardará os vossos corações.",
  reference: "Filipenses 4:7",
  text: "Em meio às tempestades da vida, a ansiedade tenta tomar conta de nossa mente. Mas Deus nos oferece uma paz sobrenatural."
};

const RECENT_ITEMS = [
  { id: 1, title: 'Culto de Domingo', category: 'Série de Mensagens', img: 'https://images.unsplash.com/photo-1544427920-c49ccfb85579' },
  { id: 2, title: 'Adoração e Fogo', category: 'Worship Session', img: 'https://images.unsplash.com/photo-1510076857177-7470076d4098' },
  { id: 3, title: 'Nexus Podcast', category: 'Episódio 42', img: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7' },
  { id: 4, title: 'Seminário Vida', category: 'Ensino Bíblico', img: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3' }
];

export default function Home() {
  const [config, setConfig] = useState<any>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [givingMethod, setGivingMethod] = useState<'pix' | 'card'>('pix');
  const { themeColor, churchName } = useTheme();
  
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'app_config', 'main'), (snapshot) => {
      if (snapshot.exists()) setConfig(snapshot.data());
    }, (error) => handleFirestoreError(error, OperationType.GET, 'app_config/main'));
    return () => unsubscribe();
  }, []);

  const banners = config?.banners?.length > 0 ? config.banners : DEFAULT_BANNERS;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(config?.pixKey || 'ecclesia@pix.church');
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
  };

  const currentBanner = banners[0];

  return (
    <div className="min-h-screen bg-transparent text-white font-sans w-full overflow-x-hidden pb-32">
      
      {/* Hero Section (Netflix Style) */}
      <div className="relative w-full h-[65vh] lg:h-[75vh] flex items-end justify-start overflow-hidden lg:rounded-b-[3rem] shadow-2xl">
        <div className="absolute inset-0 bg-black">
          <img src={currentBanner.image} alt={currentBanner.title} className="w-full h-full object-cover opacity-80 scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-6"></div>
          {/* Neon overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--color-theme-purple)]/10 to-black pointer-events-none"></div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative z-10 p-6 lg:p-16 w-full max-w-7xl mx-auto"
        >
          <div className="flex gap-2 mb-4">
            <span className="px-3 py-1 rounded bg-[var(--theme-color)]/20 backdrop-blur-md text-[var(--theme-color)] text-[10px] uppercase font-bold tracking-[0.2em] shadow-[0_0_15px_var(--theme-color)] border border-[var(--theme-color)]/30">Lançamento</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-bold font-serif tracking-tight leading-[1.1] mb-4 text-white drop-shadow-2xl">
            {currentBanner.title}
          </h1>
          <p className="text-lg lg:text-xl text-white/80 font-medium max-w-xl mb-8 leading-relaxed filter drop-shadow-lg">
            {currentBanner.subtitle}
          </p>
          
          <div className="flex items-center gap-4">
            <Link to="/media" className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-black rounded-full font-bold transition-transform active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.4)]">
              <Play className="w-5 h-5 fill-current" />
              <span>Assistir</span>
            </Link>
            <button className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center transition-transform active:scale-95 hover:bg-white/20">
              <Bell className="w-6 h-6 text-white" />
            </button>
          </div>
        </motion.div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-6 mt-12 space-y-16">
        
        {/* Categories / Quick Access */}
        <section>
          <div className="flex gap-4 lg:gap-6 overflow-x-auto scrollbar-hide pb-4 -mx-6 px-6 lg:mx-0 lg:px-0 scroll-smooth">
            {[
              { to: '/bible', icon: BookOpen, label: 'Bíblia', color: 'from-blue-600 to-blue-400' },
              { to: '/events', icon: Calendar, label: 'Agenda', color: 'from-orange-600 to-orange-400' },
              { to: '/media?live=1', icon: Radio, label: 'Ao Vivo', color: 'from-pink-600 to-rose-400' },
              { to: '#donate', icon: Heart, label: 'Doar', color: 'from-[var(--color-theme-purple)] to-[var(--theme-color)]' },
              { to: '/gallery', icon: Search, label: 'Grupos', color: 'from-emerald-600 to-emerald-400' },
              { to: '/prayers', icon: HandHeart, label: 'Oração', color: 'from-cyan-600 to-cyan-400' },
              { to: '/notes', icon: Edit3, label: 'Notas', color: 'from-yellow-600 to-yellow-400' },
            ].map((cat, idx) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                key={idx}
              >
                <Link to={cat.to} className="flex flex-col items-center gap-3 w-20 lg:w-24 group">
                  <div className={`w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-tr ${cat.color} p-[2px] transition-transform group-hover:scale-105 group-active:scale-95`}>
                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center border-2 border-transparent">
                       <cat.icon className="w-7 h-7 text-white opacity-90 group-hover:opacity-100" />
                    </div>
                  </div>
                  <span className="text-[12px] font-medium text-white/70 group-hover:text-white transition-colors tracking-wide">{cat.label}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Continue Watching / Recent */}
        <section>
          <div className="flex items-end justify-between mb-6">
             <h2 className="text-2xl font-bold tracking-tight">Em Alta Categoria</h2>
             <Link to="/media" className="text-sm font-bold text-[var(--theme-color)] uppercase tracking-widest flex items-center gap-1 hover:text-white transition-colors">Ver Mais <ChevronRight className="w-4 h-4" /></Link>
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-6 px-6 lg:mx-0 lg:px-0">
            {RECENT_ITEMS.map((item, idx) => (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={item.id} 
              >
                <Link to="/media" className="block w-64 lg:w-80 group relative">
                  <div className="aspect-video rounded-xl bg-black overflow-hidden relative border border-white/10 group-hover:border-white/30 transition-colors">
                    <img src={item.img} alt={item.title} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-3 left-3 right-3">
                       <span className="text-[10px] font-bold text-[var(--theme-color)] uppercase tracking-wider mb-1 block">{item.category}</span>
                       <h3 className="text-sm font-bold text-white truncate">{item.title}</h3>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm">
                      <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center">
                        <Play className="w-5 h-5 text-white ml-1 fill-current" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Modern Devotional Widget */}
        <section>
          <div className="relative w-full rounded-[2.5rem] bg-gradient-to-br from-[#1C1C1E] to-[#2C2C2E] border border-white/5 overflow-hidden group">
             {/* Abstract background */}
             <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[var(--color-theme-purple)]/30 to-transparent rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-1000 group-hover:scale-110"></div>
             
             <div className="relative z-10 p-8 lg:p-12 flex flex-col lg:flex-row gap-8 items-center lg:items-start justify-between">
                <div className="flex-1 max-w-2xl">
                  <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[var(--theme-color)] mb-4 block">Devocional Diário</span>
                  <h3 className="text-3xl lg:text-4xl font-serif font-bold text-white mb-6 leading-tight">{DEVOCIONAL.title}</h3>
                  <div className="pl-6 border-l-2 border-[var(--theme-color)] mb-6">
                    <p className="text-lg text-white/90 italic leading-relaxed">"{DEVOCIONAL.verse}"</p>
                    <p className="text-xs text-[var(--theme-color)] font-bold mt-3 uppercase tracking-widest">{DEVOCIONAL.reference}</p>
                  </div>
                  <p className="text-white/60 leading-relaxed mb-8">{DEVOCIONAL.text}</p>
                  <Link to="/bible" className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[var(--theme-color)] text-white rounded-full font-bold uppercase tracking-widest text-[12px] active:scale-95 transition-transform hover:bg-[var(--color-primary-focused)] shadow-[0_0_20px_var(--theme-color)]/30">
                    <BookOpen className="w-4 h-4 fill-current" />
                    Ler Completo
                  </Link>
                </div>

                <div className="w-full lg:w-1/3 flex justify-center">
                  <div className="w-48 h-64 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-xl flex items-center justify-center rotate-3 hover:rotate-0 transition-transform duration-500 shadow-2xl relative overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-tr from-[var(--theme-color)]/20 to-transparent"></div>
                     <BookOpen className="w-20 h-20 text-white/20" />
                  </div>
                </div>
             </div>
          </div>
        </section>

        {/* Premium Donation / Give */}
        <section id="donate" className="pt-4">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[var(--color-theme-wine)]/40 to-black border border-white/10 p-8 lg:p-12 text-center lg:text-left flex flex-col lg:flex-row items-center gap-12">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
            
            <div className="flex-1 relative z-10 w-full">
              <h2 className="text-4xl font-serif font-bold mb-4">Semear e Contribuir</h2>
              <p className="text-white/60 text-lg mb-8 max-w-md mx-auto lg:mx-0">Faça sua contribuição de forma segura e rápida. Ajude-nos a continuar espalhando a palavra.</p>
              
              <div className="inline-flex p-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl mb-8 relative w-full max-w-sm">
                <button 
                  onClick={() => setGivingMethod('pix')}
                  className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider rounded-xl transition-all ${givingMethod === 'pix' ? 'bg-white text-black' : 'text-white/50'}`}
                >
                  PIX
                </button>
                <button 
                  onClick={() => setGivingMethod('card')}
                  className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider rounded-xl transition-all ${givingMethod === 'card' ? 'bg-white text-black' : 'text-white/50'}`}
                >
                  Cartão
                </button>
              </div>

              {givingMethod === 'pix' ? (
                <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 max-w-sm w-full mx-auto lg:mx-0">
                  <div className="p-4 bg-white rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                    <QrCode className="w-24 h-24 text-black" />
                  </div>
                  <div className="w-full flex-1">
                    <button 
                      onClick={handleCopyPix}
                      className="w-full h-14 bg-[var(--theme-color)] text-white rounded-xl flex items-center justify-center gap-2 font-bold active:scale-95 transition-all mb-3 text-sm hover:bg-[var(--color-primary-focused)] shadow-[0_0_20px_var(--theme-color)]/30"
                    >
                      {copiedPix ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      <span>{copiedPix ? 'Copiada!' : 'Copiar Chave'}</span>
                    </button>
                    <p className="text-[12px] font-mono text-white/50 text-center lg:text-left">{config?.pixKey || 'contato@frutosdoespirito.com.br'}</p>
                  </div>
                </div>
              ) : (
                <div className="p-8 bg-black/40 backdrop-blur-sm rounded-2xl border border-white/5 max-w-sm w-full mx-auto lg:mx-0 border-dashed text-center">
                  <CreditCard className="w-8 h-8 text-white/30 mx-auto mb-4" />
                  <p className="text-sm font-medium text-white/60">Em breve aceitaremos cartões de crédito online.</p>
                </div>
              )}
            </div>

            <div className="hidden lg:flex w-1/3 relative z-10 justify-end">
               <div className="w-64 h-64 bg-gradient-to-tr from-[var(--theme-color)] to-[var(--color-theme-neon)] rounded-full blur-[120px] opacity-20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
               <Heart className="w-48 h-48 text-white/10" />
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
