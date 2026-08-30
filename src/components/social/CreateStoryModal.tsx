import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Film, UploadCloud, Send, Sparkles, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../../lib/firebase';
import { createStory } from '../../services/socialService';

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoryCreated?: () => void;
}

export default function CreateStoryModal({
  isOpen,
  onClose,
  onStoryCreated
}: CreateStoryModalProps) {
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    setMediaType(isVideo ? 'video' : 'image');

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setMediaUrl(reader.result as string);
        setPreviewError(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePresetSelect = (url: string, type: 'image' | 'video', presetCaption: string) => {
    setMediaUrl(url);
    setMediaType(type);
    setCaption(presetCaption);
    setPreviewError(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUrl.trim()) return;

    setIsSubmitting(true);
    try {
      await createStory({
        mediaUrl: mediaUrl.trim(),
        mediaType,
        caption: caption.trim()
      });

      if (onStoryCreated) onStoryCreated();
      onClose();
    } catch (err) {
      console.error('Error creating story:', err);
      alert('Erro ao publicar Story. Verifique a conexão e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const STORY_PRESETS = [
    {
      title: 'Momento de Louvor',
      type: 'image' as const,
      url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800',
      caption: '🎶 Adorando a Deus em espírito e em verdade! Culto abençoado de domingo.'
    },
    {
      title: 'Versículo do Dia',
      type: 'image' as const,
      url: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800',
      caption: '📖 "O Senhor é o meu pastor e nada me faltará." — Salmos 23:1'
    },
    {
      title: 'Comunhão & Célula',
      type: 'image' as const,
      url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800',
      caption: '☕ Noite incrível de comunhão e fortalecimento espiritual da nossa célula!'
    }
  ];

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
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Criar Novo Story</h3>
              <p className="text-xs text-white/50">Compartilhe momentos da sua fé com os irmãos (24h)</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 scrollbar-hide">
          {/* Media Preview Box */}
          <div className="relative w-full aspect-[9/16] max-h-[320px] bg-black/50 border border-dashed border-white/20 rounded-2xl overflow-hidden flex flex-col items-center justify-center group mx-auto">
            {mediaUrl ? (
              <>
                {mediaType === 'video' ? (
                  <video
                    src={mediaUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={mediaUrl}
                    alt="Story Preview"
                    onError={() => setPreviewError(true)}
                    className="w-full h-full object-cover"
                  />
                )}
                {/* Overlay remove button */}
                <button
                  type="button"
                  onClick={() => setMediaUrl('')}
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
                <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 group-hover:text-white group-hover:border-white/30 transition-all">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Carregar Foto ou Vídeo</p>
                  <p className="text-xs text-white/50 mt-1">Toque para selecionar da galeria ou câmera</p>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Preset Suggestions */}
          <div>
            <span className="text-xs font-semibold text-white/70 block mb-2">Sugestões rápidas de fotos:</span>
            <div className="grid grid-cols-3 gap-2">
              {STORY_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePresetSelect(preset.url, preset.type, preset.caption)}
                  className="relative rounded-xl overflow-hidden aspect-video border border-white/10 hover:border-amber-400/50 group text-left transition-all"
                >
                  <img src={preset.url} alt={preset.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-1.5 flex items-end">
                    <span className="text-[10px] font-bold text-white leading-tight truncate">{preset.title}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Or Paste URL */}
          <div>
            <label className="text-xs font-medium text-white/70 block mb-1.5">Ou cole o link direto da imagem/vídeo:</label>
            <input
              type="url"
              placeholder="https://..."
              value={mediaUrl}
              onChange={(e) => {
                setMediaUrl(e.target.value);
                setPreviewError(false);
              }}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/40 outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Caption Input */}
          <div>
            <label className="text-xs font-medium text-white/70 block mb-1.5">Legenda ou mensagem do Story (opcional):</label>
            <textarea
              rows={2}
              placeholder="O que Deus colocou no seu coração hoje?..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/40 outline-none focus:border-purple-500 resize-none transition-colors"
            />
          </div>

          {/* Submit Actions */}
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
              disabled={!mediaUrl.trim() || isSubmitting}
              className="px-6 py-2.5 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-xs font-bold text-white flex items-center gap-2 shadow-lg hover:shadow-rose-500/25 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Publicando...' : 'Compartilhar Story'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
