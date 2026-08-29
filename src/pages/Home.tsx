import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { Play, Calendar, BookOpen, Radio, Search, User, Heart, Edit3, Edit, ChevronRight, ChevronLeft, Copy, CheckCircle2, QrCode, CreditCard, Bell, HandHeart, Mic, MessageSquareQuote, Star, Camera, Headphones, X, Navigation, MapPin, Sparkles, Scroll } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';
import { Logo } from '../components/Logo';
import { useTheme } from '../lib/ThemeContext';
import { getDailyDevotional } from '../lib/devotionalsData';
import { DEFAULT_BANNERS, RECENT_ITEMS, TESTIMONIALS, PODCASTS, CONTINUE_WATCHING, GALLERY_IMAGES } from '../lib/data';
import { YouTubeVideo } from '../services/youtube';

function getYouTubeId(url: string) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : url;
}

export default function Home() {
  const [config, setConfig] = useState<any>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [givingMethod, setGivingMethod] = useState<'pix' | 'card'>('pix');
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [selectedBanner, setSelectedBanner] = useState<any>(null);
  const [isCinematicMode, setIsCinematicMode] = useState(true);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const [recentPhotos, setRecentPhotos] = useState<any[]>([]);
  const [liveStream, setLiveStream] = useState<YouTubeVideo | null>(null);
  const [liveStreams, setLiveStreams] = useState<YouTubeVideo[]>([]);
  const [currentLiveIndex, setCurrentLiveIndex] = useState(0);
  const { themeColor, churchName } = useTheme();
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 150]);
  
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'app_config', 'main'), (snapshot) => {
      if (snapshot.exists()) setConfig(snapshot.data());
    }, (error) => handleFirestoreError(error, OperationType.GET, 'app_config/main'));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    import('../services/youtube').then(({ fetchChannelStreams }) => {
      fetchChannelStreams().then(streams => {
        if (streams && streams.length > 0) {
          const sortedStreams = [...streams].sort((a: any, b: any) => (b.views || 0) - (a.views || 0));
          setLiveStreams(sortedStreams);
          setLiveStream(sortedStreams[0]);
        }
      });
    });
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'photos'), orderBy('createdAt', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const photoData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecentPhotos(photoData.filter((p: any) => p.url || p.image));
    });
    return () => unsubscribe();
  }, []);

  const banners = config?.banners?.length > 0 ? config.banners : DEFAULT_BANNERS;

  useEffect(() => {
    if (!banners || banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonialIndex((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCopyPix = () => {
    navigator.clipboard.writeText(config?.pixKey || 'ecclesia@pix.church');
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
  };

  const currentBanner = banners[currentBannerIndex] || banners[0];
  const currentDevotional = getDailyDevotional();

  return (
    <div className="min-h-screen bg-transparent text-white font-sans w-full overflow-x-hidden pb-32">
      
      {/* Hero Section (iOS 26 Style) */}
      <div className="relative w-full h-[88vh] lg:h-[95vh] flex items-end justify-start overflow-hidden lg:rounded-b-[40px] ios-shadow bg-black">
        <AnimatePresence mode="wait">
          {(!isCinematicMode || !currentBanner.videoUrl) ? (
            <motion.div
              key={`image-${currentBannerIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0"
            >
              <motion.img style={{ y: y1 }} src={currentBanner.image || undefined} alt={currentBanner.title} className="w-full h-[120%] object-cover opacity-90" />
            </motion.div>
          ) : (
            <motion.div
              key={`video-${currentBannerIndex}-${currentBanner.videoUrl}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 overflow-hidden"
            >
              <iframe
                src={`https://www.youtube.com/embed/${getYouTubeId(currentBanner.videoUrl)}?autoplay=1&mute=1&controls=0&loop=1&playlist=${getYouTubeId(currentBanner.videoUrl)}&playsinline=1&modestbranding=1&rel=0&iv_load_policy=3&showinfo=0&disablekb=1&enablejsapi=1`}
                title="Church Video Loop"
                className="pointer-events-none select-none border-0"
                style={{
                  pointerEvents: 'none',
                  width: '100vw',
                  height: '56.25vw',
                  minHeight: '100%',
                  minWidth: '177.77vh',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
                allow="autoplay; encrypted-media"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/45 mix-blend-multiply" />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent z-[2]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--theme-color)]/10 to-black pointer-events-none z-[2]"></div>
        {/* iOS 26 Frost bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#F2F2F7] dark:from-[#000000] to-transparent z-[5]"></div>
        
        <AnimatePresence mode="wait">
          <motion.div 
            key={`hero-text-${currentBannerIndex}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-10 p-6 lg:p-16 w-full max-w-7xl mx-auto mb-12"
          >

            <div className="flex items-center gap-4 mb-4">
              <button 
                onClick={() => setSelectedBanner(currentBanner)} 
                className="ios-button flex items-center justify-center gap-2 px-8 py-3.5 bg-white dark:bg-white text-black rounded-[24px] font-bold text-[15px]"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Visualizar</span>
              </button>
              <button className="w-12 h-12 rounded-[20px] bg-white/20 backdrop-blur-[30px] border border-white/20 flex items-center justify-center transition-all active:scale-95 hover:bg-white/30">
                <Bell className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="flex flex-col gap-1 max-w-xl">
              <h1 className="text-2xl md:text-3xl font-black font-display tracking-tight text-white drop-shadow-lg uppercase">
                {currentBanner.title}
              </h1>
              <p className="text-sm border-l-2 border-[var(--theme-color)] pl-3 text-white/80 font-medium uppercase drop-shadow-md line-clamp-2">
                {currentBanner.subtitle}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
        
        {/* Carousel Indicators & Cinematic Toggle */}
        <div className="absolute bottom-6 right-6 lg:right-16 z-20 flex flex-wrap justify-end items-center gap-3 lg:gap-4">
          <button 
            onClick={() => setIsCinematicMode(!isCinematicMode)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/10 text-xs font-bold uppercase tracking-wider text-white transition-all active:scale-95 shadow-lg"
            title="Alternar Modo de Exibição"
          >
            <div className={`w-2 h-2 rounded-full ${isCinematicMode ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-400'}`} />
            <span>{isCinematicMode ? 'Cinematográfico' : 'Estático'}</span>
          </button>
          <div className="flex gap-2">
            {banners.map((_, i) => (
              <button key={i} onClick={() => setCurrentBannerIndex(i)} className={`h-1.5 focus:outline-none rounded-full transition-all duration-500 ${i === currentBannerIndex ? 'w-8 bg-white' : 'w-2 bg-white/30 hover:bg-white/50'}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-6 mt-8 space-y-12 pb-24">
        
        {/* Live Alert Banner */}
        {liveStreams.length > 0 && (
          <section className="relative group">
            {/* Navigational Arrows */}
            {liveStreams.length > 1 && (
              <>
                <button 
                  onClick={() => setCurrentLiveIndex((prev) => (prev - 1 + liveStreams.length) % liveStreams.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-md border border-white/10 active:scale-90 transition-transform md:opacity-0 md:group-hover:opacity-100 duration-300 shadow-md"
                  aria-label="Anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setCurrentLiveIndex((prev) => (prev + 1) % liveStreams.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-md border border-white/10 active:scale-90 transition-transform md:opacity-0 md:group-hover:opacity-100 duration-300 shadow-md"
                  aria-label="Próximo"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={currentLiveIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <Link 
                  to={`/media?live=${liveStreams[currentLiveIndex].id}`} 
                  className={`group relative w-full rounded-[28px] overflow-hidden ios-shadow flex items-center gap-4 lg:gap-6 p-4 lg:p-6 border active:scale-[0.98] transition-all ${
                    currentLiveIndex === 0 
                      ? 'bg-red-600 border-red-500' 
                      : 'bg-zinc-950 dark:bg-zinc-950 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
                  
                  {/* Indicator of status */}
                  <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border backdrop-blur-md ${
                    currentLiveIndex === 0 
                      ? 'bg-white/20 border-white/20' 
                      : 'bg-red-500/10 border-red-500/20'
                  }`}>
                    <Radio className={`w-8 h-8 ${currentLiveIndex === 0 ? 'text-white animate-pulse' : 'text-red-500'}`} />
                  </div>

                  <div className="relative flex-1 min-w-0 pr-6 pl-2">
                    <div className="flex items-center gap-2 mb-1">
                      {currentLiveIndex === 0 ? (
                        <>
                          <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                          <span className="text-[10px] lg:text-xs font-bold text-white uppercase tracking-widest">Culto em Destaque</span>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                          <span className="text-[10px] lg:text-xs font-bold text-red-500 uppercase tracking-widest">Transmissão Gravada</span>
                        </>
                      )}
                    </div>
                    <h3 className={`text-base lg:text-xl font-bold font-sans truncate ${currentLiveIndex === 0 ? 'text-white' : 'text-white/95'}`}>
                      {liveStreams[currentLiveIndex].title}
                    </h3>
                    <p className={`text-[11px] lg:text-sm line-clamp-1 ${currentLiveIndex === 0 ? 'text-white/80' : 'text-white/60'}`}>
                      {liveStreams[currentLiveIndex].author}
                    </p>
                  </div>

                  <div className={`relative w-12 h-12 rounded-full flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-lg ${
                    currentLiveIndex === 0 ? 'bg-white' : 'bg-red-600'
                  }`}>
                    <Play className={`w-5 h-5 ml-1 ${currentLiveIndex === 0 ? 'text-red-600 fill-red-600' : 'text-white fill-white'}`} />
                  </div>
                </Link>
              </motion.div>
            </AnimatePresence>

            {/* Slide bullet indicators */}
            {liveStreams.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-3">
                {liveStreams.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentLiveIndex(idx)}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      idx === currentLiveIndex ? 'w-4 bg-red-500' : 'w-1 bg-white/20 hover:bg-white/40'
                    }`}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Categories / Quick Access */}
        <section>
          <motion.div 
            className="flex gap-4 lg:gap-6 overflow-x-auto scrollbar-hide pb-4 -mx-6 px-6 lg:mx-0 lg:px-0 scroll-smooth snap-x snap-mandatory"
          >
            {[
              { 
                to: '#', 
                onClick: (e: any) => { 
                  e.preventDefault(); 
                  window.dispatchEvent(new CustomEvent('open-ai-assistant', { detail: { mode: 'chat' } })); 
                }, 
                icon: Sparkles, 
                label: 'Pastor IA', 
                color: 'from-amber-400 to-purple-600' 
              },
              { to: '/bible', icon: BookOpen, label: 'Bíblia', color: 'from-blue-600 to-blue-400' },
              { to: '/gallery', icon: Camera, label: 'Galeria', color: 'from-emerald-600 to-emerald-400' },
              { to: '/events', icon: Calendar, label: 'Agenda', color: 'from-orange-600 to-orange-400' },
              { to: '/media?live=1', icon: Radio, label: 'Ao Vivo', color: 'from-pink-600 to-rose-400' },
              { to: '/webradio', icon: Headphones, label: 'Web Rádio', color: 'from-purple-600 to-purple-400' },
              { to: '/give', icon: Heart, label: 'Doar', color: 'from-[var(--color-theme-purple)] to-[var(--theme-color)]' },
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
                <Link to={cat.to} onClick={cat.onClick} className="flex flex-col items-center gap-3 w-20 lg:w-24 group">
                  <div className={`w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-tr ${cat.color} p-[2px] transition-transform group-hover:scale-105 group-active:scale-95 shadow-md`}>
                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center border-2 border-transparent">
                       <cat.icon className="w-7 h-7 text-white opacity-90 group-hover:opacity-100" />
                    </div>
                  </div>
                  <span className="text-[12px] font-medium text-black/70 dark:text-white/70 group-hover:text-black dark:group-hover:text-white transition-colors tracking-wide">{cat.label}</span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* AI Pastor & Theological Assistant Highlight Card */}
        <section className="bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-black border border-white/10 rounded-[32px] p-6 lg:p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-[var(--theme-color)]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--theme-color)]/20 border border-[var(--theme-color)]/30 text-[var(--theme-color)] text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> Mentor Teológico & Exegese IA
              </div>
              <h3 className="text-2xl lg:text-3xl font-display font-bold text-white tracking-tight">
                Aprofunde seus Estudos Bíblicos com Inteligência Artificial
              </h3>
              <p className="text-sm text-white/70 leading-relaxed">
                Consulte raízes do hebraico e grego, gere esboços expositivos de sermões, tire dúvidas doutrinárias e receba orações pastorais guiadas.
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-ai-assistant', { detail: { mode: 'exegesis', reference: 'Salmos 23:1' } }))}
                className="flex-1 md:flex-none h-12 px-6 rounded-2xl bg-[var(--theme-color)] hover:bg-[var(--color-primary-focused)] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-purple-950/50 active:scale-95 transition-all"
              >
                <BookOpen className="w-4 h-4" /> Exegese
              </button>

              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-ai-assistant', { detail: { mode: 'sermon' } }))}
                className="flex-1 md:flex-none h-12 px-6 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Scroll className="w-4 h-4 text-amber-400" /> Esboço
              </button>
            </div>
          </div>
        </section>

        {/* Continue Watching / Recent */}
        <section>
          <div className="flex items-end justify-between mb-6 px-2">
             <h2 className="text-3xl font-display font-bold tracking-tight text-black dark:text-white">Em Alta</h2>
             <Link to="/media" className="text-sm font-bold text-[var(--theme-color)] tracking-widest flex items-center gap-1 hover:opacity-80 transition-opacity">Ver Mais <ChevronRight className="w-4 h-4" /></Link>
          </div>
          <motion.div 
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-6 px-6 lg:mx-0 lg:px-0 snap-x snap-mandatory"
          >
            {RECENT_ITEMS.map((item, idx) => (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={item.id} 
              >
                <Link to="/media" className="block w-64 lg:w-80 group relative ios-card rounded-[32px] p-2">
                  <div className="aspect-video rounded-[24px] bg-black overflow-hidden relative border border-white/5 group-hover:border-white/20 transition-colors shadow-inner">
                    <img loading="lazy" src={item.img} alt={item.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
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
          </motion.div>
        </section>

        {/* Continue Watching Section */}
        <section>
          <div className="flex items-end justify-between mb-6 px-2">
             <div className="flex items-center gap-3">
               <h2 className="text-3xl font-display font-bold tracking-tight text-black dark:text-white">Continuar Assistindo</h2>
             </div>
          </div>
          <motion.div 
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-6 px-6 lg:mx-0 lg:px-0 snap-x snap-mandatory"
          >
            {CONTINUE_WATCHING.map((item, idx) => (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={item.id} 
              >
                <Link to="/media" className="block w-64 lg:w-80 group relative ios-card rounded-[32px] p-2">
                  <div className="aspect-video rounded-[24px] bg-black overflow-hidden relative border border-white/5 group-hover:border-white/20 transition-colors shadow-inner">
                    <img loading="lazy" src={item.img} alt={item.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2">
                       <h3 className="text-sm font-bold text-white truncate drop-shadow-md">{item.title}</h3>
                       <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                         <div className="h-full bg-[var(--theme-color)] rounded-full" style={{ width: `${item.progress}%` }}></div>
                       </div>
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
          </motion.div>
        </section>

        {/* Modern Devotional Widget */}
        <section>
          <div className="ios-card relative w-full bg-gradient-to-br from-white to-[#F2F2F7] dark:from-[#1C1C1E] dark:to-[#111111] overflow-hidden group min-h-[400px] flex items-center">
             {/* Background Image */}
             {currentDevotional.image ? (
                <div className="absolute inset-0 z-0 pointer-events-none">
                  <img loading="lazy" src={currentDevotional.image} alt="Devocional Background" className="w-full h-full object-cover opacity-20 dark:opacity-40 group-hover:scale-105 transition-transform duration-1000" />
                  <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent dark:from-[#1C1C1E] dark:via-[#1C1C1E]/90 dark:to-transparent"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent dark:from-[#1C1C1E] dark:via-transparent dark:to-transparent lg:hidden"></div>
                </div>
             ) : (
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[var(--theme-color)]/20 to-transparent rounded-full blur-[80px] translate-x-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-1000 group-hover:scale-110"></div>
             )}
             
             <div className="relative z-10 p-8 lg:p-12 w-full max-w-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[var(--theme-color)] drop-shadow-sm">Devocional Diário</span>
                  <div className="flex items-center gap-1 bg-[var(--theme-color)]/10 text-[var(--theme-color)] px-2 py-0.5 rounded-full border border-[var(--theme-color)]/20 shadow-sm">
                    <Star className="w-3 h-3 fill-current" />
                    <span className="text-[10px] font-bold">Ofensiva: 5 dias</span>
                  </div>
                </div>
                <h3 className="text-3xl lg:text-4xl font-display tracking-tight font-bold text-black dark:text-white mb-6 leading-tight drop-shadow-sm">{currentDevotional.title}</h3>
                <div className="pl-6 border-l-[3px] border-[var(--theme-color)]/50 mb-6 rounded-sm">
                  <p className="text-xl text-black/80 dark:text-white/90 italic leading-relaxed drop-shadow-sm">"{currentDevotional.verse}"</p>
                  <p className="text-xs text-[var(--theme-color)] font-bold mt-3 tracking-wider drop-shadow-sm">{currentDevotional.reference}</p>
                </div>
                <p className="text-black/70 dark:text-white/80 leading-relaxed mb-8 font-medium drop-shadow-sm">{currentDevotional.text}</p>
                <div className="flex items-center gap-4">
                  <Link to="/bible" state={{ book: currentDevotional.book, chapter: currentDevotional.chapter, verse: currentDevotional.verseNumber }} className="ios-button inline-flex items-center justify-center gap-2 shadow-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 backdrop-blur-md">
                    <BookOpen className="w-4 h-4 fill-current" />
                    Ler Completo
                  </Link>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`*${currentDevotional.title}*\n\n"${currentDevotional.verse}" - ${currentDevotional.reference}\n\n${currentDevotional.text}`);
                      alert("Devocional copiado!");
                    }}
                    className="w-12 h-12 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors backdrop-blur-md shadow-lg"
                  >
                    <Copy className="w-5 h-5 text-black dark:text-white" />
                  </button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`*${currentDevotional.title}*\n\n"${currentDevotional.verse}" - ${currentDevotional.reference}\n\n${currentDevotional.text}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-12 h-12 rounded-full flex items-center justify-center bg-green-500 hover:bg-green-600 transition-colors shadow-lg"
                  >
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                    </svg>
                  </a>
                </div>
             </div>
          </div>
        </section>

        {/* Podcast Section */}
        <section>
          <div className="flex items-end justify-between mb-8 px-2">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center border border-black/5 dark:border-white/5">
                 <Mic className="w-5 h-5 text-black dark:text-white" />
               </div>
               <h2 className="text-3xl font-display font-bold tracking-tight text-black dark:text-white">Podcasts</h2>
             </div>
             <Link to="/podcast" className="text-sm font-bold text-black/50 dark:text-white/50 tracking-widest flex items-center gap-1 hover:text-black dark:hover:text-white transition-colors uppercase">Mais <ChevronRight className="w-4 h-4" /></Link>
          </div>
          <div className="flex lg:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 overflow-x-auto scrollbar-hide pb-4 -mx-6 px-6 lg:mx-0 lg:px-0 snap-x snap-mandatory">
            {PODCASTS.map((podcast, idx) => (
              <motion.div
                key={podcast.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="ios-card p-4 lg:p-5 flex justify-between items-center group cursor-pointer w-[300px] lg:w-auto shrink-0 snap-start bg-white/60 dark:bg-[#1C1C1E]/60 hover:bg-white dark:hover:bg-[#1C1C1E] transition-colors border border-black/5 dark:border-white/5"
              >
                <div className="flex gap-4 items-center">
                  <div className="relative w-[70px] h-[70px] lg:w-[80px] lg:h-[80px] rounded-[18px] lg:rounded-[20px] overflow-hidden shrink-0 shadow-sm border border-black/5 dark:border-white/5">
                    <img loading="lazy" src={podcast.img} alt={podcast.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <Play className="w-6 h-6 text-white fill-current translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300" />
                    </div>
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="text-[10px] text-[var(--theme-color)] font-bold tracking-widest uppercase mb-1.5">{podcast.duration}</p>
                    <h4 className="text-black dark:text-white font-bold leading-tight line-clamp-2 mb-1 text-[14px] lg:text-[15px]">{podcast.title}</h4>
                    <p className="text-black/50 dark:text-white/50 text-[11px] lg:text-xs font-medium">{podcast.host}</p>
                  </div>
                </div>
                <button className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 hidden md:flex items-center justify-center group-hover:bg-[var(--theme-color)] group-hover:text-white transition-colors text-black/40 dark:text-white/40 shrink-0">
                   <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </button>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Testimonials / Impact Section */}
        <section>
          <div className="text-center mb-6 px-4">
            <h2 className="text-3xl lg:text-4xl font-display font-bold tracking-tight mb-3 text-black dark:text-white">Vidas Transformadas</h2>
            <p className="text-black/60 dark:text-white/60 max-w-xl mx-auto font-medium text-sm">O que Deus tem feito através deste ministério</p>
          </div>
          
          <div className="relative max-w-2xl mx-auto ios-card p-8 lg:p-12 min-h-[300px]">
             <AnimatePresence mode="wait">
               <motion.div
                 key={currentTestimonialIndex}
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 transition={{ duration: 0.5 }}
                 className="flex flex-col items-center text-center"
               >
                 <div className="text-[var(--theme-color)]/20 mb-6">
                   <MessageSquareQuote className="w-12 h-12" />
                 </div>
                 
                 <div className="flex gap-1 mb-6">
                   {Array.from({ length: TESTIMONIALS[currentTestimonialIndex].rating }).map((_, i) => (
                     <Star key={i} className="w-4 h-4 fill-[var(--theme-color)] text-[var(--theme-color)]" />
                   ))}
                 </div>
                 
                 <p className="text-black/90 dark:text-white/90 font-medium italic mb-8 text-[17px] lg:text-[19px] leading-relaxed">
                   "{TESTIMONIALS[currentTestimonialIndex].text}"
                 </p>
                 
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[var(--color-theme-purple)] to-[var(--theme-color)] p-[2px]">
                     <div className="w-full h-full rounded-full bg-white dark:bg-black flex items-center justify-center font-bold text-black dark:text-white">
                       {TESTIMONIALS[currentTestimonialIndex].author.charAt(0)}
                     </div>
                   </div>
                   <div className="text-left">
                     <h4 className="font-bold text-black dark:text-white tracking-wide">{TESTIMONIALS[currentTestimonialIndex].author}</h4>
                     <span className="text-[10px] uppercase font-bold text-[var(--theme-color)] tracking-widest">{TESTIMONIALS[currentTestimonialIndex].role}</span>
                   </div>
                 </div>
               </motion.div>
             </AnimatePresence>

             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                 {TESTIMONIALS.map((_, i) => (
                   <button 
                     key={i}
                     onClick={() => setCurrentTestimonialIndex(i)}
                     className={`w-2 h-2 rounded-full transition-colors ${i === currentTestimonialIndex ? 'bg-[var(--theme-color)]' : 'bg-black/10 dark:bg-white/10'}`}
                   />
                 ))}
             </div>
          </div>
        </section>

        {/* Gallery Preview Section */}
        <section>
          <div className="flex items-end justify-between mb-8 px-2">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center border border-black/5 dark:border-white/5">
                 <Camera className="w-5 h-5 text-black dark:text-white" />
               </div>
               <h2 className="text-3xl font-display font-bold tracking-tight text-black dark:text-white">Nossos Momentos</h2>
             </div>
             <Link to="/gallery" className="text-sm font-bold text-black/50 dark:text-white/50 tracking-widest flex items-center gap-1 hover:text-black dark:hover:text-white transition-colors uppercase">Ver Todas <ChevronRight className="w-4 h-4" /></Link>
          </div>
          
          <div className="grid grid-cols-12 gap-3 lg:gap-4 px-2">
             <div className="col-span-12 md:col-span-8 lg:col-span-6 row-span-2 ios-card rounded-[24px] lg:rounded-[32px] overflow-hidden aspect-video lg:aspect-auto lg:h-[400px] xl:h-[480px] group relative border border-black/5 dark:border-white/5 shadow-sm">
                <img loading="lazy" src={(recentPhotos[0]?.url || recentPhotos[0]?.image) || "https://images.unsplash.com/photo-1544427920-c49ccfb85579"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt={recentPhotos[0]?.category || "Culto"} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <Heart className="w-10 h-10 text-white fill-white drop-shadow-md scale-75 group-hover:scale-100 transition-transform duration-500 delay-100" />
                </div>
             </div>
             
             <div className="col-span-6 md:col-span-4 lg:col-span-3 ios-card rounded-[20px] lg:rounded-[28px] overflow-hidden aspect-square lg:h-[192px] xl:h-[232px] group relative border border-black/5 dark:border-white/5 shadow-sm">
                <img loading="lazy" src={(recentPhotos[1]?.url || recentPhotos[1]?.image) || "https://images.unsplash.com/photo-1510076857177-7470076d4098"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={recentPhotos[1]?.category || "Igreja"} />
             </div>
             
             <div className="col-span-6 md:col-span-4 lg:col-span-3 ios-card rounded-[20px] lg:rounded-[28px] overflow-hidden aspect-square lg:h-[192px] xl:h-[232px] group relative border border-black/5 dark:border-white/5 shadow-sm">
                <img loading="lazy" src={(recentPhotos[2]?.url || recentPhotos[2]?.image) || "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={recentPhotos[2]?.category || "Comunhão"} />
             </div>
             
             <div className="col-span-6 md:col-span-4 lg:col-span-3 ios-card rounded-[20px] lg:rounded-[28px] overflow-hidden aspect-square lg:h-[192px] xl:h-[232px] group relative border border-black/5 dark:border-white/5 shadow-sm">
                <img loading="lazy" src={(recentPhotos[3]?.url || recentPhotos[3]?.image) || "https://images.unsplash.com/photo-1438232992991-995b7058bbb3"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={recentPhotos[3]?.category || "Kids"} />
             </div>
             
             <div className="col-span-6 md:col-span-8 lg:col-span-3 ios-card rounded-[20px] lg:rounded-[28px] overflow-hidden aspect-square lg:h-[192px] xl:h-[232px] group relative border border-black/5 dark:border-white/5 shadow-sm">
                <img loading="lazy" src={(recentPhotos[4]?.url || recentPhotos[4]?.image) || "https://images.unsplash.com/photo-1529070538774-1843cb3265df"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={recentPhotos[4]?.category || "Louvor"} />
             </div>
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

        {/* Location / Map Section */}
        <section id="location" className="pt-4">
           <div className="ios-card overflow-hidden p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center bg-white dark:bg-[#1C1C1E]">
             <div className="flex-1 w-full text-center md:text-left">
                <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto md:mx-0 mb-6 font-bold">
                   <Navigation className="w-6 h-6 text-red-500" />
                </div>
                <h2 className="text-2xl md:text-3xl font-display font-bold mb-3 text-black dark:text-white">Onde Estamos</h2>
                <p className="text-black/60 dark:text-white/60 mb-6">Venha nos fazer uma visita e participe dos nossos encontros abertos a toda a comunidade.</p>
                
                <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-5 mb-6 text-left border border-black/5 dark:border-white/5">
                   <h3 className="font-bold text-sm text-black dark:text-white mb-1 uppercase tracking-wider">Ministério Frutos do Espírito</h3>
                   <p className="text-black/70 dark:text-white/70 text-sm leading-relaxed">
                     QR 407 - Samambaia<br />
                     Brasília - DF<br />
                     CEP: 72321-106
                   </p>
                </div>

                <a 
                  href="https://maps.app.goo.gl/XQxnqawktgfX1mxf9" 
                  target="_blank" 
                  rel="noreferrer"
                  className="ios-button inline-flex w-full md:w-auto justify-center gap-2"
                >
                  <MapPin className="w-5 h-5" />
                  Abrir no Google Maps
                </a>
             </div>
             <div className="w-full md:w-1/2 aspect-square md:aspect-video rounded-[24px] overflow-hidden bg-black/5 border border-black/10 dark:border-white/5 relative">
                {/* Embed Map URL matching the provided location info. Since we just want the easiest representation without an API key, we can construct a basic map via iframe query. "QR 407 - Samambaia, Brasília - DF" */}
                <iframe 
                  src="https://maps.google.com/maps?width=100%25&amp;height=600&amp;hl=en&amp;q=Minist%C3%A9rio%20Frutos%20do%20Esp%C3%ADrito,%20QR%20407%20-%20Samambaia,%20Bras%C3%ADlia%20-%20DF,%2072321-106+(Minist%C3%A9rio%20Frutos%20do%20Esp%C3%ADrito)&amp;t=&amp;z=15&amp;ie=UTF8&amp;iwloc=B&amp;output=embed" 
                  width="100%" 
                  height="100%" 
                  className="absolute inset-0 border-0"
                  allowFullScreen={false}
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade" 
                />
             </div>
           </div>
        </section>

      </div>

      {/* Banner Modal */}
      <AnimatePresence>
        {selectedBanner && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={() => setSelectedBanner(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-[#09090B] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl relative"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedBanner(null)}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="w-full aspect-[4/3] sm:aspect-video relative bg-black">
                {selectedBanner.videoUrl ? (
                  <iframe 
                    src={`https://www.youtube.com/embed/${getYouTubeId(selectedBanner.videoUrl)}?autoplay=1&controls=1&rel=0`}
                    className="w-full h-full border-0"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    title={selectedBanner.title}
                  />
                ) : (
                  <img src={selectedBanner.image || undefined} alt={selectedBanner.title} className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none"></div>
              </div>
              
              <div className="p-6 md:p-8 -mt-24 md:-mt-28 relative z-10">
                <h2 className="text-xl md:text-2xl font-black font-display tracking-tight text-white drop-shadow-md mb-1">{selectedBanner.title}</h2>
                <p className="text-sm md:text-base text-white/90 font-medium mb-5">{selectedBanner.subtitle}</p>
                
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 text-[13px] md:text-sm text-white/90 leading-relaxed font-medium mb-6 shadow-xl border border-white/10">
                  {selectedBanner.description || "As informações completas sobre este item estão sendo atualizadas. Fique ligado para mais novidades e detalhes na nossa programação!"}
                </div>
                
                <div className="mt-4 flex justify-end">
                  <button 
                    onClick={() => setSelectedBanner(null)}
                    className="px-6 py-2.5 rounded-full bg-[var(--theme-color)] text-white text-sm font-bold hover:scale-105 transition-transform"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
