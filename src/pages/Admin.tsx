import { useState, useEffect } from 'react';
import { 
  Users, Calendar, Radio, Settings, Search, Plus, 
  Trash2, ShieldAlert, BarChart3, LayoutDashboard, 
  Bell, Database, Loader2, Camera, Save, X, 
  Zap, Globe, Cpu, CreditCard, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, getDocs, limit, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';

const ADMIN_EMAIL = 'rudson.p48@gmail.com';

interface Banner {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  cta: string;
  type: string;
}

interface AppConfig {
  banners: Banner[];
  churchName: string;
  pixKey: string;
  pixBankInfo: string;
  pixCopiaECola?: string;
  settingsTitles: {
    sync: string;
    security: string;
    core: string;
  };
}

export default function Admin() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<any[]>([]);
  const [config, setConfig] = useState<AppConfig>({ 
    banners: [], 
    churchName: '', 
    pixKey: '', 
    pixBankInfo: '',
    settingsTitles: { sync: '', security: '', core: '' } 
  });
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState([
    { label: 'Sincronia Membros', value: '0', icon: Users, color: 'text-cyan-400' },
    { label: 'Fluxo Galeria', value: '0', icon: Camera, color: 'text-yellow-400' },
    { label: 'Transmissões', value: '12', icon: Radio, color: 'text-pink-500' },
    { label: 'Eventos Ativos', value: '0', icon: Calendar, color: 'text-emerald-400' },
  ]);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(async (user) => {
      if (user && user.email === ADMIN_EMAIL) {
        try {
          const adminRef = doc(db, 'admins', user.uid);
          const adminSnap = await getDoc(adminRef);
          if (!adminSnap.exists()) {
             await setDoc(adminRef, { 
               email: user.email, 
               bootstrappedAt: serverTimestamp(),
               protocol: 'ALPHA-NEXUS-4' 
             });
          }
          setIsAdmin(true);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `admins/${user.uid}`);
          setIsAdmin(true); 
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchConfig = async () => {
      try {
        const docRef = doc(db, 'app_config', 'main');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setConfig(docSnap.data() as AppConfig);
        } else {
          await setDoc(docRef, config);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'app_config/main');
      }
    };
    fetchConfig();

    const fetchCounts = async () => {
      const [u, p, e] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'photos')),
        getDocs(collection(db, 'events'))
      ]);
      setStats(s => [
        { ...s[0], value: u.size.toString() },
        { ...s[1], value: p.size.toString() },
        { ...s[2], value: '12' },
        { ...s[3], value: e.size.toString() },
      ]);
    };
    fetchCounts();

    if (activeMenu !== 'settings' && activeMenu !== 'dashboard' && activeMenu !== 'analytics') {
      const q = query(collection(db, activeMenu), orderBy('createdAt', 'desc'), limit(40));
      return onSnapshot(q, (snap) => {
        setContent(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    }
  }, [isAdmin, activeMenu]);

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'app_config', 'main'), config);
      alert("NEXUS UPDATE: Configurações sincronizadas!");
    } catch (err) {
      console.error(err);
      alert("ERRO DE CONEXÃO: Falha ao injetar dados.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Confirmar deleção permanente na Matriz?")) return;
    try {
      await deleteDoc(doc(db, activeMenu, id));
    } catch (err) { console.error(err); }
  };

  if (loading) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center cyber-grid">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-32 h-32 glass flex items-center justify-center rounded-[2.5rem] mb-12 border-red-500/20 shadow-4xl glow-red">
          <ShieldAlert className="w-16 h-16 text-red-500 animate-pulse" />
        </motion.div>
        <h1 className="text-6xl font-display font-black italic uppercase tracking-tighter mb-4">Acesso <span className="text-red-500 text-glow">Bloqueado</span></h1>
        <p className="text-zinc-500 font-bold uppercase tracking-[0.4em] text-[10px] mb-12">Protocolo de segurança ECCLESIA-01 ativo.</p>
        <button onClick={() => window.location.href = '/'} className="bg-white text-black px-12 py-6 rounded-full font-black uppercase tracking-widest text-xs hover:bg-yellow-400 transition-all active:scale-95">Reset Terminal</button>
      </div>
    );
  }

  return (
    <div className="space-y-24 pb-40 cyber-grid">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] left-[-5%] w-[600px] h-[600px] bg-yellow-400/5 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-5%] w-[600px] h-[600px] bg-cyan-400/5 blur-[120px]" />
      </div>

      <header className="relative z-10 px-6 pt-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
           <div className="space-y-6">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 glass flex items-center justify-center rounded-2xl glow-yellow border-yellow-400/20">
                   <Cpu className="w-6 h-6 text-yellow-400 animate-pulse" />
                 </div>
                 <span className="text-yellow-400 text-[10px] font-black uppercase tracking-[0.4em] text-glow">Nexus Command Center // v4.0.0</span>
              </div>
              <h1 className="text-6xl md:text-9xl font-display font-black italic uppercase tracking-tighter leading-[0.8]">
                 System <br /> <span className="text-yellow-400">Control</span>
              </h1>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="glass px-8 py-5 rounded-[2rem] flex items-center gap-4 border-emerald-500/20">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 glow-emerald animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Kernel: Online</span>
              </div>
              <button onClick={() => auth.signOut()} className="w-14 h-14 glass flex items-center justify-center rounded-2xl hover:bg-red-500/20 hover:text-red-500 transition-all border-white/5">
                 <X className="w-6 h-6" />
              </button>
           </div>
        </div>
      </header>

      {/* Terminal Stats */}
      <section className="px-6 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass p-10 rounded-[3.5rem] relative overflow-hidden group hover:border-yellow-400/30 transition-all shadow-4xl bg-black/40"
            >
              <div className={`absolute top-0 right-0 w-24 h-24 blur-[60px] opacity-20 rounded-full bg-current ${stat.color}`} />
              <stat.icon className={`w-8 h-8 ${stat.color} mb-12 group-hover:scale-110 transition-transform`} />
              <div>
                 <span className="text-5xl font-display font-black italic tracking-tighter block mb-2">{stat.value}</span>
                 <span className="text-zinc-500 text-[9px] font-black uppercase tracking-widest block opacity-60">{stat.label}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="px-6 relative z-10 grid lg:grid-cols-[350px_1fr] gap-16">
        {/* Navigation Blade */}
        <aside className="space-y-4">
           {[
             { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
             { id: 'photos', label: 'N-Gallery', icon: Camera },
             { id: 'events', label: 'Agenda Matrix', icon: Calendar },
             { id: 'users', label: 'Nodes / Users', icon: Users },
             { id: 'settings', label: 'Root Config', icon: Settings },
           ].map(item => (
             <button
               key={item.id}
               onClick={() => setActiveMenu(item.id)}
               className={`w-full flex items-center gap-6 px-10 py-8 rounded-[2.5rem] transition-all relative overflow-hidden italic font-display font-black uppercase tracking-tighter text-xl ${
                 activeMenu === item.id ? 'glass text-yellow-400 border-yellow-400/40 glow-yellow translate-x-2' : 'text-zinc-600 hover:text-zinc-300'
               }`}
             >
               <item.icon className="w-5 h-5" />
               <span>{item.label}</span>
               {activeMenu === item.id && <Zap className="w-4 h-4 ml-auto animate-pulse" />}
             </button>
           ))}
        </aside>

        {/* Content Module */}
        <div className="glass p-12 md:p-24 rounded-[4rem] border-white/5 relative bg-black/60 shadow-4xl min-h-[600px]">
           <AnimatePresence mode="wait">
              {activeMenu === 'settings' ? (
                <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-16">
                   <div className="flex items-center justify-between">
                      <h2 className="text-4xl md:text-6xl font-display font-black italic uppercase tracking-tighter">Root <span className="text-yellow-400">Config</span></h2>
                      <button onClick={handleSaveConfig} disabled={isSaving} className="bg-yellow-400 text-black px-12 py-6 rounded-[2rem] font-display font-black uppercase italic tracking-tighter text-xl flex items-center gap-4 glow-yellow hover:scale-105 active:scale-95 transition-all shadow-4xl">
                         {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
                         <span>Deploy</span>
                      </button>
                   </div>

                   <div className="grid md:grid-cols-2 gap-12">
                      <div className="space-y-8 glass p-10 rounded-[3rem] border-white/5">
                         <div className="flex items-center gap-4 text-yellow-400">
                           <Globe className="w-5 h-5" />
                           <span className="text-[10px] font-black uppercase tracking-[0.3em]">Identidade Digital</span>
                         </div>
                         <div className="space-y-4">
                            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600 ml-4">Nome do Ecossistema</label>
                            <input value={config.churchName} onChange={e => setConfig({...config, churchName: e.target.value})} className="w-full glass py-6 px-10 rounded-3xl outline-none focus:border-yellow-400/50 bg-white/5 font-bold" />
                         </div>
                      </div>

                      <div className="space-y-8 glass p-10 rounded-[3rem] border-white/5">
                         <div className="flex items-center gap-4 text-cyan-400">
                           <CreditCard className="w-5 h-5" />
                           <span className="text-[10px] font-black uppercase tracking-[0.3em]">Fluxo Financeiro (PIX)</span>
                         </div>
                         <div className="space-y-4">
                            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600 ml-4">Matriz PIX (Chave)</label>
                            <input value={config.pixKey} onChange={e => setConfig({...config, pixKey: e.target.value})} className="w-full glass py-6 px-10 rounded-3xl outline-none focus:border-cyan-400/30 bg-white/5 font-bold" />
                         </div>
                         <div className="space-y-4">
                            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600 ml-4">Configuração Bancária</label>
                            <input value={config.pixBankInfo} onChange={e => setConfig({...config, pixBankInfo: e.target.value})} className="w-full glass py-6 px-10 rounded-3xl outline-none focus:border-cyan-400/30 bg-white/5 font-bold" />
                         </div>
                      </div>
                   </div>

                   <div className="space-y-10">
                      <div className="flex items-center justify-between">
                         <h3 className="text-2xl font-display font-black uppercase tracking-tighter italic">Banners Nexus</h3>
                         <button onClick={() => setConfig({...config, banners: [...config.banners, { id: Date.now(), title: 'NOME BANNER', subtitle: 'TAG', image: '', cta: 'SYNC', type: 'ALPHA' }]})} className="w-12 h-12 glass flex items-center justify-center rounded-2xl hover:bg-white/10">
                            <Plus className="w-6 h-6" />
                         </button>
                      </div>
                      <div className="grid gap-6">
                         {config.banners.map((b, i) => (
                           <div key={b.id} className="glass p-10 rounded-[3rem] border-white/5 group hover:border-yellow-400/20 transition-all">
                              <div className="flex justify-between items-start mb-10">
                                 <div className="flex gap-4">
                                    <div className="w-16 h-16 glass rounded-2xl overflow-hidden bg-white/5">
                                       {b.image && <img src={b.image} className="w-full h-full object-cover" />}
                                    </div>
                                    <div className="space-y-1">
                                       <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Banner ID // #{i + 1}</span>
                                       <h4 className="text-xl font-display font-black tracking-tighter uppercase italic">{b.title}</h4>
                                    </div>
                                 </div>
                                 <button onClick={() => setConfig({...config, banners: config.banners.filter(x => x.id !== b.id)})} className="p-3 glass rounded-xl text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                    <Trash2 className="w-5 h-5" />
                                 </button>
                              </div>
                              <div className="grid md:grid-cols-2 gap-6">
                                 <input value={b.title} onChange={e => { const nb = [...config.banners]; nb[i].title = e.target.value; setConfig({...config, banners: nb})}} placeholder="Título" className="glass py-5 px-8 rounded-2xl outline-none text-sm" />
                                 <input value={b.subtitle} onChange={e => { const nb = [...config.banners]; nb[i].subtitle = e.target.value; setConfig({...config, banners: nb})}} placeholder="Tag" className="glass py-5 px-8 rounded-2xl outline-none text-sm" />
                                 <input value={b.image} onChange={e => { const nb = [...config.banners]; nb[i].image = e.target.value; setConfig({...config, banners: nb})}} placeholder="URL Imagem" className="glass py-5 px-8 rounded-2xl outline-none text-sm md:col-span-2" />
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                </motion.div>
              ) : activeMenu === 'dashboard' ? (
                 <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-16">
                    <div className="space-y-4">
                       <h2 className="text-4xl md:text-6xl font-display font-black italic uppercase tracking-tighter">Nexus <span className="text-yellow-400">Pulse</span></h2>
                       <p className="text-zinc-500 italic max-w-lg">Monitoramento de integridade da matriz e sincronização de dados comunitários em tempo real.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                       {[
                         { label: 'Uptime Sistema', val: '99.9%', color: 'text-emerald-500' },
                         { label: 'Latência Nexus', val: '24ms', color: 'text-cyan-500' },
                         { label: 'Sincronia Firebase', val: 'Ativo', color: 'text-yellow-500' },
                       ].map((x, i) => (
                         <div key={i} className="glass p-10 rounded-[3rem] border-white/5">
                            <span className="text-zinc-600 text-[10px] font-black uppercase tracking-widest block mb-4">{x.label}</span>
                            <span className={`${x.color} text-4xl font-display font-black tracking-tighter italic uppercase`}>{x.val}</span>
                         </div>
                       ))}
                    </div>
                    <div className="glass-dark bg-black/40 p-12 rounded-[4rem] border-white/5 space-y-10">
                       <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Ocupação de Buffer</span>
                          <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
                             <div className="w-2/3 h-full bg-yellow-400 glow-yellow" />
                          </div>
                       </div>
                       <div className="h-64 flex items-end gap-4">
                          {[40, 60, 45, 90, 65, 80, 55, 75, 45, 60, 85].map((h, i) => (
                            <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: i * 0.1 }} className="flex-1 bg-yellow-400/20 rounded-t-xl hover:bg-yellow-400 transition-all cursor-pointer" />
                          ))}
                       </div>
                    </div>
                 </motion.div>
              ) : (
                <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-12">
                   <div className="flex items-center justify-between">
                      <h2 className="text-4xl md:text-6xl font-display font-black italic uppercase tracking-tighter">Nexus <span className="text-yellow-400">List</span></h2>
                      <div className="relative group max-w-xs w-full">
                         <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                         <input placeholder="Filtrar Matriz..." className="w-full glass py-4 pl-14 pr-6 rounded-2xl outline-none text-[10px] uppercase font-black tracking-widest" />
                      </div>
                   </div>

                   <div className="overflow-x-auto">
                      <table className="w-full border-separate border-spacing-y-4">
                         <thead>
                            <tr className="text-left text-[10px] font-black uppercase tracking-widest text-zinc-600">
                               <th className="px-10 py-4">ID / Entidade</th>
                               <th className="px-10 py-4">Status</th>
                               <th className="px-10 py-4 text-right">Ação</th>
                            </tr>
                         </thead>
                         <tbody>
                            {content.map((item, i) => (
                              <tr key={item.id} className="group">
                                 <td className="glass px-10 py-6 rounded-l-[3rem] border-r-0">
                                    <div className="flex items-center gap-6">
                                       <div className="w-14 h-14 glass flex items-center justify-center rounded-2xl bg-white/5 overflow-hidden">
                                          {item.url ? <img src={item.url} className="w-full h-full object-cover" /> : item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <Database className="w-6 h-6 text-yellow-400" />}
                                       </div>
                                       <div>
                                          <p className="text-xl font-display font-black tracking-tighter uppercase italic text-white leading-none mb-1">{item.title || item.name || item.email || 'Registro Undef'}</p>
                                          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 italic">CRC: {item.id.slice(0, 10)}</p>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="glass px-10 py-6 border-x-0">
                                    <div className="flex items-center gap-3">
                                       <div className="w-2 h-2 rounded-full bg-emerald-500 glow-emerald animate-pulse" />
                                       <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Synced</span>
                                    </div>
                                 </td>
                                 <td className="glass px-10 py-6 rounded-r-[3rem] text-right border-l-0">
                                    <button onClick={() => deleteItem(item.id)} className="w-12 h-12 glass flex items-center justify-center rounded-2xl text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all ml-auto">
                                       <Trash2 className="w-5 h-5" />
                                    </button>
                                 </td>
                              </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>

                   {content.length === 0 && (
                     <div className="py-24 text-center">
                        <Loader2 className="w-12 h-12 text-yellow-400 animate-spin mx-auto mb-6 opacity-20" />
                        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-600 italic">Vácuo de Dados Detectado</span>
                     </div>
                   )}
                </motion.div>
              )}
           </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
