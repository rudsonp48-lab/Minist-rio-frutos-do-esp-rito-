import { motion, AnimatePresence } from 'motion/react';
import { Settings as SettingsIcon, Bell, Shield, Eye, Database, Info, ChevronRight, Moon, Globe, Terminal, Cpu, Share2, Youtube, ShieldAlert, LayoutDashboard, ChevronLeft, LogOut, User, Lock, Heart, Paintbrush, Camera, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { auth, db, storage } from '../lib/firebase';
import { Link, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { updateProfile, signOut } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useTheme } from '../lib/ThemeContext';
import { Logo } from '../components/Logo';

const ADMIN_EMAIL = 'rudson.p48@gmail.com';

export default function SettingsPage() {
  const user = auth.currentUser;
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const { themeColor, setThemeColor } = useTheme();
  
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
    if (user) {
      setIsAdmin(user.email === ADMIN_EMAIL);
    }
    const unsubscribe = onSnapshot(doc(db, 'app_config', 'main'), (snapshot) => {
      if (snapshot.exists()) {
        setConfig(snapshot.data());
      }
    });
    return () => unsubscribe();
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
        const storageRef = ref(storage, `users/${user.uid}/profile_${Date.now()}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        await updateProfile(user, { photoURL: downloadUrl });
        // Force re-render with new photo
        window.location.reload();
      } catch (err) {
        console.error("Failed to upload profile photo", err);
        alert("Erro no upload da foto");
      } finally {
        setIsUploadingPhoto(false);
      }
    }
  };

  const menuGroups = [
    {
      title: 'Preferências',
      items: [
        { icon: Bell, label: 'Notificações', color: 'bg-[#FF3B30]', value: 'Ativo' },
        { icon: Moon, label: 'Modo Escuro', color: 'bg-[#5856D6]', value: 'Automático' },
        { icon: Globe, label: 'Idioma', color: 'bg-[#007AFF]', value: 'Português' },
      ]
    },
    {
      title: 'Segurançca & Dados',
      items: [
        { icon: Shield, label: 'Privacidade', color: 'bg-[#34C759]' },
        { icon: Lock, label: 'Senha e Segurança', color: 'bg-[#AF52DE]' },
        { icon: Database, label: 'Armazenamento', color: 'bg-[#8E8E93]' },
      ]
    },
    {
      title: 'Suporte',
      items: [
        { icon: Info, label: 'Sobre o Ecclesia', color: 'bg-[#8E8E93]' },
        { icon: Heart, label: 'Apoie o Projeto', color: 'bg-[#FF2D55]' },
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
        <header className="flex items-center gap-4 ios-card p-4">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
             {isUploadingPhoto ? (
               <div className="w-16 h-16 rounded-full ios-shadow bg-black/5 dark:bg-white/5 flex items-center justify-center">
                 <Loader2 className="w-6 h-6 animate-spin text-[#8E8E93]" />
               </div>
             ) : (
               <>
                 <img src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.email}&background=random`} className="w-16 h-16 rounded-full ios-shadow object-cover" alt="Avatar" />
                 <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                 </div>
               </>
             )}
             <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold tracking-tight">{user?.displayName || 'Membro do Reino'}</h2>
            <p className="text-sm text-[#8E8E93]">{user?.email}</p>
            <p className="text-[10px] text-[var(--theme-color)] mt-1 font-bold">Toque na foto para alterar</p>
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
          <h3 className="px-4 text-[13px] font-semibold text-[#8E8E93] uppercase tracking-tight">Personalização</h3>
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
    </div>
  );
}
