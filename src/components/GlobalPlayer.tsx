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
    addToPlaylist, playNext, playPrevious, seekTo,
    shuffleMode, setShuffleMode, repeatMode, setRepeatMode,
    likedSongs, toggleLike
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
        {selectedVideo && selectedVideo.id !== 'radio-1' && (
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
                try { e.target.playVideo(); } catch(err) {}
              }
            }}
            onStateChange={(e) => {
              if (e.data === YouTube.PlayerState.PLAYING) {
                if (!playing) setPlaying(true);
              } else if (e.data === YouTube.PlayerState.PAUSED || e.data === YouTube.PlayerState.UNSTARTED || e.data === YouTube.PlayerState.CUED) {
                if (playing) setPlaying(false);
              } else if (e.data === YouTube.PlayerState.ENDED) {
                playNext();
              }
            }}
            className="w-full h-full"
            iframeClassName="w-full h-full"
          />
        )}
        {selectedVideo && selectedVideo.id === 'radio-1' && (
          <audio
            ref={(audioEl) => {
               if (audioEl) {
                 playerRef.current = {
                   playVideo: () => audioEl.play().catch(() => setPlaying(false)),
                   pauseVideo: () => audioEl.pause(),
                   seekTo: (time: number) => { audioEl.currentTime = time; },
                   getCurrentTime: () => audioEl.currentTime,
                   getDuration: () => audioEl.duration || 0,
                 };
                 if (playing) audioEl.play().catch(() => setPlaying(false));
                 
                 audioEl.onplay = () => setPlaying(true);
                 audioEl.onpause = () => setPlaying(false);
               }
            }}
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
              <img src={selectedVideo.thumbnail} className="w-full h-full object-cover blur-[80px] scale-150 saturate-[1.5]" alt="bg" />
              <div className="absolute inset-0 bg-black/40 mix-blend-overlay"></div>
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80"></div>
            </div>

            {/* Navigation */}
            <div className="relative z-10 flex px-6 pt-4 pb-6 items-center justify-between shrink-0">
              <button onClick={() => setIsMinimized(true)} className="w-10 h-10 flex items-center justify-center p-2 -ml-2 text-white/90 hover:text-white active:scale-90 transition-all drop-shadow-md">
                <ChevronDown className="w-8 h-8" />
              </button>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-white/60 uppercase tracking-[0.25em] font-sans font-bold drop-shadow-md">Tocando Agora</span>
                <span className="text-xs text-white/90 font-medium font-sans mt-0.5 drop-shadow-md">Ecclesia Mídia</span>
              </div>
              <button 
                onClick={() => alert("Opções do player em desenvolvimento!")}
                className="w-10 h-10 flex items-center justify-center p-2 -mr-2 text-white/90 hover:text-white active:scale-90 transition-all drop-shadow-md"
              >
                <MoreHorizontal className="w-6 h-6" />
              </button>
            </div>

            {/* Album/Video Container */}
            <div className="relative z-10 px-8 pb-8 flex-none flex items-center justify-center">
               {selectedVideo.type === 'video' || selectedVideo.type === 'live' ? (
                 <div className="w-full aspect-video bg-black/20 shadow-2xl rounded-2xl relative border border-white/10 backdrop-blur-md">
                     {/* The video is rendered above this via fixed positioning */}
                 </div>
               ) : (
                 <div className="w-full aspect-[4/5] sm:aspect-square relative rounded-[2rem] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.6)] border border-white/10">
                   <img src={selectedVideo.thumbnail} alt={selectedVideo.title} className="w-full h-full object-cover" />
                 </div>
               )}
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
                    {selectedVideo.author || 'Ecclesia Stream'}
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
                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => alert("Procurando dispositivos para transmitir (Chromecast/AirPlay)...")}
                    className="flex items-center gap-2 p-3 -ml-3 active:opacity-50 transition-opacity"
                  >
                    <Volume2 className="w-5 h-5 text-white/80 hover:text-white drop-shadow-md" />
                  </button>
                  <button onClick={() => setShowPlaylist(true)} className="p-3 -mr-3 relative active:opacity-50 transition-opacity">
                    <List className="w-6 h-6 text-white/80 drop-shadow-md" />
                    {playlist.length > 0 && (
                       <span className="absolute top-2.5 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-black/50 drop-shadow-sm" />
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
