import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Mic, RotateCcw } from 'lucide-react';

interface VoicePrayerPlayerProps {
  audioUrl: string;
  duration?: number;
  authorName?: string;
  compact?: boolean;
}

export default function VoicePrayerPlayer({ 
  audioUrl, 
  duration, 
  authorName,
  compact = false 
}: VoicePrayerPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setTotalDuration(Math.round(audio.duration));
      }
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error('Audio play error:', err);
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const time = Number(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  if (compact) {
    return (
      <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-white w-full max-w-sm">
        <audio ref={audioRef} src={audioUrl} preload="metadata" />
        <button
          onClick={togglePlay}
          className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md active:scale-95 transition-transform"
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
        </button>

        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-center justify-between text-[10px] text-purple-200 font-bold mb-1">
            <span className="flex items-center gap-1">
              <Mic className="w-3 h-3 text-purple-400" />
              Áudio de Clamor
            </span>
            <span>{formatTime(currentTime)} / {formatTime(totalDuration || 0)}</span>
          </div>

          <div className="relative w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-emerald-400 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 rounded-3xl bg-gradient-to-r from-purple-950/60 via-[#1C162E] to-black/80 border border-purple-500/30 shadow-xl relative overflow-hidden">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Decorative Waveform Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 blur-2xl rounded-full pointer-events-none" />

      <div className="flex items-center gap-3.5 relative z-10">
        <button
          onClick={togglePlay}
          className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-emerald-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-purple-950/50 active:scale-95 transition-transform hover:opacity-90"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-white" />
          ) : (
            <Play className="w-5 h-5 fill-white ml-1" />
          )}
        </button>

        <div className="flex-1">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-white">
                {authorName ? `Áudio de Oração de ${authorName}` : 'Clamor & Bênção Gravada'}
              </span>
            </div>
            <span className="text-[11px] font-mono font-bold text-purple-300">
              {formatTime(currentTime)} / {formatTime(totalDuration || 0)}
            </span>
          </div>

          {/* Animated sound wave bars or scrubber */}
          <div className="flex items-center gap-1 h-6">
            {[40, 70, 30, 90, 60, 100, 45, 80, 50, 95, 60, 40, 85, 70, 50, 90, 65, 35, 75, 45].map((val, i) => {
              const active = (i / 20) <= (progressPercent / 100);
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-full transition-all duration-200 ${
                    active 
                      ? 'bg-gradient-to-t from-purple-500 to-emerald-400' 
                      : 'bg-white/10'
                  } ${isPlaying ? 'animate-pulse' : ''}`}
                  style={{ 
                    height: `${Math.max(20, (val * (isPlaying ? (0.6 + Math.random() * 0.4) : 1)))}%`,
                    animationDelay: `${i * 50}ms`
                  }}
                />
              );
            })}
          </div>

          <input
            type="range"
            min={0}
            max={totalDuration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 mt-2 opacity-40 hover:opacity-100 transition-opacity accent-purple-400 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
