import { useState, useEffect, useRef } from 'react';
import { 
  Users, Calendar, Radio, Settings, Search, Plus, 
  Trash2, ShieldAlert, BarChart3, LayoutDashboard, 
  Bell, Database, Loader2, Camera, Save, X, 
  Zap, Globe, Cpu, CreditCard, ChevronRight, ChevronLeft, ShieldCheck, ImagePlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, getDocs, limit, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { compressImage } from '../lib/imageUtils';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';
import { Link } from 'react-router-dom';

const ADMIN_EMAIL = 'rudson.p48@gmail.com';

export default function Admin() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<any[]>([]);
  const [config, setConfig] = useState<any>({ 
    banners: [], 
    churchName: '', 
    pixKey: '', 
    pixBankInfo: '',
    logoUrl: '',
    settingsTitles: { sync: '', security: '', core: '' } 
  });
  const [newItem, setNewItem] = useState<any>({});
  const [adminEmailInput, setAdminEmailInput] = useState('');
  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const contentFileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddAdminByEmail = async () => {
    if (!adminEmailInput) return;
    try {
      await setDoc(doc(db, 'admins', adminEmailInput.trim().toLowerCase()), {
        role: 'admin',
        updatedAt: serverTimestamp()
      });
      alert(`O email ${adminEmailInput} foi promovido a administrador! Ele terá acesso no próximo login.`);
      setAdminEmailInput('');
    } catch (e) {
      console.error(e);
      alert("Erro ao adicionar admin.");
    }
  };

  const [stats, setStats] = useState([
    { label: 'Membros', value: '0', icon: Users, color: '#3B0944', text: '#FF00E5' },
    { label: 'Fotos', value: '0', icon: Camera, color: '#4A0E17', text: '#FF3B30' },
    { label: 'Mídia', value: '12', icon: Radio, color: '#002B36', text: '#00F0FF' },
    { label: 'Eventos', value: '0', icon: Calendar, color: '#311005', text: '#FF9500' },
  ]);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        if (user.email === ADMIN_EMAIL) {
          setIsAdmin(true);
        } else {
          try {
            const adminDoc = await getDoc(doc(db, 'admins', user.uid));
            let hasAdminByEmail = false;
            if (user.email) {
               const adminDocEmail = await getDoc(doc(db, 'admins', user.email.toLowerCase()));
               hasAdminByEmail = adminDocEmail.exists();
            }
            setIsAdmin(adminDoc.exists() || hasAdminByEmail);
          } catch (e) {
            setIsAdmin(false);
          }
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
      const docRef = doc(db, 'app_config', 'main');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setConfig(prev => ({ ...prev, ...docSnap.data() }));
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

    if (activeMenu !== 'settings' && activeMenu !== 'dashboard' && activeMenu !== 'banners') {
      let q;
      if (activeMenu === 'users') {
        q = query(collection(db, activeMenu), limit(40));
      } else {
        q = query(collection(db, activeMenu), orderBy('createdAt', 'desc'), limit(40));
      }
      return onSnapshot(q, (snap) => {
        setContent(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (err) => {
        console.error("Erro no listener do admin:", err);
      });
    }
  }, [isAdmin, activeMenu]);

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsSaving(true);
      try {
        const base64Image = await compressImage(file);
        setNewItem({ ...newItem, image: base64Image });
      } catch (err) {
        alert("Erro no upload do banner");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleAddBanner = async () => {
    if (!newItem.image || !newItem.title) return;
    setIsSaving(true);
    try {
      const newBanners = [...(config.banners || []), { 
        id: Date.now(), 
        title: newItem.title, 
        subtitle: newItem.subtitle || '',
        description: newItem.description || '',
        image: newItem.image 
      }];
      await setDoc(doc(db, 'app_config', 'main'), { banners: newBanners }, { merge: true });
      setConfig({ ...config, banners: newBanners });
      setNewItem({});
    } catch (err) {
      alert("Erro ao salvar banner");
    } finally {
      setIsSaving(false);
    }
  };

  const removeBanner = async (id: number) => {
    if (!confirm("Remover banner?")) return;
    try {
      const newBanners = config.banners.filter((b: any) => b.id !== id);
      await setDoc(doc(db, 'app_config', 'main'), { banners: newBanners }, { merge: true });
      setConfig({ ...config, banners: newBanners });
    } catch (err) {
      console.error(err);
    }
  };

  const handleContentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsSaving(true);
      try {
        const base64Image = await compressImage(file);
        setNewItem({ ...newItem, url: base64Image, image: base64Image });
      } catch (err) {
        alert("Erro no upload");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleAddContent = async () => {
    setIsSaving(true);
    try {
      const newDocRef = doc(collection(db, activeMenu));
      await setDoc(newDocRef, {
        ...newItem,
        createdAt: serverTimestamp()
      });
      setNewItem({});
    } catch (err) {
      alert("Erro ao salvar");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'app_config', 'main'), config, { merge: true });
      alert("Configurações Atualizadas");
    } catch (err: any) {
      console.error(err);
      alert("Erro ao salvar: " + (err.message || 'Erro desconhecido. Verifique as permissões.'));
    } finally {
      setIsSaving(false);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Remover permanentemente?")) return;
    try {
      if (activeMenu === 'users') {
        alert("Exclusão de usuários deve ser feita diretamente no Firebase console para segurança estrutural.");
        return;
      }
      await deleteDoc(doc(db, activeMenu, id));
    } catch (err) { console.error(err); }
  };

  const toggleAdminStatus = async (userId: string) => {
    try {
      const docRef = doc(db, 'admins', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        await deleteDoc(docRef);
        alert("Privilégios administrativos removidos.");
      } else {
        await setDoc(docRef, { role: 'admin', updatedAt: serverTimestamp() });
        alert("Privilégios administrativos concedidos com sucesso!");
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao alterar privilégios. Verifique as permissões de acesso.");
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsSaving(true);
      try {
        const base64Image = await compressImage(file);
        setConfig(prev => ({ ...prev, logoUrl: base64Image }));
      } catch (err) {
        console.error("Failed to upload logo", err);
        alert("Erro no upload da logo");
      } finally {
        setIsSaving(false);
      }
    }
  };

  if (loading) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-black">
        <ShieldAlert className="w-20 h-20 text-red-500 mb-6 drop-shadow-[0_0_15px_rgba(255,59,48,0.5)]" />
        <h1 className="text-3xl font-serif font-bold mb-4 tracking-wider text-white uppercase">Acesso Restrito</h1>
        <p className="text-white/60 mb-8 max-w-md">Esta área é protegida e exclusiva para administradores de nível Alpha.</p>
        <Link to="/" className="inline-flex items-center gap-2 px-8 py-3 bg-white/10 rounded-full font-bold text-white hover:bg-white/20 transition-colors border border-white/20">Abaixe a Defesa e Volte</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 bg-transparent text-white font-sans w-full max-w-7xl mx-auto">
       {/* Premium Top Navigation Header */}
       <header className="sticky top-0 z-40 bg-black/50 backdrop-blur-3xl border-b border-white/5 py-6 px-6 lg:px-12 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10 group">
             <ChevronLeft className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-2xl font-serif font-bold tracking-widest text-white uppercase">Painel Admin</h1>
            <div className="flex items-center gap-2 mt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em]">Alpha Clearance</span>
            </div>
          </div>
        </div>
        <button className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors shadow-xl">
          <Bell className="w-5 h-5 text-white/80" />
        </button>
      </header>

      <div className="pt-8 px-6 lg:px-12 space-y-12">
        
        {/* Stats Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {stats.map((stat, idx) => (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              key={idx} 
              className="relative p-6 rounded-3xl border border-white/10 overflow-hidden group bg-[#111111]"
            >
              <div className="absolute inset-0 opacity-20 transition-opacity duration-500 group-hover:opacity-40" style={{ background: `linear-gradient(135deg, ${stat.color} 0%, transparent 100%)` }} />
              <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center border border-white/10 bg-black/50 backdrop-blur-md" style={{ color: stat.text }}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-4xl lg:text-5xl font-bold tracking-tighter text-white drop-shadow-md">{stat.value}</span>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50 mt-1">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </section>

        {/* Action Menu Toolbar */}
        <div className="flex gap-2 lg:gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6 lg:mx-0 lg:px-0 scroll-smooth">
          {[
            { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
            { id: 'settings', label: 'Sistema', icon: Settings },
            { id: 'banners', label: 'Banners Web', icon: ImagePlus },
            { id: 'events', label: 'Agenda', icon: Calendar },
            { id: 'photos', label: 'Galeria', icon: Camera },
            { id: 'users', label: 'Membros', icon: Users }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              className={`flex items-center gap-2 px-6 py-3.5 rounded-full text-[13px] font-bold uppercase tracking-wider transition-all whitespace-nowrap border ${
                activeMenu === item.id 
                  ? 'text-white border-[var(--theme-color)] shadow-[0_0_20px_var(--theme-color)]/30 bg-[var(--theme-color)]/20' 
                  : 'bg-black/40 border-white/5 text-white/50 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Dynamic Content Module */}
        <AnimatePresence mode="wait">
          {activeMenu === 'settings' ? (
            <motion.div key="s" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-4xl">
              <div className="bg-[#111111] border border-white/10 rounded-[2rem] p-8 lg:p-12 space-y-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--theme-color)]/10 blur-[80px] rounded-full pointer-events-none" />
                
                <h3 className="text-2xl font-serif font-bold tracking-wider uppercase">Configuração Central</h3>
                
                {/* Logo Upload Section */}
                <div className="space-y-4 relative z-10">
                  <span className="text-xs font-bold text-[var(--theme-color)] uppercase tracking-[0.2em]">Identidade Visual</span>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full max-w-xs aspect-[2/1] bg-black/40 border border-white/10 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-white/5 transition-all overflow-hidden relative shadow-inner"
                  >
                    {config.logoUrl ? (
                      <div className="relative w-full h-full p-4 flex items-center justify-center group">
                         <img src={config.logoUrl} className="max-w-full max-h-full object-contain drop-shadow-xl transition-transform group-hover:scale-105" alt="Logo preview" />
                         <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                            <span className="text-xs font-bold text-white uppercase tracking-widest">Trocar Logo</span>
                         </div>
                      </div>
                    ) : (
                      <>
                        <ImagePlus className="w-8 h-8 text-white/30" />
                        <span className="text-xs text-white/40 font-bold uppercase tracking-widest">Upload Logotipo</span>
                      </>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest px-2">Nome Institucional</label>
                     <input value={config.churchName} onChange={e => setConfig({...config, churchName: e.target.value})} placeholder="Nome da Igreja" className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm outline-none focus:border-[var(--theme-color)] transition-colors text-white" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest px-2">Chave Pix Arrecadação</label>
                     <input value={config.pixKey} onChange={e => setConfig({...config, pixKey: e.target.value})} placeholder="Email, CPF, CNPJ..." className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm outline-none focus:border-[var(--theme-color)] transition-colors text-white" />
                  </div>
                </div>

                <div className="space-y-4 relative z-10 pt-4 border-t border-white/10">
                  <span className="text-xs font-bold text-[var(--theme-color)] uppercase tracking-[0.2em]">Corpo Eclesiástico</span>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest px-2">Pastores</label>
                       <textarea value={config.pastors || ''} onChange={e => setConfig({...config, pastors: e.target.value})} placeholder="Pr. João, Pra. Maria" className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm outline-none focus:border-[var(--theme-color)] transition-colors text-white min-h-[80px] resize-none" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest px-2">Missionários</label>
                         <textarea value={config.missionaries || ''} onChange={e => setConfig({...config, missionaries: e.target.value})} placeholder="Miss. Ana" className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm outline-none focus:border-[var(--theme-color)] transition-colors text-white min-h-[80px] resize-none" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest px-2">Diáconos</label>
                         <textarea value={config.deacons || ''} onChange={e => setConfig({...config, deacons: e.target.value})} placeholder="Dc. Pedro, Dc. Paulo" className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm outline-none focus:border-[var(--theme-color)] transition-colors text-white min-h-[80px] resize-none" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={handleSaveConfig}
                  disabled={isSaving}
                  className="w-full md:w-auto px-12 h-14 bg-[var(--theme-color)] text-white shadow-[0_0_20px_var(--theme-color)]/40 rounded-2xl font-bold uppercase tracking-widest text-[12px] flex items-center justify-center gap-3 transition-transform active:scale-95 hover:bg-[var(--color-primary-focused)] relative z-10"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4"/> Sincronizar Sistema</>}
                </button>
              </div>
            </motion.div>
          ) : activeMenu === 'dashboard' ? (
            <motion.div key="d" className="bg-[#111111] border border-white/10 rounded-[2rem] p-12 lg:p-20 text-center space-y-6 flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-24 h-24 rounded-full bg-[var(--color-theme-purple)]/20 border border-[var(--color-theme-purple)]/50 flex items-center justify-center shadow-[0_0_50px_var(--color-theme-purple)]/30 backdrop-blur-xl relative">
                  <Cpu className="w-10 h-10 text-[var(--color-theme-neon)] animate-pulse relative z-10" />
                  <div className="absolute inset-0 rounded-full border border-[var(--color-theme-neon)]/50 animate-ping opacity-20"></div>
              </div>
              <h3 className="text-3xl font-serif font-bold tracking-widest uppercase">Kernel Alpha V3.1</h3>
              <p className="text-white/50 text-sm max-w-sm font-medium leading-relaxed">Todos os sistemas operando em capacidade otimizada. Banco de dados e autenticação sincronizados com sucesso.</p>
            </motion.div>
          ) : activeMenu === 'banners' ? (
            <motion.div key="b" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-6xl">
              <div className="bg-[#111111] border border-white/10 rounded-[2rem] p-8 lg:p-10 space-y-8">
                <h3 className="text-xl font-serif font-bold tracking-wider uppercase flex items-center gap-3">
                  <ImagePlus className="w-6 h-6 text-[var(--theme-color)]" />
                  Novo Banner Destaque
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                     <div 
                       onClick={() => bannerFileInputRef.current?.click()}
                       className="w-full aspect-[16/9] bg-black/40 border border-white/10 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-white/5 transition-colors overflow-hidden relative group"
                     >
                       {newItem.image ? (
                         <div className="relative w-full h-full">
                           <img src={newItem.image} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                           <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
                              <span className="text-xs font-bold text-white uppercase tracking-widest">Alterar Imagem</span>
                           </div>
                         </div>
                       ) : (
                         <>
                           <Camera className="w-8 h-8 text-white/30" />
                           <span className="text-xs text-white/40 font-bold uppercase tracking-widest">Upload 16:9 Destaque</span>
                         </>
                       )}
                     </div>
                     <input type="file" ref={bannerFileInputRef} onChange={handleBannerUpload} className="hidden" accept="image/*" />
                  </div>
                  <div className="space-y-4 flex flex-col justify-center">
                    <input value={newItem.title || ''} onChange={e => setNewItem({...newItem, title: e.target.value})} placeholder="Título Principal" className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm outline-none focus:border-[var(--theme-color)] transition-colors text-white" />
                    <input value={newItem.subtitle || ''} onChange={e => setNewItem({...newItem, subtitle: e.target.value})} placeholder="Subtítulo Descritivo" className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm outline-none focus:border-[var(--theme-color)] transition-colors text-white" />
                    <textarea value={newItem.description || ''} onChange={e => setNewItem({...newItem, description: e.target.value})} placeholder="Descrição Completa (opcional)" className="w-full min-h-[100px] bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm outline-none focus:border-[var(--theme-color)] transition-colors text-white resize-none" />
                    <button onClick={handleAddBanner} disabled={isSaving} className="w-full h-14 mt-4 bg-[var(--theme-color)] text-white shadow-[0_0_20px_var(--theme-color)]/30 rounded-2xl font-bold uppercase tracking-widest text-[12px] flex items-center justify-center gap-3 transition-transform active:scale-95 hover:bg-[var(--color-primary-focused)]">
                      {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Publicar Banner</span>}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {config.banners?.map((b: any) => (
                  <div key={b.id} className="relative bg-[#111111] border border-white/10 rounded-2xl overflow-hidden group flex aspect-[21/9]">
                    <img src={b.image} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
                    <div className="relative z-10 p-6 flex flex-col justify-end w-full">
                      <h4 className="font-serif font-bold text-lg lg:text-xl text-white tracking-wide truncate">{b.title}</h4>
                      <p className="text-xs text-white/70 font-medium truncate mt-1">{b.subtitle}</p>
                    </div>
                    <div className="absolute top-4 right-4 z-20">
                      <button onClick={() => removeBanner(b.id)} className="w-10 h-10 rounded-full flex items-center justify-center text-red-400 bg-red-400/10 hover:bg-red-400 hover:text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all border border-red-400/20">
                         <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="l" className="space-y-8 max-w-4xl">
              {(activeMenu === 'events' || activeMenu === 'photos') && (
                <div className="bg-[#111111] border border-white/10 rounded-[2rem] p-8 lg:p-10 space-y-6">
                  <h3 className="text-xl font-serif font-bold tracking-wider uppercase flex items-center gap-3">
                    <Plus className="w-6 h-6 text-[var(--theme-color)]" />
                    Adicionar Registro em {activeMenu}
                  </h3>
                  
                  {(activeMenu === 'photos' || activeMenu === 'events') && (
                    <div 
                      onClick={() => contentFileInputRef.current?.click()}
                      className="w-full aspect-[21/9] bg-black/40 border border-white/10 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-white/5 transition-colors overflow-hidden relative group"
                    >
                       {newItem.image ? (
                         <div className="relative w-full h-full">
                           <img src={newItem.image} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                         </div>
                       ) : (
                         <>
                           <ImagePlus className="w-8 h-8 text-white/30" />
                           <span className="text-xs text-white/40 font-bold uppercase tracking-widest">Upload Header Imagem</span>
                         </>
                       )}
                    </div>
                  )}
                  <input type="file" ref={contentFileInputRef} onChange={handleContentUpload} className="hidden" accept="image/*" />
                  
                  <div className="space-y-4">
                    <input value={newItem.title || ''} onChange={e => setNewItem({...newItem, title: e.target.value})} placeholder="Título descritivo" className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-6 text-sm outline-none focus:border-[var(--theme-color)] transition-colors text-white" />
                    
                    {activeMenu === 'events' && (
                      <div className="flex flex-col md:flex-row gap-4">
                         <input value={newItem.date || ''} onChange={e => setNewItem({...newItem, date: e.target.value})} placeholder="Data Ex: 12 DEZ 20:00" className="flex-1 bg-black/40 border border-white/10 rounded-xl py-4 px-6 text-sm outline-none focus:border-[var(--theme-color)] transition-colors text-white" />
                         <input value={newItem.location || ''} onChange={e => setNewItem({...newItem, location: e.target.value})} placeholder="Local Institucional" className="flex-1 bg-black/40 border border-white/10 rounded-xl py-4 px-6 text-sm outline-none focus:border-[var(--theme-color)] transition-colors text-white" />
                      </div>
                    )}
                  </div>

                  <button onClick={handleAddContent} disabled={isSaving} className="w-full lg:w-auto px-10 h-12 bg-[var(--theme-color)] text-white rounded-xl font-bold uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 active:scale-95 transition-transform hover:bg-[var(--color-primary-focused)] shadow-[0_0_20px_var(--theme-color)]/30">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Executar Inclusão</span>}
                  </button>
                </div>
              )}
              
              {activeMenu === 'users' && (
                <div className="bg-[#111111] border border-white/10 rounded-[2rem] p-8 lg:p-10 space-y-6">
                  <h3 className="text-xl font-serif font-bold tracking-wider uppercase flex items-center gap-3">
                    <Users className="w-6 h-6 text-[var(--theme-color)]" />
                    Gerenciar Acesso Administrativo
                  </h3>
                  <div className="flex flex-col md:flex-row gap-4">
                    <input 
                      value={adminEmailInput} 
                      onChange={(e) => setAdminEmailInput(e.target.value)} 
                      placeholder="E-mail do novo administrador..." 
                      className="flex-1 bg-black/40 border border-white/10 rounded-xl py-4 px-6 text-sm outline-none focus:border-[var(--theme-color)] transition-colors text-white" 
                    />
                    <button 
                      onClick={handleAddAdminByEmail}
                      disabled={!adminEmailInput}
                      className="px-10 h-12 bg-purple-600 text-white rounded-xl font-bold uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 active:scale-95 transition-transform hover:bg-purple-700 disabled:opacity-50"
                    >
                      Promover Admin
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3">
                {content.map((item) => (
                  <div key={item.id} className="bg-[#111111] border border-white/5 rounded-2xl p-4 flex items-center justify-between group hover:border-white/20 transition-colors">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                         {item.url || item.image || item.photoURL ? <img src={item.url || item.image || item.photoURL} className="w-full h-full object-cover" /> : <Database className="w-5 h-5 text-white/30" />}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-white truncate max-w-[200px] lg:max-w-[400px]">{item.title || item.name || item.email || 'Registro Anônimo'}</h4>
                        <p className="text-[10px] text-[var(--theme-color)] font-mono uppercase tracking-widest mt-0.5">{item.id.slice(0, 12)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {activeMenu === 'users' && (
                        <button onClick={() => toggleAdminStatus(item.id)} className="px-4 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase bg-purple-500/10 text-purple-400 hover:bg-purple-500 hover:text-white transition-colors border border-purple-500/20">
                          Toggle Admin
                        </button>
                      )}
                      {activeMenu !== 'users' && (
                        <button onClick={() => deleteItem(item.id)} className="w-10 h-10 rounded-full flex items-center justify-center text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
