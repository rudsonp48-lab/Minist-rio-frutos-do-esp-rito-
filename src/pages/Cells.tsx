import { useState } from 'react';
import { 
  Users, 
  MapPin, 
  Map, 
  Share2, 
  Search, 
  ChevronRight, 
  ChevronLeft, 
  BookOpen, 
  Heart, 
  CheckCircle2, 
  Calendar, 
  Flame, 
  Sparkles, 
  Clock, 
  Plus, 
  UserCheck, 
  Smile, 
  MessageSquare 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import NotificationCenter from '../components/NotificationCenter';

interface Cell {
  id: number;
  name: string;
  leader: string;
  address: string;
  day: string;
  membersCount: number;
  guide: {
    icebreaker: string;
    worshipSongs: string[];
    wordTopic: string;
    wordPassage: string;
    discussionQuestions: string[];
    prayerFocus: string;
  };
}

const CELLS_DATA: Cell[] = [
  {
    id: 1,
    name: 'Célula Graça & Vida (Centro)',
    leader: 'Pr. João & Pra. Sara',
    address: 'Rua Principal, 123 - Centro',
    day: 'Quarta-feira, 20:00',
    membersCount: 14,
    guide: {
      icebreaker: 'Se você pudesse escolher um momento bíblico para ter presenciado ao vivo, qual seria e por quê?',
      worshipSongs: ['Bondade de Deus - Isaías Saad', 'Ousado Amor - Isaias'],
      wordTopic: 'Permanecendo Firmes na Videira Verdadeira',
      wordPassage: 'João 15:1-8',
      discussionQuestions: [
        'O que significa na prática o fruto de uma vida conectada a Cristo?',
        'Quais distrações cotidianas tentam nos desconectar da oração diária?',
        'Como a nossa célula pode apoiar você nessa semana?'
      ],
      prayerFocus: 'Orar pelos enfermos da congregação, familiares não convertidos e pela multiplicação da célula.'
    }
  },
  {
    id: 2,
    name: 'Célula Restauração (Zona Sul)',
    leader: 'Dc. Marcos & Maria',
    address: 'Av. Sul, 456 - Bairro Sul',
    day: 'Quinta-feira, 19:30',
    membersCount: 18,
    guide: {
      icebreaker: 'Compartilhe uma bênção simples que aconteceu com você nos últimos dias.',
      worshipSongs: ['Ruja o Leão - Talita Catanzaro', 'A Ele a Glória'],
      wordTopic: 'A Fé que Move Montanhas',
      wordPassage: 'Hebreus 11:1-6',
      discussionQuestions: [
        'Como a fé nos sustenta mesmo quando as circunstâncias parecem contrárias?',
        'De que maneira a comunhão dos irmãos fortalece nossa fé?'
      ],
      prayerFocus: 'Clamor pelas famílias, restauração matrimonial e novas vidas alcançadas.'
    }
  },
  {
    id: 3,
    name: 'Célula Universitária Connect',
    leader: 'Miss. Carlos & Beatriz',
    address: 'Rua da Faculdade, 789 - Campus',
    day: 'Sábado, 17:00',
    membersCount: 22,
    guide: {
      icebreaker: 'Qual é o seu maior objetivo para este semestre acadêmico/profissional?',
      worshipSongs: ['Yeshua - Fernandinho', 'Vem Me Buscar'],
      wordTopic: 'Luz nas Universidades & Mercado de Trabalho',
      wordPassage: 'Mateus 5:14-16',
      discussionQuestions: [
        'Como ser testemunho cristão no ambiente de estudo/trabalho?',
        'Quais princípios bíblicos devem guiar nossas decisões profissionais?'
      ],
      prayerFocus: 'Jovens, vestibulares, sabedoria e testemunho no ambiente de trabalho.'
    }
  }
];

export default function Cells() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'list' | 'guide' | 'attendance'>('list');
  const [selectedCell, setSelectedCell] = useState<Cell>(CELLS_DATA[0]);
  
  // Attendance Tracker state
  const [attendance, setAttendance] = useState<Record<string, boolean>>({
    'Lucas Silva': true,
    'Mariana Costa': true,
    'Pedro Henrique': false,
    'Gabriel Souza': true,
    'Aline Ribeiro (Visitante)': true,
    'Rodrigo Santos': true,
    'Fernanda Lima': false
  });
  const [newMemberName, setNewMemberName] = useState('');
  const [savedAttendanceToast, setSavedAttendanceToast] = useState(false);

  const toggleAttendance = (name: string) => {
    setAttendance(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    setAttendance(prev => ({ ...prev, [newMemberName.trim()]: true }));
    setNewMemberName('');
  };

  const presentCount = Object.values(attendance).filter(Boolean).length;
  const totalListCount = Object.keys(attendance).length;

  const filteredCells = CELLS_DATA.filter(cell => 
    cell.name.toLowerCase().includes(search.toLowerCase()) || 
    cell.address.toLowerCase().includes(search.toLowerCase()) ||
    cell.leader.toLowerCase().includes(search.toLowerCase())
  );

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
              Pequenos Grupos & Células
            </h1>
            <span className="text-[10px] font-bold text-[var(--theme-color)] uppercase tracking-widest flex items-center gap-1 mt-0.5">
              <Users className="w-3.5 h-3.5" /> Comunhão & Discipulado
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <NotificationCenter />
        </div>
      </header>

      {/* Main Tabs */}
      <div className="flex bg-[#121216] border border-white/10 rounded-2xl p-1.5 max-w-lg mx-auto mb-8">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'list' ? 'bg-white text-black shadow-md' : 'text-white/60 hover:text-white'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" /> Células
        </button>
        <button
          onClick={() => setActiveTab('guide')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'guide' ? 'bg-white text-black shadow-md' : 'text-white/60 hover:text-white'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" /> Roteiro do Encontro
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'attendance' ? 'bg-white text-black shadow-md' : 'text-white/60 hover:text-white'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" /> Chamada
        </button>
      </div>

      {activeTab === 'list' && (
        <div className="space-y-6">
          <div className="relative max-w-2xl mx-auto">
            <Search className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por bairro, nome da célula ou líder..." 
              className="w-full bg-[#121216] border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-[var(--theme-color)] transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCells.map(cell => (
              <motion.div 
                key={cell.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#121216] border border-white/10 hover:border-white/20 rounded-[28px] p-6 flex flex-col justify-between shadow-2xl transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-full bg-[var(--theme-color)]/20 text-[var(--theme-color)] text-[10px] font-bold uppercase tracking-wider border border-[var(--theme-color)]/30">
                      {cell.membersCount} Membros
                    </span>
                    <span className="text-[11px] text-white/50">{cell.day}</span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[var(--theme-color)] transition-colors">{cell.name}</h3>
                  <p className="text-xs font-medium text-white/50 mb-4">Líder: {cell.leader}</p>
                  
                  <div className="flex items-start gap-2 text-xs text-white/70 bg-black/40 p-3 rounded-xl border border-white/5 mb-4">
                    <MapPin className="w-4 h-4 shrink-0 text-[var(--theme-color)] mt-0.5" />
                    <span>{cell.address}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                  <button 
                    onClick={() => {
                      setSelectedCell(cell);
                      setActiveTab('guide');
                    }}
                    className="flex-1 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> Ver Roteiro
                  </button>
                  <a 
                    href={`https://wa.me/?text=${encodeURIComponent(`Venha participar da nossa célula (${cell.name})! Nos reunimos ${cell.day} em: ${cell.address}.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-10 h-10 rounded-xl bg-green-600 hover:bg-green-500 transition-colors flex items-center justify-center text-white shrink-0 shadow-md"
                    title="Convidar no WhatsApp"
                  >
                    <Share2 className="w-4 h-4" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Guided Meeting Outline (Roteiro do Encontro) */}
      {activeTab === 'guide' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-[#121216] border border-purple-500/30 rounded-[32px] p-6 sm:p-8 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold uppercase tracking-wider border border-purple-500/30">
                Guia Semanal do Líder
              </span>
              <span className="text-xs text-white/50">{selectedCell.name}</span>
            </div>

            <h2 className="text-2xl font-serif font-bold text-white mb-1">
              {selectedCell.guide.wordTopic}
            </h2>
            <p className="text-sm font-semibold text-[var(--theme-color)] mb-6">
              Passagem Bíblica: {selectedCell.guide.wordPassage}
            </p>

            {/* 5-Step Meeting Guide */}
            <div className="space-y-4">
              {/* Step 1: Quebra-gelo */}
              <div className="bg-black/50 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                  <Smile className="w-4 h-4" /> 1. Quebra-Gelo (10 min)
                </div>
                <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                  "{selectedCell.guide.icebreaker}"
                </p>
              </div>

              {/* Step 2: Louvor */}
              <div className="bg-black/50 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">
                  <Flame className="w-4 h-4" /> 2. Louvor & Gratidão (15 min)
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedCell.guide.worshipSongs.map((song, i) => (
                    <span key={i} className="px-3 py-1 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-white/90">
                      🎵 {song}
                    </span>
                  ))}
                </div>
              </div>

              {/* Step 3: Estudo & Perguntas */}
              <div className="bg-black/50 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">
                  <BookOpen className="w-4 h-4" /> 3. Compartilhamento da Palavra (25 min)
                </div>
                <ul className="space-y-2">
                  {selectedCell.guide.discussionQuestions.map((q, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-white/80">
                      <span className="font-bold text-[var(--theme-color)]">{idx + 1}.</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Step 4: Oração e Intercessão */}
              <div className="bg-black/50 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider mb-2">
                  <Heart className="w-4 h-4" /> 4. Clamor, Oração & Comunhão (15 min)
                </div>
                <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                  {selectedCell.guide.prayerFocus}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Attendance Checklist */}
      {activeTab === 'attendance' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-[#121216] border border-white/10 rounded-[32px] p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">Chamada de Presença</h3>
                <p className="text-xs text-white/50">Encontro de {selectedCell.name}</p>
              </div>
              <div className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                {presentCount} de {totalListCount} presentes
              </div>
            </div>

            {/* Add member / visitor form */}
            <form onSubmit={handleAddMember} className="flex gap-2 mb-6">
              <input
                type="text"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="Adicionar membro ou visitante..."
                className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[var(--theme-color)]"
              />
              <button
                type="submit"
                disabled={!newMemberName.trim()}
                className="px-4 py-2.5 rounded-xl bg-[var(--theme-color)] text-white text-xs font-bold uppercase flex items-center gap-1.5 disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </button>
            </form>

            {/* Attendance items */}
            <div className="space-y-2">
              {Object.entries(attendance).map(([name, isPresent]) => (
                <div
                  key={name}
                  onClick={() => toggleAttendance(name)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isPresent
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                      : 'bg-black/40 border-white/5 text-white/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors ${
                      isPresent ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-white/20'
                    }`}>
                      {isPresent && <CheckCircle2 className="w-4 h-4" />}
                    </div>
                    <span className="text-xs sm:text-sm font-medium">{name}</span>
                  </div>

                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    isPresent ? 'text-emerald-400' : 'text-white/30'
                  }`}>
                    {isPresent ? 'Presente' : 'Ausente'}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setSavedAttendanceToast(true);
                setTimeout(() => setSavedAttendanceToast(false), 3000);
              }}
              className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-lg mt-6 active:scale-95 transition-transform"
            >
              <CheckCircle2 className="w-4 h-4" /> Salvar Relatório de Presença
            </button>
          </div>
        </div>
      )}

      {/* Attendance Saved Toast */}
      {savedAttendanceToast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-3 rounded-full text-xs font-bold shadow-2xl flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" /> Relatório de presença da célula salvo com sucesso!
        </motion.div>
      )}
    </div>
  );
}
