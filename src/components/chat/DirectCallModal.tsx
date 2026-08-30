import React, { useState, useEffect, useRef } from 'react';
import { 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Volume2, 
  VolumeX, 
  RotateCw, 
  Minimize2,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../../lib/firebase';
import { 
  CallSession, 
  endDirectCall, 
  playCallSound, 
  startRingingLoop,
  RTC_CONFIG,
  saveCallOffer,
  saveCallAnswer,
  addCallIceCandidate,
  subscribeCallIceCandidates,
  subscribeToCallSession
} from '../../services/callService';

interface DirectCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  callSession: CallSession;
  isInitiator: boolean;
}

export default function DirectCallModal({
  isOpen,
  onClose,
  callSession: initialCallSession,
  isInitiator
}: DirectCallModalProps) {
  const currentUser = auth.currentUser;
  const [callSession, setCallSession] = useState<CallSession>(initialCallSession);
  const [callState, setCallState] = useState<'ringing' | 'connected' | 'ended'>('ringing');
  const [durationSeconds, setDurationSeconds] = useState(0);

  // Media & Controls
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(initialCallSession.type === 'audio');
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);

  // Peer Connection & Streams
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  const isVideo = callSession.type === 'video';
  const remoteUser = isInitiator ? callSession.receiver : callSession.caller;

  // 1. Subscribe to Firestore Call Session Updates (status, offer, answer)
  useEffect(() => {
    if (!isOpen || !callSession.id) return;

    const unsubscribe = subscribeToCallSession(callSession.id, (updatedSession) => {
      if (!updatedSession) {
        handleEndCall(false);
        return;
      }
      setCallSession(updatedSession);

      if (updatedSession.status === 'connected' && callState === 'ringing') {
        setCallState('connected');
        playCallSound('connect');
      } else if (updatedSession.status === 'rejected' || updatedSession.status === 'ended') {
        setCallState('ended');
        playCallSound('disconnect');
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen, callSession.id, callState]);

  // 2. Outgoing Ringing Sound Loop while calling
  useEffect(() => {
    if (!isOpen || callState !== 'ringing' || !isInitiator) return;
    const stopRing = startRingingLoop('outgoing');
    return () => {
      stopRing();
    };
  }, [isOpen, callState, isInitiator]);

  // 3. Call Duration Timer
  useEffect(() => {
    if (callState !== 'connected') return;
    const interval = setInterval(() => {
      setDurationSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callState]);

  // 4. WebRTC P2P Setup
  useEffect(() => {
    if (!isOpen) {
      cleanupStreams();
      return;
    }

    let isMounted = true;

    async function initWebRTC() {
      try {
        // Step A: Get Local Media
        const constraints: MediaStreamConstraints = {
          audio: true,
          video: isVideo ? { facingMode, width: { ideal: 720 }, height: { ideal: 1280 } } : false
        };

        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (mediaErr) {
          console.warn('[DirectCall] Fallback to audio only due to media error:', mediaErr);
          stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        }

        if (!isMounted) return;
        localStreamRef.current = stream;

        if (localVideoRef.current && isVideo) {
          localVideoRef.current.srcObject = stream;
        }

        // Step B: Create RTCPeerConnection
        const pc = new RTCPeerConnection(RTC_CONFIG);
        peerConnectionRef.current = pc;

        // Add local tracks to PeerConnection
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        // Remote track handling
        pc.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            const rStream = event.streams[0];
            remoteStreamRef.current = rStream;

            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = rStream;
              setHasRemoteVideo(true);
            }
            if (remoteAudioRef.current) {
              remoteAudioRef.current.srcObject = rStream;
            }
          }
        };

        // ICE Candidate handling
        const myRole = isInitiator ? 'caller' : 'receiver';
        const counterpartRole = isInitiator ? 'receiver' : 'caller';

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            addCallIceCandidate(callSession.id, myRole, event.candidate);
          }
        };

        // Listen for counter-party ICE candidates
        subscribeCallIceCandidates(callSession.id, counterpartRole, (candidateInit) => {
          if (pc && pc.remoteDescription && candidateInit) {
            pc.addIceCandidate(new RTCIceCandidate(candidateInit)).catch((e) => {
              console.debug('[DirectCall] Error adding remote candidate:', e);
            });
          }
        });

        // Step C: Negotiation (Offer / Answer)
        if (isInitiator) {
          // Caller creates Offer
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: isVideo
          });
          await pc.setLocalDescription(offer);
          await saveCallOffer(callSession.id, offer);

          // Listen for Answer from receiver
          const unsubsAnswer = subscribeToCallSession(callSession.id, async (updated) => {
            if (updated?.answer && pc.signalingState === 'have-local-offer') {
              const remoteDesc = new RTCSessionDescription(updated.answer as RTCSessionDescriptionInit);
              await pc.setRemoteDescription(remoteDesc);
              unsubsAnswer();
            }
          });
        } else {
          // Receiver waits for Offer, then creates Answer
          const unsubsOffer = subscribeToCallSession(callSession.id, async (updated) => {
            if (updated?.offer && pc.signalingState === 'stable') {
              const remoteDesc = new RTCSessionDescription(updated.offer as RTCSessionDescriptionInit);
              await pc.setRemoteDescription(remoteDesc);

              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              await saveCallAnswer(callSession.id, answer);
              unsubsOffer();
            }
          });
        }
      } catch (err) {
        console.error('[DirectCall] WebRTC initialization error:', err);
      }
    }

    initWebRTC();

    return () => {
      isMounted = false;
      cleanupStreams();
    };
  }, [isOpen, callSession.id]);

  const cleanupStreams = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  };

  const handleEndCall = async (notifyServer = true) => {
    cleanupStreams();
    playCallSound('disconnect');
    if (notifyServer) {
      try {
        await endDirectCall(callSession.id);
      } catch (e) {
        console.debug('[DirectCall] End call error:', e);
      }
    }
    onClose();
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
      }
    }
  };

  const flipCamera = async () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);

    if (localStreamRef.current) {
      const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
      if (oldVideoTrack) oldVideoTrack.stop();

      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: nextMode }
        });
        const newVideoTrack = newStream.getVideoTracks()[0];
        if (newVideoTrack) {
          localStreamRef.current.removeTrack(oldVideoTrack);
          localStreamRef.current.addTrack(newVideoTrack);

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }

          if (peerConnectionRef.current) {
            const sender = peerConnectionRef.current.getSenders().find((s) => s.track?.kind === 'video');
            if (sender) {
              sender.replaceTrack(newVideoTrack);
            }
          }
        }
      } catch (err) {
        console.warn('[DirectCall] Camera flip error:', err);
      }
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        {/* Hidden Remote Audio Element for P2P voice */}
        <audio ref={remoteAudioRef} autoPlay playsInline />

        <div className="relative w-full h-full max-w-md sm:max-h-[92vh] sm:rounded-[36px] overflow-hidden bg-[#0e0e14] flex flex-col justify-between shadow-2xl border sm:border-white/15">
          {/* Top Status & Header Bar */}
          <div className="absolute top-0 left-0 right-0 z-30 p-4 sm:p-5 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent backdrop-blur-[2px]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full p-[1.5px] bg-gradient-to-tr from-purple-500 to-emerald-400 shrink-0 shadow-md">
                {remoteUser.photoURL ? (
                  <img
                    src={remoteUser.photoURL}
                    alt={remoteUser.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div className="w-full h-full bg-[#1c1c28] rounded-full flex items-center justify-center font-bold text-white text-sm">
                    {remoteUser.name?.charAt(0) || '✝'}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-base font-bold text-white leading-tight drop-shadow truncate max-w-[180px] sm:max-w-[220px]">
                  {remoteUser.name}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-white/80 font-medium">
                  {callState === 'ringing' ? (
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      Chamando...
                    </span>
                  ) : (
                    <span className="text-white/90 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {formatTimer(durationSeconds)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleEndCall(true)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white/80 transition-colors"
              title="Minimizar chamada"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Main Visual Viewport */}
          <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden">
            {isVideo ? (
              <>
                {/* Remote Video Stream (or remote avatar if camera disabled) */}
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className={`w-full h-full object-cover ${hasRemoteVideo ? 'block' : 'hidden'}`}
                />

                {!hasRemoteVideo && (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#181824] via-[#101017] to-[#0a0a0f] text-center">
                    {/* Animated Pulsing Rings */}
                    <div className="relative mb-6">
                      <motion.div
                        animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute -inset-4 rounded-full border-2 border-purple-500/40"
                      />
                      <div className="relative w-32 h-32 rounded-full p-1.5 bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 shadow-2xl">
                        {remoteUser.photoURL ? (
                          <img
                            src={remoteUser.photoURL}
                            alt={remoteUser.name}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#121218] rounded-full flex items-center justify-center text-4xl font-black text-white">
                            {remoteUser.name?.charAt(0) || '✝'}
                          </div>
                        )}
                      </div>
                    </div>

                    <h2 className="text-xl font-bold text-white mb-1">{remoteUser.name}</h2>
                    <p className="text-xs text-white/60">
                      {callState === 'ringing' ? 'Aguardando atendimento...' : 'Conectado em chamada de vídeo'}
                    </p>
                  </div>
                )}

                {/* Local Video Stream (Picture-in-Picture Floating Window - Instagram Style) */}
                <motion.div
                  drag
                  dragConstraints={{ top: -100, left: -100, right: 100, bottom: 100 }}
                  className="absolute bottom-28 right-4 z-30 w-28 sm:w-32 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-white/25 shadow-2xl bg-black/80 backdrop-blur-md cursor-grab active:cursor-grabbing"
                >
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${isVideoMuted ? 'hidden' : 'block'}`}
                  />
                  {isVideoMuted && (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#1c1c28] text-white/60 text-[10px] p-2 text-center font-semibold">
                      <VideoOff className="w-5 h-5 mb-1 text-white/40" />
                      Câmera Desativada
                    </div>
                  )}
                  <span className="absolute bottom-1.5 left-2 text-[10px] font-bold text-white/90 bg-black/60 px-1.5 py-0.5 rounded-md">
                    Você
                  </span>
                </motion.div>
              </>
            ) : (
              /* Audio Call View (Instagram Dark Aesthetic) */
              <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#181824] via-[#101017] to-[#0a0a0f] text-center">
                {/* Ambient Soft Glow */}
                <div className="absolute w-64 h-64 rounded-full bg-emerald-600/15 blur-3xl pointer-events-none" />

                {/* Radiating Waves Around Avatar */}
                <div className="relative mb-6">
                  <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -inset-5 rounded-full border border-emerald-500/30"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.25, 1], opacity: [0.7, 0.1, 0.7] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                    className="absolute -inset-2.5 rounded-full border border-emerald-400/40"
                  />
                  <div className="relative w-36 h-36 rounded-full p-1.5 bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 shadow-2xl">
                    {remoteUser.photoURL ? (
                      <img
                        src={remoteUser.photoURL}
                        alt={remoteUser.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#121218] rounded-full flex items-center justify-center text-4xl font-black text-white">
                        {remoteUser.name?.charAt(0) || '✝'}
                      </div>
                    )}
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-white mb-1.5">{remoteUser.name}</h2>
                <p className="text-sm font-medium text-emerald-400 mb-2 flex items-center gap-1.5">
                  {callState === 'ringing' ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      Chamando...
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Em chamada de áudio • {formatTimer(durationSeconds)}
                    </>
                  )}
                </p>
                <span className="text-[11px] px-3 py-1 rounded-full bg-white/10 text-white/60 border border-white/10 font-medium">
                  Comunhão Direta Privada
                </span>
              </div>
            )}
          </div>

          {/* Bottom Floating Control Bar (Instagram Style Capsule) */}
          <div className="relative z-30 p-5 sm:p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
            <div className="flex items-center justify-center gap-3 sm:gap-4 bg-white/10 backdrop-blur-xl border border-white/15 rounded-full p-2.5 sm:p-3 shadow-2xl max-w-sm mx-auto">
              {/* Mic Mute Toggle */}
              <button
                onClick={toggleMic}
                className={`p-3 sm:p-3.5 rounded-full transition-all active:scale-95 ${
                  isMicMuted
                    ? 'bg-red-500 text-white shadow-md shadow-red-900/40'
                    : 'bg-white/15 hover:bg-white/25 text-white'
                }`}
                title={isMicMuted ? 'Ativar microfone' : 'Silenciar microfone'}
              >
                {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Video Toggle */}
              {isVideo && (
                <>
                  <button
                    onClick={toggleVideo}
                    className={`p-3 sm:p-3.5 rounded-full transition-all active:scale-95 ${
                      isVideoMuted
                        ? 'bg-red-500 text-white shadow-md shadow-red-900/40'
                        : 'bg-white/15 hover:bg-white/25 text-white'
                    }`}
                    title={isVideoMuted ? 'Ligar câmera' : 'Desligar câmera'}
                  >
                    {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                  </button>

                  {/* Flip Camera (Mobile) */}
                  <button
                    onClick={flipCamera}
                    className="p-3 sm:p-3.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition-all active:scale-95"
                    title="Inverter câmera"
                  >
                    <RotateCw className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Speaker Mute Toggle */}
              <button
                onClick={() => setIsSpeakerMuted(!isSpeakerMuted)}
                className={`p-3 sm:p-3.5 rounded-full transition-all active:scale-95 ${
                  isSpeakerMuted
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-900/40'
                    : 'bg-white/15 hover:bg-white/25 text-white'
                }`}
                title={isSpeakerMuted ? 'Ativar som' : 'Silenciar som'}
              >
                {isSpeakerMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>

              {/* Big Red End Call Button */}
              <button
                onClick={() => handleEndCall(true)}
                className="p-3 sm:p-3.5 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/50 transition-all active:scale-95 border border-red-400/30"
                title="Encerrar chamada"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
}
