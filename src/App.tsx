import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ThemeProvider } from './lib/ThemeContext';
import { PlayerProvider } from './lib/PlayerContext';
import GlobalPlayer from './components/GlobalPlayer';

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
import SettingsPage from './pages/Settings';

// Components
import Navbar from './components/layout/Navbar';
import BottomNav from './components/layout/BottomNav';

import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router-dom';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Create/Update user profile for admin management
        try {
          const userRef = doc(db, 'users', user.uid);
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email?.toLowerCase(),
            displayName: user.displayName || 'Membro',
            photoURL: user.photoURL || '',
            lastLogin: serverTimestamp()
          }, { merge: true });
        } catch (e) {
          console.error("Error updating user profile:", e);
        }

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
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/*" element={<Login />} />
        </Routes>
      </Router>
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

  return (
    <div className="min-h-screen bg-transparent text-white font-sans flex flex-col relative z-0">
      <div className="spline-container absolute inset-0 w-full h-full -z-10 pointer-events-none opacity-60">
        <iframe src="https://my.spline.design/particlesmoment-kW3xyVny6weIhXJ3vbs2M2bB" frameBorder="0" width="100%" height="100%" id="aura-spline"></iframe>
      </div>
      <Navbar isAdmin={isAdmin} user={user} />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 mb-24 md:mb-0 md:pt-16 overflow-x-hidden">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
            <Route path="/bible" element={<PageWrapper><Bible /></PageWrapper>} />
            <Route path="/media" element={<PageWrapper><Media /></PageWrapper>} />
            <Route path="/events" element={<PageWrapper><Events /></PageWrapper>} />
            <Route path="/gallery" element={<PageWrapper><Gallery /></PageWrapper>} />
            <Route path="/notes" element={<PageWrapper><Notes /></PageWrapper>} />
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
