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

export default function Notes() {
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
    <div className="min-h-screen pb-32">
      {/* iOS Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-40 ios-glass border-b border-black/[0.05] dark:border-white/[0.05] flex items-center justify-between px-6 h-16">
        <Link to="/" className="flex items-center gap-1 text-[var(--theme-color,#007AFF)] font-medium transition-opacity active:opacity-50">
          <ChevronLeft className="w-6 h-6" />
          <span>Início</span>
        </Link>
        <h1 className="text-[17px] font-bold tracking-tight absolute left-1/2 -translate-x-1/2">Estudos</h1>
        <div className="w-10" />
      </nav>

      <div className="pt-24 px-6 space-y-8 max-w-4xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
           <div>
             <div className="flex items-center gap-2 mb-2">
               <BookOpen className="w-5 h-5 text-[#8E8E93]" />
               <span className="text-[11px] font-bold uppercase tracking-widest text-[#8E8E93]">Área de Estudo</span>
             </div>
             <h2 className="text-4xl font-bold tracking-tighter">Minhas Anotações</h2>
           </div>
           
           {/* Gamification Badge */}
           <div className="ios-card bg-white dark:bg-[#1C1C1E] p-4 flex items-center gap-4 min-w-[240px]">
             <div className="w-12 h-12 bg-black/5 dark:bg-white/5 rounded-2xl flex items-center justify-center">
               <Trophy className="w-6 h-6 text-[var(--theme-color,#FFD700)]" />
             </div>
             <div className="flex-1">
               <div className="flex items-center justify-between">
                 <span className="text-[9px] font-bold uppercase tracking-widest text-[#8E8E93]">Nível {getLevel(userXP)}</span>
               </div>
               <p className="font-bold tracking-tight text-sm">{getRank(userXP)}</p>
               <div className="w-full h-1.5 bg-black/5 dark:bg-white/5 rounded-full mt-2 overflow-hidden">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${(userXP % 100)}%` }}
                   className="h-full bg-[var(--theme-color,#FFD700)] rounded-full" 
                 />
               </div>
             </div>
           </div>
        </header>

        <AnimatePresence>
          {showXP && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: -20 }}
              className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
            >
              <div className="ios-card px-6 py-3 flex items-center gap-3 bg-[var(--theme-color,#FFD700)] text-white font-bold">
                <Trophy className="w-5 h-5" />
                <span>+{showXP} XP</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Note Editor */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSave} className="ios-card p-6 space-y-6 lg:sticky lg:top-24">
              <div className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Título do Estudo"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-transparent text-2xl font-bold tracking-tight placeholder:text-black/20 dark:placeholder:text-white/20 focus:outline-none"
                  required
                />
                <div className="h-px bg-black/5 dark:bg-white/5" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[#8E8E93]">
                  <BookOpen className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Referência Bíblica</span>
                </div>
                <input 
                  type="text" 
                  placeholder="Ex: João 3:16"
                  value={verseRef}
                  onChange={(e) => setVerseRef(e.target.value)}
                  className="w-full bg-black/5 dark:bg-white/5 rounded-xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] transition-all"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[#8E8E93]">
                  <Search className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Estudo de Palavras</span>
                </div>
                <input 
                  type="text" 
                  placeholder="Ex: Logos - Verbo, Razão"
                  value={wordStudy}
                  onChange={(e) => setWordStudy(e.target.value)}
                  className="w-full bg-black/5 dark:bg-white/5 rounded-xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] transition-all"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[#8E8E93]">
                  <Edit3 className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Anotação</span>
                </div>
                <textarea 
                  rows={6}
                  placeholder="Escreva seus pensamentos..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-black/5 dark:bg-white/5 rounded-[1.5rem] p-5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] transition-all resize-none leading-relaxed"
                  required
                />
              </div>

              <button type="submit" className="w-full bg-[var(--theme-color,#007AFF)] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all">
                <Save className="w-5 h-5" />
                <span>Salvar Estudo</span>
              </button>
            </form>
          </div>

          {/* Notes List */}
          <div className="lg:col-span-3 space-y-4">
            <AnimatePresence>
              {loading ? (
                <p className="text-center py-10 text-[#8E8E93] text-sm">Carregando estudos...</p>
              ) : notes.length === 0 ? (
                <div className="text-center py-20 ios-card bg-black/5 dark:bg-white/5 border border-dashed border-black/10 dark:border-white/10">
                  <p className="font-bold text-lg mb-2">Nenhuma anotação ainda</p>
                  <p className="text-[#8E8E93] text-sm">Seus estudos e reflexões aparecerão aqui.</p>
                </div>
              ) : notes.map((note) => (
                <motion.div 
                  key={note.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="ios-card p-6 md:p-8"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-full bg-[var(--theme-color)]/10 text-[var(--theme-color)] text-[10px] font-bold uppercase tracking-widest">+{note.xp} XP</span>
                        {note.verseRef && <span className="text-[#8E8E93] text-xs font-bold">{note.verseRef}</span>}
                      </div>
                      <h3 className="text-xl font-bold tracking-tight">{note.title}</h3>
                    </div>
                    <button 
                      onClick={() => deleteNote(note.id)}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-[#8E8E93] hover:bg-[#FF3B30]/10 hover:text-[#FF3B30] transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {note.wordStudy && (
                    <div className="mb-4 p-4 rounded-2xl bg-black/5 dark:bg-white/5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#8E8E93] mb-1">Estudo</p>
                      <p className="text-sm font-medium italic">"{note.wordStudy}"</p>
                    </div>
                  )}

                  <p className="text-sm leading-relaxed whitespace-pre-wrap opacity-90">
                    {note.content}
                  </p>

                  <div className="mt-6 flex items-center gap-2 pt-6 border-t border-black/5 dark:border-white/5">
                     <Clock className="w-4 h-4 text-[#8E8E93]" />
                     <span className="text-[10px] font-bold uppercase tracking-widest text-[#8E8E93]">
                       {note.createdAt?.toDate().toLocaleDateString('pt-BR')}
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
