import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Heart, 
  Send, 
  Mic, 
  Square, 
  Check, 
  Sparkles, 
  Volume2, 
  AlertCircle,
  HelpCircle,
  Flame,
  Tag,
  Image as ImageIcon,
  Film,
  Link as LinkIcon,
  MapPin,
  Plus,
  Trash2,
  Radio,
  Church,
  Globe,
  UploadCloud
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../lib/firebase';
import { addDoc, collection, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { VoiceRecorder, RecordedAudio } from '../services/audioRecorder';
import VoicePrayerPlayer from './VoicePrayerPlayer';

interface CreatePrayerPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
}

const FEED_CATEGORIES = [
  { id: 'culto', label: '📸 Relato de Culto', desc: 'Fotos, testemunhos e momentos dos cultos e eventos da igreja' },
  { id: 'noticia', label: '🌍 Notícia do Mundo Gospel', desc: 'Acontecimentos, missões e avivamentos no Brasil e no mundo' },
  { id: 'video', label: '🎥 Vídeo & Louvor', desc: 'Vídeos de ministrações, batismos, louvores e vigílias' },
  { id: 'oracao', label: '🙏 Pedido de Oração', desc: 'Clamor de intercessão e apoio espiritual da congregação' },
  { id: 'saude', label: '🩺 Saúde & Cura', desc: 'Enfermidades, cirurgias, restabelecimento' },
  { id: 'familia', label: '🏡 Família & Lar', desc: 'Casamento, filhos, reconciliação' },
  { id: 'financas', label: '💼 Trabalho & Provisão', desc: 'Emprego, negócios, causas financeiras' },
  { id: 'espiritual', label: '🕊️ Vida Espiritual', desc: 'Libertação, fé, avivamento, santidade' },
  { id: 'urgente', label: '🚨 Causa Urgente', desc: 'Casos emergenciais que necessitam de clamor imediato' },
  { id: 'agradecimento', label: '🎉 Testemunho & Vitória', desc: 'Agradecer por milagres e orações respondidas' },
];

export default function CreatePrayerPostModal({
  isOpen,
  onClose,
  onPostCreated
}: CreatePrayerPostModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('culto');
  const [location, setLocation] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Active composer media tab: 'text' | 'photos' | 'video' | 'audio'
  const [activeMediaTab, setActiveMediaTab] = useState<'text' | 'photos' | 'video' | 'audio'>('text');

  // Photo Upload States (supports multiple photos)
  const [photosList, setPhotosList] = useState<string[]>([]);
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const photoFileInputRef = useRef<HTMLInputElement | null>(null);

  // Video Upload States
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFileInput, setVideoFileInput] = useState<string | null>(null);
  const videoFileInputRef = useRef<HTMLInputElement | null>(null);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState<RecordedAudio | null>(null);
  const recorderRef = useRef<VoiceRecorder | null>(null);
  const timerIntervalRef = useRef<any>(null);

  if (!isOpen) return null;

  // Handle Photo File Upload
  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setPhotosList(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddPhotoUrl = () => {
    if (photoUrlInput.trim()) {
      setPhotosList(prev => [...prev, photoUrlInput.trim()]);
      setPhotoUrlInput('');
    }
  };

  const handleRemovePhoto = (idx: number) => {
    setPhotosList(prev => prev.filter((_, i) => i !== idx));
  };

  // Handle Video File Upload
  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setVideoFileInput(reader.result as string);
        setVideoUrl('');
      }
    };
    reader.readAsDataURL(file);
  };

  // Voice Recording Functions
  const startRecording = async () => {
    try {
      const recorder = new VoiceRecorder();
      recorderRef.current = recorder;
      await recorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone error:', err);
      alert('Permissão de microfone não concedida. Por favor, permita o acesso ao áudio no navegador.');
    }
  };

  const stopRecording = async () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (!recorderRef.current) return;

    try {
      const audioResult = await recorderRef.current.stop();
      setRecordedAudio(audioResult);
      setIsRecording(false);
    } catch (err) {
      console.error('Error stopping recorder:', err);
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (recorderRef.current) recorderRef.current.cancel();
    setIsRecording(false);
    setRecordedAudio(null);
    setRecordingDuration(0);
  };

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert('Faça login para publicar no feed da igreja.');
      return;
    }

    if (!content.trim() && !recordedAudio && photosList.length === 0 && !videoUrl && !videoFileInput) {
      alert('Por favor, escreva um relato, adicione fotos/vídeos ou grave um áudio.');
      return;
    }

    setIsSubmitting(true);

    // Extract tags
    const tags = tagsInput
      .split(/[\s,]+/)
      .filter(t => t.trim().length > 0)
      .map(t => t.startsWith('#') ? t : `#${t}`);

    const finalVideoUrl = videoFileInput || videoUrl.trim();
    const isYt = finalVideoUrl.includes('youtube.com') || finalVideoUrl.includes('youtu.be');

    try {
      // Fetch latest user profile from Firestore if available
      let authorName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Irmão em Cristo';
      let authorPhoto = currentUser.photoURL || '';
      let authorMinistry = 'Membro';

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const uData = userDoc.data();
          if (uData.displayName || uData.name) authorName = uData.displayName || uData.name;
          if (uData.photoURL || uData.avatarUrl) authorPhoto = uData.photoURL || uData.avatarUrl;
          if (uData.ministryRole) authorMinistry = uData.ministryRole;
        }
      } catch (err) {
        console.debug('User profile doc fetch notice:', err);
      }

      await addDoc(collection(db, 'prayers'), {
        userId: currentUser.uid,
        userName: authorName,
        userRole: currentUser.email === 'rudson.p48@gmail.com' ? 'Administrador' : authorMinistry,
        userPhoto: authorPhoto,
        title: title.trim() || content.trim().slice(0, 45) + (content.length > 45 ? '...' : ''),
        content: content.trim() || 'Confira a publicação e fotos/vídeos acima! 🙌',
        category,
        location: location.trim() || (category === 'culto' ? 'Templo Sede' : ''),
        tags: tags.length > 0 ? tags : (category === 'culto' ? ['#Culto', '#Igreja'] : ['#Comunidade']),
        isAnonymous: isAnonymous && category !== 'culto' && category !== 'noticia',
        likes: [],
        commentsCount: 0,
        imageUrl: photosList.length > 0 ? photosList[0] : '',
        imageUrls: photosList,
        videoUrl: finalVideoUrl,
        videoType: isYt ? 'youtube' : finalVideoUrl ? 'file' : undefined,
        audioUrl: recordedAudio ? recordedAudio.dataUrl : '',
        audioDuration: recordedAudio ? recordedAudio.durationSeconds : 0,
        answered: category === 'agradecimento',
        testimony: category === 'agradecimento' ? content.trim() : '',
        createdAt: serverTimestamp(),
        createdAtIso: new Date().toISOString(),
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setTitle('');
        setContent('');
        setPhotosList([]);
        setVideoUrl('');
        setVideoFileInput(null);
        setRecordedAudio(null);
        setLocation('');
        setTagsInput('');
        setIsAnonymous(false);
        if (onPostCreated) onPostCreated();
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Error creating post:', err);
      alert('Erro ao publicar post. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-2xl bg-[#14141A] border border-white/15 rounded-[32px] p-6 sm:p-8 shadow-2xl relative my-8"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-purple-950/50 shrink-0">
            <Sparkles className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight">
              Criar Publicação no Feed
            </h3>
            <p className="text-xs text-white/50">
              Compartilhe fotos dos cultos, notícias do mundo gospel, vídeos, orações e vitórias
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Category Selector Reel */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-purple-400" />
              Tipo de Post / Categoria
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
              {FEED_CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`p-2.5 rounded-xl text-left border text-xs font-bold transition-all flex flex-col justify-between ${
                    category === cat.id
                      ? 'bg-purple-600/20 border-purple-500 text-purple-200 shadow-md'
                      : 'bg-black/30 border-white/10 text-white/70 hover:text-white hover:border-white/20'
                  }`}
                >
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Post Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
              Título da Publicação (Opcional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Noite de Avivamento no Culto de Domingo! ou Notícia Missionária no Sertão"
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Main Description Textarea */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
              Relato, Notícia ou Motivo do Clamor *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva sobre o que aconteceu no culto, novidades do mundo cristão, detalhes da oração ou palavras de encorajamento..."
              rows={4}
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-purple-500 transition-colors resize-none leading-relaxed"
            />
          </div>

          {/* Media Attachment Selector Tabs */}
          <div className="space-y-3 p-4 rounded-2xl bg-black/30 border border-white/10">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-white/70">
                Anexar Mídias ao Post:
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveMediaTab('photos')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    activeMediaTab === 'photos' || photosList.length > 0
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/5 hover:bg-white/10 text-white/70'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Fotos {photosList.length > 0 && `(${photosList.length})`}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMediaTab('video')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    activeMediaTab === 'video' || videoUrl || videoFileInput
                      ? 'bg-rose-600 text-white'
                      : 'bg-white/5 hover:bg-white/10 text-white/70'
                  }`}
                >
                  <Film className="w-3.5 h-3.5" />
                  Vídeo
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMediaTab('audio')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    activeMediaTab === 'audio' || recordedAudio
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white/5 hover:bg-white/10 text-white/70'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  Áudio
                </button>
              </div>
            </div>

            {/* TAB: Photos Attachment */}
            {activeMediaTab === 'photos' && (
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="file"
                    ref={photoFileInputRef}
                    accept="image/*"
                    multiple
                    onChange={handlePhotoFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => photoFileInputRef.current?.click()}
                    className="flex-1 py-3 px-4 rounded-xl border border-dashed border-purple-500/40 hover:border-purple-500 bg-purple-500/10 hover:bg-purple-500/20 text-purple-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <UploadCloud className="w-4 h-4 text-purple-400" />
                    Enviar Fotos do Celular/PC
                  </button>

                  <div className="flex items-center gap-1 flex-1">
                    <input
                      type="url"
                      value={photoUrlInput}
                      onChange={(e) => setPhotoUrlInput(e.target.value)}
                      placeholder="Ou cole URL da foto..."
                      className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddPhotoUrl}
                      className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Photos Previews Grid */}
                {photosList.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2">
                    {photosList.map((photo, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-white/20 group">
                        <img src={photo} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(i)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-black/80 text-white hover:text-red-400 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: Video Attachment */}
            {activeMediaTab === 'video' && (
              <div className="space-y-3 pt-2">
                <input
                  type="file"
                  ref={videoFileInputRef}
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={handleVideoFileUpload}
                  className="hidden"
                />

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => videoFileInputRef.current?.click()}
                    className="flex-1 py-3 px-4 rounded-xl border border-dashed border-rose-500/40 hover:border-rose-500 bg-rose-500/10 hover:bg-rose-500/20 text-rose-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <UploadCloud className="w-4 h-4 text-rose-400" />
                    Enviar Arquivo de Vídeo (MP4/WebM)
                  </button>

                  <div className="flex items-center gap-1 flex-1">
                    <input
                      type="url"
                      value={videoUrl}
                      onChange={(e) => {
                        setVideoUrl(e.target.value);
                        setVideoFileInput(null);
                      }}
                      placeholder="Link YouTube/Vimeo/Reels..."
                      className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                {/* Video Preview */}
                {(videoFileInput || videoUrl) && (
                  <div className="relative rounded-xl overflow-hidden border border-rose-500/30 bg-black/60 p-3 flex items-center justify-between">
                    <span className="text-xs text-rose-200 flex items-center gap-2 truncate">
                      <Film className="w-4 h-4 text-rose-400 shrink-0" />
                      {videoFileInput ? 'Vídeo carregado com sucesso' : videoUrl}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setVideoFileInput(null);
                        setVideoUrl('');
                      }}
                      className="text-white/50 hover:text-white text-xs p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB: Audio Recording */}
            {activeMediaTab === 'audio' && (
              <div className="pt-2">
                {!recordedAudio && !isRecording && (
                  <div className="text-center py-4 space-y-2">
                    <button
                      type="button"
                      onClick={startRecording}
                      className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 mx-auto shadow-lg active:scale-95 transition-all"
                    >
                      <Mic className="w-4 h-4" />
                      Iniciar Gravação de Voz
                    </button>
                    <p className="text-[11px] text-white/40">Grave até 2 minutos de clamor ou mensagem falada</p>
                  </div>
                )}

                {isRecording && (
                  <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                      <span className="text-xs font-bold text-rose-200">Gravando áudio de oração... ({recordingDuration}s)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={cancelRecording}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="px-4 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5"
                      >
                        <Square className="w-3.5 h-3.5 fill-current" />
                        Concluir
                      </button>
                    </div>
                  </div>
                )}

                {recordedAudio && (
                  <div className="space-y-2">
                    <VoicePrayerPlayer
                      audioUrl={recordedAudio.dataUrl}
                      duration={recordedAudio.durationSeconds}
                      authorName="Seu áudio gravado"
                    />
                    <button
                      type="button"
                      onClick={cancelRecording}
                      className="text-xs text-rose-400 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Descartar e gravar novamente
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Location and Tags Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-white/50 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-purple-400" /> Local / Evento
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Templo Sede, Culto de Jovens, Chácara"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-white/50 mb-1 flex items-center gap-1">
                <Tag className="w-3 h-3 text-purple-400" /> Hashtags
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Ex: #Culto #Louvor #Avivamento #Testemunho"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Anonymous checkbox */}
          {category !== 'culto' && category !== 'noticia' && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isAnonPost"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-black/50 accent-purple-600"
              />
              <label htmlFor="isAnonPost" className="text-xs text-white/70 cursor-pointer">
                Publicar anonimamente (apenas para pedidos de oração confidenciais)
              </label>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || success}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-purple-950/50 disabled:opacity-50 transition-all active:scale-98"
            >
              {success ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  Publicado com Sucesso no Feed!
                </>
              ) : isSubmitting ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                  Publicando no Feed...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Publicar no Feed da Igreja
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
