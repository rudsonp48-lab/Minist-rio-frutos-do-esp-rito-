import { useState, useEffect } from 'react';
import { Play, Radio, Mic, Tv, ChevronRight, Volume2, Share2, Heart, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams } from 'react-router-dom';
import { searchGospelContent, YouTubeVideo } from '../services/youtube';

export default function Media() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'all' | 'live' | 'music' | 'podcast'>('all');
  const [ytVideos, setYtVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const liveId = searchParams.get('live');
    if (liveId) {
      setSelectedVideo({
        id: liveId,
        title: 'Transmissão ao Vivo',
        thumbnail: '',
        publishedAt: new Date().toISOString(),
        type: 'live'
      });
    }
  }, [searchParams]);

  const fetchContent = async (customQuery?: string) => {
    setLoading(true);
    let query = customQuery || 'gospel';
    
    if (!customQuery) {
      if (activeTab === 'music') query = 'música gospel louvores';
      if (activeTab === 'podcast') query = 'podcast gospel testemunho';
      if (activeTab === 'live') query = 'culto ao vivo hoje igreja';
    }
    
    const vids = await searchGospelContent(query);
    setYtVideos(vids);
    setLoading(false);
  };

  useEffect(() => {
    fetchContent();
  }, [activeTab]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchContent(searchQuery);
    }
  };

  const defaultItems = [
    { id: 'radio-1', title: 'Radio Ecclesia FM', type: 'radio', author: 'Ao Vivo 24h', duration: 'Live', thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800' },
  ];

  const allItems = [...defaultItems, ...ytVideos.map(v => ({
    id: v.id,
    title: v.title,
    type: v.type === 'live' ? 'live' : (activeTab === 'podcast' ? 'podcast' : 'music'),
    author: 'YouTube',
    duration: 'Video',
    thumbnail: v.thumbnail,
    ytId: v.id
  }))] as any[];

  const filteredItems = activeTab === 'all' 
    ? allItems 
    : allItems.filter(i => {
        if (activeTab === 'live') return i.type === 'live';
        if (activeTab === 'music') return i.type === 'music';
        if (activeTab === 'podcast') return i.type === 'podcast';
        return i.type === activeTab;
      });

  return (
    <div className="space-y-12 pb-24">
      {/* Video Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
            onClick={() => setSelectedVideo(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-5xl aspect-video bg-zinc-900 rounded-[2rem] overflow-hidden shadow-2xl relative"
              onClick={e => e.stopPropagation()}
            >
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1`}
                title={selectedVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <button 
                onClick={() => setSelectedVideo(null)}
                className="absolute top-4 right-4 bg-black/40 hover:bg-white text-white hover:text-black p-4 rounded-full transition-all"
              >
                Fechar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="pt-8 px-4 md:px-0">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-[2px] bg-yellow-400 glow-yellow" />
          <span className="text-yellow-400 text-[9px] md:text-[10px] font-display font-black uppercase tracking-[0.4em] text-glow">Arquivos de Mídia Digital</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-display font-black italic uppercase tracking-tighter leading-[0.85]">Imersão <br /> <span className="text-yellow-400">Sensorial</span></h1>
        <p className="text-zinc-500 font-medium max-w-xl mt-6 text-[11px] md:text-sm uppercase tracking-widest opacity-60">Sintonize com a frequência do Reino através de streams, áudios e vídeos imersivos.</p>
      </header>

      {/* Search Bar */}
      <section className="px-4 md:px-0">
        <form onSubmit={handleSearch} className="relative group">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 w-8 h-8 glass flex items-center justify-center rounded-xl border-white/5 group-focus-within:border-yellow-400/40 transition-all">
             <Search className="w-4 h-4 text-zinc-600 group-focus-within:text-yellow-400 transition-colors" />
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por louvores, pregações ou podcasts..." 
            className="w-full glass-dark bg-zinc-900/40 border border-white/5 rounded-2xl md:rounded-[2.5rem] py-5 md:py-6 pl-16 pr-10 font-display font-black italic tracking-tighter text-lg md:text-xl focus:outline-none focus:border-yellow-400/40 transition-all text-white placeholder:text-zinc-800 shadow-2xl"
          />
          <button 
            type="submit"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-yellow-400 text-black px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[9px] hover:scale-105 active:scale-95 transition-all glow-yellow"
          >
            Buscar
          </button>
        </form>
      </section>

      {/* Futuristic Tabs */}
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide px-4 md:px-0">
        {[
          { id: 'all', label: 'Todos os Dados', icon: Tv },
          { id: 'live', label: 'Links ao Vivo', icon: Play },
          { id: 'music', label: 'Louvores', icon: Mic },
          { id: 'podcast', label: 'Podcasts', icon: Radio },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all whitespace-nowrap relative overflow-hidden group ${
                isActive 
                  ? 'glass border-yellow-400/40 text-yellow-400' 
                  : 'glass-dark text-zinc-500 border-white/5 hover:border-yellow-400/20 hover:text-white'
              }`}
            >
              {isActive && (
                <motion.div 
                  layoutId="active-tab-glow" 
                  className="absolute inset-0 bg-yellow-400 opacity-5" 
                />
              )}
              <Icon className={`w-4 h-4 relative z-10 ${isActive ? 'animate-pulse' : ''}`} />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Featured Stream Hero */}
      {activeTab === 'all' && (
        <section className="relative h-[55vh] md:h-[60vh] rounded-[3rem] overflow-hidden group border border-white/5 mx-2 md:mx-0 shadow-2xl">
          <img 
            src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1600" 
            className="absolute inset-0 w-full h-full object-cover grayscale brightness-50 group-hover:grayscale-0 group-hover:brightness-75 transition-all duration-1000"
            alt="Radio Featured"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/20 to-transparent" />
          
          <div className="absolute inset-x-0 bottom-0 p-8 md:p-16 flex flex-col md:flex-row md:items-end justify-between gap-8 md:gap-12 bg-gradient-to-t from-black via-black/40 to-transparent">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-3.5 w-3.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-600 border-2 border-black"></span>
                </div>
                <span className="text-red-600 text-[9px] font-black uppercase tracking-[0.4em] text-glow">Node: Live-Radio-01</span>
              </div>
              
              <h2 className="text-4xl md:text-7xl font-display font-black uppercase italic tracking-tighter mb-6 leading-[0.85]">
                Radio <br /> <span className="text-yellow-400">Ecclesia</span>
              </h2>

              <p className="text-white/60 font-black uppercase tracking-[0.2em] text-[9px] mb-6 max-w-sm leading-relaxed">Sinfonias celestiais transmitidas 24/7 para sua elevação espiritual.</p>
            </div>

            <div className="flex gap-8 items-center">
              <button className="w-16 h-16 md:w-20 md:h-20 bg-yellow-400 text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_0_60px_rgba(250,204,21,0.4)] glow-yellow group">
                <Radio className="w-8 h-8 md:w-9 md:h-9 group-hover:rotate-12 transition-transform" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Grid Content 2.0 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4 md:px-0">
        {filteredItems.map((item) => (
          <motion.div 
            key={item.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-dark rounded-[3.5rem] overflow-hidden group hover:border-yellow-400/40 transition-all shadow-2xl relative"
            onClick={() => {
              if (item.ytId) {
                setSelectedVideo({
                  id: item.ytId,
                  title: item.title,
                  thumbnail: item.thumbnail,
                  publishedAt: '',
                  type: 'video'
                });
              }
            }}
          >
            <div className="relative aspect-[16/10] overflow-hidden">
              <img src={item.thumbnail} className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000 brightness-75 group-hover:brightness-100" alt={item.title} />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
              
              <div className="absolute top-6 left-6">
                <div className="glass px-4 py-1.5 rounded-full border-yellow-400/20">
                  <span className="text-yellow-400 text-[9px] font-black uppercase tracking-widest">{item.type}</span>
                </div>
              </div>

              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 scale-90 group-hover:scale-100">
                <div className="w-16 h-16 bg-yellow-400 text-black rounded-full flex items-center justify-center glow-yellow">
                  <Play className="w-6 h-6 fill-black translate-x-0.5" />
                </div>
              </div>
            </div>
            
            <div className="p-10 space-y-6">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-3">
                  <h3 className="font-display font-bold uppercase italic text-2xl line-clamp-2 leading-tight group-hover:text-yellow-400 transition-colors">{item.title}</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 glass flex items-center justify-center rounded-lg">
                      <Tv className="w-3 h-3 text-zinc-500" />
                    </div>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">{item.author}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-8 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 glass rounded-lg">
                    <Volume2 className="w-3 h-3 text-yellow-400" />
                  </div>
                  <span className="text-[10px] uppercase font-black tracking-widest text-zinc-600 italic">{item.duration}</span>
                </div>
                <div className="flex gap-4">
                  <Heart className="w-5 h-5 text-zinc-700 hover:text-red-500 transition-colors cursor-pointer" />
                  <Share2 className="w-5 h-5 text-zinc-700 hover:text-white transition-colors cursor-pointer" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      {ytVideos.length === 0 && !loading && import.meta.env.VITE_YOUTUBE_API_KEY === undefined && (
        <div className="bg-zinc-900 border border-white/5 p-12 rounded-[3rem] text-center">
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Configure a chave API do YouTube para ver mais conteúdo.</p>
        </div>
      )}
    </div>
  );
}
