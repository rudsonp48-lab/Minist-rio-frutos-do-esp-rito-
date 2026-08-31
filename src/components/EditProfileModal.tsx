import React, { useState, useRef } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  Link as LinkIcon, 
  Check, 
  Sparkles, 
  User, 
  Phone, 
  BookOpen, 
  Heart, 
  ShieldCheck, 
  Loader2, 
  Image as ImageIcon 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { compressAvatar, CHRISTIAN_AVATAR_PRESETS } from '../lib/imageUtils';
import { saveUserProfile, UserProfileData } from '../services/userService';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    displayName?: string;
    photoURL?: string;
    bio?: string;
    ministryRole?: string;
    phoneNumber?: string;
    favoriteVerse?: string;
    email?: string;
  };
  onProfileUpdated?: (updatedData: Partial<UserProfileData>) => void;
}

const MINISTRY_OPTIONS = [
  'Membro da Congregação',
  'Ministério de Louvor & Adoração',
  'Líder de Célula / Pequeno Grupo',
  'Ministério de Intercessão & Oração',
  'Diaconia & Recepção',
  'Juventude & Adolescentes',
  'Ensino & Escola Bíblica (EBD)',
  'Mídia, Som & Transmissão',
  'Missões & Ação Social',
  'Corpo Pastoral & Presbíteros'
];

export default function EditProfileModal({
  isOpen,
  onClose,
  initialData,
  onProfileUpdated
}: EditProfileModalProps) {
  const [displayName, setDisplayName] = useState(initialData?.displayName || '');
  const [photoURL, setPhotoURL] = useState(initialData?.photoURL || '');
  const [bio, setBio] = useState(initialData?.bio || '');
  const [ministryRole, setMinistryRole] = useState(initialData?.ministryRole || 'Membro da Congregação');
  const [phoneNumber, setPhoneNumber] = useState(initialData?.phoneNumber || '');
  const [favoriteVerse, setFavoriteVerse] = useState(initialData?.favoriteVerse || '');
  
  const [photoMode, setPhotoMode] = useState<'upload' | 'preset' | 'url'>('upload');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with initial data when modal opens
  React.useEffect(() => {
    if (isOpen && initialData) {
      setDisplayName(initialData.displayName || '');
      setPhotoURL(initialData.photoURL || '');
      setBio(initialData.bio || '');
      setMinistryRole(initialData.ministryRole || 'Membro da Congregação');
      setPhoneNumber(initialData.phoneNumber || '');
      setFavoriteVerse(initialData.favoriteVerse || '');
      setErrorMessage(null);
      setSuccessMessage(false);
    }
  }, [isOpen, initialData]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsCompressing(true);
      setErrorMessage(null);
      try {
        const compressedBase64 = await compressAvatar(file, 320, 0.8);
        setPhotoURL(compressedBase64);
      } catch (err: any) {
        console.error('Error processing avatar:', err);
        setErrorMessage('Não foi possível processar a imagem. Tente outra foto.');
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleApplyUrl = () => {
    if (customUrlInput.trim()) {
      setPhotoURL(customUrlInput.trim());
      setCustomUrlInput('');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setErrorMessage('Por favor, informe seu nome.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      await saveUserProfile({
        displayName: displayName.trim(),
        photoURL: photoURL.trim(),
        bio: bio.trim(),
        ministryRole: ministryRole.trim(),
        phoneNumber: phoneNumber.trim(),
        favoriteVerse: favoriteVerse.trim()
      });

      if (onProfileUpdated) {
        onProfileUpdated({
          displayName: displayName.trim(),
          name: displayName.trim(),
          photoURL: photoURL.trim(),
          avatarUrl: photoURL.trim(),
          bio: bio.trim(),
          ministryRole: ministryRole.trim(),
          phoneNumber: phoneNumber.trim(),
          favoriteVerse: favoriteVerse.trim()
        });
      }

      setSuccessMessage(true);
      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 700);
    } catch (err: any) {
      console.error('Erro ao salvar perfil:', err);
      setErrorMessage('Erro ao salvar as informações. Tente novamente.');
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-xl bg-[#121216] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl relative my-8"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[var(--theme-color)]/20 border border-[var(--theme-color)]/30 flex items-center justify-center text-[var(--theme-color)]">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight font-serif" style={{ fontFamily: '"Playfair Display", serif' }}>
                  Editar Perfil & Foto
                </h3>
                <p className="text-xs text-white/50">Atualize seu nome, foto e testemunho</p>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={isSaving}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto scrollbar-hide">
            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-300 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            {/* Avatar Preview & Selection */}
            <div className="bg-black/40 border border-white/5 rounded-3xl p-5 space-y-4">
              <label className="block text-xs font-bold text-white uppercase tracking-wider">
                Foto de Perfil
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-5">
                {/* Avatar Preview Circle */}
                <div className="relative shrink-0">
                  {photoURL ? (
                    <img 
                      src={photoURL} 
                      alt="Prévia do Perfil" 
                      className="w-24 h-24 rounded-full object-cover border-2 border-[var(--theme-color)] shadow-xl"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-700 to-indigo-600 border-2 border-[var(--theme-color)] flex items-center justify-center shadow-xl">
                      <User className="w-10 h-10 text-white" />
                    </div>
                  )}

                  {isCompressing && (
                    <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-xs">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                </div>

                {/* Photo selection tabs */}
                <div className="flex-1 w-full space-y-3">
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/50 rounded-2xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => setPhotoMode('upload')}
                      className={`py-1.5 text-xs font-semibold rounded-xl transition-all ${
                        photoMode === 'upload' ? 'bg-[var(--theme-color)] text-white shadow-md' : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Galeria / Foto
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoMode('preset')}
                      className={`py-1.5 text-xs font-semibold rounded-xl transition-all ${
                        photoMode === 'preset' ? 'bg-[var(--theme-color)] text-white shadow-md' : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Avatares
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoMode('url')}
                      className={`py-1.5 text-xs font-semibold rounded-xl transition-all ${
                        photoMode === 'url' ? 'bg-[var(--theme-color)] text-white shadow-md' : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Link Web
                    </button>
                  </div>

                  {/* Mode 1: Upload from device */}
                  {photoMode === 'upload' && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 py-2.5 px-4 bg-white/10 hover:bg-white/15 border border-white/15 rounded-2xl text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors active:scale-95"
                      >
                        <Camera className="w-4 h-4 text-[var(--theme-color)]" />
                        Escolher Foto do Aparelho
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*,.jpg,.jpeg,.png,.gif,.webp,.heic,.heif,.avif,.bmp,.svg"
                        className="hidden"
                      />
                    </div>
                  )}

                  {/* Mode 2: Preset avatars */}
                  {photoMode === 'preset' && (
                    <div className="space-y-2">
                      <p className="text-[11px] text-white/50">Toque em um avatar para selecionar:</p>
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {CHRISTIAN_AVATAR_PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setPhotoURL(preset.url)}
                            className={`relative shrink-0 rounded-full p-0.5 border-2 transition-all ${
                              photoURL === preset.url ? 'border-[var(--theme-color)] scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                            }`}
                            title={preset.label}
                          >
                            <img src={preset.url} alt={preset.label} className="w-10 h-10 rounded-full object-cover" />
                            {photoURL === preset.url && (
                              <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-0.5 text-white">
                                <Check className="w-2.5 h-2.5" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mode 3: Direct URL */}
                  {photoMode === 'url' && (
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://exemplo.com/sua-foto.jpg"
                        value={customUrlInput}
                        onChange={(e) => setCustomUrlInput(e.target.value)}
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[var(--theme-color)]"
                      />
                      <button
                        type="button"
                        onClick={handleApplyUrl}
                        className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors"
                      >
                        Aplicar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Name Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[var(--theme-color)]" />
                Nome Completo / Como deseja ser chamado *
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Seu nome completo"
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[var(--theme-color)] transition-colors"
              />
            </div>

            {/* Ministry / Role */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                Ministério / Área de Atuação na Igreja
              </label>
              <select
                value={ministryRole}
                onChange={(e) => setMinistryRole(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--theme-color)] transition-colors"
              >
                {MINISTRY_OPTIONS.map((m) => (
                  <option key={m} value={m} className="bg-[#1C1C1E] text-white">
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Favorite Bible Verse / Motto */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                Versículo Favorito / Lema de Fé
              </label>
              <input
                type="text"
                value={favoriteVerse}
                onChange={(e) => setFavoriteVerse(e.target.value)}
                placeholder="Ex: Filipenses 4:13 - Tudo posso naquele que me fortalece"
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[var(--theme-color)] transition-colors"
              />
            </div>

            {/* Bio / Testimony */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                Biografia Breve / Testemunho
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                placeholder="Escreva uma breve apresentação ou saudação cristã..."
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[var(--theme-color)] transition-colors resize-none"
              />
            </div>

            {/* Contact / WhatsApp */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-400" />
                Telefone / WhatsApp (Opcional)
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="(00) 00000-0000"
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[var(--theme-color)] transition-colors"
              />
            </div>

            {/* Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isSaving || isCompressing}
                className="px-6 py-3 rounded-2xl bg-[var(--theme-color)] hover:brightness-110 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-[var(--theme-color)]/30 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : successMessage ? (
                  <>
                    <Check className="w-4 h-4" />
                    Salvo com Sucesso!
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
