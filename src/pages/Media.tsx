import { useState, useEffect } from 'react';
import { Play, Radio, Mic, Tv, ChevronRight, Volume2, Volume1, Share2, Heart, Search, ChevronLeft, LayoutGrid, RadioTower, ListPlus, ListVideo, SkipForward, SkipBack, X, Clock, ChevronDown, MoreHorizontal, Shuffle, Pause, Repeat, Cast, List } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchGospelContent, YouTubeVideo } from '../services/youtube';
import { useTheme } from '../lib/ThemeContext';
import { usePlayer } from '../lib/PlayerContext';

const MUSIC_CATEGORIES = [
  { name: 'Pop Coral', query: 'pop coral gospel cover', colors: 'from-pink-500 to-rose-600', img: 'https://hoirqrkdgbmvpwutwuwj-all.supabase.co/storage/v1/object/public/assets/assets/cd1e23ec-0f27-4bd7-94aa-ec4a5e45ff55_320w.jpg' },
  { name: 'Worship Rock', query: 'worship rock gospel', colors: 'from-orange-500 to-red-600', img: 'https://hoirqrkdgbmvpwutwuwj-all.supabase.co/storage/v1/object/public/assets/assets/8830c989-0aa7-4a9b-a1fc-a81e75ddc91c_320w.jpg' },
  { name: 'Hip-Hop Gospel', query: 'hip hop rap gospel', colors: 'from-green-500 to-emerald-600', img: 'https://hoirqrkdgbmvpwutwuwj-all.supabase.co/storage/v1/object/public/assets/assets/0decebec-86b8-4a0b-8eae-9d59fc2cb6c0_320w.jpg' },
  { name: 'Electronic', query: 'musica eletronica gospel', colors: 'from-purple-500 to-violet-600', img: 'https://hoirqrkdgbmvpwutwuwj-all.supabase.co/storage/v1/object/public/assets/assets/0c3dbf33-c7e3-4e8b-98c2-2fa9aa8446c3_320w.jpg' },
  { name: 'Jazz Cristão', query: 'jazz piano cristão', colors: 'from-blue-500 to-indigo-600', img: 'https://hoirqrkdgbmvpwutwuwj-all.supabase.co/storage/v1/object/public/assets/assets/7dc1deaa-731d-47ce-a397-6b102ac413ee_320w.jpg' },
  { name: 'Sertanejo', query: 'sertanejo gospel adoracao', colors: 'from-yellow-500 to-orange-500', img: 'https://hoirqrkdgbmvpwutwuwj-all.supabase.co/storage/v1/object/public/assets/assets/68126ad8-98eb-4b55-bf1c-e7e1c245f0b1_320w.jpg' },
  { name: 'R&B / Soul', query: 'r&b soul black gospel', colors: 'from-teal-500 to-cyan-600', img: 'https://hoirqrkdgbmvpwutwuwj-all.supabase.co/storage/v1/object/public/assets/assets/e3feb627-3752-46af-9eea-dab3b32a4b2b_320w.jpg' },
  { name: 'Música Clássica', query: 'instrumental classica hinos', colors: 'from-indigo-500 to-purple-600', img: 'https://hoirqrkdgbmvpwutwuwj-all.supabase.co/storage/v1/object/public/assets/assets/8da92894-10a2-4653-8a1e-6560bde45a33_320w.jpg' },
];

export default function Media() {
  const { themeColor } = useTheme();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'all' | 'live' | 'music' | 'podcast'>('all');
  const [ytVideos, setYtVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { 
    setSelectedVideo, 
    playlist, 
    setPlaylist, 
    addToPlaylist, 
    removeFromPlaylist,
    setIsFullscreen 
  } = usePlayer();

  const [showPlaylist, setShowPlaylist] = useState(false);

  // Drag and drop state
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedItemIndex === null || draggedItemIndex === index) return;
    
    setPlaylist(prev => {
      const newPlaylist = [...prev];
      const draggedItem = newPlaylist[draggedItemIndex];
      newPlaylist.splice(draggedItemIndex, 1);
      newPlaylist.splice(index, 0, draggedItem);
      return newPlaylist;
    });
    setDraggedItemIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedItemIndex(null);
  };

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
      if (activeTab === 'music') query = 'louvores adoração playback';
      if (activeTab === 'podcast') query = 'podcast gospel testemunho';
      if (activeTab === 'live') query = 'culto ao vivo';
    }
    
    // For music, only fetch if we explicitly search
    if (activeTab === 'music' && !customQuery) {
      setYtVideos([]);
      setLoading(false);
      return;
    }

    const vids = await searchGospelContent(query);
    setYtVideos(vids);
    setLoading(false);
  };

  useEffect(() => {
    fetchContent();
  }, [activeTab]);

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
          {activeTab !== 'music' && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <RadioTower className="w-5 h-5 text-[#8E8E93]" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#8E8E93]">Frequência Digital</span>
              </div>
              <h2 className="text-4xl font-bold tracking-tighter">Imersão Total</h2>
            </div>
          )}

          {activeTab !== 'music' && (
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
          )}

          {!import.meta.env.VITE_YOUTUBE_API_KEY && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
              <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider mb-1">Aviso do Sistema</p>
              <p className="text-[12px] text-amber-500/80 leading-tight">
                A chave da API do YouTube não foi configurada. Acesse o painel de segredos do AI Studio e adicione <strong>VITE_YOUTUBE_API_KEY</strong> para ver o conteúdo.
              </p>
            </div>
          )}
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
            activeTab === 'music' && ytVideos.length === 0 ? (
              <div className="mt-6 text-white w-full max-w-lg mx-auto bg-gray-950 p-6 rounded-[47px] pb-16 shadow-2xl relative">
                {/* Search Bar for Music */}
                <div className="mb-6">
                  <h1 className="text-white tracking-tight mb-4 font-sans font-semibold text-3xl">Música</h1>
                  <form onSubmit={(e) => { e.preventDefault(); fetchContent(searchQuery || 'louvores adoração'); }} className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className="w-5 h-5 text-gray-400" />
                    </div>
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Artistas, louvores ou playlists" 
                      className="w-full placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:border-transparent text-white bg-gray-900 border-gray-800 border rounded-xl py-3 pl-12 pr-4 transition-all" 
                    />
                  </form>
                </div>

                {/* Browse All */}
                <div className="mb-6">
                  <h2 className="font-semibold text-white mb-4 font-sans text-lg">Navegar</h2>
                  <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1 scrollbar-hide">
                    {MUSIC_CATEGORIES.map(cat => (
                      <div 
                        key={cat.name} 
                        onClick={() => { setSearchQuery(cat.name); fetchContent(cat.query); }}
                        className={`p-4 bg-gradient-to-br ${cat.colors} rounded-xl shadow-lg relative overflow-hidden h-[100px] cursor-pointer active:scale-95 transition-transform`}
                      >
                        <h3 className="text-white font-bold text-base md:text-lg font-sans z-10 relative drop-shadow-md">{cat.name}</h3>
                        <div className="absolute -bottom-2 -right-4 w-20 h-20 rotate-[20deg] shadow-[0_8px_20px_rgba(0,0,0,0.5)] rounded bg-white/10 z-0 overflow-hidden ring-1 ring-white/20">
                          <img src={cat.img} className="w-full h-full object-cover opacity-90" alt={cat.name} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent searches */}
                <div>
                  <h2 className="font-semibold text-white mb-4 font-sans text-lg">Suas Buscas</h2>
                  <div className="space-y-3">
                    {['Aline Barros', 'Hillsong Worship', 'Adoração 2024'].map(term => (
                      <div 
                        key={term} 
                        onClick={() => { setSearchQuery(term); fetchContent(term + ' gospel'); }}
                        className="flex gap-4 hover:bg-gray-800/50 transition-colors bg-gray-900 border-gray-800 border rounded-xl p-3 items-center cursor-pointer"
                      >
                        <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                           <Clock className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-white font-sans text-sm">{term}</h3>
                        </div>
                        <button className="p-2 text-gray-400 hover:text-white" onClick={(e) => { e.stopPropagation(); }}>
                           <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              items.map((item) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => {
                    setSelectedVideo(item.originalVideo);
                  }}
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
                    onClick={(e: any) => { e.stopPropagation(); addToPlaylist(item.originalVideo); }}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-[#8E8E93] hover:text-[var(--theme-color)] hover:bg-black/5 transition-all"
                  >
                     <ListPlus className="w-5 h-5" />
                  </button>
                </motion.div>
              ))
            )
          )}
        </div>
      </div>

      {/* Fullscreen Player removed - now handled globally */}

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
                    <div 
                      key={idx} 
                      className={`flex items-center gap-4 group p-2 rounded-xl transition-all ${draggedItemIndex === idx ? 'opacity-50 bg-black/10 dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="text-[#8E8E93] cursor-grab active:cursor-grabbing w-6 flex justify-center">
                        <MoreHorizontal className="w-4 h-4 opacity-50" />
                      </div>
                      <span className="text-[#8E8E93] text-xs font-bold w-4 text-right shrink-0">{idx + 1}</span>
                      <div className="w-16 h-12 rounded-lg overflow-hidden shrink-0">
                        <img src={video.thumbnail} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm truncate">{video.title}</h4>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeFromPlaylist(idx); }}
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
