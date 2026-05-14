import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

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

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Bootstrapped admin check
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

  // Separate Login Page logic
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
    <Router>
      <div className="min-h-screen bg-transparent text-white font-sans pb-20 md:pb-0 md:pt-16">
        <Navbar isAdmin={isAdmin} user={user} />
        
        <main className="max-w-7xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/bible" element={<Bible />} />
            <Route path="/media" element={<Media />} />
            <Route path="/events" element={<Events />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/profile" element={<Profile user={user} />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/admin" element={isAdmin ? <Admin /> : <Navigate to="/" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        <BottomNav />
      </div>
    </Router>
  );
}
