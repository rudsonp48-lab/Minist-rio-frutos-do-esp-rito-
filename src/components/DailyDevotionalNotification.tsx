import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, X, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getDailyDevotional } from '../lib/devotionalsData';
import { User } from 'firebase/auth';

export function DailyDevotionalNotification({ user }: { user: User }) {
  const [showNotification, setShowNotification] = useState(false);
  const currentDevotional = getDailyDevotional();

  useEffect(() => {
    // Check if the user has been notified today
    const now = new Date();
    const dateToUse = new Date(now);
    if (dateToUse.getHours() < 8) {
        dateToUse.setDate(dateToUse.getDate() - 1);
    }
    const todayStr = `${dateToUse.getFullYear()}-${dateToUse.getMonth() + 1}-${dateToUse.getDate()}`;
    const storageKey = `devotional_notified_${user.uid}`;
    const lastNotified = localStorage.getItem(storageKey);

    if (lastNotified !== todayStr) {
      // Trigger native notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`Devocional: ${currentDevotional.title}`, {
          body: currentDevotional.verse,
          icon: '/icon.png' // Just an abstract icon link
        });
      } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }

      // Show in-app notification
      setShowNotification(true);
      localStorage.setItem(storageKey, todayStr);
    }
  }, [user.uid, currentDevotional]);

  return (
    <AnimatePresence>
      {showNotification && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className="fixed top-safe-top pt-4 left-0 right-0 z-[300] flex justify-center px-4"
        >
          <div className="bg-zinc-900/95 dark:bg-white/90 backdrop-blur-xl border border-white/10 dark:border-black/10 rounded-2xl p-4 shadow-2xl flex max-w-sm w-full gap-4 items-start">
            <div className="w-10 h-10 rounded-full bg-[var(--theme-color)]/20 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-[var(--theme-color)]" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-white dark:text-black font-bold text-sm">Devocional Diário</h4>
              <p className="text-white/60 dark:text-black/60 text-xs mt-0.5 line-clamp-1">{currentDevotional.title}</p>
              
              <Link 
                to="/bible" 
                onClick={() => setShowNotification(false)}
                className="mt-2 text-[var(--theme-color)] text-xs font-bold flex items-center gap-1 active:opacity-70 transition-opacity"
              >
                Ler agora <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <button 
              onClick={() => setShowNotification(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 dark:text-black/50 hover:bg-white/10 dark:hover:bg-black/10 transition-colors shrink-0 -mr-2 -mt-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
