import { useState, useEffect, useRef } from 'react';
import { 
  Users, Calendar, Radio, Settings, Search, Plus, 
  Trash2, ShieldAlert, BarChart3, LayoutDashboard, 
  Bell, Database, Loader2, Camera, Save, X, 
  Zap, Globe, Cpu, CreditCard, ChevronRight, ChevronLeft, ShieldCheck, ImagePlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, storage } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, getDocs, limit, setDoc, getDoc, serverTimestamp, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';
import { Link } from 'react-router-dom';

const ADMIN_EMAIL = 'rudson.p48@gmail.com';

export default function Admin() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
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
  
  const PERMISSIONS: Record<string, string[]> = {
    PROPRIETARIO: ['dashboard', 'settings', 'prayers', 'banners', 'devotionals', 'events', 'photos', 'users', 'admins'],
    CONTRIBUTOR: ['dashboard', 'banners', 'devotionals', 'events', 'photos'],
    ORGANIZER: ['dashboard', 'prayers', 'events'],
    DEFAULT: ['dashboard']
  };

  const hasPermission = (menu: string) => {
    if (auth.currentUser?.email === ADMIN_EMAIL) return true;
    const role = userRole || 'DEFAULT';
    return PERMISSIONS[role]?.includes(menu) || PERMISSIONS['DEFAULT'].includes(menu);
  };
  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const contentFileInputRef = useRef<HTMLInputElement>(null);

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsSaving(true);
      try {
        const storageRef = ref(storage, `banners/banner_${Date.now()}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        setNewItem({ ...newItem, image: downloadUrl });
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
        const storageRef = ref(storage, `content/${activeMenu}_${Date.now()}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        setNewItem({ ...newItem, url: downloadUrl, image: downloadUrl });
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
  const [stats, setStats] = useState([
    { label: 'Membros', value: '0', icon: Users, color: '#007AFF' },
    { label: 'Fotos', value: '0', icon: Camera, color: '#AF52DE' },
    { label: 'Mídia', value: '12', icon: Radio, color: '#FF2D55' },
    { label: 'Eventos', value: '0', icon: Calendar, color: '#FF9500' },
  ]);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        if (user.email === ADMIN_EMAIL) {
          setIsAdmin(true);
          setUserRole('PROPRIETARIO');
        } else {
          try {
            const adminDoc = await getDoc(doc(db, 'admins', user.uid));
            if (adminDoc.exists()) {
              setIsAdmin(true);
              setUserRole(adminDoc.data().role);
            } else {
              setIsAdmin(false);
              setUserRole(null);
            }
          } catch (e) {
            setIsAdmin(false);
            setUserRole(null);
          }
        }
      } else {
        setIsAdmin(false);
        setUserRole(null);
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
      const q = query(collection(db, activeMenu), orderBy('createdAt', 'desc'), limit(40));
      return onSnapshot(q, (snap) => {
        setContent(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (err) => {
        console.error("Erro no listener do admin:", err);
      });
    }
  }, [isAdmin, activeMenu]);

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
      await deleteDoc(doc(db, activeMenu, id));
    } catch (err) { console.error(err); }
  };
  
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsSaving(true);
      try {
        const storageRef = ref(storage, `config/logo_${Date.now()}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        const newConfig = { ...config, logoUrl: downloadUrl };
        setConfig(newConfig);
        await setDoc(doc(db, 'app_config', 'main'), newConfig, { merge: true });
        alert("Logo atualizada com sucesso!");
      } catch (err) {
        console.error("Failed to upload logo", err);
        alert("Erro no upload da logo. Verifique sua conexão e se tem permissão.");
      } finally {
        setIsSaving(false);
      }
    }
  };

  if (loading) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="w-16 h-16 text-[#FF3B30] mb-6" />
        <h1 className="text-2xl font-bold tracking-tight mb-2">Acesso Restrito</h1>
        <p className="text-[#8E8E93] text-sm mb-8">Esta área é exclusiva para administradores.</p>
        <Link to="/" className="text-[#007AFF] font-bold">Voltar para Início</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
       {/* iOS Navigation Header */}
       <nav className="fixed top-0 left-0 right-0 z-40 ios-glass border-b border-black/[0.05] dark:border-white/[0.05] flex items-center justify-between px-6 h-16">
        <Link to="/settings" className="flex items-center gap-1 text-[#007AFF] font-medium">
          <ChevronLeft className="w-6 h-6" />
          <span>Ajustes</span>
        </Link>
        <h1 className="text-[17px] font-bold tracking-tight absolute left-1/2 -translate-x-1/2">Admin</h1>
        <div className="w-10" />
      </nav>

      <div className="pt-24 px-6 space-y-8 max-w-lg mx-auto">
        <header className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">Matrix Panel</h2>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#34C759]" />
              <span className="text-[11px] font-bold text-[#34C759] uppercase tracking-widest">Nível Alpha Ativo</span>
            </div>
          </div>
          <button className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-[#8E8E93]">
            <Bell className="w-6 h-6" />
          </button>
        </header>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 gap-4">
          {stats.map((stat, idx) => (
            <div key={idx} className="ios-card p-6 flex flex-col justify-between aspect-square">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: stat.color }}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-3xl font-bold tracking-tight text-white">{stat.value}</span>
                <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-widest mt-1">{stat.label}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Action Menu */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
          {[
            { id: 'dashboard', label: 'Início' },
            { id: 'settings', label: 'Igreja' },
            { id: 'prayers', label: 'Orações' },
            { id: 'banners', label: 'Banners' },
            { id: 'devotionals', label: 'Devocional' },
            { id: 'events', label: 'Eventos' },
            { id: 'photos', label: 'Mídia' },
            { id: 'users', label: 'Membros' },
            { id: 'admins', label: 'Equipe' }
          ].filter(item => hasPermission(item.id)).map(item => (
            <button
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                activeMenu === item.id 
                  ? 'text-white' 
                  : 'bg-black/5 dark:bg-white/5 text-[#8E8E93]'
              }`}
              style={activeMenu === item.id ? { backgroundColor: 'var(--theme-color)' } : {}}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Dynamic Content Module */}
        <AnimatePresence mode="wait">
          {activeMenu === 'settings' ? (
            <motion.div key="s" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="ios-card p-8 space-y-6">
                <h3 className="text-xl font-bold tracking-tight">Main Config</h3>
                
                {/* Logo Upload Section */}
                <div className="space-y-4">
                  <span className="text-sm font-bold text-[#8E8E93]">Logotipo do App (Upload ou URL)</span>
                  <div className="flex gap-4">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-1/3 aspect-[3/1] bg-black/5 dark:bg-white/5 border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-colors overflow-hidden relative"
                    >
                      {config.logoUrl ? (
                        <img src={config.logoUrl} className="w-full h-full object-contain p-4" alt="Logo preview" />
                      ) : (
                        <>
                          <ImagePlus className="w-6 h-6 text-[#8E8E93]" />
                          <span className="text-xs text-[#8E8E93] font-bold">Upload Logo</span>
                        </>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                       <input 
                         value={config.logoUrl || ''} 
                         onChange={e => {
                           const newConfig = {...config, logoUrl: e.target.value};
                           setConfig(newConfig);
                         }} 
                         placeholder="Ou cole a URL da imagem aqui" 
                         className="w-full bg-white dark:bg-black/20 border-black/5 dark:border-white/5 rounded-2xl py-4 px-6 text-sm outline-none" 
                       />
                    </div>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                </div>

                <div className="space-y-4">
                  <input value={config.churchName} onChange={e => setConfig({...config, churchName: e.target.value})} placeholder="Nome da Igreja" className="w-full bg-white dark:bg-black/20 border-black/5 dark:border-white/5 rounded-2xl py-4 px-6 text-sm outline-none" />
                  <input value={config.pixKey} onChange={e => setConfig({...config, pixKey: e.target.value})} placeholder="Chave PIX" className="w-full bg-white dark:bg-black/20 border-black/5 dark:border-white/5 rounded-2xl py-4 px-6 text-sm outline-none" />
                </div>
                <button 
                  onClick={handleSaveConfig}
                  disabled={isSaving}
                  className="w-full h-14 bg-[#34C759] text-white rounded-2xl font-bold flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Sincronizar Matrix</span>}
                </button>
              </div>
            </motion.div>
          ) : activeMenu === 'dashboard' ? (
            <motion.div key="d" className="ios-card p-10 text-center space-y-4">
              <Cpu className="w-12 h-12 text-[var(--theme-color)] mx-auto animate-pulse" />
              <h3 className="text-xl font-bold">Kernel v4.2 Online</h3>
              <p className="text-sm text-[#8E8E93]">Monitoramento de latência e integridade em tempo real.</p>
            </motion.div>
          ) : activeMenu === 'banners' ? (
            <motion.div key="b" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="ios-card p-6 space-y-4">
                <h3 className="font-bold text-lg">Adicionar Novo Banner</h3>
                <div className="flex gap-4 mb-4">
                  <div 
                    onClick={() => bannerFileInputRef.current?.click()}
                    className="w-1/3 aspect-[16/9] bg-black/5 dark:bg-white/5 border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-black/10 transition-colors overflow-hidden relative"
                  >
                    {newItem.image ? (
                      <img src={newItem.image} className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <ImagePlus className="w-6 h-6 text-[#8E8E93]" />
                        <span className="text-xs text-[#8E8E93] font-bold">16:9 Image</span>
                      </>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                     <input value={newItem.image || ''} onChange={e => setNewItem({...newItem, image: e.target.value})} placeholder="Ou cole a URL da Imagem" className="w-full bg-white dark:bg-black/20 border-black/5 dark:border-white/5 rounded-xl py-3 px-4 text-sm" />
                  </div>
                </div>
                <input type="file" ref={bannerFileInputRef} onChange={handleBannerUpload} className="hidden" accept="image/*" />
                <input value={newItem.title || ''} onChange={e => setNewItem({...newItem, title: e.target.value})} placeholder="Título principal" className="w-full bg-white dark:bg-black/20 border-black/5 dark:border-white/5 rounded-xl py-3 px-4 text-sm" />
                <input value={newItem.subtitle || ''} onChange={e => setNewItem({...newItem, subtitle: e.target.value})} placeholder="Subtítulo" className="w-full bg-white dark:bg-black/20 border-black/5 dark:border-white/5 rounded-xl py-3 px-4 text-sm" />
                <button onClick={handleAddBanner} disabled={isSaving} className="w-full h-12 bg-[var(--theme-color)] text-white rounded-xl font-bold flex flex-center gap-2 justify-center items-center">
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Salvar Banner</span>}
                </button>
              </div>

              <div className="space-y-4">
                {config.banners?.map((b: any) => (
                  <div key={b.id} className="ios-card p-4 flex gap-4 pr-6 items-center group">
                    <img src={b.image} className="w-20 h-20 rounded-xl object-cover" />
                    <div className="flex-1">
                      <h4 className="font-bold text-sm">{b.title}</h4>
                      <p className="text-xs text-[#8E8E93]">{b.subtitle}</p>
                    </div>
                    <button onClick={() => removeBanner(b.id)} className="w-10 h-10 rounded-full flex items-center justify-center text-[#FF3B30] bg-[#FF3B30]/10 opacity-0 group-hover:opacity-100 transition-opacity">
                       <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="l" className="space-y-6">
                  {activeMenu === 'admins' ? (
                    <div className="space-y-6">
                      <div className="ios-card p-6 space-y-4">
                        <h3 className="font-bold text-lg">Adicionar Admin</h3>
                        <p className="text-xs text-[#8E8E93] leading-relaxed">
                          O usuário deve ter uma conta no aplicativo antes de ser promovido.
                        </p>
                        <div className="space-y-3">
                          <input 
                            value={newItem.email || ''} 
                            onChange={e => setNewItem({...newItem, email: e.target.value})} 
                            placeholder="E-mail do novo admin" 
                            className="w-full bg-white dark:bg-black/20 rounded-xl py-3 px-4 text-sm" 
                          />
                          <select 
                            value={newItem.role || 'CONTRIBUTOR'} 
                            onChange={e => setNewItem({...newItem, role: e.target.value})}
                            className="w-full bg-white dark:bg-black/20 rounded-xl py-3 px-4 text-sm"
                          >
                            <option value="CONTRIBUTOR">CONTRIBUTOR (Mídia/Banners)</option>
                            <option value="ORGANIZER">ORGANIZER (Orações/Eventos)</option>
                            <option value="PROPRIETARIO">PROPRIETARIO (Acesso Total)</option>
                          </select>
                          <button 
                            onClick={async () => {
                              if (!newItem.email) return;
                              setIsSaving(true);
                              try {
                                const q = query(collection(db, 'users'), where('email', '==', newItem.email.toLowerCase()));
                                const snap = await getDocs(q);
                                if (snap.empty) {
                                  alert("Usuário não encontrado. Peça para ele baixar o app e entrar primeiro.");
                                } else {
                                  const userDoc = snap.docs[0];
                                  await setDoc(doc(db, 'admins', userDoc.id), {
                                    email: userDoc.data().email,
                                    role: newItem.role || 'CONTRIBUTOR',
                                    displayName: userDoc.data().displayName || 'Membro',
                                    uid: userDoc.id,
                                    promotedAt: serverTimestamp(),
                                    createdAt: serverTimestamp() // Added for query consistency
                                  });
                                  alert("Novo administrador cadastrado!");
                                  setNewItem({});
                                }
                              } catch (e) {
                                console.error(e);
                                alert("Erro ao processar solicitação.");
                              } finally {
                                setIsSaving(false);
                              }
                            }}
                            disabled={isSaving}
                            className="w-full h-12 bg-[var(--theme-color)] text-white rounded-xl font-bold flex items-center justify-center gap-2"
                          >
                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Confirmar Promoção</span>}
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        {content.map((item) => (
                          <div key={item.id} className="ios-card p-4 flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
                                <ShieldCheck className="w-5 h-5 text-[var(--theme-color)]" />
                              </div>
                              <div>
                                <h4 className="font-bold text-sm truncate max-w-[200px]">{item.displayName || item.email}</h4>
                                <p className="text-[10px] text-[#34C759] font-bold uppercase tracking-widest">{item.role}</p>
                              </div>
                            </div>
                            <button onClick={() => deleteItem(item.id)} className="w-10 h-10 rounded-full bg-[#FF3B30]/10 flex items-center justify-center text-[#FF3B30] opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (activeMenu === 'events' || activeMenu === 'photos' || activeMenu === 'devotionals') && (
                <div className="ios-card p-6 space-y-4">
                  <h3 className="font-bold text-lg">Adicionar {activeMenu === 'events' ? 'Evento/Aviso' : (activeMenu === 'devotionals' ? 'Devocional' : 'Mídia')}</h3>
                  {(activeMenu === 'photos' || activeMenu === 'events' || activeMenu === 'devotionals') && (
                    <div className="flex gap-4">
                      <div 
                        onClick={() => contentFileInputRef.current?.click()}
                        className="w-1/3 aspect-square bg-black/5 dark:bg-white/5 border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer relative overflow-hidden"
                      >
                         {newItem.image || newItem.thumbnail ? (
                           <img src={newItem.image || newItem.thumbnail} className="w-full h-full object-cover" />
                         ) : (
                           <span className="text-xs text-[#8E8E93] font-bold text-center px-2">Upload Imagem</span>
                         )}
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                         <input value={newItem.image || newItem.thumbnail || ''} onChange={e => setNewItem({...newItem, image: e.target.value, thumbnail: e.target.value})} placeholder="Ou cole a URL da Imagem" className="w-full bg-white dark:bg-black/20 rounded-xl py-3 px-4 text-sm" />
                      </div>
                    </div>
                  )}
                  <input type="file" ref={contentFileInputRef} onChange={handleContentUpload} className="hidden" accept="image/*" />
                  <input value={newItem.title || ''} onChange={e => setNewItem({...newItem, title: e.target.value})} placeholder="Título" className="w-full bg-white dark:bg-black/20 rounded-xl py-3 px-4 text-sm" />
                  
                  {activeMenu === 'devotionals' && (
                    <textarea 
                      value={newItem.content || ''} 
                      onChange={e => setNewItem({...newItem, content: e.target.value})} 
                      placeholder="Conteúdo do devocional..." 
                      className="w-full bg-white dark:bg-black/20 rounded-xl py-3 px-4 text-sm min-h-32"
                    />
                  )}

                  {activeMenu === 'events' && (
                    <div className="flex gap-2">
                       <input value={newItem.date || ''} onChange={e => setNewItem({...newItem, date: e.target.value})} placeholder="Data Ex: 12 DEZ 20:00" className="flex-1 bg-white dark:bg-black/20 rounded-xl py-3 px-4 text-sm" />
                       <input value={newItem.location || ''} onChange={e => setNewItem({...newItem, location: e.target.value})} placeholder="Local/Endereço" className="flex-1 bg-white dark:bg-black/20 rounded-xl py-3 px-4 text-sm" />
                    </div>
                  )}

                  {activeMenu === 'devotionals' && (
                    <input 
                      type="date" 
                      value={newItem.date || ''} 
                      onChange={e => setNewItem({...newItem, date: e.target.value})} 
                      className="w-full bg-white dark:bg-black/20 rounded-xl py-3 px-4 text-sm"
                    />
                  )}

                  <button onClick={handleAddContent} disabled={isSaving} className="w-full h-12 bg-[var(--theme-color)] text-white rounded-xl font-bold flex flex-center gap-2 justify-center items-center">
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Adicionar</span>}
                  </button>
                </div>
              )}

              <div className="space-y-4">
                {content.map((item) => (
                  <div key={item.id} className="ios-card p-4 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center overflow-hidden">
                         {item.url || item.image ? <img src={item.url || item.image} className="w-full h-full object-cover" /> : <Database className="w-5 h-5 text-[#8E8E93]" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm truncate max-w-[200px]">{item.title || item.name || item.request || item.email || item.displayName || 'Registro'}</h4>
                        <p className="text-[10px] text-[#8E8E93] font-bold uppercase tracking-widest">
                          {item.id.slice(0, 8)} {activeMenu === 'prayers' && '• ORAÇÃO'}
                          {activeMenu === 'admins' && `• ${item.role?.toUpperCase() || 'MODERADOR'}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {activeMenu === 'users' && !item.isAdmin && (
                        <button 
                          onClick={async () => {
                            const role = prompt("Defina o nível (PROPRIETARIO, CONTRIBUTOR, ORGANIZER):", "CONTRIBUTOR");
                            if (role) {
                              await setDoc(doc(db, 'admins', item.id), {
                                email: item.email,
                                uid: item.id,
                                role: role.toUpperCase(),
                                promotedAt: serverTimestamp(),
                                createdAt: serverTimestamp() // Added for query consistency
                              });
                              alert("Membro promovido a administrador!");
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#34C759]/10 text-[#34C759] text-[10px] font-bold uppercase tracking-wider"
                        >
                          Promover
                        </button>
                      )}
                      <button onClick={() => deleteItem(item.id)} className="w-10 h-10 rounded-full bg-[#FF3B30]/10 flex items-center justify-center text-[#FF3B30] opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-5 h-5" />
                      </button>
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
