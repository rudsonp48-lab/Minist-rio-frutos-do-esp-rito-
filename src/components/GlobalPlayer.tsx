import { motion, AnimatePresence } from 'motion/react';
import ReactPlayer from 'react-player';
import { Play, Pause, X, SkipForward, ChevronDown, Heart, Shuffle, Repeat, ChevronUp } from 'lucide-react';
import { usePlayer } from '../lib/PlayerContext';
import { useState, useEffect } from 'react';

export default function GlobalPlayer() {
  const ReactPlayerAny = ReactPlayer as any;
  const { 
    selectedVideo, 
    setSelectedVideo,
    isPlaying, 
    setIsPlaying, 
    playedSeconds, 
    setPlayedSeconds, 
    duration, 
    setDuration, 
    isFullscreen, 
    setIsFullscreen,
    playNext,
    playerRef,
    playlist,
    addToPlaylist,
    removeFromPlaylist
  } = usePlayer();

  if (!selectedVideo) return null;

  const handleClose = () => {
    setIsPlaying(false);
    setTimeout(() => {
      setSelectedVideo(null);
    }, 0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const seekTime = percentage * duration;
    
    playerRef.current.seekTo(seekTime, 'seconds');
    setPlayedSeconds(seekTime);
  };

  return (
    <>
      {/* Background Player Area */}
      <div 
        className={`fixed transition-all duration-700 z-[1600] overflow-hidden bg-black ${isFullscreen ? 'inset-0 flex items-center justify-center' : 'w-1 h-1 top-0 left-4 opacity-[0.01] pointer-events-none'}`}
      >
        {selectedVideo && (
          <ReactPlayerAny
            key={selectedVideo.id}
            ref={playerRef}
            url={`https://www.youtube.com/watch?v=${selectedVideo.id}`}
            playing={isPlaying}
            volume={1}
            muted={false}
            onReady={(player: any) => {
              if (player && typeof player.getDuration === 'function') {
                setDuration(player.getDuration() || 0);
              }
            }}
            onEnded={playNext}
            onProgress={(state: any) => {
              setPlayedSeconds(state.playedSeconds);
              // Update duration in progress if it wasn't captured in onReady
              if (playerRef.current && (!duration || duration === 0)) {
                const d = playerRef.current.getDuration();
                if (d) setDuration(d);
              }
            }}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onError={(e: any) => console.error('Player Error:', e)}
            width="100%"
            height="100%"
            config={{
              youtube: {
                playerVars: { 
                  modestbranding: 1, 
                  playsinline: 1, 
                  rel: 0, 
                  controls: 1,
                  autoplay: 1,
                  enablejsapi: 1
                }
              }
            } as any}
          />
        )}
      </div>

      <AnimatePresence>
        {!isFullscreen ? (
          /* Mini Player */
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            onClick={() => setIsFullscreen(true)}
            className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom,32px)+12px)] left-4 right-4 z-[1100] bg-[#1C1C1E] border border-white/10 rounded-2xl p-2 flex items-center gap-3 shadow-2xl cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-black/40">
              <img src={selectedVideo.thumbnail} className="w-full h-full object-cover" alt={selectedVideo.title} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[13px] font-bold text-white truncate">{selectedVideo.title}</h4>
              <p className="text-[11px] text-gray-400 truncate">Tocando agora</p>
            </div>
            <div className="flex items-center gap-1 shrink-0 px-2" onClick={e => e.stopPropagation()}>
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 flex items-center justify-center text-white"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>
              <button 
                onClick={handleClose}
                className="w-10 h-10 flex items-center justify-center text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Progress Bar (Mini) */}
            <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-white/10 rounded-full overflow-hidden">
               <div 
                 className="h-full bg-white transition-all duration-300" 
                 style={{ width: `${(playedSeconds / (duration || 1)) * 100}%` }}
               />
            </div>
          </motion.div>
        ) : (
          /* Fullscreen Player UI Overlay */
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-[1700] bg-transparent flex flex-col pt-[max(20px,env(safe-area-inset-top))]"
          >
            {/* Header controls for Fullscreen */}
            <div className="absolute top-0 left-0 right-0 z-[10] flex px-6 pt-4 pb-6 items-center justify-between shrink-0 bg-gradient-to-b from-black/80 to-transparent">
              <button onClick={() => setIsFullscreen(false)} className="w-10 h-10 flex items-center justify-center p-2 -ml-2 text-white hover:bg-white/10 rounded-full transition-all">
                <ChevronDown className="w-8 h-8" />
              </button>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-white/60 uppercase tracking-[0.2em] font-sans font-bold">Ecclesia Stream</span>
              </div>
              <div className="w-10 h-10" />
            </div>

            <div className="flex-1" /> {/* Spacer for Video Area */}

            {/* Content Area */}
            <div className="px-8 pb-12 shrink-0 flex flex-col bg-gradient-to-t from-black via-black/80 to-transparent pt-20">
              <div className="flex justify-between items-start mb-8">
                <div className="flex-1 min-w-0 pr-4">
                  <h1 className="text-2xl leading-tight text-white tracking-tight truncate font-sans font-bold">{selectedVideo.title}</h1>
                  <p className="text-lg text-white/60 truncate mt-1 font-sans">Ecclesia Player</p>
                </div>
                <button className="p-2 -mr-2">
                  <Heart className="w-7 h-7 text-white/70" />
                </button>
              </div>

              {/* Progress */}
              <div className="w-full mb-8">
                <div className="w-full h-1.5 bg-white/10 rounded-full mb-3 cursor-pointer relative" onClick={handleSeek}>
                  <div className="h-full bg-white rounded-full relative" style={{ width: `${(playedSeconds / (duration || 1)) * 100}%` }} />
                </div>
                <div className="flex justify-between text-xs text-white/40 font-medium">
                  <span>{formatTime(playedSeconds)}</span>
                  <span>-{formatTime(duration - playedSeconds)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex gap-8 items-center justify-center mb-12">
                <button className="text-white/40 hover:text-white transition-all">
                  <Shuffle className="w-6 h-6" />
                </button>
                <button className="text-white/40 cursor-not-allowed">
                  <SkipForward className="w-10 h-10 fill-current rotate-180" />
                </button>
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-black active:scale-95 transition-all shadow-xl"
                >
                  {isPlaying ? <Pause className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current translate-x-1" />}
                </button>
                <button onClick={playNext} className="text-white hover:text-white active:scale-90 transition-all">
                  <SkipForward className="w-10 h-10 fill-current" />
                </button>
                <button className="text-white/40 hover:text-white transition-all">
                  <Repeat className="w-6 h-6" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
