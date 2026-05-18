import { createContext, useContext, useState, useRef, ReactNode, useEffect } from 'react';
import { YouTubeVideo } from '../services/youtube';

interface PlayerContextType {
  selectedVideo: YouTubeVideo | null;
  isPlaying: boolean;
  playedSeconds: number;
  duration: number;
  playlist: YouTubeVideo[];
  isFullscreen: boolean;
  setSelectedVideo: (video: YouTubeVideo | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setPlayedSeconds: (seconds: number) => void;
  setDuration: (duration: number) => void;
  setIsFullscreen: (fullscreen: boolean) => void;
  playNext: () => void;
  addToPlaylist: (video: YouTubeVideo) => void;
  removeFromPlaylist: (index: number) => void;
  setPlaylist: (playlist: YouTubeVideo[] | ((prev: YouTubeVideo[]) => YouTubeVideo[])) => void;
  playerRef: React.RefObject<any>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [selectedVideo, setSelectedVideoState] = useState<YouTubeVideo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playlist, setPlaylist] = useState<YouTubeVideo[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const playerRef = useRef<any>(null);

  const setSelectedVideo = (video: YouTubeVideo | null) => {
    setSelectedVideoState(video);
    if (video) {
      setPlayedSeconds(0);
      setDuration(0);
      setIsPlaying(true);
      setIsFullscreen(true);
    }
  };

  const addToPlaylist = (video: YouTubeVideo) => {
    setPlaylist(prev => [...prev, video]);
    if (!selectedVideo) {
      setSelectedVideo(video);
    }
  };

  const removeFromPlaylist = (index: number) => {
    setPlaylist(prev => prev.filter((_, i) => i !== index));
  };

  const playNext = () => {
    if (playlist.length > 0) {
      const next = playlist[0];
      setSelectedVideoState(next);
      setPlaylist(prev => prev.slice(1));
      setPlayedSeconds(0);
      setDuration(0);
      setIsPlaying(true);
    } else {
      setSelectedVideoState(null);
      setPlayedSeconds(0);
      setDuration(0);
    }
  };

  return (
    <PlayerContext.Provider value={{
      selectedVideo,
      isPlaying,
      playedSeconds,
      duration,
      playlist,
      isFullscreen,
      setSelectedVideo,
      setIsPlaying,
      setPlayedSeconds,
      setDuration,
      setPlaylist,
      setIsFullscreen,
      playNext,
      addToPlaylist,
      removeFromPlaylist,
      playerRef
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
