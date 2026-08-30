import { motion, AnimatePresence } from 'motion/react';
import { Settings as SettingsIcon, Bell, Shield, Eye, Database, Info, ChevronRight, Moon, Globe, Terminal, Cpu, Share2, Youtube, ShieldAlert, LayoutDashboard, ChevronLeft, LogOut, User, Lock, Heart, Paintbrush, Camera, Loader2, Users, Edit3, Sparkles } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { auth, db } from '../lib/firebase';
import { Link, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { compressAvatar } from '../lib/imageUtils';
import { saveUserProfile, subscribeToUserProfile, UserProfileData } from '../services/userService';
import { useTheme } from '../lib/ThemeContext';
import { Logo } from '../components/Logo';
import EditProfileModal from '../components/EditProfileModal';
import { playNotificationChime, requestBrowserNotificationPermission, triggerBrowserNotification } from '../services/notificationService';

const ADMIN_EMAIL = 'rudson.p48@gmail.com';

export default function SettingsPage() {
  const user = auth.currentUser;
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const { themeColor, setThemeColor } = useTheme();
  
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const THEME_COLORS = [
    { name: 'Azul iOS', value: '#007AFF' },
    { name: 'Ouro Real', value: '#C4D600' },
    { name: 'Esmeralda', value: '#34C759' },
    { name: 'Púrpura', value: '#AF52DE' },
    { name: 'Rubi', value: '#FF2D55' },
    { name: 'Âmbar', value: '#FF9500' }
  ];

  useEffect(() => {
    if (!user) return;
    setIsAdmin(user.email === ADMIN_EMAIL);

    const unsubProfile = subscribeToUserProfile(user.uid, (data) => {
      if (data) {
        setProfileData(data);
      }
    });

    const unsubscribe = onSnapshot(doc(db, 'app_config', 'main'), (snapshot) => {
      if (snapshot.exists()) {
        setConfig(snapshot.data());
      }
    });

    return () => {
      unsubProfile();
      unsubscribe();
    };
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && user) {
      const file = e.target.files[0];
      setIsUploadingPhoto(true);
      try {
        const compressedBase64 = await compressAvatar(file, 320, 0.8);
        await saveUserProfile({
          displayName: profileData?.displayName || user.displayName || user.email?.split('@')[0] || 'Irmão em Cristo',
          photoURL: compressedBase64
        });
        setProfileData(prev => ({
          ...(prev || {
            uid: user.uid,
            name: user.displayName || '',
            displayName: user.displayName || '',
            email: user.email || ''
          }),
          photoURL: compressedBase64,
          avatarUrl: compressedBase64
        }));
      } catch (err) {
        console.error("Failed to upload profile photo", err);
        alert("Erro no upload da foto. Tente novamente.");
      } finally {
        setIsUploadingPhoto(false);
      }
    }
  };

  const currentDisplayName = profileData?.displayName || profileData?.name || user?.displayName || 'Membro do Reino';
  const currentPhotoURL = profileData?.photoURL || profileData?.avatarUrl || user?.photoURL || '';
  const currentMinistry = profileData?.ministryRole || 'Membro da Congregação';

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState('auto');
  const [showLeadership, setShowLeadership] = useState(false);
  const [isEditingLeadership, setIsEditingLeadership] = useState(false);
  const [editLeadershipState, setEditLeadershipState] = useState({ pastors: '', missionaries: '', deacons: '' });

  const [showBankData, setShowBankData] = useState(false);
  const [isEditingBankData, setIsEditingBankData] = useState(false);
  const [editBankDataState, setEditBankDataState] = useState({ pixKey: '', bankDetails: '', cardUrl: '' });

  const handleEditLeadershipClick = () => {
    setIsEditingLeadership(!isEditingLeadership);
    setEditLeadershipState({
       pastors: config?.pastors || '',
       missionaries: config?.missionaries || '',
       deacons: config?.deacons || ''
    });
  };

  const handleSaveLeadership = async () => {
    try {
      await setDoc(doc(db, 'app_config', 'main'), { ...config, ...editLeadershipState }, { merge: true });
      setIsEditingLeadership(false);
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar o corpo eclesiástico.");
    }
  };

  const handleEditBankDataClick = () => {
    setIsEditingBankData(!isEditingBankData);
    setEditBankDataState({
       pixKey: config?.pixKey || '',
       bankDetails: config?.bankDetails || '',
       cardUrl: config?.cardUrl || ''
    });
  };

  const handleSaveBankData = async () => {
    try {
      await setDoc(doc(db, 'app_config', 'main'), { ...config, ...editBankDataState }, { merge: true });
      setIsEditingBankData(false);
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar dados bancários.");
    }
  };

  const handleSettingClick = (actionName: string) => {
    switch (actionName) {
      case 'edit_profile':
        setIsEditProfileOpen(true);
        break;
      case 'notifications': {
        const nextState = !notificationsEnabled;
        setNotificationsEnabled(nextState);
        if (nextState) {
          requestBrowserNotificationPermission().then((granted) => {
            playNotificationChime();
            triggerBrowserNotification('Notificações Ativadas 🕊️', {
              body: 'Você receberá alertas no topo do dispositivo e sons celestiais ao receber mensagens!'
            });
          });
        }
        break;
      }
      case 'darkmode':
        setDarkMode(prev => ({'auto': 'dark', 'dark': 'light', 'light': 'auto'}[prev] || 'auto'));
        break;
      case 'leadership':
        setShowLeadership(true);
        break;
      case 'bankData':
        if (isAdmin) setShowBankData(true);
        break;
      case 'language':
      case 'privacy':
      case 'security':
      case 'storage':
        alert(`Configuração de ${actionName} em desenvolvimento.`);
        break;
      case 'about':
        alert("Ecclesia App - Gestão e Comunhão.\nVersão 3.5.0");
        break;
      case 'support':
        alert("Obrigado pelo seu apoio!");
        break;
      default:
        break;
    }
  };

  const menuGroups = [
    {
      title: 'Minha Conta & Perfil',
      items: [
        { icon: User, label: 'Editar Nome & Foto de Perfil', color: 'bg-[var(--theme-color)]', value: 'Alterar', action: 'edit_profile' },
      ]
    },
    {
      title: 'Preferências',
      items: [
        { icon: Bell, label: 'Notificações', color: 'bg-[#FF3B30]', value: notificationsEnabled ? 'Ativo' : 'Inativo', action: 'notifications' },
        { icon: Moon, label: 'Modo Escuro', color: 'bg-[#5856D6]', value: darkMode === 'auto' ? 'Automático' : darkMode === 'dark' ? 'Ativo' : 'Inativo', action: 'darkmode' },
        { icon: Globe, label: 'Idioma', color: 'bg-[#007AFF]', value: 'Português', action: 'language' },
      ]
    },
    {
      title: 'Segurança & Dados',
      items: [
        { icon: Shield, label: 'Privacidade', color: 'bg-[#34C759]', action: 'privacy' },
        { icon: Lock, label: 'Senha e Segurança', color: 'bg-[#AF52DE]', action: 'security' },
        { icon: Database, label: 'Armazenamento', color: 'bg-[#8E8E93]', action: 'storage' },
      ]
    },
    {
      title: 'Administrativo',
      items: [
        { icon: Users, label: 'Corpo Eclesiástico', color: 'bg-[#FF9500]', action: 'leadership' },
        ...(isAdmin ? [{ icon: Database, label: 'Dados Bancários', color: 'bg-[#34C759]', action: 'bankData' }] : []),
      ]
    },
    {
      title: 'Suporte & Comunidade',
      items: [
        { icon: Info, label: 'Sobre o Ecclesia', color: 'bg-[#8E8E93]', action: 'about' },
        { icon: Heart, label: 'Apoie o Projeto', color: 'bg-[#FF2D55]', action: 'support' },
      ]
    }
  ];

  return (
    <div className="min-h-screen pb-32">
       {/* iOS Navigation Header */}
       <nav className="fixed top-0 left-0 right-0 z-40 ios-glass border-b border-black/[0.05] dark:border-white/[0.05] flex items-center justify-between px-6 h-16">
        <Link to="/" className="flex items-center gap-1 text-[#007AFF] font-medium transition-opacity active:opacity-50">
          <ChevronLeft className="w-6 h-6" />
          <span>Ecclesia</span>
        </Link>
        <h1 className="text-[17px] font-bold tracking-tight absolute left-1/2 -translate-x-1/2">Ajustes</h1>
        <div className="w-10" />
      </nav>

      <div className="pt-24 px-6 space-y-8 max-w-lg mx-auto">
        <header 
          onClick={() => setIsEditProfileOpen(true)}
          className="flex items-center gap-4 ios-card p-4 cursor-pointer hover:opacity-95 transition-opacity"
        >
          <div className="relative group" onClick={(e) => { e.stopPropagation(); setIsEditProfileOpen(true); }}>
             {isUploadingPhoto ? (
               <div className="w-16 h-16 rounded-full ios-shadow bg-black/5 dark:bg-white/5 flex items-center justify-center">
                 <Loader2 className="w-6 h-6 animate-spin text-[#8E8E93]" />
               </div>
             ) : (
               <>
                 <img 
                   src={currentPhotoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentDisplayName)}&background=8A2BE2&color=fff`} 
                   className="w-16 h-16 rounded-full ios-shadow object-cover border-2 border-[var(--theme-color)]" 
                   alt="Avatar" 
                 />
                 <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                 </div>
               </>
             )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">{currentDisplayName}</h2>
              <Edit3 className="w-4 h-4 text-[var(--theme-color)]" />
            </div>
            <p className="text-sm text-[#8E8E93]">{user?.email}</p>
            <p className="text-[10px] text-[var(--theme-color)] mt-0.5 font-bold">{currentMinistry} • Toque para editar</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#C7C7CC]" />
        </header>

        {isAdmin && (
          <Link to="/admin" className="block ios-card p-4 bg-[#FF3B30]/5 border-[#FF3B30]/20 group active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#FF3B30] flex items-center justify-center text-white">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-[#FF3B30]">Painel de Controle</h3>
                <p className="text-xs text-[#FF3B30]/60 uppercase font-bold tracking-widest mt-0.5 whitespace-nowrap overflow-hidden">Gestão Global Delta</p>
              </div>
              <ChevronRight className="w-5 h-5 text-[#FF3B30]/40" />
            </div>
          </Link>
        )}

        <div className="space-y-2">
          <h3 className="px-4 text-[13px] font-semibold text-[#8E8E93] uppercase tracking-tight">Personalização de Tema</h3>
          <div className="grid grid-cols-3 gap-2 ios-card p-4">
            {THEME_COLORS.map(color => (
              <button
                key={color.value}
                onClick={() => setThemeColor(color.value)}
                className={`flex flex-col items-center justify-center py-4 rounded-[1rem] border-2 transition-all ${
                  themeColor === color.value 
                    ? `border-[${color.value}] bg-black/5 dark:bg-white/10` 
                    : 'border-transparent bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10'
                }`}
                style={{ borderColor: themeColor === color.value ? color.value : 'transparent' }}
              >
                <div className="w-8 h-8 rounded-full mb-2 shadow-inner drop-shadow-md" style={{ backgroundColor: color.value }} />
                <span className="text-[10px] font-bold tracking-tight text-center truncate w-full px-1">{color.name}</span>
              </button>
            ))}
          </div>
        </div>

        {menuGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-2">
            <h3 className="px-4 text-[13px] font-semibold text-[#8E8E93] uppercase tracking-tight">{group.title}</h3>
            <div className="ios-card overflow-hidden divide-y divide-black/[0.05] dark:divide-white/[0.05]">
              {group.items.map((item, iIdx) => (
                <button
                  key={iIdx}
                  onClick={() => handleSettingClick(item.action)}
                  className="w-full flex items-center gap-4 p-4 active:bg-black/5 dark:active:bg-white/5 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center text-white`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="flex-1 text-left font-medium">{item.label}</span>
                  {item.value && <span className="text-[#8E8E93] text-sm pr-1">{item.value}</span>}
                  <ChevronRight className="w-4 h-4 text-[#C7C7CC]" />
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="ios-card overflow-hidden">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-4 text-[#FF3B30] font-bold active:bg-black/5 dark:active:bg-white/5 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sair do Ecclesia
          </button>
        </div>

        <footer className="text-center pt-8 space-y-2">
          <p className="text-[#8E8E93] text-[12px] font-medium leading-relaxed">
            Ecclesia Digital v3.5.0<br />
            © 2026 Arquitetura Quantum
          </p>
        </footer>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        initialData={{
          displayName: profileData?.displayName || user?.displayName || '',
          photoURL: profileData?.photoURL || user?.photoURL || '',
          bio: profileData?.bio || '',
          ministryRole: profileData?.ministryRole || 'Membro da Congregação',
          phoneNumber: profileData?.phoneNumber || '',
          favoriteVerse: profileData?.favoriteVerse || '',
          email: user?.email || ''
        }}
        onProfileUpdated={(updated) => {
          setProfileData(prev => ({
            ...(prev || {
              uid: user?.uid || '',
              name: '',
              displayName: '',
              email: user?.email || ''
            }),
            ...updated
          }));
        }}
      />

      <AnimatePresence>
        {showLeadership && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-sm bg-white dark:bg-[#1C1C1E] rounded-3xl overflow-hidden shadow-2xl relative"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold font-serif text-black dark:text-white">Corpo Eclesiástico</h3>
                  <div className="flex items-center gap-2">
                    {isAdmin && (
                        <button 
                          onClick={isEditingLeadership ? handleSaveLeadership : handleEditLeadershipClick}
                          className="px-3 py-1.5 rounded-full bg-[var(--theme-color)] text-white text-xs font-bold uppercase tracking-widest hover:bg-[var(--color-primary-focused)] transition-colors"
                        >
                          {isEditingLeadership ? 'Salvar' : 'Editar'}
                        </button>
                    )}
                    <button onClick={() => setShowLeadership(false)} className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
                      <ChevronLeft className="w-5 h-5 text-black/60 dark:text-white/60 -rotate-90" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-6 max-h-[60vh] overflow-y-auto scrollbar-hide">
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-[var(--theme-color)] uppercase tracking-widest">Pastores</h4>
                    {isEditingLeadership ? (
                        <textarea 
                          value={editLeadershipState.pastors} 
                          onChange={e => setEditLeadershipState({...editLeadershipState, pastors: e.target.value})}
                          placeholder="Nomes divididos por linha ou vírgula"
                          className="w-full bg-black/5 dark:bg-white/5 border-none rounded-xl p-3 text-sm text-black dark:text-white min-h-[80px] focus:ring-1 focus:ring-[var(--theme-color)]"
                        />
                    ) : (
                        <p className="text-sm font-medium text-black/80 dark:text-white/80 whitespace-pre-wrap">
                          {config?.pastors || 'Não informado.'}
                        </p>
                    )}
                  </div>
                  
                  <div className="h-px w-full bg-black/5 dark:bg-white/5" />
                  
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-[#FF9500] uppercase tracking-widest">Missionários</h4>
                    {isEditingLeadership ? (
                        <textarea 
                          value={editLeadershipState.missionaries} 
                          onChange={e => setEditLeadershipState({...editLeadershipState, missionaries: e.target.value})}
                          placeholder="Nomes divididos por linha ou vírgula"
                          className="w-full bg-black/5 dark:bg-white/5 border-none rounded-xl p-3 text-sm text-black dark:text-white min-h-[80px] focus:ring-1 focus:ring-[#FF9500]"
                        />
                    ) : (
                        <p className="text-sm font-medium text-black/80 dark:text-white/80 whitespace-pre-wrap">
                          {config?.missionaries || 'Não informado.'}
                        </p>
                    )}
                  </div>
                  
                  <div className="h-px w-full bg-black/5 dark:bg-white/5" />
                  
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-[#34C759] uppercase tracking-widest">Diáconos</h4>
                    {isEditingLeadership ? (
                        <textarea 
                          value={editLeadershipState.deacons} 
                          onChange={e => setEditLeadershipState({...editLeadershipState, deacons: e.target.value})}
                          placeholder="Nomes divididos por linha ou vírgula"
                          className="w-full bg-black/5 dark:bg-white/5 border-none rounded-xl p-3 text-sm text-black dark:text-white min-h-[80px] focus:ring-1 focus:ring-[#34C759]"
                        />
                    ) : (
                        <p className="text-sm font-medium text-black/80 dark:text-white/80 whitespace-pre-wrap">
                          {config?.deacons || 'Não informado.'}
                        </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBankData && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-sm bg-white dark:bg-[#1C1C1E] rounded-3xl overflow-hidden shadow-2xl relative"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold font-serif text-black dark:text-white">Dados Bancários</h3>
                  <div className="flex items-center gap-2">
                    {isAdmin && (
                        <button 
                          onClick={isEditingBankData ? handleSaveBankData : handleEditBankDataClick}
                          className="px-3 py-1.5 rounded-full bg-[var(--theme-color)] text-white text-xs font-bold uppercase tracking-widest hover:bg-[var(--color-primary-focused)] transition-colors"
                        >
                          {isEditingBankData ? 'Salvar' : 'Editar'}
                        </button>
                    )}
                    <button onClick={() => setShowBankData(false)} className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
                      <ChevronLeft className="w-5 h-5 text-black/60 dark:text-white/60 -rotate-90" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-6 max-h-[60vh] overflow-y-auto scrollbar-hide">
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-[#34C759] uppercase tracking-widest">Chave PIX</h4>
                    {isEditingBankData ? (
                        <input 
                          type="text"
                          value={editBankDataState.pixKey} 
                          onChange={e => setEditBankDataState({...editBankDataState, pixKey: e.target.value})}
                          placeholder="e.g. 00.000.000/0001-00"
                          className="w-full bg-black/5 dark:bg-white/5 border-none rounded-xl p-3 text-sm text-black dark:text-white focus:ring-1 focus:ring-[#34C759]"
                        />
                    ) : (
                        <p className="text-sm font-medium text-black/80 dark:text-white/80 whitespace-pre-wrap font-mono">
                          {config?.pixKey || 'Não configurada.'}
                        </p>
                    )}
                  </div>
                  
                  <div className="h-px w-full bg-black/5 dark:bg-white/5" />
                  
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-[#FF9500] uppercase tracking-widest">Dados Bancários</h4>
                    {isEditingBankData ? (
                        <textarea 
                          value={editBankDataState.bankDetails} 
                          onChange={e => setEditBankDataState({...editBankDataState, bankDetails: e.target.value})}
                          placeholder="Agência: 0001&#10;Conta: 123456-7&#10;Banco..."
                          className="w-full bg-black/5 dark:bg-white/5 border-none rounded-xl p-3 text-sm text-black dark:text-white min-h-[100px] focus:ring-1 focus:ring-[#FF9500]"
                        />
                    ) : (
                        <p className="text-sm font-medium text-black/80 dark:text-white/80 whitespace-pre-wrap font-mono">
                          {config?.bankDetails || 'Não configurados.'}
                        </p>
                    )}
                  </div>

                  <div className="h-px w-full bg-black/5 dark:bg-white/5" />
                  
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-[#007AFF] uppercase tracking-widest">Link de Pagamento (Cartão)</h4>
                    {isEditingBankData ? (
                        <input 
                          type="url"
                          value={editBankDataState.cardUrl} 
                          onChange={e => setEditBankDataState({...editBankDataState, cardUrl: e.target.value})}
                          placeholder="https://..."
                          className="w-full bg-black/5 dark:bg-white/5 border-none rounded-xl p-3 text-sm text-black dark:text-white focus:ring-1 focus:ring-[#007AFF]"
                        />
                    ) : (
                        <p className="text-sm font-medium text-black/80 dark:text-white/80 whitespace-pre-wrap font-mono truncate">
                          {config?.cardUrl || 'Não configurado.'}
                        </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
