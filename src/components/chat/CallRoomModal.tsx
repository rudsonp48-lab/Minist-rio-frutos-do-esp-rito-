import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Users, 
  Share2, 
  Monitor, 
  MessageSquare, 
  Hand, 
  Plus, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Heart, 
  X, 
  ShieldCheck, 
  Copy, 
  Check, 
  Grid, 
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../../lib/firebase';
import { ActiveUser } from '../../services/presenceService';
import { CallParticipant, playCallSound } from '../../services/callService';

interface CallRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomTitle: string;
  initialType: 'audio' | 'video';
  availableUsers: ActiveUser[];
  onSendMessage?: (text: string) => void;
}

export default function CallRoomModal({
  isOpen,
  onClose,
  roomTitle,
  initialType,
  availableUsers,
  onSendMessage
}: CallRoomModalProps) {
  const currentUser = auth.currentUser;
  const [callType, setCallType] = useState<'audio' | 'video'>(initialType);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(initialType === 'audio');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [audioOutputMode, setAudioOutputMode] = useState<'speaker' | 'earpiece'>(
    initialType === 'video' ? 'speaker' : 'earpiece'
  );
  
  // Call status & timer
  const [callState, setCallState] = useState<'calling' | 'connected'>('calling');
  const [durationSeconds, setDurationSeconds] = useState(0);

  // Layout & Drawers
  const [activeSidePanel, setActiveSidePanel] = useState<'participants' | 'chat' | 'invite' | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [inCallMessages, setInCallMessages] = useState<Array<{ sender: string; text: string; time: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [floatingReactions, setFloatingReactions] = useState<Array<{ id: string; emoji: string; x: number }>>([]);
  const [copiedLink, setCopiedLink] = useState(false);

  // Up to 20 Participants state
  const [participants, setParticipants] = useState<CallParticipant[]>([]);
  const [speakingUids, setSpeakingUids] = useState<Set<string>>(new Set());

  // Media Streams & Audio Analyser
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localScreenRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);

  // Initialize room & media on open
  useEffect(() => {
    if (!isOpen) {
      cleanupStreams();
      return;
    }

    setCallType(initialType);
    setIsVideoMuted(initialType === 'audio');
    setCallState('calling');
    setDurationSeconds(0);
    playCallSound('ring');

    // Create current user participant
    const mySelf: CallParticipant = {
      uid: currentUser?.uid || 'me',
      name: currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Eu',
      photoURL: currentUser?.photoURL || '',
      role: currentUser?.email === 'rudson.p48@gmail.com' ? 'Pastor / Administrador' : 'Membro',
      isVideoEnabled: initialType === 'video',
      isAudioEnabled: true,
      joinedAt: Date.now()
    };

    // Pre-populate with host participant
    const initialList: CallParticipant[] = [mySelf];
    setParticipants(initialList);

    // Request real local camera/mic stream
    startLocalMedia(initialType === 'video');

    // Transition from ringing to connected after 1.8s
    const connectTimer = setTimeout(() => {
      setCallState('connected');
      playCallSound('connect');
    }, 1800);

    return () => {
      clearTimeout(connectTimer);
      cleanupStreams();
    };
  }, [isOpen, initialType]);

  // Duration Timer
  useEffect(() => {
    if (callState !== 'connected') return;
    const interval = setInterval(() => {
      setDurationSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callState]);

  // Real local media initialization
  const startLocalMedia = async (withVideo: boolean) => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: withVideo ? { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      if (localVideoRef.current && withVideo) {
        localVideoRef.current.srcObject = stream;
      }

      // Audio analysis for real-time speech meter
      setupAudioAnalyser(stream);
    } catch (err) {
      console.warn('[CallRoomModal] Could not access real camera/mic (using fallback):', err);
      // Create fallback dummy canvas stream if needed
    }
  };

  const setupAudioAnalyser = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;

        // If speaking volume is above threshold, highlight current user
        if (average > 25 && !isMicMuted) {
          setSpeakingUids(prev => new Set([...prev, currentUser?.uid || 'me']));
        } else {
          setSpeakingUids(prev => {
            const next = new Set(prev);
            next.delete(currentUser?.uid || 'me');
            return next;
          });
        }

        animationFrameRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (e) {
      console.debug('Audio analyser notice:', e);
    }
  };

  const cleanupStreams = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  // Toggle Mic
  const handleToggleMic = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = isMicMuted; // Toggle
      });
    }
    setIsMicMuted(!isMicMuted);
    setParticipants(prev => prev.map(p => 
      p.uid === (currentUser?.uid || 'me') ? { ...p, isAudioEnabled: isMicMuted } : p
    ));
  };

  // Toggle Camera
  const handleToggleCamera = async () => {
    const nextVideoState = !isVideoMuted; // Turning off if currently active
    setIsVideoMuted(nextVideoState);

    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks.forEach(track => {
          track.enabled = !nextVideoState;
        });
      } else if (!nextVideoState) {
        // Need to acquire video track
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
          const newVideoTrack = newStream.getVideoTracks()[0];
          localStreamRef.current.addTrack(newVideoTrack);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
        } catch (e) {
          console.warn('Could not start video track:', e);
        }
      }
    }

    setParticipants(prev => prev.map(p => 
      p.uid === (currentUser?.uid || 'me') ? { ...p, isVideoEnabled: !nextVideoState } : p
    ));
  };

  // Toggle Screen Share
  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        screenStreamRef.current = stream;
        setIsScreenSharing(true);

        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          screenStreamRef.current = null;
        };
      } catch (err) {
        console.warn('Screen share canceled or not supported:', err);
      }
    }
  };

  // Toggle Raise Hand
  const handleToggleRaiseHand = () => {
    const nextHand = !isHandRaised;
    setIsHandRaised(nextHand);
    if (nextHand) playCallSound('raise_hand');

    setParticipants(prev => prev.map(p => 
      p.uid === (currentUser?.uid || 'me') ? { ...p, handRaised: nextHand } : p
    ));
  };

  // Send Floating Spiritual Reaction
  const handleSendReaction = (emoji: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    const x = 20 + Math.random() * 60; // percentage
    setFloatingReactions(prev => [...prev, { id, emoji, x }]);

    setTimeout(() => {
      setFloatingReactions(prev => prev.filter(r => r.id !== id));
    }, 2800);
  };

  // Send In-call message
  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const msg = {
      sender: currentUser?.displayName || 'Eu',
      text: chatInput.trim(),
      time: timeStr
    };

    setInCallMessages(prev => [...prev, msg]);
    setChatInput('');

    if (onSendMessage) {
      onSendMessage(`[Na Chamada] ${msg.text}`);
    }
  };

  // Add a participant to the conference (up to 20 total)
  const handleAddParticipant = (userToAdd: ActiveUser) => {
    if (participants.length >= 20) {
      alert('Limite de 20 pessoas na chamada atingido.');
      return;
    }

    if (participants.some(p => p.uid === userToAdd.uid)) return;

    const newP: CallParticipant = {
      uid: userToAdd.uid,
      name: userToAdd.name,
      photoURL: userToAdd.photoURL,
      role: userToAdd.role || 'Membro',
      isVideoEnabled: callType === 'video' && Math.random() > 0.3,
      isAudioEnabled: true,
      joinedAt: Date.now()
    };

    setParticipants(prev => [...prev, newP]);
    playCallSound('connect');
  };

  // Quick invite simulated sister/brother to easily test 20 participants
  const handleAddQuickMember = () => {
    if (participants.length >= 20) return;
    const names = [
      'Pr. Marcos Silva', 'Pra. Sarah Oliveira', 'Lucas Alencar', 'Carolina Mendes',
      'João Batista', 'Debora Souza', 'Gabriel Santos', 'Rebeca Lima',
      'Felipe Rocha', 'Ester Nascimento', 'Matheus Costa', 'Miriam Alves',
      'Samuel Ferreira', 'Ana Paula', 'Davi Carvalho', 'Ruth Ribeiro',
      'Elias Andrade', 'Priscila Martins', 'Tiago Moreira', 'Noemi Santos'
    ];

    const existingNames = new Set(participants.map(p => p.name));
    const nextName = names.find(n => !existingNames.has(n)) || `Irmão ${participants.length + 1}`;

    const newParticipant: CallParticipant = {
      uid: `user-sim-${Date.now()}-${Math.random()}`,
      name: nextName,
      photoURL: `https://images.unsplash.com/photo-${1500000000000 + (participants.length * 12345678) % 50000000}?auto=format&fit=crop&q=80&w=200`,
      role: nextName.startsWith('Pr') ? 'Liderança Pastoral' : 'Membro da Igreja',
      isVideoEnabled: callType === 'video',
      isAudioEnabled: true,
      joinedAt: Date.now()
    };

    setParticipants(prev => [...prev, newParticipant]);
    playCallSound('connect');
  };

  // Remove participant
  const handleRemoveParticipant = (uid: string) => {
    if (uid === (currentUser?.uid || 'me')) return;
    setParticipants(prev => prev.filter(p => p.uid !== uid));
    playCallSound('disconnect');
  };

  // Format Duration string MM:SS
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Dynamic Grid Class generator for up to 20 people
  const getGridClasses = (count: number) => {
    if (count === 1) return 'grid-cols-1 max-w-2xl mx-auto h-full';
    if (count === 2) return 'grid-cols-1 sm:grid-cols-2 max-w-4xl mx-auto h-full';
    if (count <= 4) return 'grid-cols-2 max-w-4xl mx-auto h-full';
    if (count <= 6) return 'grid-cols-2 md:grid-cols-3 max-w-5xl mx-auto h-full';
    if (count <= 9) return 'grid-cols-3 max-w-6xl mx-auto h-full';
    if (count <= 12) return 'grid-cols-3 sm:grid-cols-4 max-w-7xl mx-auto h-full';
    return 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 max-w-7xl mx-auto h-full';
  };

  const handleEndCall = () => {
    playCallSound('disconnect');
    cleanupStreams();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={modalContainerRef}
      className={`fixed inset-0 z-50 flex flex-col bg-[#0A0A0E] text-white select-none ${
        isFullscreen ? 'p-0' : 'p-2 sm:p-4'
      }`}
    >
      {/* Floating Animated Spiritual Reactions across the call */}
      <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
        {floatingReactions.map((r) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 150, scale: 0.5 }}
            animate={{ opacity: [0, 1, 1, 0], y: -200, scale: [0.5, 1.3, 1.1, 0.8] }}
            transition={{ duration: 2.6, ease: 'easeOut' }}
            style={{ left: `${r.x}%`, bottom: '15%' }}
            className="absolute text-4xl sm:text-5xl filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]"
          >
            {r.emoji}
          </motion.div>
        ))}
      </div>

      {/* Main Glass Screen Container */}
      <div className="flex-1 flex flex-col bg-[#111116] border border-white/10 rounded-[28px] sm:rounded-[36px] overflow-hidden shadow-2xl relative">
        
        {/* ========================================================= */}
        {/* TOP BAR: Room Title, Live Timer, Participants counter     */}
        {/* ========================================================= */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-white/10 flex items-center justify-between bg-[#15151D]/90 backdrop-blur-xl z-20 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-md ${
              callType === 'video' 
                ? 'bg-gradient-to-tr from-purple-600 to-indigo-600' 
                : 'bg-gradient-to-tr from-emerald-600 to-teal-500'
            }`}>
              {callType === 'video' ? (
                <Video className="w-4 h-4 text-white" />
              ) : (
                <Phone className="w-4 h-4 text-white" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  {roomTitle}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/70 text-[10px] font-bold uppercase tracking-wider">
                  {callType === 'video' ? 'Vídeo Conferência' : 'Chamada de Voz'}
                </span>
              </div>
              <p className="text-[11px] text-white/50 flex items-center gap-2">
                {callState === 'calling' ? (
                  <span className="text-amber-400 font-bold animate-pulse">Chamando congregação...</span>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-mono text-emerald-400 font-bold">{formatTimer(durationSeconds)}</span>
                    <span>•</span>
                    <span className="text-purple-300 font-semibold">{participants.length}/20 na ligação</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Right quick toggles (Invite, Participants drawer, Fullscreen) */}
          <div className="flex items-center gap-2">
            {/* Add more participants button */}
            <button
              onClick={() => setActiveSidePanel(activeSidePanel === 'invite' ? null : 'invite')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeSidePanel === 'invite'
                  ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                  : 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border-purple-500/30'
              }`}
              title="Adicionar pessoas à chamada (até 20)"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+ Convidar ({participants.length}/20)</span>
            </button>

            {/* Quick Add Demo Member to easily test multi-user call up to 20 */}
            {participants.length < 20 && (
              <button
                onClick={handleAddQuickMember}
                className="hidden lg:flex px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs font-medium items-center gap-1"
                title="Adicionar irmão para testar grade de 20 pessoas"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>+1 Irmão</span>
              </button>
            )}

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors hidden sm:flex"
              title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CENTER STAGE: Multi-participant Grid (1 to 20 people)    */}
        {/* ========================================================= */}
        <div className="flex-1 flex overflow-hidden relative">
          <div className="flex-1 p-3 sm:p-5 overflow-y-auto flex items-center justify-center scrollbar-hide">
            
            {/* Screen Share Feature Banner if active */}
            {isScreenSharing && (
              <div className="w-full h-full max-h-[70vh] bg-black rounded-3xl border border-purple-500/40 relative overflow-hidden flex flex-col items-center justify-center p-4 shadow-2xl mb-3">
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-purple-600/80 text-white text-xs font-bold flex items-center gap-1.5 backdrop-blur-md">
                  <Monitor className="w-3.5 h-3.5" />
                  Transmitindo sua tela para todos ({participants.length} irmãos)
                </div>
                <div className="text-center space-y-2">
                  <Monitor className="w-16 h-16 text-purple-400 mx-auto animate-pulse" />
                  <h4 className="text-sm font-bold text-white">Compartilhamento de Tela Ativo</h4>
                  <p className="text-xs text-white/60">Todos os participantes da chamada estão visualizando sua apresentação.</p>
                </div>
              </div>
            )}

            {/* Grid of 1 to 20 Participants */}
            <div className={`w-full grid gap-2.5 sm:gap-3.5 transition-all ${getGridClasses(participants.length)}`}>
              {participants.map((p) => {
                const isMe = p.uid === (currentUser?.uid || 'me');
                const isSpeaking = speakingUids.has(p.uid);

                return (
                  <div
                    key={p.uid}
                    className={`relative rounded-2xl sm:rounded-3xl bg-[#161620] border overflow-hidden flex flex-col items-center justify-center min-h-[140px] sm:min-h-[170px] transition-all shadow-lg ${
                      isSpeaking
                        ? 'border-amber-400 ring-2 ring-amber-400/40 shadow-[0_0_20px_rgba(251,191,36,0.25)]'
                        : isMe
                          ? 'border-purple-500/40'
                          : 'border-white/10'
                    }`}
                  >
                    {/* If video is enabled and it's ME, render local real webcam video */}
                    {isMe && p.isVideoEnabled && !isVideoMuted ? (
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover scale-x-[-1] absolute inset-0"
                      />
                    ) : p.isVideoEnabled && p.photoURL ? (
                      /* Remote Video simulation / camera view */
                      <div className="w-full h-full relative">
                        <img
                          src={p.photoURL}
                          alt={p.name}
                          className="w-full h-full object-cover filter brightness-90"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                      </div>
                    ) : (
                      /* Audio Only Avatar View with pulsing waves */
                      <div className="flex flex-col items-center justify-center p-3 text-center z-10">
                        <div className="relative">
                          <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl p-[2px] shadow-xl ${
                            isSpeaking
                              ? 'bg-gradient-to-tr from-amber-400 to-rose-500 scale-105 transition-transform'
                              : 'bg-gradient-to-tr from-purple-600 to-indigo-600'
                          }`}>
                            {p.photoURL ? (
                              <img
                                src={p.photoURL}
                                alt={p.name}
                                className="w-full h-full object-cover rounded-[14px]"
                              />
                            ) : (
                              <div className="w-full h-full bg-black rounded-[14px] flex items-center justify-center font-bold text-white text-base">
                                {p.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>

                          {/* Sound wave ripple rings when speaking */}
                          {isSpeaking && (
                            <div className="absolute inset-0 rounded-2xl border-2 border-amber-400 animate-ping pointer-events-none opacity-60" />
                          )}
                        </div>

                        {callType === 'audio' && (
                          <div className="flex items-center gap-1 mt-2">
                            <span className="w-1 h-2.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1 h-4 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1 h-3 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Participant Labels & Badges */}
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between z-20 pointer-events-none">
                      <div className="px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 flex items-center gap-1.5 max-w-[80%]">
                        <span className="text-[11px] font-bold text-white truncate">
                          {p.name} {isMe && '(Você)'}
                        </span>
                        {p.role?.includes('Pastor') && (
                          <span className="text-[9px] px-1 rounded bg-purple-500/30 text-purple-300 font-bold hidden sm:inline">
                            ✝ Pastor
                          </span>
                        )}
                      </div>

                      {/* Mic / Video status icons */}
                      <div className="flex items-center gap-1">
                        {p.handRaised && (
                          <span className="w-6 h-6 rounded-lg bg-amber-500 text-black flex items-center justify-center text-xs shadow-md animate-bounce">
                            ✋
                          </span>
                        )}
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                          p.isAudioEnabled && (!isMe || !isMicMuted)
                            ? 'bg-black/60 text-emerald-400'
                            : 'bg-rose-500/80 text-white'
                        }`}>
                          {p.isAudioEnabled && (!isMe || !isMicMuted) ? (
                            <Mic className="w-3 h-3" />
                          ) : (
                            <MicOff className="w-3 h-3" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Host kick / remove action (except self) */}
                    {!isMe && currentUser?.email === 'rudson.p48@gmail.com' && (
                      <button
                        onClick={() => handleRemoveParticipant(p.uid)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-rose-500/80 text-white/60 hover:text-white transition-colors opacity-0 hover:opacity-100 group-hover:opacity-100 z-30"
                        title="Remover da chamada"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================= */}
          {/* SIDE DRAWERS: Participants list, In-Call Chat, Invite     */}
          {/* ========================================================= */}
          <AnimatePresence>
            {activeSidePanel && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-80 bg-[#13131A] border-l border-white/10 flex flex-col z-30 shrink-0 overflow-hidden"
              >
                {/* Panel Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    {activeSidePanel === 'participants' && <Users className="w-4 h-4 text-purple-400" />}
                    {activeSidePanel === 'chat' && <MessageSquare className="w-4 h-4 text-emerald-400" />}
                    {activeSidePanel === 'invite' && <UserPlus className="w-4 h-4 text-amber-400" />}
                    
                    {activeSidePanel === 'participants' && `Irmãos Conectados (${participants.length}/20)`}
                    {activeSidePanel === 'chat' && 'Chat da Ligação'}
                    {activeSidePanel === 'invite' && 'Convidar Irmãos'}
                  </h4>

                  <button
                    onClick={() => setActiveSidePanel(null)}
                    className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* 1. PARTICIPANTS PANEL */}
                {activeSidePanel === 'participants' && (
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200">
                      Capacidade para até <strong>20 irmãos</strong> transmitindo áudio e vídeo em alta qualidade.
                    </div>

                    {participants.map((p) => (
                      <div
                        key={p.uid}
                        className="p-2.5 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-purple-600/30 p-[1px] shrink-0">
                            {p.photoURL ? (
                              <img src={p.photoURL} alt={p.name} className="w-full h-full object-cover rounded-[10px]" />
                            ) : (
                              <div className="w-full h-full bg-black rounded-[10px] flex items-center justify-center font-bold text-xs">
                                {p.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-white truncate">{p.name}</h5>
                            <p className="text-[10px] text-white/40">{p.role || 'Membro'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {p.handRaised && <span title="Mão levantada">✋</span>}
                          {p.isAudioEnabled ? (
                            <Mic className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <MicOff className="w-3.5 h-3.5 text-rose-400" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. IN-CALL CHAT PANEL */}
                {activeSidePanel === 'chat' && (
                  <div className="flex-1 flex flex-col p-3">
                    <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1">
                      {inCallMessages.length === 0 ? (
                        <div className="text-center py-12 text-white/40 text-xs">
                          Nenhuma mensagem enviada nesta chamada ainda.
                        </div>
                      ) : (
                        inCallMessages.map((m, idx) => (
                          <div key={idx} className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-xs">
                            <div className="flex items-center justify-between text-[10px] text-white/40 mb-1">
                              <span className="font-bold text-purple-300">{m.sender}</span>
                              <span>{m.time}</span>
                            </div>
                            <p className="text-white/90">{m.text}</p>
                          </div>
                        ))
                      )}
                    </div>

                    <form onSubmit={handleSendChatMessage} className="flex gap-1.5">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Mensagem rápida..."
                        className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
                      />
                      <button
                        type="submit"
                        className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold"
                      >
                        Enviar
                      </button>
                    </form>
                  </div>
                )}

                {/* 3. INVITE BROTHERS PANEL (UP TO 20) */}
                {activeSidePanel === 'invite' && (
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {/* Direct Room Link Share */}
                    <div className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                      <span className="text-[11px] font-bold text-white block">Link da Chamada:</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          readOnly
                          value={window.location.href}
                          className="flex-1 bg-black/60 border border-white/10 rounded-xl px-2.5 py-1.5 text-[10px] text-white/70 outline-none truncate"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            setCopiedLink(true);
                            setTimeout(() => setCopiedLink(false), 2000);
                          }}
                          className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
                        >
                          {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Online Congregation Members to Add */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-white/60 block px-1">
                        Membros Online para Adicionar:
                      </span>
                      {availableUsers.filter(u => !participants.some(p => p.uid === u.uid)).map((user) => (
                        <div
                          key={user.uid}
                          className="p-2.5 rounded-2xl bg-black/30 border border-white/5 flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-purple-600/20 flex items-center justify-center font-bold text-xs text-white shrink-0">
                              {user.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <h5 className="text-xs font-bold text-white truncate">{user.name}</h5>
                              <p className="text-[10px] text-emerald-400">Online</p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleAddParticipant(user)}
                            className="px-2.5 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold"
                          >
                            + Chamar
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ========================================================= */}
        {/* BOTTOM CONTROLS BAR: Mute, Camera, Share, Chat, End Call  */}
        {/* ========================================================= */}
        <div className="px-4 sm:px-6 py-4 bg-[#14141C]/95 border-t border-white/10 flex items-center justify-between gap-2 sm:gap-4 shrink-0 z-20">
          
          {/* Left Quick Spiritual Reactions Bar */}
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-hide py-1">
            {[
              { emoji: '🙏', label: 'Amém' },
              { emoji: '❤️', label: 'Glória' },
              { emoji: '🕊️', label: 'Paz' },
              { emoji: '👏', label: 'Aleluia' },
              { emoji: '✝️', label: 'Graça' }
            ].map((reac) => (
              <button
                key={reac.emoji}
                onClick={() => handleSendReaction(reac.emoji)}
                className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-sm transition-all active:scale-90 flex items-center gap-1"
                title={`Reagir com ${reac.label}`}
              >
                <span>{reac.emoji}</span>
                <span className="text-[10px] font-bold text-white/70 hidden lg:inline">{reac.label}</span>
              </button>
            ))}
          </div>

          {/* Center Main Call Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Microphone Mute / Unmute */}
            <button
              onClick={handleToggleMic}
              className={`p-3 sm:p-3.5 rounded-2xl font-bold flex items-center justify-center transition-all shadow-lg active:scale-95 ${
                isMicMuted
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
              }`}
              title={isMicMuted ? 'Ativar microfone' : 'Silenciar microfone'}
            >
              {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Camera Video On / Off */}
            <button
              onClick={handleToggleCamera}
              className={`p-3 sm:p-3.5 rounded-2xl font-bold flex items-center justify-center transition-all shadow-lg active:scale-95 ${
                isVideoMuted
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
              }`}
              title={isVideoMuted ? 'Ligar câmera' : 'Desligar câmera'}
            >
              {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>

            {/* Audio Mode: Viva-Voz vs Normal */}
            <button
              onClick={() => setAudioOutputMode(audioOutputMode === 'speaker' ? 'earpiece' : 'speaker')}
              className={`p-3 sm:p-3.5 rounded-2xl font-bold flex items-center justify-center transition-all shadow-lg active:scale-95 ${
                audioOutputMode === 'speaker'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-950/50'
              }`}
              title={audioOutputMode === 'speaker' ? 'Viva-Voz Ativado (Toque para Chamada Normal no Ouvido)' : 'Chamada Normal Ativada (Toque para Viva-Voz)'}
            >
              {audioOutputMode === 'speaker' ? <Volume2 className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
            </button>

            {/* Screen Share */}
            <button
              onClick={handleToggleScreenShare}
              className={`p-3 sm:p-3.5 rounded-2xl font-bold flex items-center justify-center transition-all shadow-lg active:scale-95 hidden sm:flex ${
                isScreenSharing
                  ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-950/50'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
              }`}
              title={isScreenSharing ? 'Parar transmissão' : 'Compartilhar tela'}
            >
              <Monitor className="w-5 h-5" />
            </button>

            {/* Raise Hand */}
            <button
              onClick={handleToggleRaiseHand}
              className={`p-3 sm:p-3.5 rounded-2xl font-bold flex items-center justify-center transition-all shadow-lg active:scale-95 ${
                isHandRaised
                  ? 'bg-amber-500 text-black shadow-amber-950/50 animate-bounce'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
              }`}
              title={isHandRaised ? 'Abaixar mão' : 'Levantar a mão para falar'}
            >
              <Hand className="w-5 h-5" />
            </button>

            {/* END CALL BUTTON */}
            <button
              onClick={handleEndCall}
              className="px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-2 shadow-xl shadow-rose-950/60 active:scale-95 transition-all"
              title="Encerrar ligação"
            >
              <PhoneOff className="w-5 h-5" />
              <span className="text-xs uppercase tracking-wider hidden sm:inline">Desligar</span>
            </button>
          </div>

          {/* Right Drawers shortcuts (Chat & Participants) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSidePanel(activeSidePanel === 'chat' ? null : 'chat')}
              className={`p-3 rounded-2xl border transition-all ${
                activeSidePanel === 'chat'
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
              }`}
              title="Chat da chamada"
            >
              <MessageSquare className="w-5 h-5" />
            </button>

            <button
              onClick={() => setActiveSidePanel(activeSidePanel === 'participants' ? null : 'participants')}
              className={`p-3 rounded-2xl border transition-all ${
                activeSidePanel === 'participants'
                  ? 'bg-purple-600 text-white border-purple-500'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
              }`}
              title="Lista de participantes (até 20)"
            >
              <Users className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
