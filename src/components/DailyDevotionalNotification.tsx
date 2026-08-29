import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, X, ChevronRight, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getDailyDevotional } from '../lib/devotionalsData';
import { User } from 'firebase/auth';

export function DailyDevotionalNotification({ user }: { user: User }) {
  const [showNotification, setShowNotification] = useState(false);
  const [streak, setStreak] = useState(0);
  const currentDevotional = getDailyDevotional();

  useEffect(() => {
    try {
      // Check if the user has been notified today
      const now = new Date();
      const dateToUse = new Date(now);
      if (dateToUse.getHours() < 8) {
        dateToUse.setDate(dateToUse.getDate() - 1);
      }
      
      const year = dateToUse.getFullYear();
      const month = String(dateToUse.getMonth() + 1).padStart(2, '0');
      const day = String(dateToUse.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;
      
      const storageKey = `devotional_notified_${user.uid}`;
      const streakKey = `devotional_streak_${user.uid}`;
      
      const lastNotified = localStorage.getItem(storageKey);
      
      // Calculate Streak safely
      let currentStreak = parseInt(localStorage.getItem(streakKey) || '0', 10);
      if (isNaN(currentStreak)) currentStreak = 0;

      if (lastNotified) {
        const lastDate = new Date(lastNotified);
        if (!isNaN(lastDate.getTime())) {
          const diffTime = Math.abs(dateToUse.getTime() - lastDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
          
          if (diffDays > 1 && lastNotified !== todayStr) {
            // Broke streak
            currentStreak = 0;
          }
        }
      }

      if (lastNotified !== todayStr) {
        // Increase streak
        currentStreak += 1;
        localStorage.setItem(streakKey, currentStreak.toString());
        
        // Safely attempt browser notification if supported (catch mobile WebKit/Chrome TypeError)
        try {
          if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'granted') {
              // Try constructing notification (works on desktop; catches on mobile where constructor is forbidden)
              new Notification(`Devocional: ${currentDevotional.title}`, {
                body: currentDevotional.verse,
                icon: '/icon.svg'
              });
            }
          }
        } catch (notifErr) {
          // Benign on mobile browsers that require ServiceWorker showNotification
          console.debug('[Devotional] Push notification not supported natively:', notifErr);
        }

        setShowNotification(true);
        localStorage.setItem(storageKey, todayStr);
      }
      
      setStreak(currentStreak);
    } catch (err) {
      console.warn('[Devotional Notification] Error calculating streak/notification:', err);
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
          <div className="bg-zinc-900/95 dark:bg-white/90 backdrop-blur-xl border border-white/10 dark:border-black/10 rounded-2xl p-4 shadow-2xl flex max-w-sm w-full gap-4 items-start relative overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-[var(--theme-color)]/20 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-[var(--theme-color)]" />
            </div>
            
            <div className="flex-1 min-w-0 pr-8">
              <div className="flex items-center gap-2">
                <h4 className="text-white dark:text-black font-bold text-sm">Devocional Diário</h4>
                {streak > 0 && (
                  <div className="flex items-center gap-1 bg-orange-500/20 text-orange-500 px-1.5 py-0.5 rounded-full text-[10px] font-bold border border-orange-500/20">
                    <Flame className="w-3 h-3 fill-orange-500" />
                    <span>{streak}</span>
                  </div>
                )}
              </div>
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
              className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-white/50 dark:text-black/50 hover:bg-white/10 dark:hover:bg-black/10 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
