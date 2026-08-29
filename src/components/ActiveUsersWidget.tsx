import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Sparkles, 
  Heart, 
  MessageCircle, 
  MessageSquare,
  Check, 
  BookOpen, 
  Headphones, 
  Flame, 
  ShieldCheck, 
  X, 
  ChevronRight,
  Smile,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../lib/firebase';
import { 
  ActiveUser, 
  subscribeToActiveUsers, 
  updateUserPresence 
} from '../services/presenceService';
import { notifyPrayerIntercession } from '../services/notificationService';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

const SPIRITUAL_STATUS_PRESETS = [
  { label: 'Orando no Mural', icon: Heart, activity: 'praying' as const, emoji: '🙏' },
  { label: 'Lendo a Palavra', icon: BookOpen, activity: 'reading_bible' as const, emoji: '📖' },
  { label: 'Ouvindo Louvor', icon: Headphones, activity: 'listening_worship' as const, emoji: '🎵' },
  { label: 'Em Comunhão', icon: Users, activity: 'fellowship' as const, emoji: '👥' },
  { label: 'Estudo Bíblico', icon: Sparkles, activity: 'studying' as const, emoji: '✨' },
];

export default function ActiveUsersWidget() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<ActiveUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ActiveUser | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAllMembersModal, setShowAllMembersModal] = useState(false);
  const [customStatus, setCustomStatus] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<ActiveUser['currentActivity']>('fellowship');
  const [blessingSentUser, setBlessingSentUser] = useState<string | null>(null);
  const [filterActivity, setFilterActivity] = useState<string>('all');

  useEffect(() => {
    const unsub = subscribeToActiveUsers((activeUsers) => {
      setUsers(activeUsers);
    });
    return () => unsub();
  }, []);

  const currentUser = auth.currentUser;
  const onlineCount = users.filter(u => u.isOnline).length;

  const handleUpdateStatus = async (preset?: typeof SPIRITUAL_STATUS_PRESETS[0]) => {
    if (preset) {
      await updateUserPresence(preset.label, preset.activity);
    } else if (customStatus.trim()) {
      await updateUserPresence(customStatus.trim(), selectedActivity);
      setCustomStatus('');
    }
    setShowStatusModal(false);
  };

  const handleSendBlessing = async (targetUser: ActiveUser) => {
    if (!currentUser || targetUser.uid === currentUser.uid) return;

    try {
      // Send notification as spiritual encouragement
      await addDoc(collection(db, 'notifications'), {
        recipientUid: targetUser.uid,
        senderUid: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Um irmão',
        senderPhoto: currentUser.photoURL || '',
        type: 'prayer_intercession',
        title: '🕊️ Abraço Fraterno e Oração!',
        message: `${currentUser.displayName || 'Um irmão(ã)'} enviou uma bênção espiritual e está orando por você agora!`,
        read: false,
        createdAt: serverTimestamp(),
        actionUrl: '/'
      });

      setBlessingSentUser(targetUser.uid);
      setTimeout(() => setBlessingSentUser(null), 3000);
    } catch (err) {
      console.error('Error sending blessing:', err);
    }
  };

  const filteredMembers = users.filter(u => {
    if (filterActivity === 'all') return true;
    return u.currentActivity === filterActivity;
  });

  return (
    <section className="w-full relative">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-400">
            <Users className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-display font-bold tracking-tight text-white">
                Irmãos Conectados Agora
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                {onlineCount} Online
              </span>
            </div>
            <p className="text-xs text-white/50 hidden sm:block">
              Membros e liderança da igreja reunidos em comunhão
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStatusModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
          >
            <Smile className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Meu Status</span>
          </button>

          <button
            onClick={() => setShowAllMembersModal(true)}
            className="text-xs font-bold text-[var(--theme-color)] hover:opacity-80 transition-opacity flex items-center gap-0.5 tracking-wider uppercase ml-1"
          >
            Ver Todos <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Reel of Online Users */}
      <div className="relative">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-3 -mx-6 px-6 lg:mx-0 lg:px-0 snap-x snap-mandatory">
          {users.map((member, idx) => {
            const isMe = member.uid === currentUser?.uid;
            return (
              <motion.div
                key={member.uid}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.04 }}
                className="shrink-0 snap-start"
              >
                <div
                  onClick={() => setSelectedUser(member)}
                  className={`group cursor-pointer relative p-3 rounded-[24px] bg-[#141419]/80 hover:bg-[#1C1C24] border transition-all duration-300 w-[140px] sm:w-[155px] flex flex-col items-center text-center shadow-lg ${
                    isMe 
                      ? 'border-[var(--theme-color)]/50 ring-1 ring-[var(--theme-color)]/30' 
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Avatar with Online Pulse Indicator */}
                  <div className="relative mb-2">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-emerald-500 p-[2px] shadow-md group-hover:scale-105 transition-transform duration-300">
                      {member.photoURL ? (
                        <img 
                          src={member.photoURL} 
                          alt={member.name} 
                          className="w-full h-full object-cover rounded-[14px]"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-black rounded-[14px] flex items-center justify-center font-bold text-white text-base">
                          {member.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Online status dot */}
                    {member.isOnline && (
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#141419] flex items-center justify-center shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      </span>
                    )}

                    {/* Disciple Level / Role Tag */}
                    {member.level && (
                      <span className="absolute -top-1.5 -left-1.5 px-1.5 py-0.5 rounded-full bg-amber-500 text-[9px] font-black text-black shadow-md border border-amber-300">
                        Nv.{member.level}
                      </span>
                    )}
                  </div>

                  {/* Name & Role */}
                  <h4 className="text-xs font-bold text-white truncate max-w-full group-hover:text-[var(--theme-color)] transition-colors">
                    {member.name}
                  </h4>
                  <span className="text-[10px] text-white/50 font-medium truncate max-w-full mb-1">
                    {isMe ? 'Você' : (member.role || 'Membro')}
                  </span>

                  {/* Spiritual Status Pill */}
                  <div className="w-full mt-1 px-2 py-1 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center gap-1">
                    <span className="text-[9px] text-white/80 font-medium truncate">
                      {member.statusMessage || 'Em comunhão'}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Selected Member Detail Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md bg-[#16161D] border border-white/15 rounded-[32px] p-6 sm:p-8 shadow-2xl relative overflow-hidden"
            >
              {/* Background gradient orb */}
              <div className="absolute -top-16 -right-16 w-48 h-48 bg-purple-600/20 blur-3xl rounded-full pointer-events-none" />

              <button
                onClick={() => setSelectedUser(null)}
                className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center text-center">
                {/* Large Avatar */}
                <div className="relative mb-4">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-600 to-emerald-500 p-[3px] shadow-xl">
                    {selectedUser.photoURL ? (
                      <img
                        src={selectedUser.photoURL}
                        alt={selectedUser.name}
                        className="w-full h-full object-cover rounded-[21px]"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-black rounded-[21px] flex items-center justify-center font-bold text-white text-2xl">
                        {selectedUser.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  {selectedUser.isOnline && (
                    <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-emerald-500 text-[10px] font-bold text-white border-2 border-[#16161D] flex items-center gap-1 shadow-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" /> Online
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold text-white mb-0.5">
                  {selectedUser.name}
                </h3>
                <p className="text-xs text-[var(--theme-color)] font-semibold uppercase tracking-wider mb-4">
                  {selectedUser.role || 'Membro do Corpo de Cristo'}
                </p>

                {/* Status Message Box */}
                <div className="w-full bg-black/40 border border-white/10 rounded-2xl p-3.5 mb-6 text-center">
                  <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider block mb-1">
                    Atividade Espiritual Atual
                  </span>
                  <p className="text-sm font-medium text-white/90">
                    "{selectedUser.statusMessage || 'Em comunhão com a congregação'}"
                  </p>
                </div>

                {/* Quick Action Buttons */}
                <div className="w-full space-y-2.5">
                  {selectedUser.uid !== currentUser?.uid && (
                    <button
                      onClick={() => {
                        setSelectedUser(null);
                        navigate(`/chat?dm=${selectedUser.uid}`);
                      }}
                      className="w-full h-12 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500 hover:opacity-95 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-purple-950/40 active:scale-95 transition-all"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Conversar no Chat Privado
                    </button>
                  )}

                  {selectedUser.uid !== currentUser?.uid ? (
                    <button
                      onClick={() => handleSendBlessing(selectedUser)}
                      className={`w-full h-11 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md ${
                        blessingSentUser === selectedUser.uid
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white/10 hover:bg-white/15 border border-white/10 text-white'
                      }`}
                    >
                      {blessingSentUser === selectedUser.uid ? (
                        <>
                          <Check className="w-4 h-4" />
                          Bênção Enviada com Sucesso! 🙏
                        </>
                      ) : (
                        <>
                          <Heart className="w-4 h-4 fill-current text-rose-300" />
                          Enviar Bênção e Orar pelo Irmão
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedUser(null);
                        setShowStatusModal(true);
                      }}
                      className="w-full h-12 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 font-bold text-xs uppercase tracking-wider text-white flex items-center justify-center gap-2"
                    >
                      <Smile className="w-4 h-4 text-amber-400" />
                      Alterar Meu Status Espiritual
                    </button>
                  )}

                  <button
                    onClick={() => {
                      const prayerSection = document.getElementById('intercession-mural-section');
                      if (prayerSection) {
                        prayerSection.scrollIntoView({ behavior: 'smooth' });
                      }
                      setSelectedUser(null);
                    }}
                    className="w-full h-11 rounded-2xl bg-black/40 hover:bg-black/60 border border-white/10 text-white/80 hover:text-white text-xs font-semibold flex items-center justify-center gap-2"
                  >
                    <Flame className="w-4 h-4 text-amber-400" />
                    Ver Clamores no Mural de Intercessão
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Set Spiritual Status Modal */}
      <AnimatePresence>
        {showStatusModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#16161D] border border-white/15 rounded-[32px] p-6 sm:p-8 shadow-2xl relative"
            >
              <button
                onClick={() => setShowStatusModal(false)}
                className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Smile className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Meu Status Espiritual</h3>
                  <p className="text-xs text-white/50">O que você está fazendo na igreja agora?</p>
                </div>
              </div>

              {/* Status Presets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
                {SPIRITUAL_STATUS_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handleUpdateStatus(preset)}
                    className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left flex items-center gap-3 transition-all active:scale-95 group"
                  >
                    <span className="text-xl">{preset.emoji}</span>
                    <span className="text-xs font-bold text-white group-hover:text-[var(--theme-color)] transition-colors">
                      {preset.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Custom Status Input */}
              <div className="space-y-3 pt-3 border-t border-white/10">
                <label className="block text-[11px] font-bold text-white/50 uppercase tracking-wider">
                  Ou escreva um status personalizado:
                </label>
                <input
                  type="text"
                  value={customStatus}
                  onChange={(e) => setCustomStatus(e.target.value)}
                  placeholder="Ex: Em jejum e oração pela mocidade..."
                  className="w-full bg-black/50 border border-white/15 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-[var(--theme-color)] placeholder:text-white/30"
                />
                <button
                  onClick={() => handleUpdateStatus()}
                  disabled={!customStatus.trim()}
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  Salvar Meu Status
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* All Members Directory Modal */}
      <AnimatePresence>
        {showAllMembersModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-[#16161D] border border-white/15 rounded-[32px] p-6 sm:p-8 shadow-2xl relative max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Comunidade de Membros</h3>
                    <p className="text-xs text-white/50">{users.length} irmãos cadastrados na congregação</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAllMembersModal(false)}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Activity Filter Chips */}
              <div className="flex gap-2 overflow-x-auto pb-3 mb-3 scrollbar-hide">
                {[
                  { id: 'all', label: 'Todos os Membros' },
                  { id: 'praying', label: '🙏 Em Oração' },
                  { id: 'reading_bible', label: '📖 Lendo a Bíblia' },
                  { id: 'listening_worship', label: '🎵 Louvor' },
                  { id: 'studying', label: '✨ Estudos' },
                ].map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() => setFilterActivity(chip.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                      filterActivity === chip.id
                        ? 'bg-white text-black border-white'
                        : 'bg-black/30 text-white/70 border-white/10 hover:text-white'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Members List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {filteredMembers.map((member) => (
                  <div
                    key={member.uid}
                    className="p-3.5 rounded-2xl bg-black/40 border border-white/10 hover:border-white/20 flex items-center justify-between gap-4 transition-all"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-emerald-500 p-[2px]">
                          {member.photoURL ? (
                            <img
                              src={member.photoURL}
                              alt={member.name}
                              className="w-full h-full object-cover rounded-[14px]"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full bg-black rounded-[14px] flex items-center justify-center font-bold text-white text-sm">
                              {member.name?.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        {member.isOnline && (
                          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-black" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white truncate">{member.name}</h4>
                          {member.level && (
                            <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                              Nv.{member.level}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-white/50 font-medium truncate">
                          {member.role || 'Membro'} • <span className="text-emerald-400">{member.statusMessage}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setShowAllMembersModal(false);
                        setSelectedUser(member);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold whitespace-nowrap shrink-0 transition-all active:scale-95"
                    >
                      Ver Perfil
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
