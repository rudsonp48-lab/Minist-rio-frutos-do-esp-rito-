import { motion, AnimatePresence } from 'motion/react';
import { Play, Calendar, BookOpen, Radio, Mic, ChevronRight, Share2, Heart, Tv, Settings, Church, CreditCard, QrCode, Copy, CheckCircle2, ChevronLeft, Zap, Bell, Search, Globe, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { checkChannelLive, YouTubeVideo } from '../services/youtube';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';

const DEFAULT_BANNERS = [
  {
    id: 1,
    title: 'Vigília Quantum',
    subtitle: 'Evento Alpha // 2026',
    image: 'https://images.unsplash.com/photo-1510076857177-7470076d4098?auto=format&fit=crop&q=80&w=1600',
    cta: 'Status de Presença',
    type: 'EVENTO',
    color: '#FFD700'
  },
  {
    id: 2,
    title: 'Nova Série: Atlas',
    subtitle: 'Estudo Profundo // Revelação',
    image: 'https://images.unsplash.com/photo-1544427920-c49ccfb85579?auto=format&fit=crop&q=80&w=1600',
    cta: 'Ver Detalhes',
    type: 'SÉRIE',
    color: '#00F3FF'
  },
  {
    id: 3,
    title: 'Conexão Jovem',
    subtitle: 'Sábado // 19:30',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1600',
    cta: 'Sync Now',
    type: 'COMUNIDADE',
    color: '#FF00E5'
  }
];

export default function Home() {
  const [liveStream, setLiveStream] = useState<YouTubeVideo | null>(null);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [copiedPix, setCopiedPix] = useState(false);
  const [banners, setBanners] = useState(DEFAULT_BANNERS);
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'app_config', 'main'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setConfig(data);
        if (data.banners && data.banners.length > 0) {
          setBanners(data.banners);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'app_config/main');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const checkLive = async () => {
      const streams = await checkChannelLive();
      if (streams && streams.length > 0) {
        setLiveStream(streams[0]);
      }
    };
    checkLive();
    const interval = setInterval(checkLive, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % banners.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const handleCopyPix = () => {
    navigator.clipboard.writeText(config?.pixKey || 'contato@igrejaecclesia.com.br');
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
  };

  const nextBanner = () => setCurrentBanner(prev => (prev + 1) % banners.length);
  const prevBanner = () => setCurrentBanner(prev => (prev - 1 + banners.length) % banners.length);

  const highlights = [
    { title: 'Culto de Domingo', time: '18:00', type: 'Live', image: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&q=80&w=800' },
    { title: 'Podcast Semanal', author: 'Pr. Silva', type: 'Audio', image: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&q=80&w=800' },
  ];

  return (
    <div className="space-y-16 pb-32 cyber-grid">
      {/* Dynamic Background Beams */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-yellow-400/5 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-400/5 blur-[120px] animate-pulse [animation-delay:2s]" />
      </div>

      {/* Futuristic Header */}
      <header className="relative z-10 px-6 pt-12 flex items-center justify-between">
        <div className="flex items-center gap-5">
           <div className="relative group">
              <div className="absolute inset-0 bg-yellow-400/20 blur-xl group-hover:blur-2xl transition-all" />
              <div className="w-14 h-14 glass flex items-center justify-center rounded-2xl glow-yellow border-yellow-400/30 relative z-10">
                <Church className="w-8 h-8 text-yellow-400" />
              </div>
           </div>
           <div>
              <h1 className="text-3xl font-display font-black italic uppercase tracking-tighter text-white leading-none">
                {config?.churchName || 'ECCLESIA'}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1 h-1 rounded-full bg-yellow-400 shadow-[0_0_8px_white]" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-500">Node // 3.1.2</span>
              </div>
           </div>
        </div>

        <div className="flex items-center gap-4">
           <button className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-zinc-500 hover:text-white transition-all">
             <Search className="w-5 h-5" />
           </button>
           <button className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-zinc-500 hover:text-white transition-all relative">
             <Bell className="w-5 h-5" />
             <span className="absolute top-3 right-3 w-2 h-2 bg-yellow-400 rounded-full glow-yellow" />
           </button>
        </div>
      </header>

      {/* Main Status Bar */}
      <section className="px-6 relative z-10">
        <div className="glass p-1 rounded-3xl overflow-hidden">
          <div className="bg-zinc-950/50 rounded-[1.4rem] px-8 py-5 flex items-center justify-between gap-6 border border-white/5">
            <div className="flex items-center gap-4">
              <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Sincronia Online</span>
            </div>
            <div className="flex -space-x-3">
              {[1,2,3].map(i => (
                <div key={i} className="w-7 h-7 rounded-full border-2 border-[#050505] bg-zinc-800" />
              ))}
              <div className="w-7 h-7 rounded-full border-2 border-[#050505] bg-yellow-400 flex items-center justify-center text-[8px] font-black text-black">
                +12
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cinematic Hero */}
      <section className="relative z-10 px-6 h-[60vh]">
        <div className="h-full glass-card group shadow-[0_10px_60px_-15px_rgba(0,0,0,0.8)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentBanner}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
            >
              <img 
                src={banners[currentBanner]?.image} 
                className="absolute inset-0 w-full h-full object-cover brightness-[0.4] group-hover:scale-105 transition-transform duration-[3s]"
                alt="Highlight"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20" />
              
              <div className="absolute bottom-0 left-0 p-10 md:p-16 w-full">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-4">
                    <span className="bg-yellow-400 text-black px-3 py-1 rounded-sm text-[8px] font-black uppercase tracking-[0.2em]">
                      {banners[currentBanner]?.type || 'LIVE'}
                    </span>
                    <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest">
                       {banners[currentBanner]?.subtitle}
                    </span>
                  </div>
                  
                  <h2 className="text-4xl md:text-7xl font-display font-black uppercase italic tracking-tighter leading-none text-white lg:max-w-2xl">
                    {banners[currentBanner]?.title}
                  </h2>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <button className="bg-white text-black px-10 py-5 rounded-2xl font-display font-black uppercase italic tracking-tighter text-base flex items-center justify-center gap-3 hover:bg-yellow-400 transition-all active:scale-95 shadow-xl glow-yellow">
                      <Zap className="w-5 h-5 fill-current" />
                      {banners[currentBanner]?.cta || 'Sync'}
                    </button>
                    <button className="glass text-white px-10 py-5 rounded-2xl font-display font-black uppercase italic tracking-tighter text-base flex items-center justify-center gap-3 hover:bg-white/10 transition-all border border-white/10 backdrop-blur-xl">
                      Info Nexus
                    </button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Indicator Rails */}
          <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-20">
             {banners.map((_, i) => (
               <div 
                 key={i} 
                 onClick={() => setCurrentBanner(i)}
                 className={`w-1 rounded-full transition-all cursor-pointer ${i === currentBanner ? 'h-12 bg-yellow-400 glow-yellow' : 'h-3 bg-white/20'}`} 
               />
             ))}
          </div>
        </div>
      </section>

      {/* Grid Navigation Reformulated */}
      <section className="px-6 relative z-10">
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Bíblia', icon: BookOpen, path: '/bible', color: 'text-yellow-400', theme: 'glow-yellow' },
            { label: 'Radio', icon: Radio, path: '/media', color: 'text-cyan-400', theme: 'glow-blue' },
            { label: 'Agenda', icon: Calendar, path: '/events', color: 'text-pink-400', theme: 'glow-pink' },
            { label: 'Fluxo', icon: Activity, path: '/media', color: 'text-emerald-400', theme: 'glow-green' },
          ].map((item, idx) => (
            <Link 
              key={item.label}
              to={item.path} 
              className="glass p-8 rounded-[2.5rem] space-y-4 hover:border-white/20 transition-all shadow-xl group border-white/5 active:scale-95"
            >
              <div className={`w-12 h-12 glass flex items-center justify-center rounded-2xl group-hover:scale-110 transition-transform ${item.theme}`}>
                <item.icon className={`w-6 h-6 ${item.color}`} />
              </div>
              <div className="space-y-1">
                <span className="text-xl font-display font-black uppercase italic tracking-tighter block text-white group-hover:text-yellow-400 transition-colors uppercase">{item.label}</span>
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-600 block">Sincronizar Canal</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* NexDonate Fintech 4.0 */}
      <section className="px-6 relative z-10">
        <div className="glass-dark rounded-[3.5rem] p-12 border border-white/5 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-yellow-400/5 blur-[100px]" />
           
           <div className="space-y-10">
              <div className="flex items-center justify-between">
                 <div className="w-16 h-16 glass flex items-center justify-center rounded-2xl glow-yellow border-yellow-400/20">
                    <Zap className="w-8 h-8 text-yellow-400 animate-pulse" />
                 </div>
                 <div className="text-right">
                    <span className="text-yellow-400 text-[10px] font-black uppercase tracking-[0.4em] block">Status de Fluxo</span>
                    <span className="text-white font-mono text-xs">Ativo // 2026</span>
                 </div>
              </div>

              <div className="space-y-4">
                 <h2 className="text-5xl font-display font-black uppercase italic tracking-tighter text-white">NexDonate</h2>
                 <p className="text-zinc-600 text-sm leading-relaxed max-w-xs font-medium italic">Sincronize sua prosperidade com o propósito do Reino Ecclesia.</p>
              </div>

              <div className="space-y-6">
                 <div className="glass p-6 rounded-3xl border-white/5 hover:border-yellow-400/20 transition-all flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 glass rounded-xl flex items-center justify-center">
                          <QrCode className="w-5 h-5 text-zinc-500" />
                       </div>
                       <div className="space-y-1">
                          <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 block">Chave PIX Ativa</span>
                          <span className="text-[10px] font-mono font-bold text-white max-w-[150px] truncate block">{config?.pixKey || 'contato@igrejaecclesia.com.br'}</span>
                       </div>
                    </div>
                    <button 
                      onClick={handleCopyPix}
                      className="w-10 h-10 glass rounded-xl flex items-center justify-center text-zinc-500 hover:text-yellow-400 transition-all"
                    >
                       {copiedPix ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                 </div>

                 <button className="w-full bg-white text-black py-6 rounded-3xl font-display font-black uppercase italic tracking-tighter text-xl hover:bg-yellow-400 transition-all active:scale-95 shadow-4xl glow-yellow flex items-center justify-center gap-3">
                    <Activity className="w-6 h-6" />
                    Abrir Portal de Oferta
                 </button>
              </div>
           </div>
        </div>
      </section>

      {/* Featured Stream */}
      <section className="px-6 relative z-10">
        <div className="space-y-8">
           <div className="flex items-end justify-between">
              <div className="space-y-2">
                 <span className="text-yellow-400 text-[9px] font-black uppercase tracking-[0.4em]">Frequência Atlas</span>
                 <h2 className="text-4xl font-display font-black uppercase italic tracking-tighter text-white">Stream Node</h2>
              </div>
              <Link to="/media" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-zinc-800 pb-1 hover:text-yellow-400 transition-all">Ver Todos</Link>
           </div>

           <div className="space-y-6">
              {highlights.map((item, idx) => (
                <div key={idx} className="glass p-2 rounded-[2.5rem] group border-white/5 active:scale-98 transition-all">
                  <div className="flex items-center gap-6">
                    <img 
                      src={item.image} 
                      className="w-28 h-28 md:w-32 md:h-32 rounded-[2rem] object-cover grayscale brightness-50 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-700" 
                      alt={item.title} 
                    />
                    <div className="flex-1 space-y-3 min-w-0 pr-6">
                       <span className="text-yellow-400 text-[8px] font-black uppercase tracking-[0.3em]">{item.type} NODE</span>
                       <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter leading-tight text-white group-hover:text-yellow-400 transition-colors uppercase truncate">{item.title}</h3>
                       <div className="flex items-center gap-3 text-zinc-600">
                          <Globe className="w-3 h-3" />
                          <span className="text-[9px] font-bold uppercase tracking-widest">{item.time || item.author}</span>
                       </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-800 group-hover:text-yellow-400 group-hover:translate-x-2 transition-all" />
                  </div>
                </div>
              ))}
           </div>
        </div>
      </section>
    </div>
  );
}
