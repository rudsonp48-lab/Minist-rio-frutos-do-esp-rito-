import { createContext, useContext, useState, useRef, useEffect } from 'react';
import { YouTubeVideo } from '../services/youtube';

interface PlayerContextType {
  selectedVideo: YouTubeVideo | null;
  setSelectedVideo: (video: YouTubeVideo | null) => void;
  playlist: YouTubeVideo[];
  setPlaylist: React.Dispatch<React.SetStateAction<YouTubeVideo[]>>;
  playing: boolean;
  setPlaying: (playing: boolean) => void;
  volume: number;
  setVolume: (volume: number) => void;
  played: number;
  setPlayed: (played: number) => void;
  duration: number;
  setDuration: (duration: number) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  playerRef: any;
  isMinimized: boolean;
  setIsMinimized: (minimized: boolean) => void;
  addToPlaylist: (video: YouTubeVideo) => void;
  playNext: () => void;
  playPrevious: () => void;
  seekTo: (amount: number) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [playlist, setPlaylist] = useState<YouTubeVideo[]>([]);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const playerRef = useRef<any>(null);

  const addToPlaylist = (video: YouTubeVideo) => {
    setPlaylist(prev => [...prev, video]);
    if (!selectedVideo) {
      setSelectedVideo(video);
      setPlaying(true);
      setIsMinimized(true);
    }
  };

  const playNext = () => {
    if (playlist.length > 0) {
      const nextVid = playlist[0];
      setSelectedVideo(nextVid);
      setPlaylist(prev => prev.slice(1));
      setPlaying(true);
    } else {
      setPlaying(false);
    }
  };
  
  const playPrevious = () => {
     if (playerRef.current) {
        playerRef.current.seekTo(0);
     }
  };

  const seekTo = (amount: number) => {
    if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
      try {
        const currentTime = playerRef.current.getCurrentTime() || 0;
        playerRef.current.seekTo(currentTime + amount, true);
      } catch (e) {}
    }
  };

  const handleSetSelectedVideo = (video: YouTubeVideo | null, autoPlay: boolean = true) => {
    setSelectedVideo(video);
    if (video && autoPlay) {
      setPlaying(true);
    } else if (!video) {
      setPlaying(false);
    }
  };

  return (
    <PlayerContext.Provider value={{
      selectedVideo, setSelectedVideo: handleSetSelectedVideo,
      playlist, setPlaylist,
      playing, setPlaying,
      volume, setVolume,
      played, setPlayed,
      duration, setDuration,
      isMuted, setIsMuted,
      playerRef,
      isMinimized, setIsMinimized,
      addToPlaylist, playNext, playPrevious, seekTo
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within PlayerProvider');
  return context;
}
