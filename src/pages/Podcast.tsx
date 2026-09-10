import { useState, useEffect } from 'react';
import { ChevronLeft, Play, Mic, Headphones } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTheme } from '../lib/ThemeContext';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface PodcastItem {
  id: string;
  title: string;
  host: string;
  duration?: string;
  audioUrl?: string;
  img?: string;
}

export default function Podcast() {
  const { churchName } = useTheme();
  const [podcasts, setPodcasts] = useState<PodcastItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const q = query(collection(db, 'podcasts'), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PodcastItem));
        setPodcasts(items);
        setLoading(false);
      }, () => {
        setPodcasts([]);
        setLoading(false);
      });
      return () => unsub();
    } catch {
      setPodcasts([]);
      setLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-transparent w-full text-white font-sans max-w-7xl mx-auto px-6 pb-32">
      <header className="sticky top-0 z-40 bg-black/50 backdrop-blur-3xl border-b border-white/5 py-6 px-0 lg:px-6 flex items-center justify-between mb-8 shadow-2xl">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10 group">
             <ChevronLeft className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-2xl font-serif font-bold tracking-widest text-white uppercase">Podcasts</h1>
            <div className="flex items-center gap-2 mt-1">
              <Mic className="w-3.5 h-3.5 text-[var(--theme-color)]" />
              <span className="text-[10px] font-bold text-[var(--theme-color)] uppercase tracking-[0.2em]">{churchName}</span>
            </div>
          </div>
        </div>
      </header>

      {podcasts.length === 0 && !loading ? (
        <div className="text-center py-20 px-6 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--theme-color)]/10 text-[var(--theme-color)] flex items-center justify-center mb-4">
            <Mic className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Novos episódios em breve</h3>
          <p className="text-white/50 text-sm max-w-md">
            Os episódios do podcast oficial do {churchName} serão disponibilizados aqui para você ouvir e edificar a sua fé.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {podcasts.map((podcast, idx) => (
            <motion.div
              key={podcast.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-[#111111] border border-white/5 rounded-3xl p-4 flex gap-4 items-center group cursor-pointer hover:border-[var(--theme-color)]/30 transition-colors relative"
            >
              <div className="absolute top-4 right-4 text-white/20 group-hover:text-[var(--theme-color)] transition-colors">
                 <Headphones className="w-5 h-5" />
              </div>
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 bg-white/5 flex items-center justify-center">
                {podcast.img ? (
                  <img src={podcast.img} alt={podcast.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <Mic className="w-8 h-8 text-[var(--theme-color)]" />
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Play className="w-8 h-8 text-white fill-current opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                </div>
              </div>
              <div className="flex flex-col flex-1 overflow-hidden pr-6">
                {podcast.duration && (
                  <p className="text-[10px] text-[var(--theme-color)] font-bold uppercase tracking-widest mb-1">{podcast.duration}</p>
                )}
                <h4 className="text-white font-bold leading-tight line-clamp-2 mb-1">{podcast.title}</h4>
                <p className="text-white/50 text-xs">{podcast.host}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
