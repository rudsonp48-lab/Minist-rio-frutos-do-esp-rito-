import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Send, Play, Pause, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VoiceMessageRecorderProps {
  onSendVoice: (audioUrl: string, duration: number) => void;
  onCancel: () => void;
}

export default function VoiceMessageRecorder({ onSendVoice, onCancel }: VoiceMessageRecorderProps) {
  const [isRecording, setIsRecording] = useState(true);
  const [recordTime, setRecordTime] = useState(0);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<any>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    startRecording();

    return () => {
      stopStreams();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const stopStreams = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startRecording = async () => {
    try {
      setErrorMsg(null);
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          setAudioBlobUrl(base64Audio);
        };
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordTime(0);

      timerRef.current = setInterval(() => {
        setRecordTime(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Error accessing microphone:', err);
      setErrorMsg('Não foi possível acessar o microfone. Verifique as permissões do navegador.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    stopStreams();
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
  };

  const handleSend = () => {
    if (audioBlobUrl) {
      onSendVoice(audioBlobUrl, Math.max(1, recordTime));
    }
  };

  const handlePreviewPlay = () => {
    if (!previewAudioRef.current && audioBlobUrl) {
      const audio = new Audio(audioBlobUrl);
      previewAudioRef.current = audio;

      audio.ontimeupdate = () => {
        if (audio.duration) {
          setPreviewProgress((audio.currentTime / audio.duration) * 100);
        }
      };

      audio.onended = () => {
        setIsPlayingPreview(false);
        setPreviewProgress(0);
      };
    }

    if (previewAudioRef.current) {
      if (isPlayingPreview) {
        previewAudioRef.current.pause();
        setIsPlayingPreview(false);
      } else {
        previewAudioRef.current.play();
        setIsPlayingPreview(true);
      }
    }
  };

  const formatSeconds = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (errorMsg) {
    return (
      <div className="flex items-center justify-between p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs w-full">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
        <button
          onClick={onCancel}
          className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-white font-bold"
        >
          Fechar
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 w-full bg-gradient-to-r from-purple-950/80 via-[#1C172E] to-black p-2.5 rounded-2xl border border-purple-500/40 shadow-xl">
      {isRecording ? (
        <>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
            <span className="text-xs font-mono font-bold text-rose-400">
              Gravando Áudio: {formatSeconds(recordTime)}
            </span>

            {/* Waveform Animation */}
            <div className="flex items-center gap-0.5 ml-2 h-4 flex-1 max-w-[120px]">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((bar) => (
                <div
                  key={bar}
                  className="w-1 bg-purple-400 rounded-full animate-pulse"
                  style={{
                    height: `${Math.max(20, Math.sin(bar + recordTime) * 100)}%`,
                    animationDuration: '0.4s'
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={stopRecording}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              Concluir
            </button>
            <button
              onClick={onCancel}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2.5 flex-1">
            <button
              onClick={handlePreviewPlay}
              className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white shrink-0 active:scale-95 shadow-md"
            >
              {isPlayingPreview ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
            </button>

            <div className="flex-1">
              <div className="flex justify-between text-[11px] font-mono text-purple-300 font-bold mb-1">
                <span>Áudio de Clamor</span>
                <span>{formatSeconds(recordTime)}</span>
              </div>
              <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-emerald-400 rounded-full transition-all"
                  style={{ width: `${previewProgress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white"
              title="Descartar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleSend}
              disabled={!audioBlobUrl}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              Enviar Áudio
            </button>
          </div>
        </>
      )}
    </div>
  );
}
