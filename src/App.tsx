import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ThemeProvider } from './lib/ThemeContext';

// Pages
import Home from './pages/Home';
import Bible from './pages/Bible';
import Media from './pages/Media';
import Events from './pages/Events';
import Gallery from './pages/Gallery';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Notes from './pages/Notes';
import Prayers from './pages/Prayers';
import Podcast from './pages/Podcast';
import Volunteer from './pages/Volunteer';
import SettingsPage from './pages/Settings';

// Components
import Sidebar from './components/layout/Sidebar';
import BottomNav from './components/layout/BottomNav';
import { User as UserIcon, Church } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation, Link } from 'react-router-dom';
import { useTheme } from './lib/ThemeContext';
import { PlayerProvider } from './lib/PlayerContext';
import GlobalPlayer from './components/GlobalPlayer';

function SplashScreen() {
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] max-w-[600px] aspect-square bg-[var(--theme-color)]/20 blur-[120px] rounded-full animate-pulse pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="w-24 h-24 rounded-3xl bg-black/50 border border-white/10 backdrop-blur-xl flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.05)] mb-8 relative">
           <div className="absolute inset-0 bg-gradient-to-tr from-[var(--theme-color)]/30 to-transparent rounded-3xl" />
           <Church className="w-10 h-10 text-white relative z-10" />
        </div>
        <h1 className="text-4xl font-serif text-white tracking-[0.2em] uppercase font-bold mb-4" style={{ fontFamily: '"Playfair Display", "Cinzel", serif' }}>
          Ecclesia
        </h1>
        <div className="flex gap-1.5 items-center">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--theme-color)] animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--theme-color)] animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--theme-color)] animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </motion.div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        if (user.email === 'rudson.p48@gmail.com') {
          setIsAdmin(true);
        } else {
          try {
            const adminDoc = await getDoc(doc(db, 'admins', user.uid));
            setIsAdmin(adminDoc.exists());
          } catch (e) {
            setIsAdmin(false);
          }
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <SplashScreen />;
  }

  if (!user) {
    return (
      <ThemeProvider>
        <Router>
          <Routes>
            <Route path="/*" element={<Login />} />
          </Routes>
        </Router>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <PlayerProvider>
        <Router>
          <AppContent user={user} isAdmin={isAdmin} />
        </Router>
      </PlayerProvider>
    </ThemeProvider>
  );
}

function AppContent({ user, isAdmin }: { user: User | null, isAdmin: boolean }) {
  const location = useLocation();
  const { churchName } = useTheme();

  return (
    <div className="min-h-screen bg-transparent text-white font-sans flex flex-col relative z-0">
      {/* iOS 26 Abstract Background System */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-purple-600/10 blur-[120px] rounded-full mix-blend-screen animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-blue-600/10 blur-[120px] rounded-full mix-blend-screen animate-[pulse_10s_ease-in-out_infinite_2s]" />
      </div>
      <Sidebar isAdmin={isAdmin} user={user} />
      
      {/* Mobile Top Header (Apple iOS 26 style) */}
      <div className="lg:hidden fixed top-0 w-full z-40 bg-white/70 dark:bg-[#1C1C1E]/70 backdrop-blur-[40px] border-b border-black/5 dark:border-white/[0.05] shadow-[0_4px_24px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)] py-3 px-6 flex items-center justify-between transition-colors">
        <span 
          className="text-lg font-serif tracking-widest text-black dark:text-white uppercase"
          style={{ fontFamily: '"Playfair Display", "Cinzel", serif' }}
        >
          {churchName || 'ECCLESIA'}
        </span>
        <Link to="/profile" className="flex items-center gap-2">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border border-white/20 object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
              <UserIcon className="w-4 h-4 text-white" />
            </div>
          )}
        </Link>
      </div>

      <main className="flex-1 w-full lg:ml-[280px] px-0 lg:px-4 py-0 lg:py-6 lg:mb-0 lg:max-w-[calc(100%-280px)] overflow-x-hidden pt-16 lg:pt-6 pb-24 lg:pb-6">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
            <Route path="/bible" element={<PageWrapper><Bible /></PageWrapper>} />
            <Route path="/media" element={<PageWrapper><Media /></PageWrapper>} />
            <Route path="/events" element={<PageWrapper><Events /></PageWrapper>} />
            <Route path="/gallery" element={<PageWrapper><Gallery /></PageWrapper>} />
            <Route path="/notes" element={<PageWrapper><Notes /></PageWrapper>} />
            <Route path="/prayers" element={<PageWrapper><Prayers /></PageWrapper>} />
            <Route path="/podcast" element={<PageWrapper><Podcast /></PageWrapper>} />
            <Route path="/volunteer" element={<PageWrapper><Volunteer /></PageWrapper>} />
            <Route path="/profile" element={<PageWrapper><Profile user={user!} /></PageWrapper>} />
            <Route path="/settings" element={<PageWrapper><SettingsPage /></PageWrapper>} />
            <Route path="/admin" element={isAdmin ? <PageWrapper><Admin /></PageWrapper> : <Navigate to="/" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </AnimatePresence>
      </main>

      <GlobalPlayer />
      <BottomNav />
    </div>
  );
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4, ease: "circOut" }}
    >
      {children}
    </motion.div>
  );
}
