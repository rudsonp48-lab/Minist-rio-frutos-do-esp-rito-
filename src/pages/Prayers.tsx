import { useState, useEffect } from 'react';
import { Heart, Send, CheckCircle2, Search, Filter, MessageSquare, Plus, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, query, onSnapshot, orderBy, serverTimestamp, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';
import { Link } from 'react-router-dom';

interface Prayer {
  id: string;
  userId: string;
  userName: string;
  content: string;
  isAnonymous: boolean;
  createdAt: any;
  likes: string[];
}

export default function Prayers() {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'mine'>('all');

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setPrayers([]);
        setLoading(false);
        return;
      }

      const q = query(collection(db, 'prayers'), orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prayer));
        setPrayers(data);
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'prayers');
        setLoading(false);
      });

      return () => unsubscribe();
    });

    return () => unsubAuth();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !auth.currentUser) return;
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'prayers'), {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Usuário',
        content,
        isAnonymous,
        likes: [],
        createdAt: serverTimestamp(),
      });
      setContent('');
      setIsAnonymous(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'prayers');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (prayerId: string) => {
    if (!auth.currentUser) return;
    try {
      const prayerRef = doc(db, 'prayers', prayerId);
      await updateDoc(prayerRef, {
        likes: arrayUnion(auth.currentUser.uid)
      });
    } catch (err) {
      console.error(err);
    }
  };

  const filteredPrayers = prayers.filter(prayer => {
    if (filter === 'mine') return prayer.userId === auth.currentUser?.uid;
    return true;
  });

  return (
    <div className="min-h-screen bg-transparent w-full text-white font-sans max-w-7xl mx-auto px-6 pb-32">
       {/* Premium Top Navigation Header */}
       <header className="sticky top-0 z-40 bg-black/50 backdrop-blur-3xl border-b border-white/5 py-6 px-0 lg:px-6 flex items-center justify-between mb-8 shadow-2xl">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10 group">
             <ChevronLeft className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-2xl font-serif font-bold tracking-widest text-white uppercase">Mural de Oração</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold text-[var(--theme-color)] uppercase tracking-[0.2em]">Interceda pelos irmãos</span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col - Post Form */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-[#111111] border border-white/10 rounded-[2rem] p-8 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--theme-color)]/10 blur-[60px] rounded-full pointer-events-none" />
             
             <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
               <Heart className="w-6 h-6 text-[var(--theme-color)]" />
               Novo Pedido
             </h2>

             <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
               <textarea
                 value={content}
                 onChange={(e) => setContent(e.target.value)}
                 placeholder="Como podemos orar por você hoje?"
                 rows={5}
                 className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm outline-none focus:border-[var(--theme-color)] transition-colors text-white resize-none"
                 required
               />
               
               <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${isAnonymous ? 'bg-[var(--theme-color)] border-[var(--theme-color)]' : 'border-white/20 bg-black/40 group-hover:border-[var(--theme-color)]/50'}`}>
                    {isAnonymous && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                  <input 
                    type="checkbox" 
                    className="hidden"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                  />
                  <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">Enviar como Anônimo</span>
               </label>

               <button 
                 type="submit" 
                 disabled={isSubmitting || !content.trim()}
                 className="w-full h-14 bg-[var(--theme-color)] text-white shadow-[0_0_20px_var(--theme-color)]/30 rounded-2xl font-bold uppercase tracking-widest text-[12px] flex items-center justify-center gap-3 transition-transform active:scale-95 hover:bg-[var(--color-primary-focused)] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
               >
                 {isSubmitting ? <span className="animate-pulse">Enviando...</span> : <><Send className="w-4 h-4"/> Publicar Pedido</>}
               </button>
             </form>
           </div>
           
           <div className="bg-[#111111] border border-white/10 rounded-2xl p-2 flex">
             <button 
               onClick={() => setFilter('all')} 
               className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-colors ${filter === 'all' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/80'}`}
             >
               Todos
             </button>
             <button 
               onClick={() => setFilter('mine')} 
               className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-colors ${filter === 'mine' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/80'}`}
             >
               Meus Pedidos
             </button>
           </div>
        </div>

        {/* Right Col - Feed */}
        <div className="lg:col-span-2 space-y-6">
           <AnimatePresence mode="popLayout">
             {loading ? (
                <div className="text-center py-20 text-white/50 text-sm font-medium uppercase tracking-widest animate-pulse">
                   Buscando pedidos...
                </div>
             ) : filteredPrayers.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[#111111] border border-white/5 border-dashed rounded-[2rem] p-12 text-center"
                >
                   <Heart className="w-16 h-16 text-white/10 mx-auto mb-4" />
                   <h3 className="text-xl font-bold text-white mb-2">Nenhum pedido encontrado</h3>
                   <p className="text-white/50 text-sm">Seja o primeiro a compartilhar seu pedido de oração.</p>
                </motion.div>
             ) : (
                filteredPrayers.map((prayer, idx) => {
                  const hasLiked = auth.currentUser ? prayer.likes?.includes(auth.currentUser.uid) : false;
                  
                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={prayer.id}
                      className="bg-[#111111] border border-white/10 rounded-3xl p-6 lg:p-8 hover:border-white/20 transition-colors group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[var(--theme-color)] to-purple-600 p-[2px]">
                             <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
                               {prayer.isAnonymous ? "?" : prayer.userName.charAt(0).toUpperCase()}
                             </div>
                           </div>
                           <div>
                             <h4 className="font-bold text-sm text-white">
                               {prayer.isAnonymous ? "Irmão(ã) Anônimo" : prayer.userName}
                             </h4>
                             <p className="text-[10px] text-white/40 uppercase tracking-widest">
                               {prayer.createdAt?.toDate().toLocaleDateString('pt-BR')}
                             </p>
                           </div>
                        </div>
                      </div>
                      
                      <p className="text-white/80 leading-relaxed text-sm md:text-base mb-6">
                        {prayer.content}
                      </p>

                      <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                        <button 
                          onClick={() => handleLike(prayer.id)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                            hasLiked 
                            ? 'bg-[var(--theme-color)]/20 text-[var(--theme-color)] border border-[var(--theme-color)]/30' 
                            : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-transparent'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${hasLiked ? 'fill-[var(--theme-color)]' : ''}`} />
                          <span>Orei ({prayer.likes?.length || 0})</span>
                        </button>
                      </div>
                    </motion.div>
                  )
                })
             )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
