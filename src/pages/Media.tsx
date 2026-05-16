import { useState, useEffect, useRef } from 'react';
import { Play, Radio, Mic, Tv, ChevronRight, Volume2, Share2, Heart, Search, ChevronLeft, LayoutGrid, RadioTower, ListPlus, ListVideo, SkipForward, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchGospelContent, YouTubeVideo } from '../services/youtube';
import { useTheme } from '../lib/ThemeContext';

export default function Media() {
  const { themeColor } = useTheme();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'all' | 'live' | 'music' | 'podcast'>('all');
  const [ytVideos, setYtVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Playlist State
  const [playlist, setPlaylist] = useState<YouTubeVideo[]>([]);
  const [showPlaylist, setShowPlaylist] = useState(false);

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
      if (activeTab === 'music') query = 'louvores adoração';
      if (activeTab === 'podcast') query = 'podcast gospel testemunho';
      if (activeTab === 'live') query = 'culto completo igreja';
    }
    
    const vids = await searchGospelContent(query);
    setYtVideos(vids);
    setLoading(false);
  };

  useEffect(() => {
    fetchContent();
  }, [activeTab]);

  const addToPlaylist = (video: YouTubeVideo, e: React.MouseEvent) => {
    e.stopPropagation();
    setPlaylist(prev => [...prev, video]);
    if (!selectedVideo) {
      setSelectedVideo(video);
    }
  };

  const removeFromPlaylist = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setPlaylist(prev => prev.filter((_, i) => i !== index));
  };

  const playNext = () => {
    if (playlist.length > 0) {
      const next = playlist[0];
      setSelectedVideo(next);
      setPlaylist(prev => prev.slice(1));
    } else {
      setSelectedVideo(null);
    }
  };

  const items = [...ytVideos.map(v => ({
    id: v.id,
    title: v.title,
    type: v.type === 'live' ? 'LIVE' : (activeTab === 'podcast' ? 'PODCAST' : 'VIDEO'),
    author: 'Ecclesia Stream',
    thumbnail: v.thumbnail,
    ytId: v.id,
    originalVideo: v
  }))];

  return (
    <div className="min-h-screen pb-32">
      {/* iOS Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-40 ios-glass border-b border-black/[0.05] dark:border-white/[0.05] flex items-center justify-between px-6 h-16">
        <Link to="/" className="flex items-center gap-1 font-medium transition-opacity active:opacity-50" style={{ color: themeColor }}>
          <ChevronLeft className="w-6 h-6" />
          <span>Início</span>
        </Link>
        <h1 className="text-[17px] font-bold tracking-tight absolute left-1/2 -translate-x-1/2">Mídia</h1>
        <button 
          onClick={() => setShowPlaylist(true)} 
          className="relative w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-all"
          style={{ color: themeColor }}
        >
          <ListVideo className="w-5 h-5" />
          {playlist.length > 0 && (
            <span className="absolute max-w-full truncate top-1 right-1 bg-[#FF3B30] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
              {playlist.length}
            </span>
          )}
        </button>
      </nav>

      <div className="pt-24 px-6 space-y-8 max-w-lg mx-auto">
        <header className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <RadioTower className="w-5 h-5 text-[#8E8E93]" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#8E8E93]">Frequência Digital</span>
            </div>
            <h2 className="text-4xl font-bold tracking-tighter">Imersão Total</h2>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); fetchContent(searchQuery); }} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93]" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar vídeos ou louvores..."
              className="w-full bg-black/5 dark:bg-white/5 rounded-2xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 transition-all"
              style={{ '--tw-ring-color': themeColor } as any}
            />
          </form>
        </header>

        {/* Categories Bar */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'live', label: 'Ao Vivo' },
            { id: 'music', label: 'Louvores' },
            { id: 'podcast', label: 'Podcasts' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm' 
                  : 'bg-black/5 dark:bg-white/5 text-[#8E8E93]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Media Content Grid */}
        <div className="space-y-4">
          {loading ? (
            Array(3).fill(0).map((_, i) => (
               <div key={i} className="h-28 rounded-3xl bg-black/5 dark:bg-white/5 animate-pulse" />
            ))
          ) : (
            items.map((item) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedVideo(item.originalVideo)}
                className="ios-card flex items-center p-3 gap-4 active:scale-98 cursor-pointer shadow-sm border-black/[0.05] dark:border-white/[0.05]"
              >
                <div className="w-20 h-20 rounded-2xl overflow-hidden relative flex-shrink-0">
                  <img src={item.thumbnail} className="w-full h-full object-cover" alt="Video" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Play className="w-6 h-6 text-white fill-current" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-[#FF2D55] tracking-tight">{item.type}</span>
                  <h3 className="font-bold text-[14px] text-black/90 dark:text-white/90 leading-tight line-clamp-2 mt-0.5">{item.title}</h3>
                  <p className="text-[11px] text-[#8E8E93] mt-1 line-clamp-1">{item.author}</p>
                </div>
                <button 
                  onClick={(e) => addToPlaylist(item.originalVideo, e)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-[#8E8E93] hover:text-[var(--theme-color)] hover:bg-black/5 transition-all"
                >
                   <ListPlus className="w-5 h-5" />
                </button>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Fullscreen Video Player */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col pt-[max(20px,env(safe-area-inset-top))]"
          >
            <div className="flex items-center justify-between px-4 py-4 shrink-0">
              <button 
                onClick={() => setSelectedVideo(null)}
                className="text-white/80 hover:text-white p-2"
              >
                <ChevronLeft className="w-7 h-7" />
              </button>
              <h2 className="text-white font-bold text-sm truncate px-4">{selectedVideo.title}</h2>
              <button 
                onClick={() => setShowPlaylist(true)}
                className="text-white/80 hover:text-white p-2 relative"
              >
                <ListVideo className="w-6 h-6" />
                {playlist.length > 0 && (
                   <span className="absolute top-1 right-1 bg-[#FF3B30] w-2 h-2 rounded-full" />
                )}
              </button>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-full aspect-video bg-zinc-900 shadow-2xl relative">
                {/* Note: In standard browsers, iframe playback pauses when screen locks unless user has YT Premium. 
                    Adding enablesjsapi to allow detecting end of video to auto-play next from playlist (requires YT Iframe API). */}
                <iframe
                  src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1&modestbranding=1&rel=0&playsinline=1`}
                  title={selectedVideo.title}
                  className="w-full h-full border-0 absolute inset-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              
              <div className="w-full max-w-md mt-12 px-8 flex justify-center gap-8">
                 <button className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-white active:bg-white/20 transition-all opacity-50 cursor-not-allowed">
                   <ChevronLeft className="w-8 h-8" />
                 </button>
                 <button onClick={playNext} className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-black active:scale-95 transition-all shadow-xl shadow-white/10">
                   <SkipForward className="w-8 h-8 fill-current" />
                 </button>
              </div>
              <p className="text-white/40 text-xs mt-8 px-6 text-center">Para reprodução em segundo plano (tela desligada), certifique-se de usar o navegador que suporta PiP ou ter as permissões adequadas do sistema.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Playlist Drawer */}
      <AnimatePresence>
        {showPlaylist && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPlaylist(false)}
              className="fixed inset-0 bg-black/60 z-[110] backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed inset-x-0 bottom-0 z-[120] bg-white dark:bg-[#1C1C1E] rounded-t-[2rem] max-h-[80vh] flex flex-col ios-shadow"
            >
              <div className="flex items-center justify-between p-6 border-b border-black/5 dark:border-white/5 shrink-0">
                <div>
                  <h3 className="font-bold text-xl">Fila de Reprodução</h3>
                  <p className="text-xs text-[#8E8E93] mt-1">{playlist.length} faixas na sequência</p>
                </div>
                <button onClick={() => setShowPlaylist(false)} className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
                  <X className="w-5 h-5 text-[#8E8E93]" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {playlist.length === 0 ? (
                  <div className="text-center py-10 opacity-50">
                    <ListVideo className="w-12 h-12 mx-auto mb-4" />
                    <p className="font-medium">Nenhuma mídia na fila.</p>
                  </div>
                ) : (
                  playlist.map((video, idx) => (
                    <div key={idx} className="flex items-center gap-4 group">
                      <span className="text-[#8E8E93] text-xs font-bold w-4 text-right shrink-0">{idx + 1}</span>
                      <div className="w-16 h-12 rounded-lg overflow-hidden shrink-0">
                        <img src={video.thumbnail} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm truncate">{video.title}</h4>
                      </div>
                      <button 
                        onClick={(e) => removeFromPlaylist(idx, e)}
                        className="w-8 h-8 flex items-center justify-center text-[#8E8E93] group-hover:text-[#FF3B30] active:scale-95"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
