import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ThemeProvider } from './lib/ThemeContext';
import { startPresenceHeartbeat } from './services/presenceService';

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
import Chat from './pages/Chat';
import Podcast from './pages/Podcast';
import Volunteer from './pages/Volunteer';
import SettingsPage from './pages/Settings';
import WebRadio from './pages/WebRadio';
import Give from './pages/Give';

// Components
import Sidebar from './components/layout/Sidebar';
import BottomNav from './components/layout/BottomNav';
import TopBar from './components/layout/TopBar';
import { User as UserIcon, Church } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation, Link } from 'react-router-dom';
import { useTheme } from './lib/ThemeContext';
import { PlayerProvider } from './lib/PlayerContext';
import GlobalPlayer from './components/GlobalPlayer';
import { DailyDevotionalNotification } from './components/DailyDevotionalNotification';
import { Onboarding } from './components/Onboarding';
import AITheologicalAssistant from './components/AITheologicalAssistant';
import TopNotificationBanner from './components/TopNotificationBanner';
import IncomingCallModal from './components/chat/IncomingCallModal';
import DirectCallModal from './components/chat/DirectCallModal';
import InstallAppModal from './components/InstallAppModal';
import { CallSession, subscribeToIncomingCalls } from './services/callService';
import { triggerCallNotification } from './services/notificationService';

function SplashScreen({ onRetry }: { onRetry?: () => void }) {
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowRetry(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden px-6">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] max-w-[600px] aspect-square bg-[var(--theme-color)]/20 blur-[120px] rounded-full animate-pulse pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="w-24 h-24 rounded-3xl bg-black/50 border border-white/10 backdrop-blur-xl flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.05)] mb-8 relative">
           <div className="absolute inset-0 bg-gradient-to-tr from-[var(--theme-color)]/30 to-transparent rounded-3xl" />
           <Church className="w-10 h-10 text-white relative z-10" />
        </div>
        <h1 className="text-4xl font-serif text-white tracking-[0.2em] uppercase font-bold mb-4" style={{ fontFamily: '"Playfair Display", "Cinzel", serif' }}>
          Ecclesia
        </h1>
        <div className="flex gap-1.5 items-center mb-6">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--theme-color)] animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--theme-color)] animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--theme-color)] animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>

        {showRetry && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-2"
          >
            <p className="text-xs text-white/50 text-center max-w-xs">
              Conexão demorando a responder. Deseja recarregar o app?
            </p>
            <button
              onClick={() => {
                if (onRetry) onRetry();
                else window.location.reload();
              }}
              className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white transition-all active:scale-95"
            >
              Recarregar Agora
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Safety watchdog: ensure loading never hangs past 2 seconds
    const watchdogTimer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    let cleanupHeartbeat: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      clearTimeout(watchdogTimer);
      setUser(currentUser);

      if (cleanupHeartbeat) {
        cleanupHeartbeat();
        cleanupHeartbeat = null;
      }

      if (currentUser) {
        cleanupHeartbeat = startPresenceHeartbeat();

        // Asynchronous non-blocking background sync
        (async () => {
          try {
            const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
            const existingData = userSnap.data();
            const existingPhoto = existingData?.photoURL || existingData?.avatarUrl;
            let cachedPhoto = '';
            try {
              cachedPhoto = localStorage.getItem(`church_user_photo_${currentUser.uid}`) || '';
            } catch {}
            const finalPhoto = existingPhoto || cachedPhoto || currentUser.photoURL || '';

            const syncPayload: any = {
              uid: currentUser.uid,
              email: currentUser.email,
              name: existingData?.displayName || existingData?.name || currentUser.displayName || currentUser.email?.split('@')[0] || '',
              isOnline: true,
              lastLogin: serverTimestamp(),
              lastSeen: serverTimestamp()
            };

            if (finalPhoto) {
              syncPayload.photoURL = finalPhoto;
              syncPayload.avatarUrl = finalPhoto;
            }

            await setDoc(doc(db, 'users', currentUser.uid), syncPayload, { merge: true });
          } catch (err) {
            console.debug("[Auth] Background user sync failed:", err);
          }

          if (currentUser.email === 'rudson.p48@gmail.com') {
            setIsAdmin(true);
          } else {
            try {
              const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid));
              let hasAdminByEmail = false;
              if (currentUser.email) {
                const adminDocEmail = await getDoc(doc(db, 'admins', currentUser.email.toLowerCase()));
                hasAdminByEmail = adminDocEmail.exists();
              }
              setIsAdmin(adminDoc.exists() || hasAdminByEmail);
            } catch (e) {
              setIsAdmin(false);
            }
          }
        })();
      } else {
        setIsAdmin(false);
      }

      setLoading(false);
    });

    return () => {
      clearTimeout(watchdogTimer);
      if (cleanupHeartbeat) cleanupHeartbeat();
      unsubscribe();
    };
  }, []);

  if (loading) {
    return <SplashScreen onRetry={() => setLoading(false)} />;
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

import LiveStream from './pages/LiveStream';

import Cells from './pages/Cells';

function AppContent({ user, isAdmin }: { user: User | null, isAdmin: boolean }) {
  const location = useLocation();
  const { churchName } = useTheme();

  // Real-time 1-on-1 Call Signaling State
  const [incomingCall, setIncomingCall] = useState<CallSession | null>(null);
  const [activeDirectCall, setActiveDirectCall] = useState<CallSession | null>(null);
  const [isInitiator, setIsInitiator] = useState(false);

  // Subscribe to incoming calls across the entire application
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = subscribeToIncomingCalls(user.uid, (call) => {
      // Only show incoming call if we are not already in that call
      if (call && activeDirectCall?.id !== call.id) {
        setIncomingCall(call);
        // Trigger system background push notification & vibration (rings on lock screen / other apps)
        triggerCallNotification({
          callerName: call.caller.name,
          callType: call.type,
          callId: call.id,
          callerPhoto: call.caller.photoURL
        });
      } else if (!call) {
        setIncomingCall(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user?.uid, activeDirectCall?.id]);

  return (
    <div className="min-h-screen bg-transparent text-white font-sans flex flex-col relative z-0">
      {/* iOS 26 Abstract Background System */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-purple-600/10 blur-[120px] rounded-full mix-blend-screen animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-blue-600/10 blur-[120px] rounded-full mix-blend-screen animate-[pulse_10s_ease-in-out_infinite_2s]" />
      </div>
      <Sidebar isAdmin={isAdmin} user={user} />
      <TopBar />
      <TopNotificationBanner />
      
      <main className={`flex-1 w-full lg:ml-[280px] px-0 lg:px-4 py-0 lg:py-6 lg:mb-0 lg:max-w-[calc(100%-280px)] overflow-x-hidden pt-0 lg:pt-6 ${location.pathname.startsWith('/chat') ? 'pb-0' : 'pb-24'} lg:pb-6`}>
        <DailyDevotionalNotification user={user as User} />
        <Onboarding />
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
            <Route path="/bible" element={<PageWrapper><Bible /></PageWrapper>} />
            <Route path="/live" element={<PageWrapper><LiveStream /></PageWrapper>} />
            <Route path="/cells" element={<PageWrapper><Cells /></PageWrapper>} />
            <Route path="/media" element={<PageWrapper><Media /></PageWrapper>} />
            <Route path="/events" element={<PageWrapper><Events /></PageWrapper>} />
            <Route path="/gallery" element={<PageWrapper><Gallery /></PageWrapper>} />
            <Route path="/notes" element={<PageWrapper><Notes /></PageWrapper>} />
            <Route path="/prayers" element={<PageWrapper><Prayers /></PageWrapper>} />
            <Route path="/chat" element={<PageWrapper><Chat /></PageWrapper>} />
            <Route path="/podcast" element={<PageWrapper><Podcast /></PageWrapper>} />
            <Route path="/webradio" element={<PageWrapper><WebRadio /></PageWrapper>} />
            <Route path="/give" element={<PageWrapper><Give /></PageWrapper>} />
            <Route path="/volunteer" element={<PageWrapper><Volunteer /></PageWrapper>} />
            <Route path="/profile" element={<PageWrapper><Profile user={user!} /></PageWrapper>} />
            <Route path="/settings" element={<PageWrapper><SettingsPage /></PageWrapper>} />
            <Route path="/admin" element={isAdmin ? <PageWrapper><Admin /></PageWrapper> : <Navigate to="/" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </AnimatePresence>
      </main>

      {/* Global Real-time Incoming Call Overlay (Instagram Style) */}
      <IncomingCallModal
        incomingCall={incomingCall}
        onAccept={(call) => {
          setIncomingCall(null);
          setActiveDirectCall(call);
          setIsInitiator(false);
        }}
        onDecline={() => {
          setIncomingCall(null);
        }}
      />

      {/* Global Active 1-on-1 Direct Call Modal */}
      {activeDirectCall && (
        <DirectCallModal
          isOpen={!!activeDirectCall}
          onClose={() => {
            setActiveDirectCall(null);
            setIncomingCall(null);
          }}
          callSession={activeDirectCall}
          isInitiator={isInitiator}
        />
      )}

      <GlobalPlayer />
      <AITheologicalAssistant />
      <InstallAppModal />
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
