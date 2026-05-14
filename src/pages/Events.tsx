import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, MapPin, Clock, ChevronRight, Plus, Loader2, Zap, Target, Globe, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
  image: string;
  createdAt: any;
}

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    category: 'Culto',
    image: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Event[];
      setEvents(eventData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'events');
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'events'), {
        ...formData,
        createdAt: serverTimestamp()
      });
      setShowAddModal(false);
      setFormData({ title: '', date: '', time: '', location: '', category: 'Culto', image: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'events');
    } finally {
      setIsSubmitting(false);
    }
  };

  const featuredEvent = events[0];
  const listEvents = events.slice(1);

  return (
    <div className="space-y-24 pb-40 cyber-grid">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[20%] right-[-5%] w-[400px] h-[400px] bg-cyan-400/5 blur-[120px]" />
        <div className="absolute bottom-[20%] left-[-5%] w-[400px] h-[400px] bg-yellow-400/5 blur-[120px]" />
      </div>

      <header className="relative z-10 px-6 pt-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
           <div className="space-y-6">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 glass flex items-center justify-center rounded-2xl glow-yellow border-yellow-400/20">
                   <Target className="w-6 h-6 text-yellow-400 animate-pulse" />
                 </div>
                 <span className="text-yellow-400 text-[10px] font-black uppercase tracking-[0.4em] text-glow">Operação Matrix // Agenda</span>
              </div>
              <h1 className="text-6xl md:text-9xl font-display font-black italic uppercase tracking-tighter leading-[0.8]">
                 Nexus <br /> <span className="text-yellow-400">Events</span>
              </h1>
              <p className="max-w-md text-zinc-500 font-medium italic text-lg border-l-2 border-white/5 pl-6">
                Sincronize sua localização na matriz com nossos pontos de encontro sagrados.
              </p>
           </div>
           
           <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowAddModal(true)}
                className="bg-white text-black px-12 py-6 rounded-[2.5rem] flex items-center justify-center gap-4 font-display font-black uppercase italic tracking-tighter text-xl hover:bg-yellow-400 transition-all shadow-4xl glow-yellow active:scale-95 group"
              >
                <Plus className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
                <span>Registrar</span>
              </button>
           </div>
        </div>
      </header>

      {loading ? (
        <div className="py-40 text-center space-y-8">
          <div className="relative inline-block">
             <Loader2 className="w-20 h-20 text-yellow-400 animate-spin opacity-20" />
             <Zap className="w-8 h-8 text-yellow-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="text-zinc-600 font-black uppercase tracking-[0.4em] text-[10px]">Carregando Coordenadas...</p>
        </div>
      ) : (
        <>
          {featuredEvent && (
            <section className="px-6 relative z-10">
              <div className="relative h-[75vh] glass-card group shadow-4xl">
                <img 
                  src={featuredEvent.image} 
                  className="absolute inset-0 w-full h-full object-cover grayscale brightness-[0.3] group-hover:grayscale-0 group-hover:brightness-75 transition-all duration-[2s] scale-100 group-hover:scale-105"
                  alt="Highlight"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20" />
                
                <div className="absolute inset-x-0 bottom-0 p-12 md:p-24 space-y-10">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
                    <div className="space-y-8">
                       <div className="inline-flex items-center gap-4 glass px-6 py-2 rounded-full border-yellow-400/20">
                          <div className="w-2 h-2 rounded-full bg-yellow-400 glow-yellow animate-pulse" />
                          <span className="text-yellow-400 text-[10px] font-black uppercase tracking-[0.3em]">{featuredEvent.category} // PRIORIDADE ALPHA</span>
                       </div>
                       
                       <h2 className="text-6xl md:text-8xl font-display font-black italic uppercase tracking-tighter leading-none text-white lg:max-w-3xl">
                         {featuredEvent.title}
                       </h2>

                       <div className="grid grid-cols-2 lg:grid-cols-3 gap-12 pt-4">
                         <div className="space-y-2">
                           <p className="text-zinc-600 text-[9px] font-black uppercase tracking-widest">Protocolo de Tempo</p>
                           <div className="flex items-center gap-3 text-white text-2xl font-display font-black italic uppercase tracking-tighter">
                             <Clock className="w-5 h-5 text-yellow-400" />
                             <span>{featuredEvent.date} @ {featuredEvent.time}</span>
                           </div>
                         </div>
                         <div className="space-y-2">
                           <p className="text-zinc-600 text-[9px] font-black uppercase tracking-widest">Geo Localização</p>
                           <div className="flex items-center gap-3 text-white text-2xl font-display font-black italic uppercase tracking-tighter">
                             <MapPin className="w-5 h-5 text-zinc-500" />
                             <span className="truncate">{featuredEvent.location}</span>
                           </div>
                         </div>
                       </div>
                    </div>
                    
                    <button className="bg-white text-black px-16 py-8 rounded-[2.5rem] font-display font-black uppercase italic tracking-tighter text-2xl hover:bg-yellow-400 hover:scale-105 active:scale-95 transition-all shadow-4xl glow-yellow shrink-0">
                      Sync Nexus
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          <section className="px-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {listEvents.map((event, idx) => (
                <motion.div 
                  key={event.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="glass p-2 rounded-[3.5rem] group hover:border-yellow-400/30 transition-all shadow-3xl bg-black/40 active:scale-98"
                >
                  <div className="rounded-[3.3rem] overflow-hidden bg-zinc-950/20 relative">
                    <div className="aspect-[4/5] relative overflow-hidden">
                      <img src={event.image} className="w-full h-full object-cover grayscale brightness-50 group-hover:grayscale-0 group-hover:brightness-90 group-hover:scale-110 transition-all duration-[1s]" alt={event.title} />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-80" />
                      
                      <div className="absolute top-8 left-8">
                         <div className="glass px-6 py-4 rounded-[2rem] text-center backdrop-blur-2xl border-white/10 group-hover:border-yellow-400/40 transition-all">
                            <span className="text-yellow-400 font-display font-black text-3xl italic tracking-tighter block leading-none">{event.date.split(' ')[0]}</span>
                            <span className="text-white text-[10px] font-black uppercase tracking-widest mt-1 block opacity-60">{event.date.split(' ')[1]}</span>
                         </div>
                      </div>
                    </div>

                    <div className="p-10 space-y-6">
                       <div className="flex items-center justify-between">
                          <span className="text-yellow-400 text-[10px] font-black uppercase tracking-[0.3em] opacity-40 group-hover:opacity-100 transition-all">{event.category}</span>
                          <Globe className="w-4 h-4 text-zinc-800" />
                       </div>
                       <h3 className="text-3xl font-display font-black italic uppercase tracking-tighter leading-tight text-white group-hover:text-yellow-400 transition-all uppercase line-clamp-2 min-h-[4.5rem]">{event.title}</h3>
                       
                       <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                          <div className="space-y-1">
                             <span className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.2em] block">Sincronia Local</span>
                             <span className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] block truncate max-w-[150px]">{event.location}</span>
                          </div>
                          <button className="w-14 h-14 glass flex items-center justify-center rounded-2xl hover:bg-yellow-400 hover:text-black hover:glow-yellow transition-all">
                             <ChevronRight className="w-7 h-7 group-hover:translate-x-1" />
                          </button>
                       </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* Add Event Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/95 backdrop-blur-3xl"
            />
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="w-full max-w-2xl glass-dark border border-white/10 rounded-[4rem] p-12 relative z-10 max-h-[90vh] overflow-y-auto scrollbar-hide"
            >
               <div className="flex items-center justify-between mb-12">
                  <h2 className="text-4xl font-display font-black italic uppercase tracking-tighter">Registrar <span className="text-yellow-400">Ponto</span></h2>
                  <button onClick={() => setShowAddModal(false)} className="w-12 h-12 glass rounded-2xl flex items-center justify-center hover:bg-white/10">
                     <X className="w-6 h-6" />
                  </button>
               </div>
               
               <form onSubmit={handleAddEvent} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Título do Registro</label>
                    <input 
                      type="text" required placeholder="Ex: VIGÍLIA ALPHA"
                      value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                      className="w-full glass py-5 px-8 rounded-3xl text-sm font-bold bg-white/5 border-white/10 focus:border-yellow-400/40 focus:bg-white/10 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Referência Temporal</label>
                    <input 
                      type="text" required placeholder="Ex: 24 AGO"
                      value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}
                      className="w-full glass py-5 px-8 rounded-3xl text-sm font-bold bg-white/5 border-white/10 focus:border-yellow-400/40 focus:bg-white/10 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Janela de Horário</label>
                    <input 
                      type="text" required placeholder="Ex: 19:30"
                      value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})}
                      className="w-full glass py-5 px-8 rounded-3xl text-sm font-bold bg-white/5 border-white/10 focus:border-yellow-400/40 focus:bg-white/10 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Coordenadas</label>
                    <input 
                      type="text" required placeholder="Ex: TEMPLO SEDE"
                      value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}
                      className="w-full glass py-5 px-8 rounded-3xl text-sm font-bold bg-white/5 border-white/10 focus:border-yellow-400/40 focus:bg-white/10 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Visual Mapping (URL)</label>
                    <input 
                      type="url" required placeholder="https://images..."
                      value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})}
                      className="w-full glass py-5 px-8 rounded-3xl text-sm font-bold bg-white/5 border-white/10 focus:border-yellow-400/40 focus:bg-white/10 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Categoria de Fluxo</label>
                    <div className="flex flex-wrap gap-3">
                       {['Culto', 'Matrix', 'Nexus', 'Conexão', 'Atlas'].map(c => (
                         <button 
                           key={c}
                           type="button"
                           onClick={() => setFormData({...formData, category: c})}
                           className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.category === c ? 'bg-white text-black glow-yellow' : 'glass text-zinc-500'}`}
                         >
                           {c}
                         </button>
                       ))}
                    </div>
                  </div>
                  <div className="md:col-span-2 pt-10">
                     <button type="submit" disabled={isSubmitting} className="w-full bg-yellow-400 text-black py-7 rounded-[2.5rem] font-display font-black uppercase italic tracking-tighter text-xl hover:bg-white hover:scale-105 transition-all shadow-4xl glow-yellow active:scale-95 disabled:opacity-50">
                       {isSubmitting ? 'Injetando no Nexus...' : 'Sincronizar Evento'}
                     </button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Matrix Stats */}
      <section className="px-6 relative z-10">
         <div className="glass-dark bg-zinc-950/60 rounded-[4rem] p-12 md:p-24 border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-400/5 blur-[120px] rounded-full pointer-events-none" />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
               <div className="space-y-12">
                  <div className="space-y-4">
                     <h3 className="text-5xl md:text-7xl font-display font-black uppercase italic tracking-tighter leading-none">Matrix Analytics</h3>
                     <p className="text-zinc-500 text-lg italic max-w-md">O monitoramento em tempo real do crescimento espiritual e da interação comunitária no Nexus.</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-8">
                     <div className="glass p-8 rounded-[2.5rem] border-white/5">
                        <span className="text-yellow-400 text-5xl font-display font-black italic tracking-tighter block mb-2">98%</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600 block">Sincronia Semanal</span>
                     </div>
                     <div className="glass p-8 rounded-[2.5rem] border-white/5">
                        <span className="text-white text-5xl font-display font-black italic tracking-tighter block mb-2">12k+</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600 block">Interações Atlas</span>
                     </div>
                  </div>
               </div>

               <div className="glass p-2 rounded-[3.5rem] bg-white/5 border-white/5 shadow-3xl">
                  <div className="bg-black/60 rounded-[3.4rem] p-10 md:p-16 space-y-10">
                     <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Visualização de Fluxo</span>
                        <div className="flex gap-1">
                           {[1,2,3].map(i => <div key={i} className="w-1 h-3 bg-yellow-400/30 rounded-full" />)}
                        </div>
                     </div>
                     
                     <div className="space-y-6">
                        {[
                          { label: 'Matriz de Cultos', progress: 85 },
                          { label: 'Eventos Externos', progress: 62 },
                          { label: 'Projetos Nexus', progress: 45 },
                        ].map((stat, i) => (
                           <div key={i} className="space-y-3">
                              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                 <span className="text-white">{stat.label}</span>
                                 <span className="text-yellow-400">{stat.progress}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                 <motion.div 
                                   initial={{ width: 0 }}
                                   whileInView={{ width: `${stat.progress}%` }}
                                   transition={{ duration: 1.5, delay: i * 0.2 }}
                                   className="h-full bg-yellow-400 glow-yellow" 
                                 />
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>
    </div>
  );
}
