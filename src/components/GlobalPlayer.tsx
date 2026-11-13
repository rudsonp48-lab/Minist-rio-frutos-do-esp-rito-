import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePlayer } from '../lib/PlayerContext';
import { ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal, Shuffle, Pause, Play, SkipBack, SkipForward, Repeat, Volume1, Volume2, Cast, List, ListVideo, X, Heart, Mic2, Music2 } from 'lucide-react';
import YouTube from 'react-youtube';
import { useTheme } from '../lib/ThemeContext';

export default function GlobalPlayer() {
  const { themeColor } = useTheme();
  const {
    selectedVideo, setSelectedVideo,
    playlist, setPlaylist,
    playing, setPlaying,
    volume, setVolume,
    played, setPlayed,
    duration, setDuration,
    isMuted, setIsMuted,
    playerRef,
    isMinimized, setIsMinimized,
    addToPlaylist, playNext, playPrevious, seekTo,
    shuffleMode, setShuffleMode, repeatMode, setRepeatMode,
    likedSongs, toggleLike
  } = usePlayer();

  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [isDockedSide, setIsDockedSide] = useState<boolean>(() => {
    try {
      return localStorage.getItem('global_player_docked_side') === 'true';
    } catch {
      return false;
    }
  });
  const toggleDockedSide = (dock: boolean) => {
    setIsDockedSide(dock);
    try {
      localStorage.setItem('global_player_docked_side', String(dock));
    } catch {}
  };
  const [sidePos, setSidePos] = useState<{ yPct: number; side: 'left' | 'right' }>(() => {
    try {
      const saved = localStorage.getItem('global_player_side_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.yPct === 'number' && (parsed.side === 'left' || parsed.side === 'right')) {
          return { yPct: Math.min(88, Math.max(12, parsed.yPct)), side: parsed.side };
        }
      }
    } catch {}
    return { yPct: 58, side: 'right' };
  });
  const suppressSideClickRef = useRef(false);
  const handleSidePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const startX = e.clientX;
    const startY = e.clientY;
    const startYPct = sidePos.yPct;
    let currentSide = sidePos.side;
    let currentYPct = startYPct;
    let moved = false;
    suppressSideClickRef.current = false;

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!moved && Math.hypot(dx, dy) > 6) {
        moved = true;
        suppressSideClickRef.current = true;
      }
      if (!moved) return;

      const vh = window.innerHeight || 800;
      const vw = window.innerWidth || 400;
      currentYPct = Math.min(88, Math.max(12, startYPct + (dy / vh) * 100));
      if (ev.clientX < vw * 0.4) {
        currentSide = 'left';
      } else if (ev.clientX > vw * 0.6) {
        currentSide = 'right';
      }
      setSidePos({ yPct: currentYPct, side: currentSide });
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      if (moved) {
        try {
          localStorage.setItem('global_player_side_pos', JSON.stringify({ yPct: currentYPct, side: currentSide }));
        } catch {}
        setTimeout(() => {
          suppressSideClickRef.current = false;
        }, 80);
      }
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp, { once: true });
    window.addEventListener('pointercancel', onUp, { once: true });
  };
  const handleMiniTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
      try {
        if (playing) {
          playerRef.current.pauseVideo();
        } else {
          playerRef.current.playVideo();
        }
      } catch (err) {}
    }
    setPlaying(!playing);
  };
  const failedVideoIds = useRef<Set<string>>(new Set());
  const radioAudioRef = useRef<HTMLAudioElement | null>(null);
  const videoSlotRef = useRef<HTMLDivElement | null>(null);
  const [videoRect, setVideoRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  useEffect(() => {
    if (!selectedVideo || selectedVideo.id === 'radio-1' || isMinimized || showLyrics) {
      return;
    }
    const updateRect = () => {
      if (!videoSlotRef.current) return;
      const r = videoSlotRef.current.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        setVideoRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      }
    };
    updateRect();
    const t1 = setTimeout(updateRect, 120);
    const t2 = setTimeout(updateRect, 350);
    window.addEventListener('resize', updateRect);
    let ro: ResizeObserver | null = null;
    if (videoSlotRef.current && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(updateRect);
      ro.observe(videoSlotRef.current);
    }
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', updateRect);
      ro?.disconnect();
    };
  }, [selectedVideo?.id, isMinimized, showLyrics]);

  // Memoize YouTube player opts without window.location.href so route navigation
  // never changes opts and never causes react-youtube to destroy/recreate the player.
  const youtubeOpts = useMemo(
    () => ({
      width: '100%',
      height: '100%',
      playerVars: {
        autoplay: 1,
        controls: 0,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        showinfo: 0,
        enablejsapi: 1,
        origin: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    }),
    []
  );

  const handlePlayerError = async (e: any) => {
    console.warn("YouTube Player error:", e.data);
    if (selectedVideo && selectedVideo.id) {
      if (failedVideoIds.current.has(selectedVideo.id)) {
        console.warn("Alternative fallback video also failed, playing next...");
        playNext();
        return;
      }
      failedVideoIds.current.add(selectedVideo.id);

      const titleLower = selectedVideo.title.toLowerCase();
      
      let fallbackId = '';
      let fallbackTitle = selectedVideo.title;
      let fallbackAuthor = selectedVideo.author;

      if (titleLower.includes('poder do teu') || titleLower.includes('poder do teu amor')) {
        fallbackId = '_6S_Z_O-P1g';
        fallbackTitle = 'ALINE BARROS - O PODER DO TEU AMOR';
        fallbackAuthor = 'Aline Barros';
      } else if (titleLower.includes('me atraiu') || titleLower.includes('atraiu')) {
        fallbackId = 'tN8pA0L_q8c';
        fallbackTitle = 'GABRIELA ROCHA - ME ATRAIU (AO VIVO)';
        fallbackAuthor = 'Gabriela Rocha';
      } else if (titleLower.includes('lugar secreto')) {
        fallbackId = 'Y4NfX7C_m0U';
        fallbackTitle = 'GABRIELA ROCHA - LUGAR SECRETO';
        fallbackAuthor = 'Gabriela Rocha';
      } else if (titleLower.includes('podes morar') || titleLower.includes('morar aqui')) {
        fallbackId = 'U74H-q2YpB0'; // Highly playable and embeddable alternative ID for Podes Morar Aqui
        fallbackTitle = 'Podes Morar Aqui - Livres Para Adorar';
        fallbackAuthor = 'Livres Para Adorar';
      } else if (titleLower.includes('vem me buscar') || titleLower.includes('buscar')) {
        fallbackId = '9Yf-7K_rF0o';
        fallbackTitle = 'JEFERSON E SUELLEN - VEM ME BUSCAR';
        fallbackAuthor = 'Jeferson e Suellen';
      } else if (titleLower.includes('deus cuida de mim') || titleLower.includes('cuida de mim')) {
        fallbackId = 'I-M-oA5E440';
        fallbackTitle = 'KLEBER LUCAS E CAETANO VELOSO - DEUS CUIDA DE MIM';
        fallbackAuthor = 'Kleber Lucas';
      } else if (titleLower.includes('ninguém explica') || titleLower.includes('ninguem explica')) {
        fallbackId = 'ca84BfG_B_Y';
        fallbackTitle = 'PRETO NO BRANCO - NINGUÉM EXPLICA DEUS (FT. GABRIELA ROCHA)';
        fallbackAuthor = 'Preto no Branco';
      } else if (titleLower.includes('a casa é sua') || titleLower.includes('casa e sua')) {
        fallbackId = '2A8Z-gS5n10';
        fallbackTitle = 'CASA WORSHIP - A CASA É SUA';
        fallbackAuthor = 'Casa Worship';
      } else if (titleLower.includes('galileu')) {
        fallbackId = 'U94U7dM6I7M';
        fallbackTitle = 'FERNANDINHO - GALILEU';
        fallbackAuthor = 'Fernandinho';
      } else if (titleLower.includes('sou humano')) {
        fallbackId = 'h030oXyOfGg';
        fallbackTitle = 'BRUNA KARLA - SOU HUMANO';
        fallbackAuthor = 'Bruna Karla';
      } else if (titleLower.includes('advogado fiel')) {
        fallbackId = '_6p3M-M4K4Q';
        fallbackTitle = 'BRUNA KARLA - ADVOGADO FIEL';
        fallbackAuthor = 'Bruna Karla';
      } else if (titleLower.includes('ressuscita-me')) {
        fallbackId = '8y8Q1wBq8V8';
        fallbackTitle = 'ALINE BARROS - RESSUSCITA-ME (AO VIVO)';
        fallbackAuthor = 'Aline Barros';
      } else if (titleLower.includes('sonda-me')) {
        fallbackId = '483oU47M_E4';
        fallbackTitle = 'ALINE BARROS - SONDA-ME, USA-ME';
        fallbackAuthor = 'Aline Barros';
      } else if (titleLower.includes('grandes coisas')) {
        fallbackId = 'DqX81M8_08Q';
        fallbackTitle = 'FERNANDINHO - GRANDES COISAS (AO VIVO)';
        fallbackAuthor = 'Fernandinho';
      }

      if (fallbackId && fallbackId !== selectedVideo.id) {
        console.log(`Resolving unavailable video ${selectedVideo.id} -> ${fallbackId}`);
        setSelectedVideo({
          ...selectedVideo,
          id: fallbackId,
          title: fallbackTitle,
          author: fallbackAuthor,
          thumbnail: `https://i.ytimg.com/vi/${fallbackId}/hqdefault.jpg`
        });
        setPlaying(true);
        return;
      }

      // Dynamic automatic search fallback to find working version on YouTube
      try {
        console.log(`Searching dynamic alternative for unavailable video: ${selectedVideo.title}`);
        const cleanTitle = selectedVideo.title
          .replace(/\/\/.*$/, '') // remove anything after double slashes
          .replace(/\(.*\)/g, '') // remove parentheses text
          .replace(/\[.*\]/g, '') // remove bracketed text
          .trim();
        
        const response = await fetch(`/api/youtube-search?q=${encodeURIComponent(cleanTitle + " playback")}`);
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            const alternative = data.find((vid: any) => vid.id && !failedVideoIds.current.has(vid.id));
            if (alternative) {
              console.log(`Successfully resolved to dynamic alternative: ${alternative.id} (${alternative.title})`);
              setSelectedVideo({
                ...selectedVideo,
                id: alternative.id,
                title: alternative.title,
                author: alternative.author || selectedVideo.author,
                thumbnail: alternative.thumbnail || `https://i.ytimg.com/vi/${alternative.id}/hqdefault.jpg`
              });
              setPlaying(true);
              return;
            }
          }
        }
      } catch (err) {
        console.error("Dynamic YouTube search fallback failed:", err);
      }

      // If all fails, play the next track
      playNext();
    } else {
      playNext();
    }
  };

  useEffect(() => {
    let interval: any;
    if (playing && playerRef.current) {
      interval = setInterval(async () => {
        try {
          const currentTime = await playerRef.current.getCurrentTime();
          const dur = await playerRef.current.getDuration();
          if (currentTime) setPlayed(currentTime);
          if (dur) setDuration(dur);
        } catch (e) {}
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [playing, playerRef]);

  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
      if (playing) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    }
  }, [playing]);

  useEffect(() => {
    if (selectedVideo && 'mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: selectedVideo.title,
        artist: selectedVideo.author || 'Ministério Frutos do Espírito',
        album: 'Mídia e Mensagens',
        artwork: [
          { src: selectedVideo.thumbnail, sizes: '512x512', type: 'image/jpeg' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => setPlaying(true));
      navigator.mediaSession.setActionHandler('pause', () => setPlaying(false));
      navigator.mediaSession.setActionHandler('nexttrack', playNext);
      navigator.mediaSession.setActionHandler('previoustrack', playPrevious);
    }
  }, [selectedVideo, playNext, playPrevious, setPlaying]);

  // Wire WebRadio <audio> element once per radio selection without re-running on every render
  useEffect(() => {
    if (selectedVideo?.id !== 'radio-1' || !radioAudioRef.current) return;
    const audioEl = radioAudioRef.current;

    playerRef.current = {
      playVideo: () => audioEl.play().catch(() => setPlaying(false)),
      pauseVideo: () => audioEl.pause(),
      seekTo: (time: number) => { audioEl.currentTime = time; },
      getCurrentTime: () => audioEl.currentTime,
      getDuration: () => audioEl.duration || 0,
    };

    const handlePlay = () => setPlaying(true);
    const handlePause = () => setPlaying(false);
    audioEl.addEventListener('play', handlePlay);
    audioEl.addEventListener('pause', handlePause);

    if (playing) {
      audioEl.play().catch(() => setPlaying(false));
    }

    return () => {
      audioEl.removeEventListener('play', handlePlay);
      audioEl.removeEventListener('pause', handlePause);
    };
  }, [selectedVideo?.id, (selectedVideo as any)?.src]);

  const formatTime = (seconds: number) => {
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, '0');
    if (hh) return `${hh}:${mm.toString().padStart(2, '0')}:${ss}`;
    return `${mm}:${ss}`;
  };

  const removeFromPlaylist = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setPlaylist(prev => prev.filter((_, i) => i !== index));
  };
  
  // Dummy lyrics logic
  const DUMMY_LYRICS = [
    "Santo, Santo é o Senhor",
    "Poderoso e grande Eu Sou",
    "Toda a terra está cheia da sua glória",
    "Os anjos cantam em louvor",
    "A criação se prostra a ti",
    "Majestade e glória e poder",
    "(Instrumental)",
    "Tu és digno de receber",
    "Toda a honra e todo o louvor"
  ];

  return (
    <>
      <div
        style={
          selectedVideo && selectedVideo.id !== 'radio-1' && !isMinimized && !showLyrics && videoRect
            ? {
                top: `${videoRect.top}px`,
                left: `${videoRect.left}px`,
                width: `${videoRect.width}px`,
                height: `${videoRect.height}px`,
              }
            : undefined
        }
        className={
          selectedVideo && selectedVideo.id !== 'radio-1' && !isMinimized && !showLyrics
            ? "fixed top-[calc(max(20px,env(safe-area-inset-top))+64px)] left-1/2 -translate-x-1/2 w-full max-w-md h-[36vh] min-h-[210px] max-h-[340px] z-[105] bg-black overflow-hidden shadow-2xl transition-[opacity] duration-200"
            : "fixed top-0 left-0 w-[400px] max-w-[50vw] aspect-video opacity-[0.01] pointer-events-none z-[-1]"
        }
      >
        {selectedVideo && selectedVideo.id !== 'radio-1' && (
          <YouTube
            videoId={selectedVideo.id}
            opts={youtubeOpts}
            onReady={(e) => {
              playerRef.current = e.target;
              try {
                if (isMuted) {
                  e.target.mute();
                } else {
                  e.target.unMute();
                  e.target.setVolume(Math.round(volume * 100));
                }
                if (playing) {
                  e.target.playVideo();
                }
              } catch(err) {}
            }}
            onError={handlePlayerError}
            onStateChange={(e) => {
              if (e.data === YouTube.PlayerState.PLAYING) {
                if (!playing) setPlaying(true);
              } else if (e.data === YouTube.PlayerState.PAUSED) {
                if (playing) setPlaying(false);
              } else if (e.data === YouTube.PlayerState.ENDED) {
                playNext();
              }
            }}
            className="w-full h-full"
            iframeClassName="w-full h-full border-0"
          />
        )}
        {selectedVideo && selectedVideo.id === 'radio-1' && (
          <audio
            ref={radioAudioRef}
            src={(selectedVideo as any).src || 'https://stream.zeno.fm/8x934z3m8mzuv'}
            autoPlay={true}
          />
        )}
      </div>

      <AnimatePresence>
        {selectedVideo && !isMinimized && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed inset-0 z-[100] bg-black sm:max-w-md sm:mx-auto flex flex-col pt-[max(20px,env(safe-area-inset-top))] overflow-hidden`}
          >
            {/* Ambient Blurred Background from Thumbnail */}
            <div className="absolute inset-0 z-0 overflow-hidden opacity-60">
              <img src={selectedVideo.thumbnail || undefined} className={`w-full h-full object-cover scale-150 saturate-[1.5] transition-all duration-[3s] ${showLyrics ? 'blur-[100px] scale-[2] rotate-12' : 'blur-[80px]'}`} alt="bg" />
              <div className="absolute inset-0 bg-black/40 mix-blend-overlay"></div>
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80"></div>
            </div>

            {/* Navigation */}
            <div className="relative z-10 flex px-6 pt-3 pb-3 items-center justify-between shrink-0">
              <button onClick={() => setIsMinimized(true)} className="w-10 h-10 flex items-center justify-center p-2 -ml-2 text-white/90 hover:text-white active:scale-90 transition-all drop-shadow-md">
                <ChevronDown className="w-8 h-8" />
              </button>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-white/60 uppercase tracking-[0.25em] font-sans font-bold drop-shadow-md">{showLyrics ? 'Modo Imersivo' : 'Tocando Agora'}</span>
                <span className="text-xs text-white/90 font-medium font-sans mt-0.5 drop-shadow-md">Frutos do Espírito Mídia</span>
              </div>
              <button 
                onClick={() => alert("Opções do player em desenvolvimento!")}
                className="w-10 h-10 flex items-center justify-center p-2 -mr-2 text-white/90 hover:text-white active:scale-90 transition-all drop-shadow-md"
              >
                <MoreHorizontal className="w-6 h-6" />
              </button>
            </div>

            {/* Main Content Area: Video / Album OR Lyrics */}
            <div className={`relative z-10 flex-none flex items-center justify-center transition-all duration-500 ${showLyrics || selectedVideo.id === 'radio-1' ? 'px-8 pb-6' : 'px-0 pb-5'}`} style={{ height: showLyrics ? '45vh' : 'auto' }}>
               <AnimatePresence mode="wait">
                 {showLyrics ? (
                   <motion.div 
                     key="lyrics"
                     initial={{ opacity: 0, scale: 0.95 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.95 }}
                     className="w-full h-full flex flex-col items-center justify-center space-y-6 overflow-hidden relative"
                   >
                     {/* Floating Lyrics Effect - Sync to playback time visually if needed */}
                     <div className="absolute inset-0 flex flex-col justify-center gap-6 py-12 mask-image-fade" style={{ transform: `translateY(${-((played / (duration || 1)) * 300 - 150)}px)`, transition: 'transform 1s linear' }}>
                       {DUMMY_LYRICS.map((line, i) => (
                         <div key={i} className={`text-center transition-all duration-700 ${playing ? 'scale-100' : 'scale-95 opacity-80'}`}>
                           <p className={`text-xl sm:text-2xl font-bold font-display drop-shadow-lg leading-relaxed ${i === Math.floor((played / (duration || 1)) * DUMMY_LYRICS.length) ? 'text-white scale-110 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]' : 'text-white/40'}`}>
                             {line}
                           </p>
                         </div>
                       ))}
                     </div>
                   </motion.div>
                 ) : (
                   <motion.div 
                     key="album"
                     initial={{ opacity: 0, scale: 0.9 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.9 }}
                     className="w-full"
                   >
                     {selectedVideo.id !== 'radio-1' ? (
                       <div
                         ref={videoSlotRef}
                         className="w-full h-[36vh] min-h-[210px] max-h-[340px] bg-black/40 relative"
                       >
                           {/* The YouTube video is rendered directly over this slot via fixed positioning */}
                       </div>
                     ) : (
                       <div className="w-full aspect-[4/5] sm:aspect-square relative rounded-[2rem] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.6)] border border-white/10">
                         <img src={selectedVideo.thumbnail || undefined} alt={selectedVideo.title} className="w-full h-full object-cover" />
                       </div>
                     )}
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>

            {/* Song Info */}
            <div className="relative z-10 px-8 pb-6 shrink-0 flex flex-col flex-1">
              <div className="flex justify-between items-start mb-8">
                <div className="flex-1 min-w-0 pr-4 flex flex-col justify-center">
                  <motion.h1 
                    key={selectedVideo.title}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-[26px] sm:text-[30px] leading-tight text-white tracking-tight line-clamp-2 font-sans font-bold drop-shadow-lg"
                  >
                    {selectedVideo.title}
                  </motion.h1>
                  <motion.p 
                    key={selectedVideo.author}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-lg text-white/70 truncate mt-1.5 font-sans font-medium drop-shadow-md"
                  >
                    {selectedVideo.author || 'Frutos do Espírito'}
                  </motion.p>
                </div>
                <button 
                  className="p-3 active:scale-90 transition-transform -mr-3" 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    toggleLike(selectedVideo);
                  }}
                >
                  <Heart className={`w-8 h-8 drop-shadow-md transition-colors duration-300 ${likedSongs.find(v => v.id === selectedVideo.id) ? 'text-red-500 fill-red-500 scale-110' : 'text-white/80'}`} />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="w-full mb-10">
                <div 
                  className="w-full h-2 bg-white/20 rounded-full mb-3.5 cursor-pointer relative overflow-hidden backdrop-blur-md"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const percentage = x / rect.width;
                    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
                      playerRef.current.seekTo(percentage * duration, true);
                      setPlayed(percentage * duration);
                    }
                  }}
                >
                  <div className="h-full bg-white rounded-full relative shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-300 ease-out" style={{ width: `${(played / (duration || 1)) * 100}%` }}>
                  </div>
                </div>
                <div className="flex justify-between text-[11px] text-white/70 font-semibold font-mono tracking-wider drop-shadow-md">
                  <span>{formatTime(played)}</span>
                  <span>-{formatTime(duration - played > 0 ? duration - played : 0)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex gap-4 sm:gap-6 items-center justify-center mb-8">
                <button 
                  onClick={() => setShuffleMode(!shuffleMode)}
                  className={`active:scale-90 transition-all p-3 ${shuffleMode ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'text-white/50 hover:text-white/80'}`}
                >
                  <Shuffle className="w-6 h-6" />
                </button>
                
                <button 
                  onClick={playPrevious} 
                  className="text-white active:scale-90 transition-all p-3 drop-shadow-lg"
                >
                  <SkipBack className="w-10 h-10 fill-current" />
                </button>
                
                <div className="relative group mx-2">
                  <div className="absolute inset-0 bg-white/20 blur-xl opacity-0 group-active:opacity-100 transition-opacity rounded-full"></div>
                  <button 
                    onClick={() => {
                      if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
                        try {
                          if (playing) {
                            playerRef.current.pauseVideo();
                          } else {
                            playerRef.current.playVideo();
                          }
                        } catch (e) {}
                      }
                      setPlaying(!playing);
                    }}
                    className="relative w-[80px] h-[80px] rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white active:scale-[0.92] transition-all shadow-xl hover:bg-white/20"
                  >
                    {playing ? <Pause className="w-9 h-9 fill-current" /> : <Play className="w-9 h-9 fill-current ml-1.5" />}
                  </button>
                </div>
                
                <button onClick={playNext} className="text-white active:scale-90 transition-all p-3 drop-shadow-lg">
                  <SkipForward className="w-10 h-10 fill-current" />
                </button>
                
                <button 
                  onClick={() => setRepeatMode(!repeatMode)}
                  className={`active:scale-90 transition-all p-3 ${repeatMode ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'text-white/50 hover:text-white/80'}`}
                >
                  <Repeat className="w-6 h-6" />
                </button>
              </div>

              <div className="mt-auto pb-4 space-y-8">
                <div className="flex items-center justify-between px-2">
                  <button 
                    onClick={() => setShowLyrics(!showLyrics)}
                    className={`flex flex-col items-center gap-1.5 p-2 active:scale-95 transition-all ${showLyrics ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
                  >
                    <div className={`p-2 rounded-full ${showLyrics ? 'bg-white text-black' : ''} transition-colors`}>
                      <Mic2 className="w-5 h-5 drop-shadow-md" />
                    </div>
                  </button>
                  <button 
                    onClick={() => alert("Procurando dispositivos para transmitir (Chromecast/AirPlay)...")}
                    className="flex flex-col items-center gap-1.5 p-2 active:scale-95 transition-all text-white/50 hover:text-white/80"
                  >
                    <div className="p-2 rounded-full transition-colors">
                      <Volume2 className="w-5 h-5 drop-shadow-md" />
                    </div>
                  </button>
                  <button onClick={() => setShowPlaylist(true)} className="flex flex-col items-center gap-1.5 p-2 relative active:scale-95 transition-all text-white/50 hover:text-white/80">
                    <div className="p-2 rounded-full transition-colors">
                      <List className="w-5 h-5 drop-shadow-md" />
                    </div>
                    {playlist.length > 0 && (
                       <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#FF2D55] rounded-full border-2 border-black/50 drop-shadow-sm" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedVideo && isMinimized && !isDockedSide && (
          <motion.div
            key="mini-bar"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 80 }}
            className="fixed bottom-[84px] md:bottom-24 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-sm bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex items-center gap-3 z-[150] shadow-2xl cursor-pointer"
            onClick={() => setIsMinimized(false)}
          >
            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 relative">
               <img src={selectedVideo.thumbnail || undefined} className="w-full h-full object-cover" alt="" />
               <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
                 <div className="h-full bg-[var(--theme-color)]" style={{ width: `${(played / (duration || 1)) * 100}%` }} />
               </div>
            </div>
            <div className="flex-1 min-w-0 pr-1">
               <p className="text-white font-semibold text-sm truncate">{selectedVideo.title}</p>
               <p className="text-white/60 text-xs truncate">{selectedVideo.author || 'Mídia'}</p>
            </div>
            <div className="flex items-center gap-1 pr-1">
               <button
                  onClick={handleMiniTogglePlay}
                  aria-label={playing ? 'Pausar música' : 'Tocar música'}
                  className="w-9 h-9 flex items-center justify-center text-white bg-white/10 rounded-full hover:bg-white/20 active:scale-95 transition-all"
               >
                 {playing ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
               </button>
               <button
                  onClick={(e) => { e.stopPropagation(); toggleDockedSide(true); }}
                  title="Minimizar para a lateral"
                  aria-label="Minimizar player para a lateral"
                  className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-full active:scale-95 transition-all"
               >
                 <ChevronRight className="w-5 h-5" />
               </button>
               <button
                  onClick={(e) => { e.stopPropagation(); setSelectedVideo(null); }}
                  aria-label="Fechar player"
                  className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white"
               >
                 <X className="w-5 h-5" />
               </button>
            </div>
          </motion.div>
        )}

        {selectedVideo && isMinimized && isDockedSide && (
          <motion.div
            key="side-dock"
            initial={{ opacity: 0, x: sidePos.side === 'right' ? 40 : -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: sidePos.side === 'right' ? 40 : -40 }}
            onPointerDown={handleSidePointerDown}
            onClick={() => {
              if (suppressSideClickRef.current) return;
              toggleDockedSide(false);
            }}
            style={{ top: `${sidePos.yPct}%` }}
            title={`${selectedVideo.title} — Arraste para mover ou toque para expandir`}
            className={`fixed -translate-y-1/2 z-[150] bg-zinc-900/95 backdrop-blur-xl border border-white/15 py-2.5 flex flex-col items-center gap-2 shadow-2xl cursor-grab active:cursor-grabbing touch-none select-none overflow-hidden ${
              sidePos.side === 'right'
                ? 'right-0 rounded-l-2xl border-r-0 pl-2 pr-2.5'
                : 'left-0 rounded-r-2xl border-l-0 pr-2 pl-2.5'
            }`}
          >
            {/* Barrinha vertical de progresso na borda */}
            <div className={`absolute inset-y-0 w-1 bg-white/10 ${sidePos.side === 'right' ? 'right-0' : 'left-0'}`}>
              <div
                className="w-full bg-[var(--theme-color)] transition-all duration-300"
                style={{ height: `${Math.min(100, Math.max(4, (played / (duration || 1)) * 100))}%` }}
              />
            </div>

            {sidePos.side === 'right' ? (
              <ChevronLeft className="w-4 h-4 text-white/70" />
            ) : (
              <ChevronRight className="w-4 h-4 text-white/70" />
            )}

            <div className={`w-7 h-7 rounded-full overflow-hidden shrink-0 ${playing ? 'ring-2 ring-[var(--theme-color)]' : 'opacity-80'}`}>
              {selectedVideo.thumbnail ? (
                <img src={selectedVideo.thumbnail} className="w-full h-full object-cover pointer-events-none" alt="" />
              ) : (
                <div className="w-full h-full bg-white/10 flex items-center justify-center">
                  <Music2 className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </div>

            <button
              onClick={(e) => {
                if (suppressSideClickRef.current) {
                  e.stopPropagation();
                  return;
                }
                handleMiniTogglePlay(e);
              }}
              aria-label={playing ? 'Pausar música' : 'Tocar música'}
              className="w-7 h-7 flex items-center justify-center text-white bg-white/10 rounded-full hover:bg-white/20 active:scale-95 transition-all"
            >
              {playing ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Playlist Drawer */}
      <AnimatePresence>
        {showPlaylist && (
          <PlaylistDrawer 
            onClose={() => setShowPlaylist(false)} 
            playlist={playlist} 
            likedSongs={likedSongs} 
            removeFromPlaylist={removeFromPlaylist}
            toggleLike={toggleLike}
            addToPlaylist={addToPlaylist}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function PlaylistDrawer({ onClose, playlist, likedSongs, removeFromPlaylist, toggleLike, addToPlaylist }: any) {
  const [activeTab, setActiveTab] = useState<'queue'|'liked'>('queue');
  
  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 z-[200] backdrop-blur-sm"
      />
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="fixed inset-x-0 bottom-0 z-[210] bg-white dark:bg-[#1C1C1E] rounded-t-[2rem] h-[80vh] flex flex-col ios-shadow"
      >
        <div className="flex flex-col border-b border-black/5 dark:border-white/5 shrink-0 px-6 pt-6 pb-2">
          <div className="flex items-center justify-between mb-4">
             <h3 className="font-bold text-2xl dark:text-white">Músicas</h3>
             <button onClick={onClose} className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
               <X className="w-5 h-5 text-[#8E8E93]" />
             </button>
          </div>
          <div className="flex gap-4">
             <button onClick={() => setActiveTab('queue')} className={`pb-2 font-bold transition-colors ${activeTab === 'queue' ? 'text-[var(--theme-color)] border-b-2 border-[var(--theme-color)]' : 'text-[#8E8E93]'}`}>
                Fila ({playlist.length})
             </button>
             <button onClick={() => setActiveTab('liked')} className={`pb-2 font-bold transition-colors ${activeTab === 'liked' ? 'text-[var(--theme-color)] border-b-2 border-[var(--theme-color)]' : 'text-[#8E8E93]'}`}>
                Minha Playlist ({likedSongs.length})
             </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'queue' ? (
            playlist.length === 0 ? (
              <div className="text-center py-10 opacity-50 dark:text-white">
                <ListVideo className="w-12 h-12 mx-auto mb-4" />
                <p className="font-medium">Nenhuma mídia na fila.</p>
              </div>
            ) : (
              playlist.map((video: any, idx: number) => (
                <div key={idx} className="flex items-center gap-4 group">
                  <span className="text-[#8E8E93] text-xs font-bold w-4 text-right shrink-0">{idx + 1}</span>
                  <div className="w-16 h-12 rounded-lg overflow-hidden shrink-0 bg-black/10">
                    <img src={video.thumbnail} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm truncate dark:text-white">{video.title}</h4>
                  </div>
                  <button 
                    onClick={(e) => removeFromPlaylist(idx, e)}
                    className="w-10 h-10 flex items-center justify-center text-[#8E8E93] group-hover:text-[#FF3B30] active:scale-95 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))
            )
          ) : (
            likedSongs.length === 0 ? (
              <div className="text-center py-10 opacity-50 dark:text-white">
                <Heart className="w-12 h-12 mx-auto mb-4" />
                <p className="font-medium">Não há músicas salvas.</p>
              </div>
            ) : (
              likedSongs.map((video: any, idx: number) => (
                <div key={video.id} className="flex items-center gap-4 group">
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-black/10 relative">
                    <img src={video.thumbnail} className="w-full h-full object-cover" />
                    <div onClick={() => addToPlaylist(video)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                      <Play className="w-6 h-6 fill-white text-white ml-0.5" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm truncate dark:text-white">{video.title}</h4>
                    <p className="text-xs text-[#8E8E93] truncate">{video.author}</p>
                  </div>
                  <button 
                    onClick={() => toggleLike(video)}
                    className="w-10 h-10 flex items-center justify-center active:scale-95 transition-colors"
                  >
                    <Heart className="w-6 h-6 text-red-500 fill-red-500" />
                  </button>
                </div>
              ))
            )
          )}
        </div>
      </motion.div>
    </>
  );
}
