import { motion, AnimatePresence } from 'motion/react';
import { Play, Calendar, BookOpen, Radio, Search, User, Heart, Edit3, Edit, ChevronRight, Copy, CheckCircle2, QrCode, CreditCard, Bell, HandHeart, Mic, MessageSquareQuote, Star } from 'lucide-react';
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
      
      {/* Hero Section (iOS 26 Style) */}
      <div className="relative w-full h-[65vh] lg:h-[75vh] flex items-end justify-start overflow-hidden lg:rounded-b-[40px] ios-shadow">
        <div className="absolute inset-0 bg-black">
          <img src={currentBanner.image} alt={currentBanner.title} className="w-full h-full object-cover opacity-90 scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-600/10 to-black pointer-events-none"></div>
          {/* iOS 26 Frost bottom fade */}
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#F2F2F7] dark:from-[#000000] to-transparent z-[5]"></div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative z-10 p-6 lg:p-16 w-full max-w-7xl mx-auto mb-10"
        >
          <div className="flex gap-2 mb-4">
            <span className="ios-pill text-white/90">Lançamento</span>
          </div>
          <h1 className="text-4xl lg:text-7xl font-bold font-display tracking-tight leading-[1.1] mb-4 text-white drop-shadow-md">
            {currentBanner.title}
          </h1>
          <p className="text-lg lg:text-xl text-white/80 font-medium max-w-xl mb-8 leading-relaxed">
            {currentBanner.subtitle}
          </p>
          
          <div className="flex items-center gap-4">
            <Link to="/media" className="ios-button flex items-center justify-center gap-2 px-8 py-3.5 bg-white dark:bg-white text-black rounded-[24px]">
              <Play className="w-5 h-5 fill-current" />
              <span>Assistir</span>
            </Link>
            <button className="w-14 h-14 rounded-[20px] bg-white/20 backdrop-blur-[30px] border border-white/20 flex items-center justify-center transition-all active:scale-95 hover:bg-white/30">
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
              { to: '/volunteer', icon: User, label: 'Voluntário', color: 'from-indigo-600 to-indigo-400' },
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
          <div className="flex items-end justify-between mb-6 px-2">
             <h2 className="text-3xl font-display font-bold tracking-tight text-black dark:text-white">Em Alta</h2>
             <Link to="/media" className="text-sm font-bold text-purple-600 dark:text-purple-400 tracking-widest flex items-center gap-1 hover:opacity-80 transition-opacity">Ver Mais <ChevronRight className="w-4 h-4" /></Link>
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-6 px-6 lg:mx-0 lg:px-0">
            {RECENT_ITEMS.map((item, idx) => (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={item.id} 
              >
                <Link to="/media" className="block w-64 lg:w-80 group relative ios-card rounded-[32px] p-2">
                  <div className="aspect-video rounded-[24px] bg-black overflow-hidden relative border border-white/5 group-hover:border-white/20 transition-colors shadow-inner">
                    <img src={item.img} alt={item.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4">
                       <span className="text-[10px] font-bold text-white/80 backdrop-blur-md bg-black/30 px-2 py-1 rounded-full uppercase tracking-wider mb-2 inline-block border border-white/10">{item.category}</span>
                       <h3 className="text-base font-bold text-white truncate drop-shadow-md">{item.title}</h3>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-sm">
                      <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-lg">
                        <Play className="w-6 h-6 text-white ml-1 fill-current" />
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
          <div className="ios-card relative w-full bg-gradient-to-br from-white to-[#F2F2F7] dark:from-[#1C1C1E] dark:to-[#111111] overflow-hidden group">
             {/* Abstract background */}
             <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-purple-500/20 to-transparent rounded-full blur-[80px] translate-x-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-1000 group-hover:scale-110"></div>
             
             <div className="relative z-10 p-8 lg:p-12 flex flex-col lg:flex-row gap-8 items-center lg:items-start justify-between">
                <div className="flex-1 max-w-2xl">
                  <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-purple-600 dark:text-purple-400 mb-4 block">Devocional Diário</span>
                  <h3 className="text-3xl lg:text-4xl font-display tracking-tight font-bold text-black dark:text-white mb-6 leading-tight">{DEVOCIONAL.title}</h3>
                  <div className="pl-6 border-l-[3px] border-purple-500/50 mb-6 rounded-sm">
                    <p className="text-xl text-black/80 dark:text-white/90 italic leading-relaxed">"{DEVOCIONAL.verse}"</p>
                    <p className="text-xs text-purple-600 dark:text-purple-400 font-bold mt-3 tracking-wider">{DEVOCIONAL.reference}</p>
                  </div>
                  <p className="text-black/60 dark:text-white/60 leading-relaxed mb-8 font-medium">{DEVOCIONAL.text}</p>
                  <Link to="/bible" state={{ book: 'Filipenses', chapter: 4, verse: 7 }} className="ios-button inline-flex items-center justify-center gap-2">
                    <BookOpen className="w-4 h-4 fill-current" />
                    Ler Completo
                  </Link>
                </div>

                <div className="w-full lg:w-1/3 flex justify-center">
                  <div className="w-48 h-64 rounded-[32px] bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/10 backdrop-blur-3xl flex items-center justify-center rotate-3 hover:rotate-0 transition-transform duration-500 shadow-xl relative overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-blue-500/10"></div>
                     <BookOpen className="w-20 h-20 text-black/20 dark:text-white/20 drop-shadow-sm" />
                  </div>
                </div>
             </div>
          </div>
        </section>

        {/* Podcast Section */}
        <section>
          <div className="flex items-end justify-between mb-8 px-2">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                 <Mic className="w-5 h-5 text-purple-600 dark:text-purple-400" />
               </div>
               <h2 className="text-3xl font-display font-bold tracking-tight text-black dark:text-white">Podcasts</h2>
             </div>
             <Link to="/podcast" className="text-sm font-bold text-purple-600 dark:text-purple-400 tracking-widest flex items-center gap-1 hover:opacity-80 transition-opacity">Mais <ChevronRight className="w-4 h-4" /></Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { id: 1, title: 'Descobrindo o Propósito', host: 'Pr. Marcos Silva', duration: '45 min', img: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&q=80&w=800' },
              { id: 2, title: 'Fé Inabalável', host: 'Pra. Sarah Oliveira', duration: '38 min', img: 'https://images.unsplash.com/photo-1589903308904-1010c2294adc?auto=format&fit=crop&q=80&w=800' },
              { id: 3, title: 'Relacionamento com Deus', host: 'Pr. Lucas Ferreira', duration: '52 min', img: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&q=80&w=800' },
            ].map((podcast, idx) => (
              <motion.div
                key={podcast.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="ios-card p-4 flex gap-5 items-center group cursor-pointer"
              >
                <div className="relative w-[100px] h-[100px] rounded-[24px] overflow-hidden shrink-0 ios-shadow">
                  <img src={podcast.img} alt={podcast.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <Play className="w-8 h-8 text-white fill-current opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all drop-shadow-md" />
                  </div>
                </div>
                <div className="flex flex-col flex-1 overflow-hidden pr-2">
                  <p className="text-[11px] text-purple-600 dark:text-purple-400 font-bold tracking-wider mb-1.5">{podcast.duration}</p>
                  <h4 className="text-black dark:text-white font-semibold leading-tight line-clamp-2 mb-1.5 text-[15px]">{podcast.title}</h4>
                  <p className="text-black/50 dark:text-white/50 text-xs font-medium">{podcast.host}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Testimonials / Impact Section */}
        <section>
          <div className="text-center mb-10 px-4">
            <h2 className="text-3xl lg:text-5xl font-display font-bold tracking-tight mb-4 text-black dark:text-white">Vidas Transformadas</h2>
            <p className="text-black/60 dark:text-white/60 max-w-xl mx-auto font-medium">Ouça o que Deus tem feito através deste ministério na vida de nossos irmãos.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { id: 1, text: "Desde que comecei a participar dos cultos online, minha vida espiritual mudou completamente. Sinto a presença de Deus na minha casa!", author: "Carolina Mendes", role: "Membro", rating: 5 },
              { id: 2, text: "A conferência Profética foi um marco na minha família. O avivamento prometido realmente aconteceu em nosso lar.", author: "João Batista", role: "Líder de Célula", rating: 5 },
              { id: 3, text: "Os Devocionais diários pelo aplicativo têm sido meu alimento matinal. A palavra tem chegado sempre na hora exata.", author: "Mariana Souza", role: "Visitante", rating: 5 },
            ].map((testimonial, idx) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="ios-card bg-white/80 dark:bg-white/[0.03] backdrop-blur-3xl p-8 relative group"
              >
                <div className="absolute top-6 right-6 text-purple-500/10 dark:text-purple-400/10 group-hover:text-purple-500/20 transition-colors">
                  <MessageSquareQuote className="w-16 h-16" />
                </div>
                
                <div className="flex gap-1 mb-6 relative z-10">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-purple-500 text-purple-500" />
                  ))}
                </div>
                
                <p className="text-black/80 dark:text-white/80 font-medium italic mb-8 relative z-10 text-lg leading-relaxed">"{testimonial.text}"</p>
                
                <div className="flex items-center gap-4 relative z-10 border-t border-black/5 dark:border-white/5 pt-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 p-[2px]">
                    <div className="w-full h-full rounded-full bg-white dark:bg-black flex items-center justify-center font-bold text-lg text-black dark:text-white">
                      {testimonial.author.charAt(0)}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-black dark:text-white tracking-wide">{testimonial.author}</h4>
                    <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 tracking-widest">{testimonial.role}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Premium Donation / Give */}
        <section id="donate" className="pt-4">
          <div className="ios-card relative bg-gradient-to-br from-white to-[#F2F2F7] dark:from-[#2a1318] dark:to-black p-8 lg:p-12 text-center lg:text-left flex flex-col lg:flex-row items-center gap-12 overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay"></div>
            
            <div className="flex-1 relative z-10 w-full">
              <h2 className="text-4xl font-display font-bold mb-4 text-black dark:text-white">Semear e Contribuir</h2>
              <p className="text-black/60 dark:text-white/60 text-lg mb-8 max-w-md mx-auto lg:mx-0 font-medium">Faça sua contribuição de forma segura e rápida. Ajude-nos a continuar espalhando a palavra.</p>
              
              <div className="inline-flex p-1 bg-black/5 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-2xl mb-8 relative w-full max-w-sm">
                <button 
                  onClick={() => setGivingMethod('pix')}
                  className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider rounded-xl transition-all ${givingMethod === 'pix' ? 'bg-white dark:bg-white text-black shadow-md' : 'text-black/50 dark:text-white/50'}`}
                >
                  PIX
                </button>
                <button 
                  onClick={() => setGivingMethod('card')}
                  className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider rounded-xl transition-all ${givingMethod === 'card' ? 'bg-white dark:bg-white text-black shadow-md' : 'text-black/50 dark:text-white/50'}`}
                >
                  Cartão
                </button>
              </div>

              {givingMethod === 'pix' ? (
                <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 max-w-sm w-full mx-auto lg:mx-0">
                  <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center border border-black/5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] shrink-0">
                    <QrCode className="w-16 h-16 text-black" />
                  </div>
                  <div className="w-full flex-1">
                    <button 
                      onClick={handleCopyPix}
                      className="ios-button w-full flex items-center justify-center gap-2 mb-3 text-sm"
                    >
                      {copiedPix ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      <span>{copiedPix ? 'Copiada!' : 'Copiar Chave'}</span>
                    </button>
                    <p className="text-[12px] font-mono text-black/50 dark:text-white/50 text-center lg:text-left">{config?.pixKey || 'contato@frutosdoespirito.com.br'}</p>
                  </div>
                </div>
              ) : (
                <div className="p-8 bg-black/5 dark:bg-black/40 backdrop-blur-sm rounded-[24px] border border-black/10 dark:border-white/5 max-w-sm w-full mx-auto lg:mx-0 border-dashed text-center">
                  <CreditCard className="w-8 h-8 text-black/30 dark:text-white/30 mx-auto mb-4" />
                  <p className="text-sm font-medium text-black/60 dark:text-white/60">Em breve aceitaremos cartões de crédito online.</p>
                </div>
              )}
            </div>

            <div className="hidden lg:flex w-1/3 relative z-10 justify-end">
               <div className="w-64 h-64 bg-gradient-to-tr from-rose-500 to-purple-500 rounded-full blur-[100px] opacity-20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
               <Heart className="w-48 h-48 text-rose-500/10 dark:text-white/10" />
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
