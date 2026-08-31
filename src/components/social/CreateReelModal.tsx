import React, { useState, useRef } from 'react';
import { X, Film, UploadCloud, Send, Music, Tag, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { createReel } from '../../services/socialService';

interface CreateReelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReelCreated?: () => void;
}

const REEL_PRESETS = [
  {
    title: 'Ministração de Louvor',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-guitarist-playing-acoustic-guitar-41130-large.mp4',
    caption: '🎶 "Tu és Santo, poderoso e digno de todo louvor!" Momento ímpar no culto de celebração.',
    music: 'Santo Espírito És Bem-Vindo Aqui'
  },
  {
    title: 'Palavra Inspiradora',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-man-holding-a-bible-in-the-church-43187-large.mp4',
    caption: '📖 "Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento." — Pv 3:5',
    music: 'Voz da Esperança & Fé'
  },
  {
    title: 'Batismo & Testemunho',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-baptism-in-a-river-in-the-middle-of-nature-43188-large.mp4',
    caption: '🌊 "As coisas velhas já passaram; eis que tudo se fez novo!" Celebração de vidas renascidas em Cristo.',
    music: 'Graça Sobre Graça - Ao Vivo'
  }
];

export default function CreateReelModal({
  isOpen,
  onClose,
  onReelCreated
}: CreateReelModalProps) {
  const [videoUrl, setVideoUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [musicTitle, setMusicTitle] = useState('Louvor & Adoração Oficial');
  const [tagsInput, setTagsInput] = useState('#Culto, #Louvor, #ReelsGospel');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setVideoUrl(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePresetSelect = (preset: typeof REEL_PRESETS[0]) => {
    setVideoUrl(preset.url);
    setCaption(preset.caption);
    setMusicTitle(preset.music);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim()) return;

    setIsSubmitting(true);
    try {
      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      await createReel({
        videoUrl: videoUrl.trim(),
        caption: caption.trim() || 'Momento abençoado na presença do Senhor! 🙏',
        musicTitle: musicTitle.trim() || 'Louvor da Congregação',
        tags: tags.length > 0 ? tags : ['#Ecclesia', '#Louvor']
      });

      if (onReelCreated) onReelCreated();
      onClose();
    } catch (err) {
      console.error('Error creating reel:', err);
      alert('Erro ao publicar Reel. Verifique o vídeo e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-lg bg-[#141419] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Publicar Novo Reel</h3>
              <p className="text-xs text-white/50">Vídeos curtos de pregação, louvor e comunhão</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 scrollbar-hide">
          {/* Video Preview / Upload Area */}
          <div className="relative w-full aspect-[9/16] max-h-[280px] bg-black/60 border border-dashed border-white/20 rounded-2xl overflow-hidden flex flex-col items-center justify-center mx-auto">
            {videoUrl ? (
              <>
                <video
                  src={videoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setVideoUrl('')}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-black/70 text-white hover:bg-black transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-3 p-6 text-center cursor-pointer hover:scale-105 transition-transform"
              >
                <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 group-hover:text-white transition-all">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Carregar Arquivo de Vídeo</p>
                  <p className="text-xs text-white/50 mt-1">Aceita todos os formatos (MP4, MOV, WebM, AVI, MKV...)</p>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,.mp4,.mov,.webm,.mkv,.avi,.3gp,.m4v,.wmv,.flv,.ogv,.ts"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Quick Video Presets */}
          <div>
            <span className="text-xs font-semibold text-white/70 block mb-2">Ou selecione um vídeo modelo para testar:</span>
            <div className="grid grid-cols-3 gap-2">
              {REEL_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePresetSelect(p)}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-amber-400/50 text-left transition-all group"
                >
                  <Film className="w-4 h-4 text-amber-400 mb-1" />
                  <p className="text-[11px] font-bold text-white leading-tight truncate">{p.title}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Paste Video URL */}
          <div>
            <label className="text-xs font-medium text-white/70 block mb-1.5">Ou cole o link direto do vídeo (MP4):</label>
            <input
              type="url"
              placeholder="https://.../video.mp4"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/40 outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Caption */}
          <div>
            <label className="text-xs font-medium text-white/70 block mb-1.5">Descrição do Reel:</label>
            <textarea
              rows={2}
              placeholder="Descreva a mensagem ou momento do vídeo..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/40 outline-none focus:border-purple-500 resize-none transition-colors"
            />
          </div>

          {/* Music Title */}
          <div>
            <label className="text-xs font-medium text-white/70 flex items-center gap-1.5 mb-1.5">
              <Music className="w-3.5 h-3.5 text-amber-300" />
              Faixa / Música de Fundo:
            </label>
            <input
              type="text"
              placeholder="Ex: Porque Ele Vive - Harpa Cristã"
              value={musicTitle}
              onChange={(e) => setMusicTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/40 outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-medium text-white/70 flex items-center gap-1.5 mb-1.5">
              <Tag className="w-3.5 h-3.5 text-blue-300" />
              Hashtags (separadas por vírgula):
            </label>
            <input
              type="text"
              placeholder="#Culto, #Louvor, #Palavra"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/40 outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-xs font-bold text-white/70 hover:text-white hover:bg-white/5 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!videoUrl.trim() || isSubmitting}
              className="px-6 py-2.5 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-xs font-bold text-white flex items-center gap-2 shadow-lg active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Publicando...' : 'Publicar Reel'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
