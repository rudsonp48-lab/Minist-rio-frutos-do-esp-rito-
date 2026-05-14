import { useState, useEffect } from 'react';
import { Camera, Heart, MessageCircle, Share2, Plus, Loader2, Zap, Globe, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';

interface Photo {
  id: string;
  url: string;
  category: string;
  likes: number;
  user: string;
  userId: string;
  createdAt: any;
}

export default function Gallery() {
  const [activeCategory, setActiveCategory] = useState('Tudo');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Form states
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('Cultos');

  useEffect(() => {
    const q = query(collection(db, 'photos'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const photoData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Photo[];
      setPhotos(photoData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'photos');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !auth.currentUser) return;

    setIsUploading(true);
    try {
      await addDoc(collection(db, 'photos'), {
        url,
        category,
        likes: 0,
        user: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Anônimo',
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      setUrl('');
      setShowUploadModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'photos');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLike = async (photoId: string) => {
    try {
      await updateDoc(doc(db, 'photos', photoId), {
        likes: increment(1)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `photos/${photoId}`);
    }
  };

  const filteredPhotos = photos.filter(p => activeCategory === 'Tudo' || p.category === activeCategory);

  return (
    <div className="space-y-32 pb-40 cyber-grid">
      {/* Cinematic Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-yellow-400/5 blur-[140px]" />
        <div className="absolute bottom-[20%] right-[-10%] w-[400px] h-[400px] bg-cyan-400/5 blur-[120px]" />
      </div>

      <header className="relative z-10 px-6 pt-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
           <div className="space-y-6">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 glass flex items-center justify-center rounded-2xl glow-yellow border-yellow-400/20">
                   <Target className="w-6 h-6 text-yellow-400 animate-pulse" />
                 </div>
                 <span className="text-yellow-400 text-[10px] font-black uppercase tracking-[0.4em] text-glow">Repositório Visual de Memórias // Atlas Visual</span>
              </div>
              <h1 className="text-6xl md:text-9xl font-display font-black italic uppercase tracking-tighter leading-[0.8] md:leading-[0.75]">
                 Nexus <br /> <span className="text-yellow-400">Vault</span>
              </h1>
           </div>
           
           <button 
             onClick={() => setShowUploadModal(true)}
             className="bg-white text-black px-12 py-6 rounded-[2.5rem] font-display font-black uppercase italic tracking-tighter text-xl flex items-center justify-center gap-4 hover:bg-yellow-400 hover:scale-105 active:scale-95 shadow-4xl glow-yellow transition-all group shrink-0"
           >
              <Plus className="w-7 h-7 group-hover:rotate-180 transition-transform duration-500" />
              <span>Sincronizar Foto</span>
           </button>
        </div>
      </header>

      {/* Cyber Categories */}
      <section className="px-6 relative z-10">
        <div className="flex gap-4 overflow-x-auto pb-8 scrollbar-hide">
          {['Tudo', 'Cultos', 'Jovens', 'Eventos', 'Música', 'Social'].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-12 py-6 rounded-[2rem] border transition-all whitespace-nowrap text-xl font-display font-black uppercase italic tracking-tighter relative overflow-hidden group ${
                activeCategory === cat 
                  ? 'glass border-yellow-400/40 text-yellow-400 glow-yellow' 
                  : 'glass-dark text-zinc-600 border-white/5 hover:border-white/20 hover:text-white'
              }`}
            >
              <span className="relative z-10">{cat}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Gallery Fluid Grid */}
      <section className="px-6 relative z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-8">
            <Loader2 className="w-16 h-16 text-yellow-400 animate-spin opacity-20" />
            <p className="text-zinc-600 text-[10px] uppercase font-black tracking-[0.5em] animate-pulse italic text-glow">Decodificando Atlas...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            <AnimatePresence mode="popLayout">
              {filteredPhotos.map((photo) => (
                <motion.div 
                  key={photo.id}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative group glass rounded-[4rem] overflow-hidden shadow-4xl border-white/5 hover:border-yellow-400/40 transition-all p-1.5"
                >
                  <div className="rounded-[3.8rem] overflow-hidden relative aspect-square">
                     <img src={photo.url} className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 group-hover:scale-110 transition-all duration-1000" alt="Moment" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent opacity-80 group-hover:opacity-40 transition-all duration-500" />
                     
                     <div className="absolute inset-0 flex flex-col justify-between p-12 opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-6 group-hover:translate-y-0">
                       <div className="flex justify-between items-start">
                          <div className="glass px-6 py-2 rounded-full border-yellow-400/20 bg-black/40">
                             <span className="text-yellow-400 text-[10px] font-black uppercase tracking-widest leading-none">{photo.category}</span>
                          </div>
                          <button className="w-16 h-16 glass backdrop-blur-xl flex items-center justify-center rounded-2xl hover:bg-white/10 hover:text-white transition-all shadow-4xl">
                             <Share2 className="w-7 h-7" />
                          </button>
                       </div>

                       <div className="space-y-8">
                          <div className="flex items-center gap-6">
                            <div className="w-16 h-16 glass bg-black/40 flex items-center justify-center rounded-3xl glow-yellow">
                               <Camera className="w-7 h-7 text-yellow-400" />
                            </div>
                            <div>
                               <p className="text-white font-display font-black uppercase italic tracking-tighter text-3xl leading-none">{photo.user}</p>
                               <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] mt-3 italic opacity-60">Matriz: {photo.id.slice(0, 8)}</p>
                            </div>
                          </div>

                          <div className="flex gap-10 pt-8 border-t border-white/10">
                            <button 
                              onClick={() => handleLike(photo.id)}
                              className="flex items-center gap-4 text-white group/btn"
                            >
                              <div className="relative">
                                 <Heart className={`w-7 h-7 transition-all group-hover/btn:scale-125 ${photo.likes > 0 ? 'fill-red-500 text-red-500 glow-red' : ''}`} />
                              </div>
                              <span className="text-xl font-display font-black uppercase italic tracking-tighter tabular-nums">{photo.likes}</span>
                            </button>
                            <button className="flex items-center gap-4 text-white group/btn">
                              <MessageCircle className="w-7 h-7 group-hover/btn:text-yellow-400 transition-all group-hover/btn:scale-125" />
                              <span className="text-xl font-display font-black uppercase italic tracking-tighter tabular-nums">0</span>
                            </button>
                          </div>
                       </div>
                     </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUploadModal(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-3xl"
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-xl glass-dark border border-white/10 rounded-[3rem] p-8 md:p-12 relative z-10 overflow-hidden shadow-[0_0_100px_rgba(250,204,21,0.1)]"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-yellow-400 rounded-b-full glow-yellow" />
              
              <div className="text-center mb-10">
                <h2 className="text-4xl font-display font-black italic uppercase tracking-tighter mb-4">Sincronizar <span className="text-yellow-400">Dados</span></h2>
                <p className="text-zinc-500 text-[9px] uppercase font-black tracking-[0.4em] opacity-60">Imortalize momentos no Atlas Ecclesia</p>
              </div>

              <form onSubmit={handleUpload} className="space-y-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 px-4">URL da Imagem</label>
                    <input 
                      type="url" 
                      required
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://exemplo.com/foto.jpg"
                      className="w-full glass bg-zinc-900/40 border border-white/5 rounded-2xl py-6 px-8 text-sm focus:outline-none focus:border-yellow-400/40 transition-all font-bold text-white placeholder:text-zinc-800"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 px-4">Categoria</label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full glass bg-zinc-900/40 border border-white/5 rounded-2xl py-6 px-8 text-sm focus:outline-none focus:border-yellow-400/40 transition-all font-bold text-white accent-yellow-400"
                    >
                      {['Cultos', 'Jovens', 'Eventos', 'Música', 'Social'].map(cat => (
                        <option key={cat} value={cat} className="bg-zinc-950 text-white">{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 glass text-zinc-500 font-black uppercase tracking-widest text-[10px] py-6 rounded-2xl hover:text-white transition-all"
                  >
                    Abortar
                  </button>
                  <button 
                    type="submit"
                    disabled={isUploading || !url}
                    className="flex-[2] bg-yellow-400 text-black font-black uppercase tracking-widest text-[10px] py-6 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-2xl glow-yellow flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sincronizando...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Confirmar Upload</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cyber Footer CTA */}
      <section className="py-32 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-400/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="relative z-10 space-y-10">
           <div className="w-24 h-24 glass flex items-center justify-center rounded-[2.5rem] mx-auto glow-yellow">
              <Camera className="w-10 h-10 text-yellow-400" />
           </div>
           <div>
             <h3 className="text-4xl md:text-6xl font-display font-black uppercase italic tracking-tighter mb-4">Nex <br /> <span className="text-yellow-400">Capture</span></h3>
             <p className="text-zinc-600 max-w-sm mx-auto text-[10px] uppercase font-black tracking-widest leading-relaxed opacity-60">Digitalize sua experiência e imortalize momentos no fluxo da rede Ecclesia.</p>
           </div>
           <button 
             onClick={() => setShowUploadModal(true)}
             className="text-yellow-400 font-display font-black uppercase italic tracking-widest text-[11px] underline underline-offset-8 decoration-yellow-400/20 hover:text-white transition-all"
           >
             Upload Stream
           </button>
        </div>
      </section>
    </div>
  );
}
