import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Search, Book, ChevronRight, ChevronLeft, Bookmark, Share2, 
  Download, Wifi, WifiOff, Target, Zap, Globe, Cpu, BookOpen, 
  List, PenTool, Highlighter, Edit3, Volume2, VolumeX, Sparkles, 
  CheckCircle2, Copy, Check, Save, Play, Pause, RotateCcw,
  Type, Sliders, Layers, Library, Music, Mic2, Radio, SlidersHorizontal,
  Flame, Heart, Calendar, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BIBLE_STRUCTURE, SAMPLE_VERSES } from '../lib/bibleData';
import { BIBLE_DICTIONARY, DictionaryTerm } from '../lib/bibleDictionary';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../lib/ThemeContext';
import Notes from './Notes';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';
import { devotionalAudio, VoiceArchetype } from '../lib/devotionalAudioEngine';

interface Verse {
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

export type HighlightColor = 'gold' | 'emerald' | 'azure' | 'rose';

export interface VerseHighlight {
  id: string;
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
  color: HighlightColor;
  date: string;
  note?: string;
}

interface ReadingPlan {
  id: string;
  title: string;
  description: string;
  totalDays: number;
  category: string;
  days: { day: number; reference: string; targetBook: string; targetChapter: number }[];
}

const READING_PLANS: ReadingPlan[] = [
  {
    id: 'plan-nt-90',
    title: 'Novo Testamento Completo',
    description: 'Uma jornada inspiradora por todos os 27 livros do Novo Testamento.',
    totalDays: 14,
    category: 'Novo Testamento',
    days: [
      { day: 1, reference: 'Mateus 1', targetBook: 'Mateus', targetChapter: 1 },
      { day: 2, reference: 'Mateus 5 (Sermão do Monte)', targetBook: 'Mateus', targetChapter: 5 },
      { day: 3, reference: 'Mateus 28 (A Grande Comissão)', targetBook: 'Mateus', targetChapter: 28 },
      { day: 4, reference: 'Marcos 1', targetBook: 'Marcos', targetChapter: 1 },
      { day: 5, reference: 'Lucas 1', targetBook: 'Lucas', targetChapter: 1 },
      { day: 6, reference: 'Lucas 15 (O Filho Pródigo)', targetBook: 'Lucas', targetChapter: 15 },
      { day: 7, reference: 'João 1 (O Verbo de Deus)', targetBook: 'João', targetChapter: 1 },
      { day: 8, reference: 'João 3 (O Novo Nascimento)', targetBook: 'João', targetChapter: 3 },
      { day: 9, reference: 'João 14 (O Consolador)', targetBook: 'João', targetChapter: 14 },
      { day: 10, reference: 'Atos 2 (O Pentecostes)', targetBook: 'Atos', targetChapter: 2 },
      { day: 11, reference: 'Romanos 8 (Vida no Espírito)', targetBook: 'Romanos', targetChapter: 8 },
      { day: 12, reference: '1 Coríntios 13 (O Amor)', targetBook: '1 Coríntios', targetChapter: 13 },
      { day: 13, reference: 'Efésios 6 (A Armadura de Deus)', targetBook: 'Efésios', targetChapter: 6 },
      { day: 14, reference: 'Apocalipse 21 (O Novo Céu)', targetBook: 'Apocalipse', targetChapter: 21 },
    ]
  },
  {
    id: 'plan-salmos-sabedoria',
    title: 'Salmos de Paz & Provérbios de Sabedoria',
    description: 'Alimento diário para o coração e direcionamento celestial para a vida prática.',
    totalDays: 7,
    category: 'Devocional',
    days: [
      { day: 1, reference: 'Salmos 23 (O Bom Pastor)', targetBook: 'Salmos', targetChapter: 23 },
      { day: 2, reference: 'Salmos 91 (O Refúgio do Altíssimo)', targetBook: 'Salmos', targetChapter: 91 },
      { day: 3, reference: 'Salmos 121 (O Socorro que vem do Senhor)', targetBook: 'Salmos', targetChapter: 121 },
      { day: 4, reference: 'Salmos 46 (Deus é Nosso Refúgio)', targetBook: 'Salmos', targetChapter: 46 },
      { day: 5, reference: 'Provérbios 3 (Confiança no Senhor)', targetBook: 'Provérbios', targetChapter: 3 },
      { day: 6, reference: 'Salmos 139 (Onisciência e Amor)', targetBook: 'Salmos', targetChapter: 139 },
      { day: 7, reference: 'Salmos 150 (Tudo que tem fôlego Louve)', targetBook: 'Salmos', targetChapter: 150 },
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
  
  const [view, setView] = useState<'books' | 'chapters' | 'chapter' | 'search' | 'notes' | 'plans' | 'dictionary' | 'highlights'>('books');
  const [selectedBook, setSelectedBook] = useState<typeof BIBLE_STRUCTURE[0] | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [chapterVerses, setChapterVerses] = useState<Verse[]>([]);
  
  const [searchReference, setSearchReference] = useState('João 3:16');
  const [searchedVerse, setSearchedVerse] = useState<Verse | null>(null);

  // Dictionary Search state
  const [dictSearch, setDictSearch] = useState('');
  const [selectedDictCategory, setSelectedDictCategory] = useState('all');

  // Accessibility Font Size & Typography state
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('bible_font_size');
    return saved ? parseInt(saved, 10) : 17;
  });
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif'>('sans');
  const [showTypographySettings, setShowTypographySettings] = useState(false);

  // Audio & Devotional Narration Engine State
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [showAudioControls, setShowAudioControls] = useState(false);
  const [voiceArchetype, setVoiceArchetype] = useState<VoiceArchetype>(devotionalAudio.voiceArchetype);
  const [musicVolume, setMusicVolume] = useState<number>(devotionalAudio.musicVolume);
  const [activeSpokenVerse, setActiveSpokenVerse] = useState<number | null>(null);

  // Verse selection modal / drawer
  const [activeVerse, setActiveVerse] = useState<Verse | null>(null);
  const [copiedVerse, setCopiedVerse] = useState(false);
  const [savedVerse, setSavedVerse] = useState(false);

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

  // Structured Multi-Color Highlights
  const [highlights, setHighlights] = useState<Record<string, VerseHighlight>>(() => {
    const cached = localStorage.getItem('bible_colored_highlights');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {}
    }
    // Backward compatibility with previous array highlights
    const oldArr = localStorage.getItem('bible_highlights');
    if (oldArr) {
      try {
        const parsed = JSON.parse(oldArr);
        const map: Record<string, VerseHighlight> = {};
        parsed.forEach((k: string) => {
          const parts = k.split('_');
          if (parts.length >= 3) {
            map[k] = {
              id: k,
              book_name: parts[0],
              chapter: parseInt(parts[1], 10),
              verse: parseInt(parts[2], 10),
              text: '',
              color: 'gold',
              date: new Date().toLocaleDateString('pt-BR')
            };
          }
        });
        return map;
      } catch {}
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('bible_colored_highlights', JSON.stringify(highlights));
  }, [highlights]);

  const applyHighlight = (v: Verse, color: HighlightColor) => {
    const key = `${v.book_name}_${v.chapter}_${v.verse}`;
    setHighlights(prev => ({
      ...prev,
      [key]: {
        id: key,
        book_name: v.book_name,
        chapter: v.chapter,
        verse: v.verse,
        text: v.text,
        color,
        date: new Date().toLocaleDateString('pt-BR')
      }
    }));
  };

  const removeHighlight = (v: Verse) => {
    const key = `${v.book_name}_${v.chapter}_${v.verse}`;
    setHighlights(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const updateFontSize = (size: number) => {
    setFontSize(size);
    localStorage.setItem('bible_font_size', size.toString());
  };

  const translations = [
    { id: 'almeida', label: 'Almeida Revista' },
    { id: 'nvi', label: 'Nova Versão Internacional (NVI)' },
  ];

  useEffect(() => {
    const handleStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);

    // Audio Engine State Listener
    devotionalAudio.onStateChange((playing) => {
      setIsAudioPlaying(playing);
      if (!playing) {
        setActiveSpokenVerse(null);
      }
    });

    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
      devotionalAudio.stop();
    };
  }, []);

  const fetchChapter = useCallback(async (bookName: string, chapterNum: number, trans: string = translation) => {
    setLoading(true);
    setError(null);
    devotionalAudio.stop();

    if (navigator.onLine) {
      try {
        const res = await fetch(`https://bible-api.com/${encodeURIComponent(bookName)}+${chapterNum}?translation=${trans}`);
        if (!res.ok) throw new Error('Falha ao obter capítulo');
        const data = await res.json();
        const formatted: Verse[] = data.verses.map((v: any) => ({
          book_name: v.book_name,
          chapter: v.chapter,
          verse: v.verse,
          text: v.text.trim()
        }));
        setChapterVerses(formatted);
        setLoading(false);
        return;
      } catch (err) {
        console.warn('API online falhou, buscando cache local...', err);
      }
    }

    // Fallback offline verses generator
    const singleSample = SAMPLE_VERSES[`${bookName} ${chapterNum}:1`];
    if (singleSample) {
      setChapterVerses([{
        book_name: bookName,
        chapter: chapterNum,
        verse: 1,
        text: singleSample
      }]);
    } else {
      const generated: Verse[] = Array.from({ length: 15 }, (_, i) => ({
        book_name: bookName,
        chapter: chapterNum,
        verse: i + 1,
        text: `Porque a palavra de Deus é viva, e eficaz, e mais penetrante do que qualquer espada de dois gumes... (${bookName} ${chapterNum}:${i + 1})`
      }));
      setChapterVerses(generated);
    }
    setLoading(false);
  }, [translation]);

  // Devotional Soft Voice Playback Handler (Inspired by YouTube reference)
  const handleToggleDevotionalNarration = () => {
    if (isAudioPlaying) {
      devotionalAudio.stop();
      setIsAudioPlaying(false);
      setActiveSpokenVerse(null);
      return;
    }

    if (chapterVerses.length === 0) return;

    setShowAudioControls(true);
    devotionalAudio.narrateVerses(chapterVerses, {
      onVerseChange: (verseNum) => {
        setActiveSpokenVerse(verseNum);
        // Scroll active verse smoothly into view
        const el = document.getElementById(`verse-${verseNum}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      },
      onFinish: () => {
        setIsAudioPlaying(false);
        setActiveSpokenVerse(null);
      },
      includeBackgroundMusic: musicVolume > 0
    });
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

  const startPlanChapter = (targetBookName: string, targetChapterNum: number) => {
    const bookData = BIBLE_STRUCTURE.find(b => b.book === targetBookName) || {
      book: targetBookName,
      chapters: 50,
      testament: 'old' as const
    };
    setSelectedBook(bookData);
    setSelectedChapter(targetChapterNum);
    setView('chapter');
    fetchChapter(targetBookName, targetChapterNum);
    window.scrollTo({ top: 0 });
  };

  const goBack = () => {
    devotionalAudio.stop();
    if (view === 'chapter') {
      setView('chapters');
      setChapterVerses([]);
    } else if (view === 'chapters' || view === 'search' || view === 'notes' || view === 'plans' || view === 'dictionary' || view === 'highlights') {
      setView('books');
      setSelectedBook(null);
      setSelectedChapter(null);
    }
  };

  const filteredDictionary = BIBLE_DICTIONARY.filter(item => {
    if (selectedDictCategory !== 'all' && item.category !== selectedDictCategory) return false;
    if (dictSearch.trim()) {
      const q = dictSearch.toLowerCase();
      return item.term.toLowerCase().includes(q) || 
             item.definition.toLowerCase().includes(q) ||
             item.transliteration.toLowerCase().includes(q);
    }
    return true;
  });

  const allHighlightsList = Object.values(highlights);

  // Color helper mappings for aesthetic rendering
  const getColorStyles = (color: HighlightColor) => {
    switch (color) {
      case 'gold':
        return {
          bg: 'bg-amber-500/15 border-amber-500/35',
          text: 'text-amber-300',
          dot: 'bg-amber-400',
          label: 'Promessa & Fé'
        };
      case 'emerald':
        return {
          bg: 'bg-emerald-500/15 border-emerald-500/35',
          text: 'text-emerald-300',
          dot: 'bg-emerald-400',
          label: 'Vida & Esperança'
        };
      case 'azure':
        return {
          bg: 'bg-cyan-500/15 border-cyan-500/35',
          text: 'text-cyan-300',
          dot: 'bg-cyan-400',
          label: 'Paz & Conforto'
        };
      case 'rose':
        return {
          bg: 'bg-purple-500/15 border-purple-500/35',
          text: 'text-purple-300',
          dot: 'bg-purple-400',
          label: 'Graça & Amor'
        };
    }
  };

  return (
    <div className="min-h-screen pb-32">
      {/* Navigation Header */}
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
          {view === 'books' ? 'Bíblia Sagrada' : view === 'chapters' ? selectedBook?.book : view === 'chapter' ? `${selectedBook?.book} ${selectedChapter}` : view === 'plans' ? 'Planos de Leitura' : view === 'highlights' ? 'Meus Versículos Grifados' : view === 'dictionary' ? 'Dicionário Teológico' : view === 'notes' ? 'Bloco de Notas' : 'Busca'}
        </h1>
        <div className="flex items-center gap-1.5">
          {view === 'chapter' && (
            <>
              <button
                onClick={() => setShowAudioControls(!showAudioControls)}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  isAudioPlaying 
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30 animate-pulse' 
                    : 'bg-black/5 dark:bg-white/5 text-white/80 hover:text-white'
                }`}
                title="Narração com Voz Suave & Fundo de Oração"
              >
                <Radio className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowTypographySettings(!showTypographySettings)}
                className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-white/80 hover:text-white"
                title="Ajustar Fonte e Acessibilidade"
              >
                <Type className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleOpenAIExegesis(`${selectedBook?.book} ${selectedChapter}`)}
                className="px-2.5 py-1.5 rounded-full bg-[var(--theme-color)]/20 hover:bg-[var(--theme-color)]/30 border border-[var(--theme-color)]/30 flex items-center gap-1 text-xs font-bold text-[var(--theme-color)] transition-colors"
                title="Exegese Teológica com IA"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Exegese IA</span>
              </button>
            </>
          )}
          {view !== 'notes' && (
            <button onClick={() => setView('notes')} className="w-9 h-9 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/5" style={{ color: themeColor }}>
              <Edit3 className="w-4 h-4" />
            </button>
          )}
        </div>
      </nav>

      {/* Devotional Audio Control Bar (YouTube Gentle Voice Style) */}
      <AnimatePresence>
        {showAudioControls && view === 'chapter' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-16 left-0 right-0 z-30 bg-[#14141C]/95 backdrop-blur-xl border-b border-amber-500/20 p-4 max-w-xl mx-auto shadow-2xl rounded-b-3xl"
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-amber-500/20 text-amber-300">
                  <Mic2 className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    Narração Suave & Fundo de Oração
                    {isAudioPlaying && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
                  </h4>
                  <p className="text-[10px] text-white/50">Voz solene inspiradora com harmonia celestial</p>
                </div>
              </div>

              <button
                onClick={handleToggleDevotionalNarration}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
                  isAudioPlaying
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold'
                }`}
              >
                {isAudioPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                {isAudioPlaying ? 'Pausar' : 'Ouvir Capítulo'}
              </button>
            </div>

            {/* Voice Archetype Selector */}
            <div className="grid grid-cols-3 gap-2 text-[11px] font-bold mb-3">
              <button
                onClick={() => {
                  setVoiceArchetype('solene');
                  devotionalAudio.setArchetype('solene');
                }}
                className={`p-2 rounded-xl border flex flex-col items-center gap-0.5 text-center transition-all ${
                  voiceArchetype === 'solene'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                    : 'bg-black/30 border-white/10 text-white/60'
                }`}
              >
                <span>🎙️ Solene & Profunda</span>
                <span className="text-[9px] text-white/40 font-normal">Cid Moreira / Solene</span>
              </button>

              <button
                onClick={() => {
                  setVoiceArchetype('suave');
                  devotionalAudio.setArchetype('suave');
                }}
                className={`p-2 rounded-xl border flex flex-col items-center gap-0.5 text-center transition-all ${
                  voiceArchetype === 'suave'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                    : 'bg-black/30 border-white/10 text-white/60'
                }`}
              >
                <span>🕊️ Suave & Acolhedora</span>
                <span className="text-[9px] text-white/40 font-normal">Paz & Oração</span>
              </button>

              <button
                onClick={() => {
                  setVoiceArchetype('feminina');
                  devotionalAudio.setArchetype('feminina');
                }}
                className={`p-2 rounded-xl border flex flex-col items-center gap-0.5 text-center transition-all ${
                  voiceArchetype === 'feminina'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                    : 'bg-black/30 border-white/10 text-white/60'
                }`}
              >
                <span>🌸 Serena Feminina</span>
                <span className="text-[9px] text-white/40 font-normal">Voz Doce & Clara</span>
              </button>
            </div>

            {/* Background Music Volume Slider */}
            <div className="flex items-center justify-between gap-3 text-xs text-white/80 bg-black/40 px-3 py-2 rounded-xl border border-white/10">
              <div className="flex items-center gap-2">
                <Music className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[11px] font-semibold">Fundo Celestial (Pad de Paz):</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={musicVolume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setMusicVolume(val);
                  devotionalAudio.setMusicVolume(val);
                }}
                className="w-28 accent-amber-400"
              />
              <span className="text-[10px] font-mono text-amber-300 w-8 text-right">
                {Math.round(musicVolume * 100)}%
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Accessibility / Typography Floating Settings Bar */}
      <AnimatePresence>
        {showTypographySettings && view === 'chapter' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-16 left-0 right-0 z-30 bg-[#121216]/95 backdrop-blur-md border-b border-white/10 p-4 max-w-lg mx-auto shadow-2xl rounded-b-2xl"
          >
            <div className="flex items-center justify-between gap-4 text-xs font-bold text-white">
              <div className="flex items-center gap-2">
                <span>Tamanho:</span>
                {[14, 17, 20, 24].map(sz => (
                  <button
                    key={sz}
                    onClick={() => updateFontSize(sz)}
                    className={`w-7 h-7 rounded-lg border ${fontSize === sz ? 'bg-white text-black border-white' : 'bg-black/40 border-white/20 text-white'}`}
                  >
                    {sz}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span>Fonte:</span>
                <button
                  onClick={() => setFontFamily('sans')}
                  className={`px-2.5 py-1 rounded-lg border ${fontFamily === 'sans' ? 'bg-white text-black' : 'bg-black/40 border-white/20'}`}
                >
                  Sans
                </button>
                <button
                  onClick={() => setFontFamily('serif')}
                  className={`px-2.5 py-1 rounded-lg border font-serif ${fontFamily === 'serif' ? 'bg-white text-black' : 'bg-black/40 border-white/20'}`}
                >
                  Serif
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 pt-20">
        {/* Secondary Subtabs when in Books View */}
        {view === 'books' && (
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            <button 
              onClick={() => setView('books')}
              className="px-4 py-2 rounded-full text-xs font-bold bg-white text-black shadow-md shrink-0 flex items-center gap-1.5"
            >
              <Book className="w-3.5 h-3.5" /> Livros
            </button>
            <button 
              onClick={() => setView('plans')}
              className="px-4 py-2 rounded-full text-xs font-bold bg-[#14141A] text-white/80 hover:text-white border border-white/10 shadow-sm shrink-0 flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-400" /> Planos de Leitura
            </button>
            <button 
              onClick={() => setView('highlights')}
              className="px-4 py-2 rounded-full text-xs font-bold bg-[#14141A] text-white/80 hover:text-white border border-white/10 shadow-sm shrink-0 flex items-center gap-1.5"
            >
              <Highlighter className="w-3.5 h-3.5 text-purple-400" /> Grifados ({allHighlightsList.length})
            </button>
            <button 
              onClick={() => setView('dictionary')}
              className="px-4 py-2 rounded-full text-xs font-bold bg-[#14141A] text-white/80 hover:text-white border border-white/10 shadow-sm shrink-0 flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" /> Dicionário Bíblico
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Books Grid View */}
          {view === 'books' && (
            <motion.div key="books" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              {/* Search Bar */}
              <form onSubmit={searchSingleVerse} className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input 
                  type="text" 
                  value={searchReference}
                  onChange={(e) => setSearchReference(e.target.value)}
                  placeholder="Buscar versículo (ex: João 3:16, Salmos 23)..."
                  className="w-full bg-[#121216] border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-xs text-white placeholder:text-white/30 outline-none focus:border-[var(--theme-color)]"
                />
              </form>

              {/* Devotional Hero Banner with gentle audio callout */}
              <div className="bg-gradient-to-br from-amber-500/10 via-[#181824] to-purple-900/20 border border-amber-500/20 rounded-[28px] p-5 relative overflow-hidden shadow-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1 max-w-md">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                      ✨ Experiência Devocional
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      Narração Suave & Leitura Imersiva
                    </h3>
                    <p className="text-xs text-white/60 leading-relaxed">
                      Escute a Palavra narrada com voz solene e fundo instrumental celestial de oração.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedBook(BIBLE_STRUCTURE.find(b => b.book === 'Salmos') || BIBLE_STRUCTURE[0]);
                      setSelectedChapter(23);
                      setView('chapter');
                      fetchChapter('Salmos', 23);
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-all shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Ouvir Salmos 23
                  </button>
                </div>
              </div>

              {/* Testament Sections */}
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-[#8E8E93] uppercase tracking-widest pl-2">Antigo Testamento</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {BIBLE_STRUCTURE.filter(b => b.testament === 'old').map(book => (
                    <button 
                      key={book.book}
                      onClick={() => handleBookSelect(book)}
                      className="ios-card p-3 flex flex-col justify-between items-start active:scale-95 transition-all text-left bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
                    >
                      <span className="font-bold text-[15px]">{book.book}</span>
                      <span className="text-[11px] text-[#8E8E93]">{book.chapters} caps</span>
                    </button>
                  ))}
                </div>

                <h3 className="text-sm font-bold text-[#8E8E93] uppercase tracking-widest pl-2 pt-4">Novo Testamento</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {BIBLE_STRUCTURE.filter(b => b.testament === 'new').map(book => (
                    <button 
                      key={book.book}
                      onClick={() => handleBookSelect(book)}
                      className="ios-card p-3 flex flex-col justify-between items-start active:scale-95 transition-all text-left bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
                    >
                      <span className="font-bold text-[15px]">{book.book}</span>
                      <span className="text-[11px] text-[#8E8E93]">{book.chapters} caps</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Chapter Reading View */}
          {view === 'chapter' && (
            <motion.div key="chapter" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="flex flex-wrap items-center justify-between bg-black/5 dark:bg-white/5 p-4 rounded-2xl gap-2">
                <div>
                  <h2 className="text-xl font-bold">{selectedBook?.book} {selectedChapter}</h2>
                  <span className="text-xs text-white/50 uppercase font-semibold">{translation.toUpperCase()}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAudioControls(!showAudioControls)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-amber-300 text-xs font-bold flex items-center gap-1.5 border border-amber-500/20"
                    title="Configurações de Voz & Fundo Musical"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Voz & Música</span>
                  </button>

                  <button
                    onClick={handleToggleDevotionalNarration}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95 ${
                      isAudioPlaying ? 'bg-red-500 text-white animate-pulse' : 'bg-amber-500 text-black font-extrabold shadow-md'
                    }`}
                  >
                    {isAudioPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    {isAudioPlaying ? 'Parar Leitura' : 'Ouvir Capítulo'}
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-20 text-white/40 text-xs font-bold uppercase tracking-widest animate-pulse">
                  Carregando Palavra Viva...
                </div>
              ) : (
                <div className={`space-y-3 ${fontFamily === 'serif' ? 'font-serif' : 'font-sans'}`}>
                  {chapterVerses.map(v => {
                    const key = `${v.book_name}_${v.chapter}_${v.verse}`;
                    const hl = highlights[key];
                    const isSelected = activeVerse?.verse === v.verse;
                    const isSpoken = activeSpokenVerse === v.verse;
                    const hlStyles = hl ? getColorStyles(hl.color) : null;

                    return (
                      <div 
                        key={v.verse} 
                        id={`verse-${v.verse}`}
                        onClick={() => setActiveVerse(isSelected ? null : v)}
                        className={`p-3.5 rounded-2xl cursor-pointer transition-all border ${
                          isSpoken
                            ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/40 shadow-lg scale-[1.01]'
                            : isSelected
                              ? 'bg-purple-900/30 border-purple-500/50 shadow-md'
                              : hlStyles
                                ? `${hlStyles.bg} ${hlStyles.text}`
                                : 'bg-black/5 dark:bg-white/5 border-transparent hover:bg-black/10 dark:hover:bg-white/10'
                        }`}
                      >
                        <div className="flex gap-3">
                          <span className={`text-[12px] font-bold mt-0.5 w-6 text-right shrink-0 ${isSpoken ? 'text-amber-400 font-extrabold' : hlStyles ? hlStyles.text : 'text-[#8E8E93]'}`}>
                            {v.verse}
                          </span>
                          <div className="flex-1">
                            <p 
                              style={{ fontSize: `${fontSize}px` }}
                              className={`leading-relaxed font-medium ${isSpoken ? 'text-white font-semibold' : hlStyles ? hlStyles.text : 'text-black/90 dark:text-white/90'}`}
                            >
                              {v.text}
                            </p>

                            {/* Verse Quick Action & Color Highlighter Bar when clicked */}
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

                                {/* Multi-Color Highlight Selection */}
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/50 border border-white/15">
                                  <span className="text-[10px] text-white/50 font-bold uppercase mr-1">Grifar:</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      applyHighlight(v, 'gold');
                                    }}
                                    className="w-5 h-5 rounded-full bg-amber-400 hover:scale-110 active:scale-95 transition-transform"
                                    title="Dourado: Promessa & Fé"
                                  />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      applyHighlight(v, 'emerald');
                                    }}
                                    className="w-5 h-5 rounded-full bg-emerald-400 hover:scale-110 active:scale-95 transition-transform"
                                    title="Esmeralda: Vida & Esperança"
                                  />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      applyHighlight(v, 'azure');
                                    }}
                                    className="w-5 h-5 rounded-full bg-cyan-400 hover:scale-110 active:scale-95 transition-transform"
                                    title="Azul: Paz & Conforto"
                                  />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      applyHighlight(v, 'rose');
                                    }}
                                    className="w-5 h-5 rounded-full bg-purple-400 hover:scale-110 active:scale-95 transition-transform"
                                    title="Púrpura: Graça & Amor"
                                  />
                                  {hl && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeHighlight(v);
                                      }}
                                      className="ml-1 p-0.5 rounded text-red-400 hover:text-red-300"
                                      title="Remover marcação"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>

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

          {/* Highlights & Grifos Tab View */}
          {view === 'highlights' && (
            <motion.div key="highlights" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Versículos Grifados & Marcados</h2>
                  <p className="text-xs text-white/50">Seu tesouro espiritual organizado por cores</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30">
                  {allHighlightsList.length} Destaques
                </span>
              </div>

              {allHighlightsList.length === 0 ? (
                <div className="text-center py-16 bg-[#121216] rounded-3xl border border-white/5 space-y-3">
                  <Highlighter className="w-10 h-10 text-white/20 mx-auto" />
                  <h3 className="text-base font-bold text-white">Nenhum versículo grifado ainda</h3>
                  <p className="text-xs text-white/50 max-w-sm mx-auto">
                    Ao ler qualquer capítulo da Bíblia, toque no versículo e escolha uma cor para destacá-lo aqui.
                  </p>
                  <button
                    onClick={() => setView('books')}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
                  >
                    Explorar a Bíblia
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {allHighlightsList.map(h => {
                    const st = getColorStyles(h.color);
                    return (
                      <div
                        key={h.id}
                        onClick={() => startPlanChapter(h.book_name, h.chapter)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer hover:scale-[1.01] ${st.bg}`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${st.dot}`} />
                            <h4 className="font-bold text-sm text-white">
                              {h.book_name} {h.chapter}:{h.verse}
                            </h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-black/40 text-white/60">
                              {st.label}
                            </span>
                          </div>
                          <span className="text-[10px] text-white/40">{h.date}</span>
                        </div>
                        <p className="text-xs text-white/90 leading-relaxed italic">
                          "{h.text}"
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* Reading Plans Tab View */}
          {view === 'plans' && (
            <motion.div key="plans" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Planos de Leitura da Bíblia</h2>
                  <p className="text-xs text-white/50">Acompanhe seu crescimento e constância diária</p>
                </div>
              </div>

              <div className="space-y-6">
                {READING_PLANS.map(plan => {
                  const completedDays = planProgress[plan.id] || [];
                  const percent = Math.round((completedDays.length / plan.totalDays) * 100);

                  return (
                    <div key={plan.id} className="bg-[#121216] border border-white/10 rounded-[28px] p-5 sm:p-6 space-y-4 shadow-xl">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-[10px] font-bold uppercase tracking-wider border border-amber-500/25">
                            {plan.category}
                          </span>
                          <h3 className="text-base sm:text-lg font-bold text-white mt-1">{plan.title}</h3>
                          <p className="text-xs text-white/50">{plan.description}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-bold text-amber-300">{percent}%</span>
                          <p className="text-[10px] text-white/40 font-mono">{completedDays.length} de {plan.totalDays} dias</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-white/10">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500" 
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      {/* Days Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                        {plan.days.map(d => {
                          const isDone = completedDays.includes(d.day);
                          return (
                            <div 
                              key={d.day}
                              className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                                isDone 
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                                  : 'bg-black/30 border-white/10 hover:border-white/20'
                              }`}
                            >
                              <button
                                onClick={() => startPlanChapter(d.targetBook, d.targetChapter)}
                                className="flex items-center gap-2.5 text-left flex-1 min-w-0"
                              >
                                <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold shrink-0">
                                  {d.day}
                                </span>
                                <span className="text-xs font-bold truncate text-white hover:text-amber-300 transition-colors">
                                  {d.reference}
                                </span>
                              </button>

                              <button
                                onClick={() => togglePlanDay(plan.id, d.day)}
                                className={`p-1.5 rounded-lg border transition-all shrink-0 ${
                                  isDone 
                                    ? 'bg-emerald-500 text-black border-emerald-400' 
                                    : 'bg-white/5 border-white/20 text-white/40 hover:text-white'
                                }`}
                                title={isDone ? 'Marcar como não lido' : 'Marcar como concluído'}
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Chapters Selection View */}
          {view === 'chapters' && selectedBook && (
            <motion.div key="chapters" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <h2 className="text-xl font-bold">{selectedBook.book}</h2>
              <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(ch => (
                  <button
                    key={ch}
                    onClick={() => handleChapterSelect(ch)}
                    className="aspect-square rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center font-bold text-sm"
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Theological Dictionary Tab View */}
          {view === 'dictionary' && (
            <motion.div key="dictionary" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input 
                  type="text" 
                  value={dictSearch}
                  onChange={(e) => setDictSearch(e.target.value)}
                  placeholder="Pesquisar termo teológico, hebraico ou grego..."
                  className="w-full bg-[#121216] border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-xs text-white placeholder:text-white/30 outline-none focus:border-[var(--theme-color)]"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {['all', 'Doutrina', 'Teologia', 'Espírito Santo', 'Aliança', 'Lugares'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedDictCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border ${
                      selectedDictCategory === cat ? 'bg-white text-black border-white' : 'bg-[#121216] text-white/60 border-white/10'
                    }`}
                  >
                    {cat === 'all' ? 'Todos os Termos' : cat}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {filteredDictionary.map(term => (
                  <div 
                    key={term.term}
                    className="bg-[#121216] border border-white/10 rounded-[24px] p-5 space-y-2 shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <h3 className="text-lg font-bold text-white">{term.term}</h3>
                          <span className="text-xs text-[var(--theme-color)] font-mono">{term.original}</span>
                        </div>
                        <span className="text-[11px] text-white/40 italic font-mono">{term.transliteration}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-amber-300 uppercase">
                        {term.category}
                      </span>
                    </div>

                    <p className="text-xs text-white/80 leading-relaxed font-sans">
                      {term.definition}
                    </p>

                    <div className="pt-2 flex items-center justify-between text-[11px] text-white/40 border-t border-white/5">
                      <span>Ref: <strong className="text-white/70">{term.keyVerse}</strong></span>
                      <button
                        onClick={() => handleOpenAIExegesis(`Estudo aprofundado do termo bíblico: ${term.term} (${term.original})`)}
                        className="text-[var(--theme-color)] hover:underline flex items-center gap-1 font-bold"
                      >
                        <Sparkles className="w-3 h-3" /> Aprofundar Estudo
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Verse Search Results */}
          {view === 'search' && (
            <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <h2 className="text-xl font-bold">Resultado da Busca</h2>
              {loading && <div className="text-center py-10 text-white/40 text-xs font-bold">Pesquisando versículo...</div>}
              {error && <div className="p-4 rounded-xl bg-red-500/20 text-red-300 text-xs">{error}</div>}
              {searchedVerse && !loading && (
                <div className="p-5 rounded-2xl bg-black/5 dark:bg-white/5 space-y-2 border border-white/10">
                  <h3 className="font-bold text-base text-[var(--theme-color)]">
                    {searchedVerse.book_name} {searchedVerse.chapter}:{searchedVerse.verse}
                  </h3>
                  <p className="text-sm leading-relaxed">{searchedVerse.text}</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Notes Tab View */}
          {view === 'notes' && (
            <motion.div key="notes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Notes />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
