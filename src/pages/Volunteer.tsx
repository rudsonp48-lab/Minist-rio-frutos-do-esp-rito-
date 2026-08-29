import { useState } from 'react';
import { 
  ChevronLeft, 
  UserPlus, 
  Heart, 
  HandHeart, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  RefreshCw, 
  Send, 
  Users, 
  Sparkles, 
  AlertCircle, 
  Check, 
  X 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../lib/ThemeContext';
import NotificationCenter from '../components/NotificationCenter';

interface Shift {
  id: string;
  event: string;
  role: string;
  department: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'swap_requested';
  color: string;
}

const INITIAL_SHIFTS: Shift[] = [
  {
    id: 'shift-1',
    event: 'Culto da Família & Celebração',
    role: 'Operador de Câmera Principal',
    department: 'Mídia & Transmissão',
    date: 'Próximo Domingo',
    time: '18:00 - 20:30',
    status: 'confirmed',
    color: 'from-blue-600 to-indigo-600'
  },
  {
    id: 'shift-2',
    event: 'Culto de Oração & Doutrina',
    role: 'Acolhimento & Boas-Vindas',
    department: 'Recepção',
    date: 'Quarta-feira',
    time: '19:15 - 21:00',
    status: 'pending',
    color: 'from-emerald-600 to-teal-600'
  },
  {
    id: 'shift-3',
    event: 'Culto de Jovens (Connect)',
    role: 'Backing Vocal / Teclado',
    department: 'Louvor & Adoração',
    date: 'Sexta-feira',
    time: '19:30 - 22:00',
    status: 'pending',
    color: 'from-purple-600 to-pink-600'
  }
];

export default function Volunteer() {
  const { themeColor } = useTheme();
  const [tab, setTab] = useState<'schedules' | 'join'>('schedules');
  const [shifts, setShifts] = useState<Shift[]>(INITIAL_SHIFTS);
  const [submitted, setSubmitted] = useState(false);
  const [swapModalShift, setSwapModalShift] = useState<Shift | null>(null);
  const [swapReason, setSwapReason] = useState('');
  const [selectedSubstitute, setSelectedSubstitute] = useState('Priscila Ramos');
  const [swapSuccessToast, setSwapSuccessToast] = useState(false);

  const handleConfirmShift = (shiftId: string) => {
    setShifts(prev => prev.map(s => s.id === shiftId ? { ...s, status: 'confirmed' } : s));
  };

  const handleRequestSwap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!swapModalShift) return;

    setShifts(prev => prev.map(s => s.id === swapModalShift.id ? { ...s, status: 'swap_requested' } : s));
    setSwapModalShift(null);
    setSwapReason('');
    setSwapSuccessToast(true);
    setTimeout(() => setSwapSuccessToast(false), 3500);
  };

  const handleSubmitNewVolunteer = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-transparent w-full text-white font-sans max-w-7xl mx-auto px-4 sm:px-6 pb-32">
      <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-3xl border-b border-white/5 py-4 px-0 flex items-center justify-between mb-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <Link 
            to="/" 
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10 group"
          >
            <ChevronLeft className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-2xl font-serif font-bold tracking-wider text-white uppercase" style={{ fontFamily: '"Playfair Display", serif' }}>
              Voluntariado & Escalas
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <HandHeart className="w-3.5 h-3.5 text-[var(--theme-color)]" />
              <span className="text-[10px] font-bold text-[var(--theme-color)] uppercase tracking-[0.2em]">Servir com Excelência</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <NotificationCenter />
        </div>
      </header>

      {/* Tabs */}
      <div className="flex bg-[#121216] border border-white/10 rounded-2xl p-1.5 max-w-md mx-auto mb-8">
        <button
          onClick={() => setTab('schedules')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            tab === 'schedules' ? 'bg-white text-black shadow-md' : 'text-white/60 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" /> Minhas Escalas
        </button>
        <button
          onClick={() => setTab('join')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            tab === 'join' ? 'bg-white text-black shadow-md' : 'text-white/60 hover:text-white'
          }`}
        >
          <UserPlus className="w-4 h-4" /> Ficha de Inscrição
        </button>
      </div>

      {tab === 'schedules' ? (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Próximos Compromissos Ministeriais
            </h2>
            <span className="text-xs text-white/50">{shifts.length} escalas ativas</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shifts.map((shift) => (
              <motion.div
                key={shift.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#121216] border border-white/10 rounded-[28px] p-6 relative overflow-hidden flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold text-[var(--theme-color)] uppercase tracking-wider">
                      {shift.department}
                    </span>

                    {shift.status === 'confirmed' ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Presença Confirmada
                      </span>
                    ) : shift.status === 'swap_requested' ? (
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin" /> Troca em Análise
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Aguardando Confirmação
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white">{shift.event}</h3>
                  <div className="text-sm text-white/80 font-medium">{shift.role}</div>

                  <div className="flex items-center gap-4 text-xs text-white/50 pt-2 border-t border-white/5">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{shift.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{shift.time}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-6 pt-4 border-t border-white/5">
                  {shift.status !== 'confirmed' && (
                    <button
                      onClick={() => handleConfirmShift(shift.id)}
                      className="flex-1 h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" /> Confirmar
                    </button>
                  )}

                  {shift.status !== 'swap_requested' && (
                    <button
                      onClick={() => setSwapModalShift(shift)}
                      className="flex-1 h-11 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/80 hover:text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Solicitar Troca
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        /* Join / Volunteer Registration Form */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-5xl mx-auto items-center">
          <div>
            <div className="w-14 h-14 rounded-3xl bg-[var(--theme-color)]/20 border border-[var(--theme-color)]/30 flex items-center justify-center mb-6">
              <Heart className="w-7 h-7 text-[var(--theme-color)]" />
            </div>
            <h2 className="text-3xl lg:text-4xl font-serif font-bold mb-4">Junte-se à nossa equipe ministerial.</h2>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              Acreditamos que cada pessoa tem dons e talentos únicos dados por Deus. Ao servir como voluntário, você abençoa vidas e fortalece o Corpo de Cristo.
            </p>
            
            <div className="space-y-3">
              {['Mídia & Transmissão', 'Recepção & Acolhimento', 'Louvor & Adoração', 'Ministério Infantil', 'Ação Social & Comunidade'].map((area, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-white/80 font-medium text-sm">{area}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#121216] p-7 sm:p-9 rounded-[32px] border border-white/10 relative overflow-hidden shadow-2xl">
            {submitted ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">Inscrição Recebida!</h3>
                <p className="text-white/60 text-xs max-w-xs mx-auto">
                  Nossa liderança pastoral entrará em contato em breve para os próximos passos. Bem-vindo(a) ao time de servos!
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmitNewVolunteer} className="space-y-4">
                <h3 className="text-lg font-bold mb-2">Ficha de Inscrição</h3>
                
                <div>
                  <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">Nome Completo</label>
                  <input type="text" placeholder="Ex: João da Silva" required className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-3 text-xs outline-none focus:border-[var(--theme-color)] transition-colors text-white" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">E-mail</label>
                    <input type="email" placeholder="seu@email.com" required className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-3 text-xs outline-none focus:border-[var(--theme-color)] transition-colors text-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">WhatsApp</label>
                    <input type="tel" placeholder="(11) 99999-9999" required className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-3 text-xs outline-none focus:border-[var(--theme-color)] transition-colors text-white" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">Área de Interesse</label>
                  <select required className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-3 text-xs outline-none focus:border-[var(--theme-color)] transition-colors text-white">
                    <option value="midia">Mídia e Transmissão</option>
                    <option value="recepcao">Recepção e Acolhimento</option>
                    <option value="louvor">Louvor e Adoração</option>
                    <option value="infantil">Ministério Infantil</option>
                    <option value="social">Ação Social</option>
                  </select>
                </div>

                <button type="submit" className="w-full h-13 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 mt-2">
                  <UserPlus className="w-4 h-4"/> Quero Servir na Igreja
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Swap Shift Request Modal */}
      <AnimatePresence>
        {swapModalShift && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#121218] border border-white/15 rounded-[32px] p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setSwapModalShift(null)}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mb-4">
                <RefreshCw className="w-6 h-6 text-amber-400" />
              </div>

              <h3 className="text-lg font-bold text-white mb-1">Solicitar Troca de Escala</h3>
              <p className="text-xs text-white/60 mb-4">
                Escala: <strong className="text-white">{swapModalShift.event}</strong> ({swapModalShift.date})
              </p>

              <form onSubmit={handleRequestSwap} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">
                    Irmão(ã) Substituto Sugerido
                  </label>
                  <select
                    value={selectedSubstitute}
                    onChange={(e) => setSelectedSubstitute(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white outline-none focus:border-[var(--theme-color)]"
                  >
                    <option value="Priscila Ramos">Priscila Ramos (Mídia)</option>
                    <option value="Carlos Eduardo">Carlos Eduardo (Recepção)</option>
                    <option value="Lucas Oliveira">Lucas Oliveira (Louvor)</option>
                    <option value="Sarah Mendes">Sarah Mendes (Infantil)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">
                    Motivo da Troca
                  </label>
                  <textarea
                    value={swapReason}
                    onChange={(e) => setSwapReason(e.target.value)}
                    placeholder="Ex: Viagem de trabalho, compromisso familiar imprevisto..."
                    rows={3}
                    className="w-full bg-black/50 border border-white/10 rounded-2xl p-3 text-xs text-white outline-none focus:border-[var(--theme-color)] resize-none"
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSwapModalShift(null)}
                    className="flex-1 h-11 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-11 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg"
                  >
                    <Send className="w-3.5 h-3.5" /> Enviar Pedido
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      {swapSuccessToast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-3 rounded-full text-xs font-bold shadow-2xl flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" /> Solicitação de troca enviada para a liderança!
        </motion.div>
      )}
    </div>
  );
}
