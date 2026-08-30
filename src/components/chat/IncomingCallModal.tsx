import React, { useEffect } from 'react';
import { Phone, PhoneOff, Video, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CallSession, acceptDirectCall, rejectDirectCall, startRingingLoop, playCallSound } from '../../services/callService';

interface IncomingCallModalProps {
  incomingCall: CallSession | null;
  onAccept: (call: CallSession) => void;
  onDecline: () => void;
}

export default function IncomingCallModal({
  incomingCall,
  onAccept,
  onDecline
}: IncomingCallModalProps) {
  // Ringing audio loop while call is incoming
  useEffect(() => {
    if (!incomingCall) return;

    const stopRing = startRingingLoop('incoming');

    return () => {
      stopRing();
    };
  }, [incomingCall?.id]);

  if (!incomingCall) return null;

  const handleAccept = async () => {
    try {
      playCallSound('connect');
      await acceptDirectCall(incomingCall.id);
      onAccept(incomingCall);
    } catch (e) {
      console.error('[IncomingCall] Accept error:', e);
      onAccept(incomingCall);
    }
  };

  const handleDecline = async () => {
    try {
      playCallSound('disconnect');
      await rejectDirectCall(incomingCall.id);
      onDecline();
    } catch (e) {
      console.error('[IncomingCall] Decline error:', e);
      onDecline();
    }
  };

  const isVideo = incomingCall.type === 'video';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-sm rounded-[36px] bg-gradient-to-b from-[#1c1c28] to-[#0f0f15] border border-white/15 p-8 text-center shadow-2xl overflow-hidden flex flex-col items-center"
        >
          {/* Ambient background glow */}
          <div className={`absolute -top-24 w-56 h-56 rounded-full blur-3xl pointer-events-none ${
            isVideo ? 'bg-purple-600/30' : 'bg-emerald-600/25'
          }`} />

          {/* Top Pill / Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[11px] font-semibold text-white/80 mb-6">
            {isVideo ? (
              <>
                <Video className="w-3.5 h-3.5 text-purple-400" />
                <span>Chamada de Vídeo</span>
              </>
            ) : (
              <>
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Chamada de Voz</span>
              </>
            )}
          </div>

          {/* Pulsating Avatar Rings (Instagram Style) */}
          <div className="relative mb-6">
            {/* Outer wave rings */}
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className={`absolute -inset-4 rounded-full border-2 ${
                isVideo ? 'border-purple-500/40' : 'border-emerald-500/40'
              }`}
            />
            <motion.div
              animate={{ scale: [1, 1.25, 1], opacity: [0.8, 0.2, 0.8] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
              className={`absolute -inset-2 rounded-full border-2 ${
                isVideo ? 'border-purple-400/60' : 'border-emerald-400/60'
              }`}
            />

            {/* Avatar image / initials */}
            <div className={`relative w-28 h-28 rounded-full p-1 bg-gradient-to-tr shadow-xl ${
              isVideo 
                ? 'from-purple-600 via-pink-500 to-amber-400' 
                : 'from-emerald-500 via-teal-400 to-cyan-400'
            }`}>
              {incomingCall.caller.photoURL ? (
                <img
                  src={incomingCall.caller.photoURL}
                  alt={incomingCall.caller.name}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full bg-[#121218] rounded-full flex items-center justify-center text-3xl font-black text-white">
                  {incomingCall.caller.name?.charAt(0) || '✝'}
                </div>
              )}
            </div>
          </div>

          {/* Caller Name & Status */}
          <h2 className="text-xl font-bold text-white mb-1 truncate max-w-[240px]">
            {incomingCall.caller.name}
          </h2>
          <p className="text-xs text-white/60 mb-8 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Ligando para você...
          </p>

          {/* Accept / Decline Action Buttons (Instagram Style) */}
          <div className="w-full flex items-center justify-around px-4">
            {/* Decline Button */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleDecline}
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-red-900/40 transition-all border border-red-400/30"
                title="Recusar chamada"
              >
                <PhoneOff className="w-7 h-7" />
              </button>
              <span className="text-xs font-semibold text-white/70">Recusar</span>
            </div>

            {/* Accept Button */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleAccept}
                className={`w-16 h-16 rounded-full active:scale-95 text-white flex items-center justify-center shadow-lg transition-all border ${
                  isVideo 
                    ? 'bg-gradient-to-tr from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 shadow-purple-900/50 border-purple-300/40' 
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/50 border-emerald-300/40'
                }`}
                title="Atender chamada"
              >
                {isVideo ? <Video className="w-7 h-7" /> : <Phone className="w-7 h-7" />}
              </button>
              <span className="text-xs font-semibold text-white">Atender</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
