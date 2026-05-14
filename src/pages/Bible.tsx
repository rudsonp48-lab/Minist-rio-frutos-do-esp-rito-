import { useState, useEffect, useCallback } from 'react';
import { Search, Book, ChevronRight, ChevronLeft, Bookmark, Share2, Download, Wifi, WifiOff, Target, Zap, Globe, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BIBLE_STRUCTURE, SAMPLE_VERSES } from '../lib/bibleData';

interface Verse {
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

export default function Bible() {
  const [translation, setTranslation] = useState('almeida');
  const [verse, setVerse] = useState<Verse | null>(null);
  const [reference, setReference] = useState('João 3:16');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [downloaded, setDownloaded] = useState(localStorage.getItem('bible_cached') === 'true');
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);

  const translations = [
    { id: 'almeida', label: 'Almeida' },
    { id: 'nvi', label: 'NVI' },
    { id: 'kjv', label: 'KJV' },
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

  const fetchVerse = useCallback(async (ref: string, tr: string = translation) => {
    setLoading(true);
    setError(null);
    const cacheKey = `bible_${tr}_${ref}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setVerse(JSON.parse(cached));
      setLoading(false);
      return;
    }
    if (isOffline && SAMPLE_VERSES[ref]) {
      const v = {
        book_name: ref.split(' ')[0],
        chapter: parseInt(ref.split(' ')[1].split(':')[0]),
        verse: parseInt(ref.split(':')[1]) || 1,
        text: SAMPLE_VERSES[ref]
      };
      setVerse(v);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`https://bible-api.com/${encodeURIComponent(ref)}?translation=${tr}`);
      if (!res.ok) throw new Error('Fragmento não detectado');
      const data = await res.json();
      const v = {
        book_name: data.verses[0].book_name,
        chapter: data.verses[0].chapter,
        verse: data.verses[0].verse,
        text: data.text
      };
      setVerse(v);
      localStorage.setItem(cacheKey, JSON.stringify(v));
    } catch (err) {
      setError('Sinal interrompido. Verifique suas coordenadas.');
    } finally {
      setLoading(false);
    }
  }, [isOffline, translation]);

  useEffect(() => { fetchVerse(reference, translation); }, [translation]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVerse(reference, translation);
  };

  return (
    <div className="space-y-24 pb-40 cyber-grid">
      {/* Cinematic Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[15%] right-[-10%] w-[500px] h-[500px] bg-yellow-400/5 blur-[140px]" />
        <div className="absolute bottom-[10%] left-[-5%] w-[400px] h-[400px] bg-cyan-400/5 blur-[120px]" />
      </div>

      <header className="relative z-10 px-6 pt-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
           <div className="space-y-6">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 glass flex items-center justify-center rounded-2xl glow-yellow border-yellow-400/20">
                   <Target className="w-6 h-6 text-yellow-400 animate-pulse" />
                 </div>
                 <span className="text-yellow-400 text-[10px] font-black uppercase tracking-[0.4em] text-glow">Arquigrafia Sagrada // Logos Stream</span>
              </div>
              <h1 className="text-6xl md:text-9xl font-display font-black italic uppercase tracking-tighter leading-[0.8]">
                 Quantum <br /> <span className="text-yellow-400">Verses</span>
              </h1>
           </div>
           
           <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3 self-end">
                 <div className={`w-2 h-2 rounded-full ${isOffline ? 'bg-red-500 glow-red' : 'bg-emerald-400 glow-emerald'} animate-pulse`} />
                 <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{isOffline ? 'Off-Grid Mode' : 'Direct Link Active'}</span>
              </div>
              <div className="flex gap-2 glass p-1.5 rounded-[2rem] bg-black/40 border-white/5">
                 {translations.map((t) => (
                   <button
                     key={t.id}
                     onClick={() => setTranslation(t.id)}
                     className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                       translation === t.id ? 'bg-white text-black glow-yellow' : 'text-zinc-500 hover:text-zinc-300'
                     }`}
                   >
                     {t.label}
                   </button>
                 ))}
              </div>
           </div>
        </div>
      </header>

      {/* Cyber Intelligence Search */}
      <section className="px-6 relative z-10">
         <form onSubmit={handleSearch} className="relative group max-w-4xl mx-auto">
            <div className="absolute inset-0 bg-yellow-400/10 blur-[80px] opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <div className="relative glass-dark bg-black/80 rounded-[4rem] p-3 border border-white/10 flex items-center gap-4 shadow-4xl">
               <div className="w-16 h-16 glass flex items-center justify-center rounded-3xl ml-2">
                  <Search className="w-7 h-7 text-zinc-500 group-focus-within:text-yellow-400 transition-colors" />
               </div>
               <input 
                 type="text" value={reference} onChange={e => setReference(e.target.value)}
                 placeholder="INJETAR COORDENADA (EX: JOÃO 3:16)"
                 className="flex-1 bg-transparent py-8 pr-8 text-2xl md:text-4xl font-display font-black italic uppercase tracking-tighter outline-none placeholder:text-zinc-900"
               />
               <button type="submit" className="w-20 h-20 bg-white text-black rounded-[2rem] flex items-center justify-center hover:bg-yellow-400 hover:scale-105 active:scale-95 transition-all shadow-4xl glow-yellow shrink-0 group">
                  <ChevronRight className="w-8 h-8 group-hover:translate-x-1 transition-transform" />
               </button>
            </div>
         </form>
      </section>

      {/* Scripture Display Engine */}
      <section className="px-6 relative z-10">
         <div className="glass-card bg-zinc-950/40 rounded-[4.5rem] p-1 shadow-4xl relative overflow-hidden">
            <div className="glass-dark bg-black/40 rounded-[4.4rem] p-12 md:p-24 min-h-[500px]">
               <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.div key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-24 flex flex-col items-center gap-10">
                       <div className="relative">
                          <Cpu className="w-20 h-20 text-yellow-400 animate-spin opacity-20" />
                          <Zap className="w-8 h-8 text-yellow-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                       </div>
                       <p className="text-[10px] font-black uppercase tracking-[0.5em] text-yellow-400 animate-pulse">Sincronizando Logos...</p>
                    </motion.div>
                  ) : error ? (
                    <motion.div key="e" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-24 text-center space-y-10">
                       <WifiOff className="w-16 h-16 text-red-500 mx-auto" />
                       <h3 className="text-4xl font-display font-black italic uppercase italic tracking-tighter text-zinc-500">{error}</h3>
                    </motion.div>
                  ) : verse && (
                    <motion.div key={verse.text} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-16">
                       <div className="flex flex-col md:flex-row justify-between items-start gap-12 pb-12 border-b border-white/5">
                          <div className="space-y-6">
                             <div className="flex items-center gap-4">
                               <div className="w-2 h-2 rounded-full bg-yellow-400 glow-yellow animate-pulse" />
                               <span className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em] italic leading-none">{translation.toUpperCase()} CORE ENGINE</span>
                             </div>
                             <h2 className="text-6xl md:text-9xl font-display font-black italic uppercase tracking-tighter leading-none text-white">
                                {verse.book_name} <br />
                                <span className="text-yellow-400 text-4xl md:text-8xl">{verse.chapter}<span className="text-zinc-800 mx-3 md:mx-4">:</span>{verse.verse}</span>
                             </h2>
                          </div>
                          <div className="flex gap-4">
                             <button className="w-20 h-20 glass flex items-center justify-center rounded-[2rem] hover:bg-white/10 transition-all group">
                                <Bookmark className="w-7 h-7 text-zinc-600 group-hover:text-yellow-400 transition-colors" />
                             </button>
                             <button className="w-20 h-20 glass flex items-center justify-center rounded-[2rem] hover:bg-white/10 transition-all group">
                                <Share2 className="w-7 h-7 text-zinc-600 group-hover:text-white transition-colors" />
                             </button>
                          </div>
                       </div>
                       
                       <div className="relative">
                          <div className="absolute -left-12 top-0 text-[150px] font-display font-black italic text-white/5 pointer-events-none select-none">"</div>
                          <p className="text-3xl md:text-6xl font-display font-black italic uppercase tracking-tighter text-zinc-200 leading-[1.1] selection:bg-yellow-400 selection:text-black">
                            {verse.text}
                          </p>
                       </div>
                    </motion.div>
                  )}
               </AnimatePresence>
            </div>
         </div>
      </section>

      {/* Book Index Terminal */}
      <section id="bible-selector" className="px-6 relative z-10">
         <div className="glass-dark bg-zinc-950/60 rounded-[4rem] p-12 md:p-24 border border-white/5 relative overflow-hidden group shadow-4xl">
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-yellow-400/5 blur-[120px] pointer-events-none rounded-full" />
            
            <AnimatePresence mode="wait">
               {!selectedBook ? (
                 <motion.div key="books" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-20">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
                       <div className="space-y-4">
                          <h3 className="text-5xl md:text-7xl font-display font-black italic text-yellow-400 uppercase tracking-tighter">Matriz do Cânon</h3>
                          <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em] italic">Exploração Dimensional da Biblioteca Eterna</p>
                       </div>
                       <div className="glass px-8 py-4 rounded-2xl border-white/5">
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total Indexado: 66 Entidades</span>
                       </div>
                    </div>

                    <div className="space-y-16">
                       {['old', 'new'].map(testament => (
                         <div key={testament} className="space-y-10">
                            <div className="flex items-center gap-6">
                               <div className="w-1.5 h-12 bg-yellow-400 glow-yellow" />
                               <h4 className="text-3xl font-display font-black italic uppercase tracking-tighter">{testament === 'old' ? 'Primeira Aliança' : 'Nova Aliança'}</h4>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
                               {BIBLE_STRUCTURE.filter(b => b.testament === testament).map(item => (
                                 <button 
                                   key={item.book} onClick={() => { setSelectedBook(item); setSelectedChapter(null); document.getElementById('bible-selector')?.scrollIntoView({ behavior: 'smooth' }); }}
                                   className="glass p-8 rounded-[2.5rem] hover:bg-yellow-400 hover:text-black transition-all group flex flex-col gap-6 text-left shadow-2xl relative overflow-hidden"
                                 >
                                    <div className="flex justify-between items-start relative z-10">
                                       <Book className="w-5 h-5 text-zinc-800 group-hover:text-black/40 transition-colors" />
                                       <span className="text-[10px] font-black opacity-30 group-hover:opacity-100">{item.chapters} VOL</span>
                                    </div>
                                    <span className="text-lg font-display font-black italic uppercase tracking-tighter leading-tight relative z-10">{item.book}</span>
                                 </button>
                               ))}
                            </div>
                         </div>
                       ))}
                    </div>
                 </motion.div>
               ) : !selectedChapter ? (
                 <motion.div key="chapters" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-16">
                    <div className="flex items-center gap-10">
                       <button onClick={() => setSelectedBook(null)} className="w-20 h-20 glass flex items-center justify-center rounded-[2rem] hover:bg-white/10 transition-all border-white/10">
                          <ChevronLeft className="w-10 h-10" />
                       </button>
                       <div>
                          <h3 className="text-6xl md:text-8xl font-display font-black italic uppercase tracking-tighter text-yellow-400">{selectedBook.book}</h3>
                          <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em] italic mt-2">Seletor de Volume de Fluxo</p>
                       </div>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-4">
                       {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(cap => (
                         <button key={cap} onClick={() => setSelectedChapter(cap)} className="glass-dark aspect-square rounded-2xl flex items-center justify-center text-2xl font-display font-black italic hover:bg-yellow-400 hover:text-black transition-all shadow-xl">
                           {cap}
                         </button>
                       ))}
                    </div>
                 </motion.div>
               ) : (
                 <motion.div key="verses" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-16">
                    <div className="flex items-center gap-10">
                       <button onClick={() => setSelectedChapter(null)} className="w-20 h-20 glass flex items-center justify-center rounded-[2rem] hover:bg-white/10 transition-all border-white/10">
                          <ChevronLeft className="w-10 h-10" />
                       </button>
                       <div>
                          <h3 className="text-6xl md:text-8xl font-display font-black italic uppercase tracking-tighter text-yellow-400">{selectedBook.book} {selectedChapter}</h3>
                          <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em] italic mt-2">Seletor de Coordenada Específica</p>
                       </div>
                    </div>
                    <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-12 gap-4">
                       {Array.from({ length: 24 }, (_, i) => i + 1).map(v => (
                         <button key={v} onClick={() => { setReference(`${selectedBook.book} ${selectedChapter}:${v}`); fetchVerse(`${selectedBook.book} ${selectedChapter}:${v}`); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="glass-dark aspect-square rounded-xl flex items-center justify-center text-sm font-display font-black italic hover:bg-white hover:text-black transition-all">
                           {v}
                         </button>
                       ))}
                    </div>
                    <div className="p-10 glass rounded-[2.5rem] border-yellow-400/10 text-center bg-yellow-400/5">
                       <p className="text-[10px] text-yellow-400/40 font-black uppercase tracking-[0.4em] max-w-2xl mx-auto italic">A indexação direta exibe fragmentos isolados. Para leitura de fluxo contínuo, utilize o sistema de busca inteligente no topo do terminal.</p>
                    </div>
                 </motion.div>
               )}
            </AnimatePresence>
         </div>
      </section>
    </div>
  );
}
