import { useState, useEffect } from 'react';
import { Edit3, Save, Trophy, Star, BookOpen, Clock, Trash2, Search, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, query, where, onSnapshot, orderBy, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';

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
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'notes'),
      where('userId', '==', auth.currentUser.uid),
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
  }, []);

  const [showXP, setShowXP] = useState<number | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || !auth.currentUser) return;

    // Gamification check: more content/details = more XP
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
    <div className="max-w-6xl mx-auto space-y-16 pb-24">
      <header className="pt-8 mb-12 px-4 md:px-0">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
             <div className="w-12 h-[2px] bg-yellow-400 glow-yellow" />
             <span className="text-yellow-400 text-[9px] md:text-[10px] font-display font-black uppercase tracking-[0.4em] text-glow">Sistema de Documentação Espiritual</span>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 md:gap-12">
           <div>
             <h1 className="text-5xl md:text-9xl font-display font-black italic uppercase tracking-tighter leading-[0.8] md:leading-[0.75]">Nexus <br /> <span className="text-yellow-400">Notes</span></h1>
             <p className="text-zinc-500 font-display font-bold uppercase tracking-[0.3em] text-[8px] md:text-[10px] mt-6 md:mt-8 flex items-center gap-3 opacity-60">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse glow-yellow" />
                Extração de dados metafísicos e estudos analíticos
             </p>
           </div>
           
           {/* Gamification Badge 2.0 */}
           <div className="glass-dark bg-zinc-950/60 border border-yellow-400/20 px-8 md:px-10 py-5 md:py-6 rounded-3xl md:rounded-[3rem] flex items-center gap-6 md:gap-8 shadow-3xl relative overflow-hidden group min-w-full md:min-w-[320px]">
             <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-400/5 blur-[60px] rounded-full group-hover:bg-yellow-400/10 transition-all" />
             <div className="w-16 h-16 glass flex items-center justify-center rounded-[1.5rem] glow-yellow shadow-2xl">
               <Trophy className="w-8 h-8 text-yellow-400" />
             </div>
             <div className="flex-1">
               <div className="flex items-center justify-between mb-2">
                 <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Nível {getLevel(userXP)}</span>
                 <div className="flex gap-1">
                   {[1,2,3].map(i => <Star key={i} className={`w-2.5 h-2.5 ${i <= (getLevel(userXP) % 3 + 1) ? 'text-yellow-400 glow-yellow' : 'text-zinc-900'}`} />)}
                 </div>
               </div>
               <p className="text-2xl font-display font-black italic uppercase tracking-tighter text-white group-hover:text-yellow-400 transition-colors uppercase">{getRank(userXP)}</p>
               <div className="w-full h-1.5 bg-white/5 rounded-full mt-4 overflow-hidden p-[1px]">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${(userXP % 100)}%` }}
                   className="h-full bg-yellow-400 glow-yellow rounded-full" 
                 />
               </div>
             </div>
           </div>
        </div>
      </header>

      <AnimatePresence>
        {showXP && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -100 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] pointer-events-none"
          >
            <div className="glass px-16 py-10 rounded-[4rem] shadow-[0_0_150px_rgba(234,179,8,0.3)] border-yellow-400/30 flex flex-col items-center backdrop-blur-3xl">
              <Trophy className="w-20 h-20 mb-6 animate-bounce text-yellow-400 glow-yellow" />
              <span className="text-6xl font-display font-black italic tracking-tighter text-white">+{showXP} XP</span>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] mt-6 opacity-60 text-center text-yellow-400">Sincronização de Dados Completa</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-5 gap-12 lg:gap-16 px-4 md:px-0">
        {/* Note Editor 2.0 */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="glass-dark bg-zinc-950/40 border border-white/5 rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-12 space-y-8 md:space-y-10 shadow-3xl lg:sticky lg:top-24">
            <div className="space-y-6">
              <div className="flex items-center gap-4 opacity-40">
                 <div className="w-8 h-[1px] bg-yellow-400" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400">Terminal de Entrada</span>
              </div>
              <input 
                type="text" 
                placeholder="Título do Estudo"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent text-4xl font-display font-black italic uppercase tracking-tighter placeholder:text-zinc-900 focus:outline-none focus:text-yellow-400 transition-colors uppercase"
                required
              />
              <div className="h-px bg-yellow-400/20" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-zinc-700">
                <BookOpen className="w-4 h-4" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em]">Referência Bíblica</span>
              </div>
              <input 
                type="text" 
                placeholder="Ex: João 3:16"
                value={verseRef}
                onChange={(e) => setVerseRef(e.target.value)}
                className="w-full glass-dark bg-zinc-900/50 rounded-2xl p-6 text-sm font-bold border border-white/5 focus:border-yellow-400/40 focus:outline-none transition-all placeholder:text-zinc-800"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-zinc-700">
                <Search className="w-4 h-4" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em]">Estudo Exegético</span>
              </div>
              <input 
                type="text" 
                placeholder="Ex: Logos - Verbo, Razão"
                value={wordStudy}
                onChange={(e) => setWordStudy(e.target.value)}
                className="w-full glass-dark bg-zinc-900/50 rounded-2xl p-6 text-sm font-bold border border-white/5 focus:border-yellow-400/40 focus:outline-none transition-all placeholder:text-zinc-800"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-zinc-700">
                <Edit3 className="w-4 h-4" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em]">Fluxo de Pensamento</span>
              </div>
              <textarea 
                rows={8}
                placeholder="Transcreva sua revelação..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full glass-dark bg-zinc-900/50 rounded-[2.5rem] p-8 text-sm font-medium border border-white/5 focus:border-yellow-400/40 focus:outline-none transition-all resize-none leading-relaxed placeholder:text-zinc-800"
                required
              />
            </div>

            <button type="submit" className="w-full bg-white text-black py-7 rounded-[2rem] font-display font-black uppercase italic tracking-tighter text-lg flex items-center justify-center gap-4 hover:bg-yellow-400 hover:scale-[1.03] transition-all shadow-3xl active:scale-95 group glow-yellow">
              <Save className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              <span>Salvar Estudo</span>
            </button>
          </form>
        </div>

        {/* Notes List 2.0 */}
        <div className="lg:col-span-3 space-y-12">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-4xl font-display font-black uppercase italic tracking-tighter">Registros <span className="text-yellow-400">Nexus</span></h2>
            <div className="flex items-center gap-4 text-zinc-700 text-[10px] font-black uppercase tracking-widest">
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <span>Stream Ativo</span>
            </div>
          </div>

          <div className="grid gap-8">
            <AnimatePresence>
              {loading ? (
                <p className="text-center py-20 text-zinc-800 font-black uppercase tracking-[0.5em] text-xs">Carregando estudos...</p>
              ) : notes.length === 0 ? (
                <div className="text-center py-32 glass-dark bg-zinc-950/40 border border-dashed border-white/5 rounded-[4rem]">
                  <p className="text-zinc-700 font-display font-black uppercase italic tracking-tighter text-2xl">Vazio Metafísico</p>
                  <p className="text-zinc-800 text-[10px] uppercase font-black tracking-widest mt-4">Inicie o fluxo de dados para ganhar XP.</p>
                </div>
              ) : notes.map((note) => (
                <motion.div 
                  key={note.id}
                  layout
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="glass-dark bg-zinc-950/40 border border-white/5 rounded-[3.5rem] p-12 group hover:border-yellow-400/40 transition-all relative overflow-hidden shadow-2xl"
                >
                  <div className="absolute top-0 right-0 w-60 h-60 bg-yellow-400/5 blur-[80px] rounded-full pointer-events-none" />
                  
                  <div className="flex flex-col md:flex-row justify-between items-start mb-10 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="glass px-4 py-1.5 rounded-full border-yellow-400/30">
                           <span className="text-yellow-400 text-[9px] font-black uppercase tracking-widest text-glow">+{note.xp} XP-SYNC</span>
                        </div>
                        {note.verseRef && <span className="text-zinc-600 font-display font-black uppercase tracking-widest text-[9px] md:text-[10px] italic">{note.verseRef}</span>}
                      </div>
                      <h3 className="text-3xl md:text-4xl font-display font-black italic uppercase tracking-tighter leading-tight text-white group-hover:text-yellow-400 transition-colors uppercase">{note.title}</h3>
                    </div>
                    <button 
                      onClick={() => deleteNote(note.id)}
                      className="w-12 h-12 md:w-14 md:h-14 glass flex items-center justify-center rounded-2xl hover:bg-red-500/10 hover:text-red-500 transition-all group/del"
                    >
                      <Trash2 className="w-5 h-5 text-zinc-800 group-hover/del:text-red-500 transition-colors" />
                    </button>
                  </div>

                  {note.wordStudy && (
                    <div className="mb-8 p-6 glass-dark bg-black/40 rounded-[2rem] border border-yellow-400/10">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-500 mb-2">Lexicon Study</p>
                      <p className="text-lg font-display font-medium text-zinc-400 italic tracking-tight opacity-70">"{note.wordStudy}"</p>
                    </div>
                  )}

                  <p className="text-zinc-500 text-lg font-medium leading-relaxed line-clamp-4 group-hover:text-zinc-400 transition-colors">
                    {note.content}
                  </p>

                  <div className="mt-12 flex justify-between items-center pt-10 border-t border-white/5 relative z-10">
                    <div className="flex items-center gap-4">
                       <Clock className="w-4 h-4 text-zinc-800" />
                       <span className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-800">
                         {note.createdAt?.toDate().toLocaleDateString('pt-BR')} • ECCLESIA-LOG
                       </span>
                    </div>
                    <button className="text-[10px] font-display font-black uppercase italic tracking-widest text-yellow-400 hover:text-white transition-all flex items-center gap-3 group/link underline underline-offset-8 decoration-yellow-400/20">
                      <span>Acessar Estudo</span>
                      <ChevronRight className="w-4 h-4 group-hover/link:translate-x-2 transition-transform" />
                    </button>
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
