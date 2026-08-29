import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Search, Book, ChevronRight, ChevronLeft, Bookmark, Share2, 
  Download, Wifi, WifiOff, Target, Zap, Globe, Cpu, BookOpen, 
  List, PenTool, Highlighter, Edit3, Volume2, VolumeX, Sparkles, 
  CheckCircle2, Copy, Check, Save, Play, Pause, RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BIBLE_STRUCTURE, SAMPLE_VERSES } from '../lib/bibleData';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../lib/ThemeContext';
import Notes from './Notes';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';

interface Verse {
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

interface ReadingPlan {
  id: string;
  title: string;
  description: string;
  totalDays: number;
  category: string;
  days: { day: number; reference: string; completed?: boolean }[];
}

const READING_PLANS: ReadingPlan[] = [
  {
    id: 'plan-nt-90',
    title: 'Novo Testamento em 90 Dias',
    description: 'Uma jornada inspiradora por todos os 27 livros do Novo Testamento.',
    totalDays: 14,
    category: 'Novo Testamento',
    days: [
      { day: 1, reference: 'Mateus 1-3' },
      { day: 2, reference: 'Mateus 4-6' },
      { day: 3, reference: 'Mateus 7-9' },
      { day: 4, reference: 'Mateus 10-12' },
      { day: 5, reference: 'Mateus 13-15' },
      { day: 6, reference: 'Marcos 1-3' },
      { day: 7, reference: 'Marcos 4-6' },
      { day: 8, reference: 'Lucas 1-3' },
      { day: 9, reference: 'Lucas 4-6' },
      { day: 10, reference: 'João 1-3' },
      { day: 11, reference: 'João 4-6' },
      { day: 12, reference: 'Atos 1-3' },
      { day: 13, reference: 'Romanos 1-4' },
      { day: 14, reference: 'Apocalipse 21-22' },
    ]
  },
  {
    id: 'plan-salmos-sabedoria',
    title: 'Salmos de Paz & Provérbios de Sabedoria',
    description: 'Alimento diário para o coração e direcionamento prático para a mente.',
    totalDays: 7,
    category: 'Devocional',
    days: [
      { day: 1, reference: 'Salmos 23 & Provérbios 3' },
      { day: 2, reference: 'Salmos 91 & Provérbios 4' },
      { day: 3, reference: 'Salmos 121 & Provérbios 16' },
      { day: 4, reference: 'Salmos 46 & Provérbios 18' },
      { day: 5, reference: 'Salmos 103 & Provérbios 22' },
      { day: 6, reference: 'Salmos 139 & Provérbios 27' },
      { day: 7, reference: 'Salmos 150 & Provérbios 31' },
    ]
  }
];

export default function Bible() {
  const { themeColor } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [translation, setTranslation] = useState('almeida');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  const [view, setView] = useState<'books' | 'chapters' | 'chapter' | 'search' | 'notes' | 'plans'>('books');
  const [selectedBook, setSelectedBook] = useState<typeof BIBLE_STRUCTURE[0] | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [chapterVerses, setChapterVerses] = useState<Verse[]>([]);
  
  const [searchReference, setSearchReference] = useState('João 3:16');
  const [searchedVerse, setSearchedVerse] = useState<Verse | null>(null);

  // Verse selection modal / drawer
  const [activeVerse, setActiveVerse] = useState<Verse | null>(null);
  const [copiedVerse, setCopiedVerse] = useState(false);
  const [savedVerse, setSavedVerse] = useState(false);

  // Audio Speech Synthesis state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [speechSpeed, setSpeechSpeed] = useState<number>(1);
  const [currentSpokenVerse, setCurrentSpokenVerse] = useState<number | null>(null);

  // Reading Plans progress state
  const [planProgress, setPlanProgress] = useState<Record<string, number[]>>(() => {
    const cached = localStorage.getItem('bible_reading_progress');
    return cached ? JSON.parse(cached) : {};
  });

  const togglePlanDay = (planId: string, day: number) => {
    setPlanProgress(prev => {
      const current = prev[planId] || [];
      const updated = current.includes(day)
        ? current.filter(d => d !== day)
        : [...current, day];
      const next = { ...prev, [planId]: updated };
      localStorage.setItem('bible_reading_progress', JSON.stringify(next));
      return next;
    });
  };

  const [highlightedVerses, setHighlightedVerses] = useState<string[]>(() => {
    const cached = localStorage.getItem('bible_highlights');
    return cached ? JSON.parse(cached) : [];
  });

  useEffect(() => {
    localStorage.setItem('bible_highlights', JSON.stringify(highlightedVerses));
  }, [highlightedVerses]);

  const toggleHighlight = (book: string, chapter: number, verse: number) => {
    const key = `${book}_${chapter}_${verse}`;
    setHighlightedVerses(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const translations = [
    { id: 'almeida', label: 'Almeida' },
    { id: 'nvi', label: 'NVI' },
  ];

  useEffect(() => {
    const handleStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  const fetchChapter = useCallback(async (book: string, chapter: number, tr: string = translation) => {
    setLoading(true);
    setError(null);
    stopAudio();
    const cacheKey = `bible_${tr}_${book}_${chapter}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setChapterVerses(JSON.parse(cached));
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`https://bible-api.com/${encodeURIComponent(`${book} ${chapter}`)}?translation=${tr}`);
      if (!res.ok) throw new Error('Capítulo não encontrado');
      const data = await res.json();
      setChapterVerses(data.verses);
      localStorage.setItem(cacheKey, JSON.stringify(data.verses));
    } catch (err) {
      setError('Falha ao carregar o capítulo.');
    } finally {
      setLoading(false);
    }
  }, [translation]);

  // Audio Speech synthesis handlers
  const stopAudio = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
    setCurrentSpokenVerse(null);
  };

  const toggleAudioNarration = () => {
    if (!window.speechSynthesis || chapterVerses.length === 0) return;

    if (isPlayingAudio) {
      stopAudio();
      return;
    }

    const fullChapterText = `${selectedBook?.book || ''} capítulo ${selectedChapter}. ` +
      chapterVerses.map(v => `Versículo ${v.verse}. ${v.text}`).join(' ');

    const utterance = new SpeechSynthesisUtterance(fullChapterText);
    utterance.lang = 'pt-BR';
    utterance.rate = speechSpeed;

    utterance.onend = () => {
      setIsPlayingAudio(false);
      setCurrentSpokenVerse(null);
    };

    utterance.onerror = () => {
      setIsPlayingAudio(false);
      setCurrentSpokenVerse(null);
    };

    window.speechSynthesis.speak(utterance);
    setIsPlayingAudio(true);
  };

  const handleOpenAIExegesis = (reference: string) => {
    window.dispatchEvent(
      new CustomEvent('open-ai-assistant', {
        detail: {
          mode: 'exegesis',
          reference: reference
        }
      })
    );
  };

  const handleCopyVerse = (text: string, ref: string) => {
    navigator.clipboard.writeText(`"${text}" — ${ref}`);
    setCopiedVerse(true);
    setTimeout(() => setCopiedVerse(false), 2000);
  };

  const handleSaveVerseToNotes = async (v: Verse) => {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'notes'), {
        userId: auth.currentUser.uid,
        title: `Estudo: ${v.book_name} ${v.chapter}:${v.verse}`,
        content: v.text,
        verseRef: `${v.book_name} ${v.chapter}:${v.verse}`,
        wordStudy: '',
        xp: 15,
        createdAt: serverTimestamp(),
      });
      setSavedVerse(true);
      setTimeout(() => setSavedVerse(false), 2000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'notes');
    }
  };

  useEffect(() => {
    if (location.state && location.state.book && location.state.chapter) {
      const bookData = BIBLE_STRUCTURE.find(b => b.book === location.state.book);
      if (bookData) {
        setSelectedBook(bookData);
        setSelectedChapter(location.state.chapter);
        setView('chapter');
        fetchChapter(location.state.book, location.state.chapter);
      }
    }
  }, [location.state, fetchChapter]);

  useEffect(() => {
    if (view === 'chapter' && !loading && chapterVerses.length > 0 && location.state?.verse) {
      setTimeout(() => {
        const el = document.getElementById(`verse-${location.state.verse}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.style.backgroundColor = 'rgba(138, 43, 226, 0.3)';
          setTimeout(() => {
            el.style.backgroundColor = '';
          }, 2000);
        }
        navigate(location.pathname, { replace: true, state: {} });
      }, 300);
    }
  }, [view, loading, chapterVerses, location.state, navigate, location.pathname]);

  const searchSingleVerse = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setView('search');
    try {
      const res = await fetch(`https://bible-api.com/${encodeURIComponent(searchReference)}?translation=${translation}`);
      if (!res.ok) throw new Error('Versículo não encontrado');
      const data = await res.json();
      setSearchedVerse({
        book_name: data.verses[0].book_name,
        chapter: data.verses[0].chapter,
        verse: data.verses[0].verse,
        text: data.text
      });
    } catch (err) {
      setError('Sinal interrompido. Verifique a referência.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookSelect = (book: typeof BIBLE_STRUCTURE[0]) => {
    setSelectedBook(book);
    setView('chapters');
    window.scrollTo({ top: 0 });
  };

  const handleChapterSelect = (chapter: number) => {
    setSelectedChapter(chapter);
    setView('chapter');
    if (selectedBook) {
      fetchChapter(selectedBook.book, chapter);
    }
    window.scrollTo({ top: 0 });
  };

  const goBack = () => {
    stopAudio();
    if (view === 'chapter') {
      setView('chapters');
      setChapterVerses([]);
    } else if (view === 'chapters' || view === 'search' || view === 'notes' || view === 'plans') {
      setView('books');
      setSelectedBook(null);
      setSelectedChapter(null);
    }
  };

  return (
    <div className="min-h-screen pb-32">
      {/* iOS Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-40 ios-glass border-b border-black/[0.05] dark:border-white/[0.05] flex items-center justify-between px-4 h-16">
        {view !== 'books' ? (
          <button onClick={goBack} className="flex items-center gap-1 font-medium transition-opacity active:opacity-50" style={{ color: themeColor }}>
            <ChevronLeft className="w-6 h-6" />
            <span className="text-[15px]">Voltar</span>
          </button>
        ) : (
          <Link to="/" className="flex items-center gap-1 font-medium transition-opacity active:opacity-50" style={{ color: themeColor }}>
            <ChevronLeft className="w-6 h-6" />
            <span className="text-[15px]">Início</span>
          </Link>
        )}
        <h1 className="text-[17px] font-bold tracking-tight absolute left-1/2 -translate-x-1/2">
          {view === 'books' ? 'Bíblia Quantum' : view === 'chapters' ? selectedBook?.book : view === 'chapter' ? `${selectedBook?.book} ${selectedChapter}` : view === 'plans' ? 'Planos de Leitura' : view === 'notes' ? 'Bloco de Notas' : 'Busca'}
        </h1>
        <div className="flex items-center gap-1">
          {view === 'chapter' && (
            <button
              onClick={() => handleOpenAIExegesis(`${selectedBook?.book} ${selectedChapter}`)}
              className="px-2.5 py-1.5 rounded-full bg-[var(--theme-color)]/20 hover:bg-[var(--theme-color)]/30 border border-[var(--theme-color)]/30 flex items-center gap-1 text-xs font-bold text-[var(--theme-color)] transition-colors"
              title="Exegese Teológica com IA"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exegese IA</span>
            </button>
          )}
          {view !== 'notes' && (
            <button onClick={() => setView('notes')} className="w-10 h-10 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/5" style={{ color: themeColor }}>
              <Edit3 className="w-5 h-5" />
            </button>
          )}
        </div>
      </nav>

      <div className="pt-20 px-4 md:px-6 space-y-6 max-w-2xl mx-auto">
        {/* Navigation Tabs between Books and Reading Plans */}
        {view !== 'notes' && (
          <header className="space-y-4">
            <div className="flex gap-2 p-1 bg-black/5 dark:bg-white/5 rounded-2xl">
              <button
                onClick={() => setView('books')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  view === 'books' || view === 'chapters' || view === 'chapter' ? 'bg-white dark:bg-white/10 shadow-sm text-black dark:text-white' : 'text-[#8E8E93]'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Livros & Capítulos
              </button>
              <button
                onClick={() => setView('plans')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  view === 'plans' ? 'bg-white dark:bg-white/10 shadow-sm text-black dark:text-white' : 'text-[#8E8E93]'
                }`}
              >
                <Target className="w-4 h-4 text-emerald-400" />
                Planos de Leitura
              </button>
            </div>

            <form onSubmit={searchSingleVerse} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93]" />
              <input 
                type="text" 
                value={searchReference}
                onChange={(e) => setSearchReference(e.target.value)}
                placeholder="Buscar versículo (Ex: João 3:16, Salmos 23)"
                className="w-full bg-black/5 dark:bg-white/5 rounded-2xl py-3 pl-10 pr-4 text-[15px] focus:outline-none focus:ring-2 transition-all"
                style={{ '--tw-ring-color': themeColor } as any}
              />
            </form>

            <div className="flex gap-2 p-1 bg-black/5 dark:bg-white/5 rounded-xl">
               {translations.map((t) => (
                 <button
                   key={t.id}
                   onClick={() => { setTranslation(t.id); if(view==='chapter' && selectedBook && selectedChapter) fetchChapter(selectedBook.book, selectedChapter, t.id); }}
                   className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                     translation === t.id ? 'bg-white dark:bg-white/10 shadow-sm' : 'text-[#8E8E93]'
                   }`}
                 >
                   {t.label}
                 </button>
               ))}
            </div>
          </header>
        )}

        {/* Dynamic Area */}
        <AnimatePresence mode="wait">
          {view === 'books' && (
            <motion.div key="books" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="ios-card bg-[var(--theme-color)] p-6 rounded-[24px] relative overflow-hidden group mb-8 shadow-xl">
                 <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                 <div className="relative z-10 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-white pb-2 border-b border-white/20">
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                      <span className="text-xs font-bold uppercase tracking-widest leading-none">Estudo Teológico com IA</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <h4 className="text-2xl font-bold tracking-tight text-white mb-1">Pastor Digital & Exegese</h4>
                        <p className="text-sm text-white/80 font-medium">Analise passagens no hebraico e grego original com 1 toque.</p>
                      </div>
                      <button 
                        className="h-10 px-6 rounded-full bg-white text-[var(--theme-color)] font-bold text-sm shadow-xl active:scale-95 transition-transform shrink-0" 
                        onClick={() => handleOpenAIExegesis('João 3:16')}
                      >
                        Abrir IA
                      </button>
                    </div>
                 </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#8E8E93] uppercase tracking-widest pl-2">Antigo Testamento</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                   {BIBLE_STRUCTURE.filter(b => b.testament === 'old').map(book => (
                     <button 
                       key={book.book}
                       onClick={() => handleBookSelect(book)}
                       className="ios-card p-3 flex flex-col justify-between items-start active:scale-95 transition-all text-left bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
                     >
                       <h4 className="font-bold text-[15px]">{book.book}</h4>
                       <p className="text-[11px] text-[#8E8E93] font-bold uppercase tracking-widest mt-1">{book.chapters} Cap</p>
                     </button>
                   ))}
                </div>
              </div>
              <div className="space-y-4 pt-4 border-t border-black/5 dark:border-white/5">
                <h3 className="text-sm font-bold text-[#8E8E93] uppercase tracking-widest pl-2">Novo Testamento</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                   {BIBLE_STRUCTURE.filter(b => b.testament === 'new').map(book => (
                     <button 
                       key={book.book}
                       onClick={() => handleBookSelect(book)}
                       className="ios-card p-3 flex flex-col justify-between items-start active:scale-95 transition-all text-left bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
                     >
                       <h4 className="font-bold text-[15px]">{book.book}</h4>
                       <p className="text-[11px] text-[#8E8E93] font-bold uppercase tracking-widest mt-1">{book.chapters} Cap</p>
                     </button>
                   ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* READING PLANS VIEW */}
          {view === 'plans' && (
            <motion.div key="plans" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              {READING_PLANS.map((plan) => {
                const completedDays = planProgress[plan.id] || [];
                const percent = Math.round((completedDays.length / plan.totalDays) * 100);

                return (
                  <div key={plan.id} className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-[28px] p-6 space-y-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--theme-color)]">{plan.category}</span>
                        <h3 className="text-xl font-bold mt-0.5">{plan.title}</h3>
                        <p className="text-xs text-white/60 mt-1">{plan.description}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black">{percent}%</span>
                        <p className="text-[10px] text-white/50">{completedDays.length}/{plan.totalDays} dias</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[var(--theme-color)] to-emerald-400 transition-all duration-500 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                      {plan.days.map((d) => {
                        const isDone = completedDays.includes(d.day);
                        return (
                          <div
                            key={d.day}
                            className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                              isDone
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 text-white/80'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => togglePlanDay(plan.id, d.day)}
                                className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors ${
                                  isDone
                                    ? 'bg-emerald-500 border-emerald-500 text-black font-bold'
                                    : 'border-white/20 hover:border-white/40'
                                }`}
                              >
                                {isDone && <Check className="w-4 h-4" />}
                              </button>
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Dia {d.day}</span>
                                <p className="text-sm font-semibold">{d.reference}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                const parts = d.reference.split(' ')[0];
                                const book = BIBLE_STRUCTURE.find(b => b.book.toLowerCase() === parts.toLowerCase());
                                if (book) {
                                  handleBookSelect(book);
                                }
                              }}
                              className="text-xs px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white font-medium"
                            >
                              Ler
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {view === 'chapters' && selectedBook && (
            <motion.div key="chapters" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
               <h3 className="text-xl font-bold tracking-tight mb-4">{selectedBook.book} - Capítulos</h3>
               <div className="grid grid-cols-5 md:grid-cols-8 gap-3">
                 {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(cap => (
                   <button
                     key={cap}
                     onClick={() => handleChapterSelect(cap)}
                     className="aspect-square rounded-[1rem] bg-black/5 dark:bg-white/5 font-bold text-lg active:scale-95 transition-all flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10"
                   >
                     {cap}
                   </button>
                 ))}
               </div>
            </motion.div>
          )}

          {view === 'chapter' && (
            <motion.div key="chapter" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="pb-12 space-y-4">
              {/* Chapter Audio Reader & Tool Banner */}
              <div className="sticky top-16 z-30 p-3 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleAudioNarration}
                    className={`h-10 px-4 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                      isPlayingAudio
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-[var(--theme-color)] text-white hover:bg-[var(--color-primary-focused)]'
                    }`}
                  >
                    {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                    {isPlayingAudio ? 'Pausar Áudio' : 'Ouvir Capítulo'}
                  </button>

                  {isPlayingAudio && (
                    <button
                      onClick={() => setSpeechSpeed(s => (s === 1 ? 1.25 : s === 1.25 ? 1.5 : 1))}
                      className="px-2.5 py-1.5 rounded-lg bg-white/10 text-xs font-bold text-white hover:bg-white/20 transition-colors"
                    >
                      {speechSpeed}x
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenAIExegesis(`${selectedBook?.book} ${selectedChapter}`)}
                    className="h-10 px-3.5 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1.5 hover:bg-purple-600/30 transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                    Exegese IA
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="py-20 flex flex-col items-center">
                  <Cpu className="w-8 h-8 animate-spin opacity-20 mb-4" style={{ color: themeColor }} />
                </div>
              ) : error ? (
                <div className="py-20 flex flex-col items-center text-center">
                  <WifiOff className="w-8 h-8 text-[#FF3B30] mb-2" />
                  <p className="text-[#FF3B30] font-bold">{error}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {chapterVerses.map(v => {
                    const isHighlighted = highlightedVerses.includes(`${v.book_name}_${v.chapter}_${v.verse}`);
                    const isSelected = activeVerse?.verse === v.verse;

                    return (
                      <div 
                        key={v.verse} 
                        id={`verse-${v.verse}`}
                        onClick={() => setActiveVerse(isSelected ? null : v)}
                        className={`p-3.5 rounded-2xl cursor-pointer transition-all border ${
                          isSelected
                            ? 'bg-purple-900/30 border-purple-500/50 shadow-md'
                            : isHighlighted
                            ? 'bg-[var(--theme-color)]/15 border-[var(--theme-color)]/30'
                            : 'bg-black/5 dark:bg-white/5 border-transparent hover:bg-black/10 dark:hover:bg-white/10'
                        }`}
                      >
                        <div className="flex gap-3">
                          <span className="text-[12px] font-bold mt-0.5 w-6 text-right shrink-0" style={{ color: isHighlighted ? themeColor : '#8E8E93' }}>{v.verse}</span>
                          <div className="flex-1">
                            <p className={`text-[17px] leading-relaxed font-medium ${isHighlighted ? 'text-[var(--theme-color)]' : 'text-black/90 dark:text-white/90'}`}>
                              {v.text}
                            </p>

                            {/* Verse Quick Action Bar when clicked */}
                            {isSelected && (
                              <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center gap-2 text-xs"
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenAIExegesis(`${v.book_name} ${v.chapter}:${v.verse}`);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-[var(--theme-color)] text-white font-bold flex items-center gap-1 shadow-sm"
                                >
                                  <Sparkles className="w-3.5 h-3.5" /> Exegese IA
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleHighlight(v.book_name, v.chapter, v.verse);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium flex items-center gap-1"
                                >
                                  <Highlighter className="w-3.5 h-3.5" /> {isHighlighted ? 'Desmarcar' : 'Destacar'}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyVerse(v.text, `${v.book_name} ${v.chapter}:${v.verse}`);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium flex items-center gap-1"
                                >
                                  {copiedVerse ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                  {copiedVerse ? 'Copiado' : 'Copiar'}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSaveVerseToNotes(v);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium flex items-center gap-1"
                                >
                                  {savedVerse ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
                                  {savedVerse ? 'Salvo' : 'Salvar Nota'}
                                </button>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {view === 'search' && (
            <motion.div key="search" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="ios-card p-6 min-h-[300px] flex flex-col justify-center">
              {loading ? (
                <div className="flex flex-col items-center">
                  <Cpu className="w-8 h-8 animate-spin opacity-20 mb-4" style={{ color: themeColor }} />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center text-center">
                  <WifiOff className="w-8 h-8 text-[#FF3B30] mb-2" />
                  <p className="text-[#FF3B30] font-bold">{error}</p>
                </div>
              ) : searchedVerse && (
                <div className="space-y-6 text-center">
                  <div>
                    <h3 className="font-bold text-lg" style={{ color: themeColor }}>{searchedVerse.book_name} {searchedVerse.chapter}:{searchedVerse.verse}</h3>
                    <div className="w-8 h-1 mx-auto mt-2 rounded-full opacity-20" style={{ backgroundColor: themeColor }} />
                  </div>
                  <p className="text-2xl font-bold tracking-tight leading-snug italic text-black/90 dark:text-white/90">"{searchedVerse.text.trim()}"</p>
                  
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => handleOpenAIExegesis(`${searchedVerse.book_name} ${searchedVerse.chapter}:${searchedVerse.verse}`)}
                      className="px-4 py-2 rounded-full bg-[var(--theme-color)] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg"
                    >
                      <Sparkles className="w-4 h-4" /> Exegese Teológica
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {view === 'notes' && (
            <motion.div key="notes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full">
               <Notes embedded={true} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
