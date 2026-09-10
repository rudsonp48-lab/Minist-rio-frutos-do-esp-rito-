import React, { useState, useEffect } from 'react';
import { Bell, BellRing, Smartphone, CheckCircle2, ShieldCheck, X, Sparkles, Timer, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { requestBrowserNotificationPermission, testLockScreenNotification, subscribeToPushService } from '../services/notificationService';
import { auth } from '../lib/firebase';

export default function LockScreenNotificationBar() {
  const [isVisible, setIsVisible] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isTesting, setIsTesting] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [testSuccessMessage, setTestSuccessMessage] = useState<string | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      
      const dismissed = sessionStorage.getItem('ecclesia_push_prompt_dismissed');
      // Show prompt if permission is default, or if opened explicitly
      if (Notification.permission === 'default' && !dismissed) {
        const timer = setTimeout(() => setIsVisible(true), 3500);
        return () => clearTimeout(timer);
      }
    }

    const handleOpenTester = () => {
      setIsVisible(true);
    };

    window.addEventListener('open-lockscreen-tester', handleOpenTester);
    return () => window.removeEventListener('open-lockscreen-tester', handleOpenTester);
  }, []);

  const handleActivate = async () => {
    setIsSubscribing(true);
    try {
      const granted = await requestBrowserNotificationPermission(auth.currentUser?.uid);
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setPermission(Notification.permission);
      }
      if (granted) {
        setTestSuccessMessage('Notificações de tela bloqueada habilitadas com sucesso!');
        setTimeout(() => setTestSuccessMessage(null), 4000);
      }
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleStartTest = async () => {
    setIsTesting(true);
    setCountdown(5);
    setTestSuccessMessage(null);

    // Call server to schedule push in 5 seconds
    const result = await testLockScreenNotification(5);

    // Countdown interval
    let counter = 5;
    const interval = setInterval(() => {
      counter -= 1;
      setCountdown(counter);
      if (counter <= 0) {
        clearInterval(interval);
        setIsTesting(false);
        setTestSuccessMessage(result.message || 'Notificação disparada! Verifique a tela do seu celular.');
      }
    }, 1000);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('ecclesia_push_prompt_dismissed', 'true');
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-[99990]">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="bg-[#121218]/95 backdrop-blur-2xl border border-white/15 rounded-3xl p-4 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.85)] text-white relative overflow-hidden"
        >
          {/* Ambient Glow */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[var(--theme-color)]/25 rounded-full blur-2xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
            title="Fechar aviso"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Testing State */}
          {isTesting ? (
            <div className="text-center py-2">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 mx-auto flex items-center justify-center text-2xl font-black shadow-lg shadow-purple-500/30 animate-pulse mb-3">
                {countdown}s
              </div>
              <h4 className="text-sm font-bold text-white mb-1">
                🔒 Bloqueie a tela do celular AGORA!
              </h4>
              <p className="text-xs text-white/70 leading-relaxed max-w-xs mx-auto">
                Pressione o botão lateral do celular para desligar a tela. Em instantes o aparelho vibrará com a notificação na tela de bloqueio!
              </p>
            </div>
          ) : (
            <div>
              {/* Header */}
              <div className="flex items-center gap-3 mb-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[var(--theme-color)]/20 border border-[var(--theme-color)]/30 flex items-center justify-center text-[var(--theme-color)] shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    Notificações com Tela Bloqueada
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </h4>
                  <p className="text-[11px] text-white/60">
                    {permission === 'granted' 
                      ? 'Push habilitado no dispositivo' 
                      : 'Receba mensagens e chamadas fora do app'}
                  </p>
                </div>
              </div>

              {testSuccessMessage && (
                <div className="mb-3 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{testSuccessMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                {permission !== 'granted' ? (
                  <button
                    onClick={handleActivate}
                    disabled={isSubscribing}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[var(--theme-color)] hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[var(--theme-color)]/25 active:scale-95 transition-all"
                  >
                    {isSubscribing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <BellRing className="w-4 h-4" />
                    )}
                    <span>Ativar Notificações</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStartTest}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 active:scale-95 transition-all"
                  >
                    <Timer className="w-4 h-4" />
                    <span>Testar na Tela Bloqueada (5s)</span>
                  </button>
                )}

                <button
                  onClick={handleDismiss}
                  className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white/70 text-xs font-semibold active:scale-95 transition-all"
                >
                  Depois
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
