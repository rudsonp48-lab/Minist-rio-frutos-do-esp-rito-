import { motion, AnimatePresence } from 'motion/react';
import { Settings as SettingsIcon, Bell, Shield, Eye, Database, Info, ChevronRight, Moon, Globe, Terminal, Cpu, Share2, Youtube, ShieldAlert, LayoutDashboard, ChevronLeft, LogOut, User, Lock, Heart, Paintbrush, Camera, Loader2, Users, Edit3, Sparkles, Download, Smartphone, CheckCircle2, Timer, AlertCircle, X, BellRing } from 'lucide-react';
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
import { playNotificationChime, requestBrowserNotificationPermission, triggerBrowserNotification, testLockScreenNotification, subscribeToPushService } from '../services/notificationService';

const ADMIN_EMAIL = 'rudson.p48@gmail.com';

export default function SettingsPage() {
  const user = auth.currentUser;
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const { themeColor, setThemeColor, churchName } = useTheme();
  
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
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [isTestingLockScreen, setIsTestingLockScreen] = useState(false);
  const [testCountdown, setTestCountdown] = useState(5);
  const [testStatusMsg, setTestStatusMsg] = useState<string | null>(null);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [darkMode, setDarkMode] = useState('auto');
  const [showLeadership, setShowLeadership] = useState(false);
  const [isEditingLeadership, setIsEditingLeadership] = useState(false);
  const [editLeadershipState, setEditLeadershipState] = useState({ pastors: '', missionaries: '', deacons: '' });

  const [showBankData, setShowBankData] = useState(false);
  const [isEditingBankData, setIsEditingBankData] = useState(false);
  const [editBankDataState, setEditBankDataState] = useState({ pixKey: '', bankDetails: '', cardUrl: '' });

  const handleStartLockScreenTest = async () => {
    setIsTestingLockScreen(true);
    setTestCountdown(5);
    setTestStatusMsg(null);

    const res = await testLockScreenNotification(5);

    let count = 5;
    const interval = setInterval(() => {
      count -= 1;
      setTestCountdown(count);
      if (count <= 0) {
        clearInterval(interval);
        setIsTestingLockScreen(false);
        setTestStatusMsg(res.message || 'Notificação disparada! Verifique a tela de bloqueio do celular.');
      }
    }, 1000);
  };

  const handleToggleNotifications = async () => {
    const granted = await requestBrowserNotificationPermission(user?.uid);
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setBrowserPermission(Notification.permission);
    }
    setNotificationsEnabled(granted);
    if (granted) {
      playNotificationChime();
      triggerBrowserNotification('Notificações Ativadas 🕊️', {
        body: 'Alertas de mensagens e chamadas ativados no dispositivo!'
      });
    }
  };

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
        setShowNotificationModal(true);
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
      case 'install_app':
        localStorage.removeItem('church_app_install_dismissed');
        window.location.reload();
        break;
      case 'about':
        alert(`${churchName || 'Ministério Frutos do Espírito'} - Gestão e Comunhão.\nVersão 3.5.0`);
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
      title: 'Aplicativo & Atalho',
      items: [
        { icon: Download, label: 'Baixar Aplicativo no Celular', color: 'bg-gradient-to-r from-purple-600 to-emerald-500', value: 'Instalar', action: 'install_app' },
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
        { icon: Info, label: `Sobre o ${churchName || 'Ministério Frutos do Espírito'}`, color: 'bg-[#8E8E93]', action: 'about' },
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
          <span className="truncate max-w-[150px]">{churchName || 'Início'}</span>
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
            Sair da Conta
          </button>
        </div>

        <footer className="text-center pt-8 space-y-2">
          <p className="text-[#8E8E93] text-[12px] font-medium leading-relaxed">
            {churchName || 'Ministério Frutos do Espírito'} v3.5.0<br />
            © 2026 Comunidade & Fé
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

        {/* Notification & Lock Screen Push Modal */}
        {showNotificationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowNotificationModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white dark:bg-[#16161e] border border-black/10 dark:border-white/10 rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl relative overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Ambient glow */}
              <div className="absolute -top-16 -right-16 w-36 h-36 bg-[var(--theme-color)]/20 rounded-full blur-3xl pointer-events-none" />

              {/* Close Button */}
              <button
                onClick={() => setShowNotificationModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-black/60 dark:text-white/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-[var(--theme-color)]/15 border border-[var(--theme-color)]/30 flex items-center justify-center text-[var(--theme-color)]">
                  <BellRing className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-black dark:text-white">
                    Notificações & Tela Bloqueada
                  </h3>
                  <p className="text-xs text-black/60 dark:text-white/60">
                    Alertas no celular com app fechado e tela desligada
                  </p>
                </div>
              </div>

              {/* Current Status Card */}
              <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 mb-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-black/70 dark:text-white/70 font-medium">Permissão do Sistema:</span>
                  <span className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                    browserPermission === 'granted'
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                  }`}>
                    {browserPermission === 'granted' ? 'Autorizado' : 'Aguardando Permissão'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-black/70 dark:text-white/70 font-medium">Web Push (Tela Bloqueada):</span>
                  <span className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                    browserPermission === 'granted'
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                  }`}>
                    {browserPermission === 'granted' ? 'Ativo & Inscrito' : 'Inativo'}
                  </span>
                </div>
              </div>

              {/* Primary Action Button */}
              <button
                onClick={handleToggleNotifications}
                className="w-full py-3 px-4 rounded-xl bg-[var(--theme-color)] hover:brightness-110 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[var(--theme-color)]/25 mb-4 active:scale-95 transition-all"
              >
                <Bell className="w-4 h-4" />
                <span>{browserPermission === 'granted' ? 'Reconectar / Atualizar Notificações' : 'Ativar Notificações no Dispositivo'}</span>
              </button>

              {/* Lock-Screen Test Section */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-blue-500/10 border border-purple-500/20 mb-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <Timer className="w-4 h-4 text-purple-400" />
                  <h4 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">
                    Teste com Tela Bloqueada (5s)
                  </h4>
                </div>
                <p className="text-xs text-black/70 dark:text-white/70 mb-3 leading-relaxed">
                  Ao iniciar o teste, você terá 5 segundos para apertar o botão power e desligar a tela do seu celular. O servidor enviará um alerta de alta prioridade.
                </p>

                {isTestingLockScreen ? (
                  <div className="py-3 px-4 rounded-xl bg-purple-600 text-white text-center shadow-lg">
                    <div className="text-2xl font-black mb-1">{testCountdown}s</div>
                    <p className="text-xs font-bold">🔒 BLOQUEIE A TELA DO SEU CELULAR AGORA!</p>
                    <p className="text-[11px] opacity-80 mt-0.5">Desligue o visor no botão lateral do celular</p>
                  </div>
                ) : (
                  <button
                    onClick={handleStartLockScreenTest}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Iniciar Teste na Tela Bloqueada (5s)</span>
                  </button>
                )}

                {testStatusMsg && (
                  <div className="mt-2.5 p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{testStatusMsg}</span>
                  </div>
                )}
              </div>

              {/* Mobile Device Tips */}
              <div className="text-[11px] text-black/50 dark:text-white/50 space-y-1.5 leading-normal">
                <p>
                  • <strong>Android:</strong> Se a notificação não despertar a tela, desative a economia de bateria para o navegador nas configurações do sistema.
                </p>
                <p>
                  • <strong>iPhone (iOS):</strong> Para notificações com tela bloqueada, instale o app pela opção "Adicionar à Tela de Início" no Safari.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
