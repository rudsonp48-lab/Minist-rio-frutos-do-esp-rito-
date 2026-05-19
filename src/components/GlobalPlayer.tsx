import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePlayer } from '../lib/PlayerContext';
import { ChevronDown, MoreHorizontal, Shuffle, Pause, Play, SkipBack, SkipForward, Repeat, Volume1, Volume2, Cast, List, ListVideo, X, Heart } from 'lucide-react';
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
    addToPlaylist, playNext, playPrevious, seekTo
  } = usePlayer();

  const [showPlaylist, setShowPlaylist] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);

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
        artist: selectedVideo.author || 'Ecclesia App',
        album: 'Mídia e Mensagens',
        artwork: [
          { src: selectedVideo.thumbnail, sizes: '512x512', type: 'image/jpeg' }
        ]
      });

      navigator.mediaSession.setActionHandler('nexttrack', playNext);
      navigator.mediaSession.setActionHandler('previoustrack', playPrevious);
    }
  }, [selectedVideo, playNext, playPrevious]);

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

  return (
    <>
      <div 
        className={
          selectedVideo && !isMinimized && (selectedVideo.type === 'video' || selectedVideo.type === 'live')
            ? "fixed top-[calc(max(20px,env(safe-area-inset-top))+80px)] sm:top-[calc(max(20px,env(safe-area-inset-top))+80px)] left-1/2 -translate-x-1/2 w-[calc(100%-4rem)] max-w-[384px] aspect-video z-[105] rounded-2xl overflow-hidden shadow-2xl"
            : "fixed top-0 left-0 w-[400px] max-w-[50vw] aspect-video opacity-[0.01] pointer-events-none z-[-1]"
        }
      >
        {selectedVideo && (
          <YouTube
            videoId={selectedVideo.id}
            opts={{
              width: '100%',
              height: '100%',
              playerVars: {
                autoplay: 1,
                controls: 0,
                modestbranding: 1,
                playsinline: 1,
                rel: 0,
                showinfo: 0,
              },
            }}
            onReady={(e) => {
              playerRef.current = e.target;
              if (playing) {
                e.target.playVideo();
              }
            }}
            onStateChange={(e) => {
              if (e.data === YouTube.PlayerState.PLAYING) {
                setPlaying(true);
              } else if (e.data === YouTube.PlayerState.PAUSED) {
                setPlaying(false);
              } else if (e.data === YouTube.PlayerState.ENDED) {
                playNext();
              }
            }}
            className="w-full h-full"
            iframeClassName="w-full h-full"
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
            className={`fixed inset-0 z-[100] bg-black sm:max-w-md sm:mx-auto flex flex-col pt-[max(20px,env(safe-area-inset-top))]`}
          >
            {/* Navigation */}
            <div className="flex px-6 pt-4 pb-6 items-center justify-between shrink-0">
              <button onClick={() => setIsMinimized(true)} className="w-10 h-10 flex items-center justify-center p-2 -ml-2 text-white/80 hover:text-white active:scale-90 transition-all">
                <ChevronDown className="w-8 h-8" />
              </button>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-white/60 uppercase tracking-[0.2em] font-sans font-bold">Tocando Agora</span>
                <span className="text-xs text-white font-medium font-sans mt-0.5">Sua Playlist</span>
              </div>
              <button className="w-10 h-10 flex items-center justify-center p-2 -mr-2 text-white/80 hover:text-white active:scale-90 transition-all">
                <MoreHorizontal className="w-6 h-6" />
              </button>
            </div>

            {/* Album/Video Container */}
            <div className="px-8 pb-8 flex-none flex items-center justify-center">
               {selectedVideo.type === 'video' || selectedVideo.type === 'live' ? (
                 <div className="w-full aspect-video bg-zinc-900 shadow-2xl rounded-2xl relative">
                     {/* The video is rendered above this via fixed positioning */}
                 </div>
               ) : (
                 <div className="w-full aspect-square relative rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                   <img src={selectedVideo.thumbnail} alt={selectedVideo.title} className="w-full h-full object-cover" />
                 </div>
               )}
            </div>

            {/* Song Info */}
            <div className="px-8 pb-6 shrink-0 flex flex-col flex-1">
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1 min-w-0 pr-4">
                  <h1 className="text-[28px] leading-tight text-white tracking-tight truncate font-sans font-bold">{selectedVideo.title}</h1>
                  <p className="text-xl text-white/60 truncate mt-1 font-sans">{selectedVideo.author || 'Ecclesia Stream'}</p>
                </div>
                <button 
                  className="p-2 active:scale-90 transition-transform -mr-2" 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (!playlist.find(v => v.id === selectedVideo.id)) {
                      addToPlaylist(selectedVideo); 
                    } else {
                      setPlaylist(prev => prev.filter(v => v.id !== selectedVideo.id));
                    }
                  }}
                >
                  <Heart className={`w-7 h-7 ${playlist.find(v => v.id === selectedVideo.id) ? 'text-[#FF2D55] fill-[#FF2D55]' : 'text-white/70'}`} />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="w-full mb-8">
                <div 
                  className="w-full h-1.5 bg-white/20 rounded-full mb-3 cursor-pointer relative"
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
                  <div className="h-full bg-[var(--theme-color)] rounded-full relative" style={{ width: `${(played / (duration || 1)) * 100}%` }}>
                    <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow" />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-white/50 font-medium font-sans tracking-wide">
                  <span>{formatTime(played)}</span>
                  <span>-{formatTime(duration - played > 0 ? duration - played : 0)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex gap-6 items-center justify-center mb-8">
                <button className="text-white/60 hover:text-white active:scale-90 transition-all p-2">
                  <Shuffle className="w-6 h-6" />
                </button>
                
                <button 
                  onClick={playPrevious} 
                  className="text-white active:scale-90 transition-all p-2"
                >
                  <SkipBack className="w-10 h-10 fill-current" />
                </button>
                
                <div className="relative group">
                  <div className="absolute inset-0 bg-[#0084ff] blur-2xl opacity-40 group-active:opacity-20 transition-opacity rounded-full"></div>
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
                    className="relative w-[72px] h-[72px] rounded-full bg-white flex items-center justify-center text-black active:scale-[0.92] transition-all shadow-xl"
                  >
                    {playing ? <Pause className="w-8 h-8 fill-current translate-x-px" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                  </button>
                </div>
                
                <button onClick={playNext} className="text-white active:scale-90 transition-all p-2">
                  <SkipForward className="w-10 h-10 fill-current" />
                </button>
                
                <button className="text-white/60 hover:text-white active:scale-90 transition-all p-2">
                  <Repeat className="w-6 h-6" />
                </button>
              </div>

              <div className="mt-auto pb-8 space-y-8">
                <div className="flex items-center justify-between">
                  <button className="flex items-center gap-2 p-2 -ml-2 active:opacity-50 transition-opacity">
                    <Cast className="w-5 h-5 text-white/80" />
                  </button>
                  <button onClick={() => setShowPlaylist(true)} className="p-2 -mr-2 relative active:opacity-50 transition-opacity">
                    <List className="w-6 h-6 text-white/80" />
                    {playlist.length > 0 && (
                       <span className="absolute top-1.5 right-1 w-2.5 h-2.5 bg-[#FF3B30] rounded-full border-2 border-black" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedVideo && isMinimized && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-[84px] md:bottom-24 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-sm bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex items-center gap-3 z-[150] shadow-2xl cursor-pointer"
            onClick={() => setIsMinimized(false)}
          >
            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 relative">
               <img src={selectedVideo.thumbnail} className="w-full h-full object-cover" alt="" />
               <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
                 <div className="h-full bg-[var(--theme-color)]" style={{ width: `${(played / (duration || 1)) * 100}%` }} />
               </div>
            </div>
            <div className="flex-1 min-w-0 pr-2">
               <p className="text-white font-semibold text-sm truncate">{selectedVideo.title}</p>
               <p className="text-white/60 text-xs truncate">{selectedVideo.author || 'Mídia'}</p>
            </div>
            <div className="flex items-center gap-2 pr-2">
               <button 
                  onClick={(e) => { 
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
                  }}
                  className="w-10 h-10 flex items-center justify-center text-white bg-white/10 rounded-full hover:bg-white/20 active:scale-95 transition-all"
               >
                 {playing ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
               </button>
               <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedVideo(null); }}
                  className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white"
               >
                 <X className="w-5 h-5" />
               </button>
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
              className="fixed inset-0 bg-black/60 z-[200] backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed inset-x-0 bottom-0 z-[210] bg-white dark:bg-[#1C1C1E] rounded-t-[2rem] max-h-[80vh] flex flex-col ios-shadow"
            >
              <div className="flex items-center justify-between p-6 border-b border-black/5 dark:border-white/5 shrink-0">
                <div>
                  <h3 className="font-bold text-xl dark:text-white">Fila de Reprodução</h3>
                  <p className="text-xs text-[#8E8E93] mt-1">{playlist.length} faixas na sequência</p>
                </div>
                <button onClick={() => setShowPlaylist(false)} className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
                  <X className="w-5 h-5 text-[#8E8E93]" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {playlist.length === 0 ? (
                  <div className="text-center py-10 opacity-50 dark:text-white">
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
                        <h4 className="font-bold text-sm truncate dark:text-white">{video.title}</h4>
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
    </>
  );
}
