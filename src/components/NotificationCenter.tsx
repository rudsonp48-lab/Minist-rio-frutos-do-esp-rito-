import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Heart, 
  CheckCheck, 
  X, 
  Sparkles, 
  Calendar, 
  Users, 
  ExternalLink,
  Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AppNotification, 
  subscribeToUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from '../services/notificationService';
import { auth } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [toastNotification, setToastNotification] = useState<AppNotification | null>(null);
  const navigate = useNavigate();

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    let previousIds = new Set<string>();
    let isInitialLoad = true;

    const unsubscribe = subscribeToUserNotifications(user.uid, (data) => {
      setNotifications(data);

      if (!isInitialLoad) {
        // Detect if a new unread notification arrived
        const newlyAdded = data.find(n => !previousIds.has(n.id) && !n.read && n.recipientUid === user.uid);
        if (newlyAdded) {
          setToastNotification(newlyAdded);
          try {
            if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
          } catch {}
          // Auto dismiss toast after 6 seconds
          setTimeout(() => {
            setToastNotification(null);
          }, 6000);
        }
      }

      previousIds = new Set(data.map(n => n.id));
      isInitialLoad = false;
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.read) {
      await markNotificationAsRead(notif.id);
    }
    setIsOpen(false);
    setToastNotification(null);
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'prayer_intercession':
        return <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />;
      case 'prayer_testimony':
        return <Sparkles className="w-5 h-5 text-amber-400" />;
      case 'volunteer_reminder':
        return <Calendar className="w-5 h-5 text-indigo-400" />;
      case 'cell_notice':
        return <Users className="w-5 h-5 text-emerald-400" />;
      default:
        return <Bell className="w-5 h-5 text-[var(--theme-color)]" />;
    }
  };

  return (
    <>
      {/* Header Notification Bell Trigger (Can be placed in headers or fixed corner) */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all active:scale-95 focus:outline-none"
          title="Notificações"
          aria-label="Abrir notificações"
        >
          <Bell className="w-5 h-5 text-white/90" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-rose-500 text-white text-[11px] font-bold flex items-center justify-center shadow-lg shadow-rose-950/50"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </button>
      </div>

      {/* Floating In-App Toast Banner when someone starts praying */}
      <AnimatePresence>
        {toastNotification && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-md bg-gradient-to-r from-[#1a1128] to-[#121218] border border-rose-500/30 rounded-2xl p-4 shadow-2xl backdrop-blur-xl cursor-pointer"
            onClick={() => handleNotificationClick(toastNotification)}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                    {toastNotification.title}
                  </h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setToastNotification(null);
                    }}
                    className="text-white/40 hover:text-white p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-sm font-medium text-white mt-0.5 line-clamp-2">
                  {toastNotification.message}
                </p>
                <span className="text-[10px] text-white/50 mt-1 inline-block">
                  Toque para ver no Mural de Oração
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications Drawer / Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[90] flex items-start justify-end p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
            {/* Backdrop click */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative w-full max-w-sm sm:max-w-md bg-[#101015] border border-white/10 rounded-3xl p-6 shadow-2xl max-h-[85vh] flex flex-col z-10"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-[var(--theme-color)]/20 border border-[var(--theme-color)]/30 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-[var(--theme-color)]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Notificações</h3>
                    <p className="text-xs text-white/50">
                      {unreadCount > 0 ? `${unreadCount} não lidas` : 'Nenhuma nova notificação'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllNotificationsAsRead(notifications)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-medium flex items-center gap-1 transition-colors"
                      title="Marcar todas como lidas"
                    >
                      <CheckCheck className="w-4 h-4" />
                      <span className="hidden sm:inline">Lidas</span>
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Notification List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center flex flex-col items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-3">
                      <Bell className="w-6 h-6 text-white/30" />
                    </div>
                    <p className="text-sm font-semibold text-white/70">Tudo limpo por aqui!</p>
                    <p className="text-xs text-white/40 max-w-xs mt-1">
                      Você receberá notificações quando alguém orar pelos seus pedidos ou houver avisos da igreja.
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <motion.div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                        notif.read
                          ? 'bg-white/[0.02] border-white/5 opacity-70 hover:opacity-100 hover:bg-white/[0.05]'
                          : 'bg-white/[0.08] border-white/15 hover:border-[var(--theme-color)]/50'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                        {getIconForType(notif.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white tracking-wide truncate">
                            {notif.title}
                          </h4>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 ml-2" />
                          )}
                        </div>

                        <p className="text-xs text-white/80 mt-1 leading-relaxed">
                          {notif.message}
                        </p>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                          <span className="text-[10px] text-white/40">
                            {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Agora'}
                          </span>
                          <span className="text-[10px] text-[var(--theme-color)] font-bold uppercase tracking-wider flex items-center gap-1">
                            Ver <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
