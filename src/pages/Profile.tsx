import { User, signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { 
  LogOut, 
  User as UserIcon, 
  Settings, 
  Heart, 
  Image as ImageIcon, 
  Bell, 
  ChevronRight, 
  ShieldCheck, 
  Trophy, 
  Camera, 
  Loader2, 
  Sparkles, 
  Flame, 
  BookOpen, 
  Award, 
  CheckCircle2, 
  Calendar,
  Share2,
  Edit3,
  Check
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { compressAvatar } from '../lib/imageUtils';
import { saveUserProfile, subscribeToUserProfile, UserProfileData } from '../services/userService';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import NotificationCenter from '../components/NotificationCenter';
import EditProfileModal from '../components/EditProfileModal';

interface ProfileProps {
  user: User;
}

interface Achievement {
  id: string;
  title: string;
  desc: string;
  icon: string;
  unlocked: boolean;
  progress: string;
}

export default function Profile({ user }: ProfileProps) {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [xp, setXp] = useState(0);
  const [prayerCount, setPrayerCount] = useState(0);
  
  // Real-time Firestore Profile State
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleLogout = () => {
    signOut(auth);
  };

  useEffect(() => {
    if (!user) return;

    // Subscribe to user's extended profile data in Firestore
    const unsubProfile = subscribeToUserProfile(user.uid, (data) => {
      if (data) {
        setProfileData(data);
      }
    });

    const qNotes = query(collection(db, 'notes'), where('userId', '==', user.uid));
    const unsubNotes = onSnapshot(qNotes, (snapshot) => {
      const total = snapshot.docs.reduce((acc, doc) => acc + (doc.data().xp || 0), 0);
      setXp(total);
    });

    const qPrayers = query(collection(db, 'prayers'), where('userId', '==', user.uid));
    const unsubPrayers = onSnapshot(qPrayers, (snapshot) => {
      setPrayerCount(snapshot.docs.length);
    });

    return () => {
      unsubProfile();
      unsubNotes();
      unsubPrayers();
    };
  }, [user.uid]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploading(true);
      try {
        const compressedBase64 = await compressAvatar(file, 320, 0.8);
        await saveUserProfile({
          displayName: profileData?.displayName || user.displayName || user.email?.split('@')[0] || 'Irmão em Cristo',
          photoURL: compressedBase64
        });
        setProfileData(prev => ({
          ...(prev || {
            uid: user.uid,
            name: user.displayName || '',
            displayName: user.displayName || '',
            email: user.email || ''
          }),
          photoURL: compressedBase64,
          avatarUrl: compressedBase64
        }));
        showToast('Foto de perfil atualizada com sucesso! ✨');
      } catch (error) {
        console.error("Erro ao atualizar foto de perfil:", error);
        showToast('Erro ao atualizar foto. Tente novamente.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const currentDisplayName = profileData?.displayName || profileData?.name || user.displayName || 'Membro da Igreja';
  const currentPhotoURL = profileData?.photoURL || profileData?.avatarUrl || user.photoURL || '';
  const currentMinistry = profileData?.ministryRole || 'Membro da Congregação';
  const currentBio = profileData?.bio || '';
  const currentVerse = profileData?.favoriteVerse || '';

  const getLevel = (xpVal: number) => Math.floor(xpVal / 100) + 1;
  const currentLevel = getLevel(xp);
  const nextLevelXp = currentLevel * 100;
  const currentLevelProgress = xp % 100;

  const achievements: Achievement[] = [
    {
      id: 'intercessor',
      title: 'Sentinela de Oração',
      desc: 'Publicou ou intercedeu por mais de 5 pedidos de oração',
      icon: '🙏',
      unlocked: prayerCount >= 1 || xp >= 30,
      progress: `${Math.min(prayerCount, 5)}/5 Pedidos`
    },
    {
      id: 'bereano',
      title: 'Estudioso Bereano',
      desc: 'Registrou anotações e estudos bíblicos no app',
      icon: '📖',
      unlocked: xp >= 50,
      progress: `${xp}/100 XP`
    },
    {
      id: 'servo',
      title: 'Servo Dedicado',
      desc: 'Participação ativa nas escalas e ministérios da igreja',
      icon: '🛡️',
      unlocked: true,
      progress: 'Ativo'
    },
    {
      id: 'comunhao',
      title: 'Vida em Célula',
      desc: 'Conectado a um pequeno grupo e participando da comunhão',
      icon: '🕊️',
      unlocked: true,
      progress: 'Conectado'
    }
  ];

  const [isFlipped, setIsFlipped] = useState(false);
  const memberRegistrationId = `MEM-${(user.uid || '000000').slice(0, 6).toUpperCase()}-2026`;

  return (
    <div className="min-h-screen bg-transparent w-full text-white font-sans max-w-4xl mx-auto px-4 sm:px-6 pb-32">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#1C1C1E] border border-emerald-500/40 text-emerald-300 px-5 py-3 rounded-full shadow-2xl flex items-center gap-2 text-xs font-bold"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar with Notifications & Edit Action */}
      <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-3xl border-b border-white/5 py-4 px-0 flex items-center justify-between mb-8 shadow-2xl">
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-serif font-bold tracking-wider text-white uppercase" style={{ fontFamily: '"Playfair Display", serif' }}>
            Meu Perfil
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="px-3.5 py-2 rounded-full bg-[var(--theme-color)] hover:brightness-110 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-[var(--theme-color)]/20 active:scale-95 transition-transform"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Editar Perfil</span>
          </button>
          <NotificationCenter />
          <Link
            to="/settings"
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
          >
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </header>

      {/* ========================================================= */}
      {/* CARTEIRINHA DIGITAL ECLESIÁSTICA DE MEMBRO               */}
      {/* ========================================================= */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            Carteirinha Digital de Membro
          </h3>
          <button
            onClick={() => setIsFlipped(!isFlipped)}
            className="text-xs text-amber-300 hover:text-amber-200 font-bold flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 active:scale-95 transition-all"
          >
            🔄 {isFlipped ? 'Ver Frente' : 'Girar Carteirinha'}
          </button>
        </div>

        <div 
          onClick={() => setIsFlipped(!isFlipped)}
          className="relative cursor-pointer select-none rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 bg-gradient-to-br from-[#1E1B2E] via-[#151324] to-[#0D0B18] border-2 border-amber-500/40 shadow-2xl overflow-hidden transition-all duration-300 hover:shadow-amber-500/10"
        >
          {/* Golden Holo Edge Glow */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-amber-500/15 via-purple-600/10 to-transparent blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-indigo-600/15 via-transparent to-transparent blur-3xl pointer-events-none" />

          {!isFlipped ? (
            /* FRONT OF THE CARD */
            <div className="relative z-10 space-y-6">
              {/* Church Crest Header */}
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 p-0.5 shadow-md flex items-center justify-center text-black font-extrabold text-xl">
                    ✝
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-amber-300 uppercase tracking-wider font-serif">
                      Igreja Batista & Ministério Fé
                    </h4>
                    <p className="text-[10px] text-white/50 tracking-widest uppercase">Credencial Eclesiástica Oficial</p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Membro Ativo
                </span>
              </div>

              {/* Member Core Details */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                <div className="relative shrink-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl p-0.5 bg-gradient-to-tr from-amber-400 via-purple-500 to-amber-300 shadow-xl overflow-hidden">
                    {currentPhotoURL ? (
                      <img
                        src={currentPhotoURL}
                        alt={currentDisplayName}
                        className="w-full h-full object-cover rounded-[14px]"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#1e1e24] rounded-[14px] flex items-center justify-center font-bold text-white text-xl">
                        {currentDisplayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-amber-400 text-black text-[10px] shadow">
                    ✨
                  </span>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-1">
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                    {currentDisplayName}
                  </h3>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5">
                    <span className="text-[11px] px-2.5 py-0.5 rounded-lg bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/25">
                      {currentMinistry}
                    </span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-lg bg-white/10 text-white/70 font-mono">
                      {memberRegistrationId}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/50 pt-1 font-mono">
                    Consagração / Ingresso: 2024 • Congregação Sede
                  </p>
                </div>
              </div>

              {/* Card Footer with Security Hologram / Microtext */}
              <div className="flex items-center justify-between pt-3 border-t border-white/10 text-[10px] text-white/40">
                <span>Válido em todos os eventos e assembleias</span>
                <span className="font-mono text-amber-400/80 font-bold">Toque para girar ➔</span>
              </div>
            </div>
          ) : (
            /* BACK OF THE CARD (QR CODE & BAPTISM DETAILS) */
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Credenciamento & Código de Acesso
                </h4>
                <span className="text-[10px] text-white/40 font-mono">SEGURANÇA ELETRÔNICA</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 justify-center py-2">
                {/* Simulated high contrast QR Code for check-in */}
                <div className="p-3 bg-white rounded-2xl shadow-xl shrink-0 flex flex-col items-center">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 bg-black p-1.5 rounded-xl flex flex-col justify-between">
                    <div className="flex justify-between">
                      <div className="w-6 h-6 border-2 border-white bg-black flex items-center justify-center"><div className="w-3 h-3 bg-white" /></div>
                      <div className="w-6 h-6 border-2 border-white bg-black flex items-center justify-center"><div className="w-3 h-3 bg-white" /></div>
                    </div>
                    <div className="text-white text-[7px] text-center font-mono">CONECTA•FE</div>
                    <div className="flex justify-between items-end">
                      <div className="w-6 h-6 border-2 border-white bg-black flex items-center justify-center"><div className="w-3 h-3 bg-white" /></div>
                      <div className="w-3 h-3 bg-white" />
                    </div>
                  </div>
                  <span className="text-[9px] text-black font-bold font-mono mt-1">{memberRegistrationId}</span>
                </div>

                <div className="space-y-2 text-center sm:text-left text-xs text-white/70">
                  <p className="font-semibold text-white">
                    Apresente este QR Code na portaria da igreja ou nos retiros para check-in automático.
                  </p>
                  <p className="text-[11px] text-white/50 leading-relaxed">
                    "Portanto, já não sois estrangeiros nem forasteiros, mas concidadãos dos santos e membros da família de Deus." — Efésios 2:19
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px] text-white/40">
                <span>Secretaria Pastoral Central</span>
                <span className="font-mono text-amber-400 font-bold">Toque para ver a frente ➔</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Profile Card Header */}
      <section className="bg-[#121216] border border-white/10 rounded-[36px] p-6 sm:p-10 relative overflow-hidden shadow-2xl mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--theme-color)]/10 blur-[90px] pointer-events-none rounded-full" />

        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 relative z-10">
          {/* Avatar Upload */}
          <div 
            onClick={() => setIsEditModalOpen(true)}
            className="relative cursor-pointer group shrink-0"
            title="Toque para mudar a foto ou nome"
          >
            {currentPhotoURL ? (
              <img 
                src={currentPhotoURL} 
                alt={currentDisplayName} 
                className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-2 border-[var(--theme-color)] object-cover shadow-2xl group-hover:opacity-80 transition-opacity" 
              />
            ) : (
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-purple-700 to-indigo-600 border-2 border-[var(--theme-color)] flex items-center justify-center shadow-2xl">
                <UserIcon className="w-14 h-14 text-white" />
              </div>
            )}
            
            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-center p-2">
              {isUploading ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : (
                <>
                  <Camera className="w-6 h-6 text-white mb-1" />
                  <span className="text-[10px] text-white font-bold leading-tight">Mudar Foto</span>
                </>
              )}
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />

            <div className="absolute bottom-0 right-0 bg-emerald-500 p-2 rounded-full border-4 border-[#121216] text-white shadow-md">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[11px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Nível {currentLevel} • Discípulo Fiel
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[11px] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> {currentMinistry}
              </div>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {currentDisplayName}
              </h2>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                title="Editar Nome e Perfil"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-white/50 font-mono">
              {user.email}
            </p>

            {/* Favorite Bible Verse / Faith Motto */}
            {currentVerse && (
              <p className="text-xs text-purple-300/90 italic bg-purple-950/30 border border-purple-800/30 px-3 py-1.5 rounded-xl inline-block max-w-md">
                "{currentVerse}"
              </p>
            )}

            {/* Bio / Testimony */}
            {currentBio && (
              <p className="text-xs text-white/70 max-w-lg leading-relaxed">
                {currentBio}
              </p>
            )}

            {/* Level XP Bar */}
            <div className="pt-2 max-w-sm mx-auto sm:mx-0">
              <div className="flex justify-between text-[11px] font-bold text-white/60 mb-1">
                <span>Progresso para Nível {currentLevel + 1}</span>
                <span>{currentLevelProgress} / 100 XP</span>
              </div>
              <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-white/10">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500" 
                  style={{ width: `${currentLevelProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mt-8 pt-6 border-t border-white/5">
          <div className="bg-black/40 rounded-2xl p-3 sm:p-4 text-center border border-white/5">
            <div className="text-xl sm:text-2xl font-bold text-white">{xp}</div>
            <div className="text-[10px] text-white/40 uppercase font-semibold">XP Bíblico</div>
          </div>
          <div className="bg-black/40 rounded-2xl p-3 sm:p-4 text-center border border-white/5">
            <div className="text-xl sm:text-2xl font-bold text-rose-400">{prayerCount}</div>
            <div className="text-[10px] text-white/40 uppercase font-semibold">Orações</div>
          </div>
          <div className="bg-black/40 rounded-2xl p-3 sm:p-4 text-center border border-white/5">
            <div className="text-xl sm:text-2xl font-bold text-emerald-400">{currentLevel}</div>
            <div className="text-[10px] text-white/40 uppercase font-semibold">Nível</div>
          </div>
        </div>
      </section>

      {/* Gamification & Achievements Section */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Conquistas & Medalhas Espirituais
          </h3>
          <span className="text-xs text-white/50">4 Emblemas</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {achievements.map((ach) => (
            <div 
              key={ach.id}
              className={`p-4 rounded-2xl border flex items-center gap-3.5 transition-all ${
                ach.unlocked 
                  ? 'bg-[#121216] border-amber-500/30' 
                  : 'bg-[#121216]/50 border-white/5 opacity-50'
              }`}
            >
              <div className="text-3xl p-2 rounded-2xl bg-black/40 border border-white/10 shrink-0">
                {ach.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-xs sm:text-sm text-white truncate">{ach.title}</h4>
                  {ach.unlocked && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                </div>
                <p className="text-[11px] text-white/50 line-clamp-1">{ach.desc}</p>
                <span className="text-[10px] font-bold text-[var(--theme-color)] mt-0.5 block">{ach.progress}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Navigation Menu */}
      <section className="bg-[#121216] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl mb-8">
        <Link 
          to="/volunteer"
          className="flex items-center justify-between p-5 hover:bg-white/5 transition-colors border-b border-white/5"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Minhas Escalas & Voluntariado</div>
              <div className="text-xs text-white/40">Consulte datas e solicite trocas</div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/30" />
        </Link>

        <Link 
          to="/prayers"
          className="flex items-center justify-between p-5 hover:bg-white/5 transition-colors border-b border-white/5"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Mural de Intercessão & Feed Social</div>
              <div className="text-xs text-white/40">Seus posts, fotos, relatos e orações</div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/30" />
        </Link>

        <Link 
          to="/chat"
          className="flex items-center justify-between p-5 hover:bg-white/5 transition-colors border-b border-white/5"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Chat da Comunidade & Grupos</div>
              <div className="text-xs text-white/40">Conversar com irmãos, células e pastor</div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/30" />
        </Link>

        <Link 
          to="/cells"
          className="flex items-center justify-between p-5 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Minha Célula & Pequeno Grupo</div>
              <div className="text-xs text-white/40">Roteiro semanal e presença</div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/30" />
        </Link>
      </section>

      {/* Logout button */}
      <button
        onClick={handleLogout}
        className="w-full h-13 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
      >
        <LogOut className="w-4 h-4" /> Desconectar da Conta
      </button>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialData={{
          displayName: profileData?.displayName || user.displayName || '',
          photoURL: profileData?.photoURL || user.photoURL || '',
          bio: profileData?.bio || '',
          ministryRole: profileData?.ministryRole || 'Membro da Congregação',
          phoneNumber: profileData?.phoneNumber || '',
          favoriteVerse: profileData?.favoriteVerse || '',
          email: user.email || ''
        }}
        onProfileUpdated={(updated) => {
          setProfileData(prev => ({
            ...(prev || {
              uid: user.uid,
              name: '',
              displayName: '',
              email: user.email || ''
            }),
            ...updated
          }));
          showToast('Perfil atualizado com sucesso!');
        }}
      />
    </div>
  );
}

