import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, MapPin, Clock, ChevronRight, Plus, Loader2, Zap, Target, Globe, Filter, X, ChevronLeft, CalendarDays } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';
import { Link } from 'react-router-dom';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
  image: string;
  createdAt: any;
}

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    category: 'Culto',
    image: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Event[];
      setEvents(eventData.length > 0 ? eventData : DEFAULT_EVENTS);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'events');
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'events'), {
        ...formData,
        createdAt: serverTimestamp()
      });
      setShowAddModal(false);
      setFormData({ title: '', date: '', time: '', location: '', category: 'Culto', image: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'events');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-32">
      {/* iOS Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-40 ios-glass border-b border-black/[0.05] dark:border-white/[0.05] flex items-center justify-between px-6 h-16">
        <Link to="/" className="flex items-center gap-1 text-[var(--theme-color)] font-medium transition-opacity active:opacity-50">
          <ChevronLeft className="w-6 h-6" />
          <span>Ecclesia</span>
        </Link>
        <h1 className="text-[17px] font-bold tracking-tight absolute left-1/2 -translate-x-1/2">Calendário</h1>
        <div className="w-10"></div>
      </nav>

      <div className="pt-24 px-6 space-y-8 max-w-lg mx-auto">
        <header>
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays className="w-5 h-5 text-[#8E8E93]" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#8E8E93]">Agenda Matrix</span>
          </div>
          <h2 className="text-4xl font-bold tracking-tighter text-white">Eventos Ecclesia</h2>
        </header>

        {/* Categories Bar */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
          {['Tudo', 'Cultos', 'Jovens', 'Matrix', 'Liderança'].map(cat => (
            <button
              key={cat}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                cat === 'Tudo' 
                  ? 'bg-black dark:bg-white text-white dark:text-black' 
                  : 'bg-black/5 dark:bg-white/5 text-[#8E8E93]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Events Feed */}
        <div className="space-y-4">
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-40 rounded-[2.5rem] bg-black/5 dark:bg-white/5 animate-pulse" />
            ))
          ) : (
            <div className="space-y-6">
              {events.map((event, idx) => (
                <motion.div 
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="ios-card group relative overflow-hidden"
                >
                  <div className="h-48 relative overflow-hidden">
                    <img src={event.image || undefined} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Event" />
                    <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                      <span className="ios-pill bg-white/20 border-white/40 text-white mb-2 inline-block">{event.category}</span>
                      <h3 className="text-2xl font-bold text-white tracking-tight leading-tight">{event.title}</h3>
                    </div>
                  </div>
                  <div className="p-6 flex items-center justify-between bg-white dark:bg-[#1C1C1E]">
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col items-center justify-center bg-black/5 dark:bg-white/5 w-12 h-12 rounded-xl">
                        <span className="text-[10px] font-bold text-[#8E8E93] uppercase leading-none">{event.date.split(' ')[1]}</span>
                        <span className="text-lg font-bold text-[#007AFF] leading-none mt-1">{event.date.split(' ')[0]}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8E8E93]">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{event.time}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8E8E93] mt-0.5">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[140px] uppercase">{event.location}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <a 
                          href={`https://wa.me/?text=${encodeURIComponent(`*${event.title}*\n📅 ${event.date} - ${event.time}\n📍 ${event.location}\n\nVenha estar conosco! ${window.location.origin}/events`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500 active:scale-90 transition-transform"
                       >
                         <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                         </svg>
                       </a>
                      <button className="w-12 h-12 rounded-2xl bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF] active:scale-90 transition-transform">
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const DEFAULT_EVENTS = [
  { id: '1', title: 'Vigília Profética Ecclesia', date: '24 AGO', time: '19:30', location: 'Templo Central', category: 'CULTO', image: 'https://images.unsplash.com/photo-1510076857177-7470076d4098', createdAt: null },
  { id: '2', title: 'Conexão Jovens Quantum', date: '28 AGO', time: '18:00', location: 'Sala Atlas', category: 'JOVENS', image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7', createdAt: null },
  { id: '3', title: 'Santa Ceia de Agosto', date: '01 SET', time: '18:00', location: 'Templo Central', category: 'CULTO', image: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3', createdAt: null },
];
