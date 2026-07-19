import { useState, useEffect } from 'react';
import { Edit3, Save, Trophy, Star, BookOpen, Clock, Trash2, Search, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, query, where, onSnapshot, orderBy, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';
import { Link } from 'react-router-dom';

interface Note {
  id: string;
  title: string;
  content: string;
  verseRef: string;
  wordStudy: string;
  xp: number;
  createdAt: any;
}

export default function Notes({ embedded = false }: { embedded?: boolean }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [verseRef, setVerseRef] = useState('');
  const [wordStudy, setWordStudy] = useState('');
  const [loading, setLoading] = useState(true);
  const [userXP, setUserXP] = useState(0);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setNotes([]);
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, 'notes'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
        setNotes(data);
        
        const totalXP = data.reduce((acc, note) => acc + (note.xp || 0), 0);
        setUserXP(totalXP);
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'notes');
        setLoading(false);
      });

      return () => unsubscribe();
    });

    return () => unsubAuth();
  }, []);

  const [showXP, setShowXP] = useState<number | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || !auth.currentUser) return;

    const xpReward = 10 + (verseRef ? 5 : 0) + (wordStudy ? 15 : 0);

    try {
      await addDoc(collection(db, 'notes'), {
        userId: auth.currentUser.uid,
        title,
        content,
        verseRef,
        wordStudy,
        xp: xpReward,
        createdAt: serverTimestamp(),
      });

      setShowXP(xpReward);
      setTimeout(() => setShowXP(null), 3000);

      setTitle('');
      setContent('');
      setVerseRef('');
      setWordStudy('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'notes');
    }
  };

  const deleteNote = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notes', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `notes/${id}`);
    }
  };

  const getLevel = (xp: number) => Math.floor(xp / 100) + 1;
  const getRank = (xp: number) => {
    if (xp < 100) return 'Iniciante';
    if (xp < 500) return 'Discípulo';
    if (xp < 1000) return 'Estudioso';
    return 'Mestre da Palavra';
  };

  return (
    <div className={`${embedded ? 'w-full' : 'min-h-screen pb-32 max-w-7xl px-6'} bg-transparent text-white font-sans mx-auto`}>
       {/* Premium Top Navigation Header */}
       {!embedded && (
         <header className="sticky top-0 z-40 bg-black/50 backdrop-blur-3xl border-b border-white/5 py-6 px-0 lg:px-6 flex items-center justify-between mb-8 shadow-2xl">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10 group">
               <ChevronLeft className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
            </Link>
            <div className="flex flex-col">
              <h1 className="text-2xl font-serif font-bold tracking-widest text-white uppercase">Meus Estudos</h1>
              <div className="flex items-center gap-2 mt-1">
                <BookOpen className="w-3.5 h-3.5 text-[var(--theme-color)]" />
                <span className="text-[10px] font-bold text-[var(--theme-color)] uppercase tracking-[0.2em]">Estudo da Palavra</span>
              </div>
            </div>
          </div>
        </header>
       )}

      <div className={`space-y-8 max-w-7xl mx-auto ${embedded ? 'mt-4' : ''}`}>
        {!embedded && (
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4 lg:px-0">
             <div>
               <h2 className="text-4xl lg:text-5xl font-serif font-bold tracking-tight text-white mb-2">Estudo da Palavra</h2>
               <p className="text-white/60">Aprofunde-se no conhecimento e guarde o que Deus tem falado com você.</p>
             </div>
             
             {/* Gamification Badge */}
             <div className="bg-[#111111] border border-white/10 p-4 rounded-3xl flex items-center gap-4 min-w-[280px]">
               <div className="w-14 h-14 bg-[var(--theme-color)]/20 border border-[var(--theme-color)]/30 rounded-2xl flex items-center justify-center shadow-[0_0_20px_var(--theme-color)]/20">
                 <Trophy className="w-7 h-7 text-[var(--theme-color)]" />
               </div>
               <div className="flex-1">
                 <div className="flex items-center justify-between mb-1">
                   <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--theme-color)]">Nível {getLevel(userXP)}</span>
                 </div>
                 <p className="font-bold tracking-wider text-sm uppercase">{getRank(userXP)}</p>
                 <div className="w-full h-1.5 bg-black rounded-full mt-2 overflow-hidden border border-white/5">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${(userXP % 100)}%` }}
                     className="h-full bg-gradient-to-r from-[var(--color-theme-purple)] to-[var(--theme-color)]" 
                   />
                 </div>
               </div>
             </div>
          </header>
        )}

        <AnimatePresence>
          {showXP && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: -20 }}
              className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
            >
              <div className="px-8 py-4 rounded-full flex items-center gap-3 bg-[var(--theme-color)] text-white font-bold shadow-[0_0_30px_var(--theme-color)] border border-white/20">
                <Trophy className="w-6 h-6" />
                <span className="tracking-widest uppercase">+ {showXP} XP</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Note Editor */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSave} className="bg-[#111111] border border-white/10 rounded-[2rem] p-6 lg:p-8 space-y-6 lg:sticky lg:top-32 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-theme-purple)]/20 blur-[60px] rounded-full pointer-events-none" />
              
              <div className="relative z-10 space-y-4">
                <input 
                  type="text" 
                  placeholder="Tema do Estudo"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-transparent text-2xl lg:text-3xl font-serif font-bold tracking-tight text-white placeholder:text-white/30 focus:outline-none"
                  required
                />
                <div className="h-px bg-gradient-to-r from-[var(--theme-color)]/50 to-transparent" />
              </div>

              <div className="space-y-3 relative z-10">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-white/50" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Referência Bíblica</span>
                </div>
                <input 
                  type="text" 
                  placeholder="Ex: João 3:16"
                  value={verseRef}
                  onChange={(e) => setVerseRef(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-[var(--theme-color)] transition-colors text-white"
                />
              </div>

              <div className="space-y-3 relative z-10">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-white/50" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Estudo de Palavras (Opcional)</span>
                </div>
                <input 
                  type="text" 
                  placeholder="Ex: Logos - Verbo, Razão"
                  value={wordStudy}
                  onChange={(e) => setWordStudy(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-[var(--theme-color)] transition-colors text-white"
                />
              </div>

              <div className="space-y-3 relative z-10">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-white/50" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Anotação</span>
                </div>
                <textarea 
                  rows={6}
                  placeholder="Escreva seus pensamentos e revelações..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm outline-none focus:border-[var(--theme-color)] transition-colors text-white resize-none"
                  required
                />
              </div>

              <button type="submit" className="w-full h-14 bg-[var(--theme-color)] text-white shadow-[0_0_20px_var(--theme-color)]/30 rounded-2xl font-bold uppercase tracking-widest text-[12px] flex items-center justify-center gap-3 transition-transform active:scale-95 hover:bg-[var(--color-primary-focused)] pt-1 relative z-10">
                <Save className="w-4 h-4" />
                <span>Registrar</span>
              </button>
            </form>
          </div>

          {/* Notes List */}
          <div className="lg:col-span-3 space-y-4">
            <AnimatePresence>
              {loading ? (
                <p className="text-center py-10 text-white/50 text-sm animate-pulse tracking-widest uppercase text-[10px]">Carregando seus estudos...</p>
              ) : notes.length === 0 ? (
                <div className="text-center py-20 bg-[#111111] border border-white/5 border-dashed rounded-[2rem]">
                  <p className="font-serif font-bold text-xl lg:text-2xl mb-2">Nenhuma anotação ainda</p>
                  <p className="text-white/50 text-sm">Seus estudos místicos e reflexões aparecerão aqui.</p>
                </div>
              ) : notes.map((note, idx) => (
                <motion.div 
                  key={note.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-[#111111] border border-white/10 rounded-3xl p-6 lg:p-8 hover:border-white/20 transition-colors group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--theme-color)]/5 blur-[40px] rounded-full pointer-events-none" />
                  
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="px-3 py-1 rounded border border-[var(--theme-color)]/30 bg-[var(--theme-color)]/10 text-[var(--theme-color)] text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 shadow-[0_0_10px_var(--theme-color)]/20">
                          <Trophy className="w-3 h-3" /> +{note.xp} XP
                        </span>
                        {note.verseRef && <span className="text-white/50 text-[10px] uppercase font-bold tracking-widest bg-white/5 px-3 py-1 rounded">{note.verseRef}</span>}
                      </div>
                      <h3 className="text-2xl font-serif font-bold tracking-wide">{note.title}</h3>
                    </div>
                    <button 
                      onClick={() => deleteNote(note.id)}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white/30 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50 transition-all border border-transparent"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {note.wordStudy && (
                    <div className="mb-6 p-4 rounded-2xl bg-black/40 border border-white/5">
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--theme-color)] mb-1">Dicionário Estudo</p>
                      <p className="text-sm text-white/80 font-serif italic">"{note.wordStudy}"</p>
                    </div>
                  )}

                  <p className="text-sm lg:text-base leading-relaxed whitespace-pre-wrap text-white/80 font-medium">
                    {note.content}
                  </p>

                  <div className="mt-8 flex items-center gap-2 pt-6 border-t border-white/5 relative z-10">
                     <Clock className="w-4 h-4 text-[var(--theme-color)]" />
                     <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                       {note.createdAt?.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric'})}
                     </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
