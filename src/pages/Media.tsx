import { useState, useEffect, useRef } from 'react';
import { Play, Radio, Mic, Tv, ChevronRight, Volume2, Volume1, Share2, Heart, Search, ChevronLeft, LayoutGrid, RadioTower, ListPlus, ListVideo, SkipForward, SkipBack, X, Clock, ChevronDown, MoreHorizontal, Shuffle, Pause, Repeat, Cast, List, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchGospelContent, YouTubeVideo } from '../services/youtube';
import { useTheme } from '../lib/ThemeContext';
import { usePlayer } from '../lib/PlayerContext';

const MUSIC_CATEGORIES = [
  { name: 'Worship Rock', query: 'worship rock gospel', colors: 'from-orange-500/80 to-red-600/80', img: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=600&q=80', span: 'col-span-2 row-span-2 min-h-[160px]' },
  { name: 'Pop Coral', query: 'pop coral gospel cover', colors: 'from-pink-500/80 to-rose-600/80', img: 'https://images.unsplash.com/photo-1516280440502-61f221464dbb?auto=format&fit=crop&w=400&q=80', span: 'col-span-1 row-span-1 min-h-[110px]' },
  { name: 'Electronic', query: 'musica eletronica gospel', colors: 'from-purple-500/80 to-violet-600/80', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80', span: 'col-span-1 row-span-1 min-h-[110px]' },
  { name: 'Hip-Hop Gospel', query: 'hip hop rap gospel', colors: 'from-green-500/80 to-emerald-600/80', img: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f5f9af?auto=format&fit=crop&w=400&q=80', span: 'col-span-1 row-span-1 min-h-[110px]' },
  { name: 'Jazz Cristão', query: 'jazz piano cristão', colors: 'from-blue-500/80 to-indigo-600/80', img: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=400&q=80', span: 'col-span-1 row-span-1 min-h-[110px]' },
  { name: 'Sertanejo', query: 'sertanejo gospel adoracao', colors: 'from-yellow-500/80 to-orange-500/80', img: 'https://images.unsplash.com/photo-1555543445-5d9dc05dc55e?auto=format&fit=crop&w=400&q=80', span: 'col-span-1 row-span-1 min-h-[110px]' },
  { name: 'Música Clássica', query: 'instrumental classica hinos', colors: 'from-indigo-500/80 to-purple-600/80', img: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&w=400&q=80', span: 'col-span-1 row-span-1 min-h-[110px]' },
  { name: 'R&B / Soul', query: 'r&b soul black gospel', colors: 'from-teal-500/80 to-cyan-600/80', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80', span: 'col-span-2 row-span-1 min-h-[120px]' },
];

export default function Media() {
  const { themeColor } = useTheme();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'all' | 'live' | 'music' | 'podcast'>('all');
  const [ytVideos, setYtVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isVoiceSearchActive, setIsVoiceSearchActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("A pesquisa por voz não é suportada neste navegador.");
      return;
    }

    setVoiceError(null);
    setIsVoiceSearchActive(true);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        console.error(e);
      }
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceError(null);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      
      // Handle the 'network' error and others beautifully
      switch (event.error) {
        case 'network':
          setVoiceError('Não foi possível conectar ao serviço de voz. Por favor, verifique sua conexão ou tente digitar.');
          break;
        case 'not-allowed':
          setVoiceError('Permissão recusada. Ative o acesso ao microfone nas configurações do seu navegador para usar a voz.');
          break;
        case 'no-speech':
          setVoiceError('Nenhuma voz detectada. Fale um pouco mais alto ou mais próximo do microfone.');
          break;
        case 'audio-capture':
          setVoiceError('Erro ao capturar áudio. Verifique se o microfone está conectado e funcionando.');
          break;
        case 'aborted':
          // Don't show abort error if manually cancelled
          break;
        default:
          setVoiceError('Ocorreu um erro ao escutar. Se o problema persistir, por favor, digite sua busca.');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setSearchQuery(transcript);
        fetchContent(transcript);
        setIsVoiceSearchActive(false);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
      setVoiceError('Erro ao iniciar o microfone.');
    }
  };

  const stopVoiceSearch = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        console.error(e);
      }
    }
    setIsListening(false);
    setIsVoiceSearchActive(false);
    setVoiceError(null);
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error(e);
        }
      }
    };
  }, []);
  
  const { setSelectedVideo, addToPlaylist, setIsMinimized, playlist, selectedVideo } = usePlayer();

  useEffect(() => {
    const liveId = searchParams.get('live');
    if (liveId) {
      if (liveId === '1') {
        setActiveTab('live');
      } else {
        setSelectedVideo({
          id: liveId,
          title: 'Transmissão ao Vivo',
          thumbnail: '',
          publishedAt: new Date().toISOString(),
          type: 'live'
        });
        setIsMinimized(false);
        setActiveTab('live');
      }
    }
  }, [searchParams]);

  const lastFetchedQueryRef = useRef<string | null>(null);
  const lastFetchedTabRef = useRef<string | null>(null);

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

    lastFetchedQueryRef.current = customQuery || '';

    let vids: YouTubeVideo[] = [];
    if (activeTab === 'live' && !customQuery) {
      const { checkChannelLive } = await import('../services/youtube');
      const liveStreams = await checkChannelLive();
      if (liveStreams && liveStreams.length > 0) {
        vids = liveStreams;
      } else {
        // Fallback to recent services if no live stream available
        vids = await searchGospelContent('culto ao vivo');
      }
    } else {
      vids = await searchGospelContent(query);
    }
    setYtVideos(vids);
    setLoading(false);
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      const currentQuery = searchQuery || '';
      const currentTab = activeTab;
      if (lastFetchedQueryRef.current !== currentQuery || lastFetchedTabRef.current !== currentTab) {
        lastFetchedTabRef.current = currentTab;
        fetchContent(searchQuery || undefined);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, activeTab]);

  const items = [...ytVideos.map(v => {
    const itemType = v.type === 'live' ? 'live' : (v.type === 'music' || activeTab === 'music' ? 'music' : (v.type === 'podcast' || activeTab === 'podcast' ? 'podcast' : 'video'));
    return {
      id: v.id,
      title: v.title,
      type: itemType === 'live' ? 'LIVE' : itemType.toUpperCase(),
      author: v.author || 'Ecclesia Stream',
      thumbnail: v.thumbnail,
      ytId: v.id,
      originalVideo: {
        ...v,
        type: itemType as 'video' | 'live' | 'music' | 'podcast'
      }
    };
  })];

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
          onClick={() => {
            if (selectedVideo || playlist.length > 0) setIsMinimized(false);
          }} 
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
          {activeTab !== 'music' ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <RadioTower className="w-5 h-5 text-[#8E8E93]" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#8E8E93]">Frequência Digital</span>
              </div>
              <h2 className="text-4xl font-bold tracking-tighter">Imersão Total</h2>
            </div>
          ) : (
            ytVideos.length > 0 && (
              <div>
                <h2 className="text-4xl font-bold tracking-tighter">Música</h2>
              </div>
            )
          )}

          {(activeTab !== 'music' || ytVideos.length > 0) && (
            <form onSubmit={(e) => { e.preventDefault(); fetchContent(searchQuery); }} className="relative flex items-center pr-2 bg-black/5 dark:bg-white/5 rounded-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93]" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeTab === 'music' ? "Artistas, louvores ou playlists..." : "Buscar vídeos ou louvores..."}
                className="w-full bg-transparent py-3 pl-10 pr-12 text-sm focus:outline-none focus:ring-2 transition-all rounded-2xl"
                style={{ '--tw-ring-color': themeColor } as any}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchQuery && (
                  <button 
                    type="button" 
                    onClick={() => { setSearchQuery(''); fetchContent(''); }} 
                    className="text-[#8E8E93] hover:text-black dark:hover:text-white transition-all p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button 
                  type="button" 
                  onClick={startVoiceSearch} 
                  className={`transition-all p-1.5 rounded-full flex items-center justify-center ${
                    isListening 
                      ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30' 
                      : 'text-[#8E8E93] hover:text-black dark:hover:text-white active:scale-95'
                  }`}
                  title="Pesquisar por voz"
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>
            </form>
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
                  <form onSubmit={(e) => { e.preventDefault(); fetchContent(searchQuery || 'louvores adoração'); }} className="relative flex items-center bg-gray-900 border border-gray-800 rounded-xl pr-2">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className="w-5 h-5 text-gray-400" />
                    </div>
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Artistas, louvores ou playlists" 
                      className="w-full placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:border-transparent text-white bg-transparent py-3 pl-12 pr-12 transition-all rounded-xl" 
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {searchQuery && (
                        <button 
                          type="button" 
                          onClick={() => { setSearchQuery(''); fetchContent(''); }} 
                          className="text-gray-400 hover:text-white transition-all p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        type="button" 
                        onClick={startVoiceSearch} 
                        className={`transition-all p-1.5 rounded-full flex items-center justify-center ${
                          isListening 
                            ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30' 
                            : 'text-gray-400 hover:text-white active:scale-95'
                        }`}
                        title="Pesquisar por voz"
                      >
                        <Mic className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </div>

                {/* Browse All */}
                <div className="mb-6">
                  <h2 className="font-semibold text-white mb-4 font-sans text-xl tracking-tight">Navegar</h2>
                  <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1 scrollbar-hide grid-flow-row-dense">
                    {MUSIC_CATEGORIES.map(cat => (
                      <div 
                        key={cat.name} 
                        onClick={() => { 
                          setSearchQuery(cat.name); 
                          lastFetchedQueryRef.current = cat.name;
                          fetchContent(cat.query); 
                        }}
                        className={`group rounded-[24px] shadow-lg relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform ${cat.span}`}
                      >
                        <img src={cat.img} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" alt={cat.name} />
                        <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent mix-blend-multiply opacity-80 group-hover:opacity-100 transition-opacity`}></div>
                        <div className={`absolute inset-0 bg-gradient-to-br ${cat.colors} mix-blend-color opacity-90`}></div>
                        
                        <div className="absolute inset-0 p-5 flex flex-col justify-end">
                          <h3 className="text-white font-bold text-xl lg:text-2xl font-sans tracking-tight drop-shadow-md">{cat.name}</h3>
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
                        onClick={() => { 
                          setSearchQuery(term); 
                          lastFetchedQueryRef.current = term;
                          fetchContent(term + ' gospel'); 
                        }}
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
                  onClick={() => { setSelectedVideo(item.originalVideo); setIsMinimized(false); }}
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
                    onClick={(e) => { e.stopPropagation(); addToPlaylist(item.originalVideo); }}
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

      {/* Modern, Premium Voice Recognition Ambient Overlay */}
      <AnimatePresence>
        {isVoiceSearchActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-zinc-900 border border-zinc-800 p-8 rounded-[36px] flex flex-col items-center space-y-6 max-w-sm text-center shadow-2xl mx-4"
            >
              {voiceError ? (
                <>
                  <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center shadow-lg">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-white text-lg font-bold">Pesquisa por Voz</h3>
                    <p className="text-[#8E8E93] text-xs mt-2 leading-relaxed">{voiceError}</p>
                  </div>
                  <div className="flex gap-3 w-full justify-center">
                    <button 
                      onClick={startVoiceSearch}
                      className="px-5 py-2.5 bg-red-500 text-white text-xs font-semibold rounded-full hover:bg-red-600 transition-all active:scale-95 shadow-md shadow-red-500/20"
                    >
                      Tentar Novamente
                    </button>
                    <button 
                      onClick={stopVoiceSearch}
                      className="px-5 py-2.5 bg-zinc-800 text-white text-xs font-semibold rounded-full hover:bg-zinc-700 transition-all active:scale-95"
                    >
                      Fechar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="relative">
                    <motion.div 
                      animate={{ scale: [1, 1.4, 1] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                      className="absolute inset-0 bg-red-500/20 rounded-full blur-md"
                    />
                    <div className="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-red-500/30">
                      <Mic className="w-8 h-8 animate-pulse" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-white text-lg font-bold">Ouvindo...</h3>
                    <p className="text-[#8E8E93] text-xs mt-1">Fale o nome do louvor, artista ou tema para pesquisar</p>
                  </div>
                  <button 
                    onClick={stopVoiceSearch}
                    className="px-6 py-2 bg-zinc-800 text-white text-xs font-semibold rounded-full hover:bg-zinc-700 transition-all active:scale-95"
                  >
                    Cancelar
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
