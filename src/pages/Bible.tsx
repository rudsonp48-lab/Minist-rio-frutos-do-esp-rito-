import { useState, useEffect, useCallback } from 'react';
import { Search, Book, ChevronRight, ChevronLeft, Bookmark, Share2, Download, Wifi, WifiOff, Target, Zap, Globe, Cpu, BookOpen, List } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BIBLE_STRUCTURE, SAMPLE_VERSES } from '../lib/bibleData';
import { Link } from 'react-router-dom';
import { useTheme } from '../lib/ThemeContext';

interface Verse {
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

export default function Bible() {
  const { themeColor } = useTheme();
  const [translation, setTranslation] = useState('almeida');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  const [view, setView] = useState<'books' | 'chapters' | 'chapter' | 'search'>('books');
  const [selectedBook, setSelectedBook] = useState<typeof BIBLE_STRUCTURE[0] | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [chapterVerses, setChapterVerses] = useState<Verse[]>([]);
  
  const [searchReference, setSearchReference] = useState('João 3:16');
  const [searchedVerse, setSearchedVerse] = useState<Verse | null>(null);

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
    if (view === 'chapter') {
      setView('chapters');
      setChapterVerses([]);
    } else if (view === 'chapters' || view === 'search') {
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
          {view === 'books' ? 'Bíblia' : view === 'chapters' ? selectedBook?.book : view === 'chapter' ? `${selectedBook?.book} ${selectedChapter}` : 'Busca'}
        </h1>
        <div className="w-16" /> {/* Placeholder for balance */}
      </nav>

      <div className="pt-20 px-4 md:px-6 space-y-6 max-w-2xl mx-auto">
        <header className="space-y-4">
          <form onSubmit={searchSingleVerse} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93]" />
            <input 
              type="text" 
              value={searchReference}
              onChange={(e) => setSearchReference(e.target.value)}
              placeholder="Buscar versículo (Ex: João 3:16)"
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

        {/* Dynamic Area */}
        <AnimatePresence mode="wait">
          {view === 'books' && (
            <motion.div key="books" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#8E8E93] uppercase tracking-widest pl-2">Velho Testamento</h3>
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
            <motion.div key="chapter" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="pb-12">
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
                <div className="space-y-6">
                  {chapterVerses.map(v => (
                    <div key={v.verse} className="flex gap-4">
                      <span className="text-[11px] font-bold text-[#8E8E93] mt-1.5 w-6 text-right shrink-0">{v.verse}</span>
                      <p className="text-[17px] leading-relaxed text-black/90 dark:text-white/90 font-medium">
                        {v.text}
                      </p>
                    </div>
                  ))}
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
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
