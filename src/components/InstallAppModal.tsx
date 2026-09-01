import { useState, useEffect } from 'react';
import { Download, Smartphone, Check, X, Share, PlusSquare, ArrowDownToLine, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallAppModal() {
  const location = useLocation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isPillDismissed, setIsPillDismissed] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    // Detect if already installed as standalone PWA or marked installed
    const isStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');
    
    const wasInstalled = localStorage.getItem('church_app_installed') === 'true';
    const pillDismissed = localStorage.getItem('church_app_pill_dismissed') === 'true';

    setIsStandalone(isStandaloneMode);
    setIsInstalled(wasInstalled || isStandaloneMode);
    setIsPillDismissed(pillDismissed);

    // Detect device platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);
    setIsIOS(isIosDevice);
    setIsAndroid(isAndroidDevice);

    // Check if user previously dismissed today
    const lastDismissed = localStorage.getItem('church_app_install_dismissed');
    const isRecentlyDismissed = lastDismissed && (Date.now() - parseInt(lastDismissed, 10)) < 86400000; // 24h

    // Native PWA prompt capture (Android / Chrome / Edge / Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // If not dismissed recently and not standalone or already installed, show prompt
      if (!isRecentlyDismissed && !isStandaloneMode && !wasInstalled) {
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 2500);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // iOS check: if iOS and not standalone and not recently dismissed and not installed
    if (isIosDevice && !isStandaloneMode && !isRecentlyDismissed && !wasInstalled) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    // App installed listener - permanently removes the button & modal
    const handleAppInstalled = () => {
      setInstallSuccess(true);
      setIsInstalled(true);
      localStorage.setItem('church_app_installed', 'true');
      setDeferredPrompt(null);
      setTimeout(() => {
        setIsOpen(false);
      }, 2000);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setInstallSuccess(true);
          setIsInstalled(true);
          localStorage.setItem('church_app_installed', 'true');
          setTimeout(() => setIsOpen(false), 2000);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('Error initiating install prompt:', err);
      }
    } else {
      // Manual trigger on devices without beforeinstallprompt
      setIsInstalled(true);
      localStorage.setItem('church_app_installed', 'true');
      setInstallSuccess(true);
      setTimeout(() => setIsOpen(false), 2000);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('church_app_install_dismissed', Date.now().toString());
    setIsOpen(false);
  };

  const handleDismissPill = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPillDismissed(true);
    localStorage.setItem('church_app_pill_dismissed', 'true');
  };

  // If running in standalone mode or app is already marked installed, do not show button or modal
  if (isStandalone || isInstalled || location.pathname.startsWith('/chat')) return null;

  return (
    <>
      {/* Floating Quick Install Pill with close button */}
      {!isOpen && !isPillDismissed && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="fixed bottom-20 lg:bottom-6 right-4 z-40 flex items-center bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500 rounded-full shadow-[0_8px_25px_rgba(138,43,226,0.45)] border border-white/20 p-1 pl-3.5 backdrop-blur-md group cursor-pointer active:scale-95 transition-transform"
          onClick={() => setIsOpen(true)}
          title="Instalar Aplicativo no Celular"
        >
          <div className="flex items-center gap-2 text-white text-xs font-bold mr-1">
            <ArrowDownToLine className="w-4 h-4 group-hover:animate-bounce" />
            <span className="hidden sm:inline">Baixar Aplicativo</span>
            <span className="sm:hidden">Baixar App</span>
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
          </div>

          {/* Close X button to hide pill */}
          <button
            onClick={handleDismissPill}
            className="w-6 h-6 rounded-full bg-black/30 hover:bg-black/50 text-white/80 hover:text-white flex items-center justify-center transition-colors ml-1"
            title="Fechar aviso"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}

      {/* Main Installation Modal / Bottom Sheet */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-[#13131A] border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-[32px] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden"
            >
              {/* Background gradient decorative glow */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600/30 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* App Icon + Title */}
              <div className="flex items-center gap-4 mb-5">
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-emerald-400 p-[2px] shadow-lg shrink-0">
                  <img
                    src="/icon.svg"
                    alt="App Icon"
                    className="w-full h-full object-cover rounded-[14px] bg-black"
                  />
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#13131A] flex items-center justify-center text-[10px] font-black text-white">
                    ✓
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-extrabold tracking-wider uppercase border border-purple-500/30">
                      App Oficial
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Grátis & Leve
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white leading-tight">
                    Ministério Frutos do Espírito
                  </h3>
                  <p className="text-xs text-white/50">
                    Instale direto na tela de início do seu celular
                  </p>
                </div>
              </div>

              {/* Success View */}
              {installSuccess ? (
                <div className="py-6 text-center space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <Check className="w-8 h-8 animate-bounce" />
                  </div>
                  <h4 className="text-base font-bold text-white">Aplicativo Instalado com Sucesso!</h4>
                  <p className="text-xs text-white/60">
                    O ícone agora está disponível na tela inicial do seu celular.
                  </p>
                </div>
              ) : (
                <>
                  {/* App Benefits List */}
                  <div className="bg-white/5 rounded-2xl p-4 mb-5 border border-white/5 space-y-2.5">
                    <div className="flex items-center gap-2.5 text-xs text-white/80">
                      <div className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        ✓
                      </div>
                      <span><strong>Receba ligações e mensagens</strong> mesmo fora do app</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-white/80">
                      <div className="w-5 h-5 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                        ✓
                      </div>
                      <span>Acesso rápido e tela cheia <strong>sem barra do navegador</strong></span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-white/80">
                      <div className="w-5 h-5 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                        ✓
                      </div>
                      <span>Bíblia, louvores, cultos ao vivo e devocionais diários</span>
                    </div>
                  </div>

                  {/* Actions / Instructions based on OS */}
                  {deferredPrompt ? (
                    /* Android / Chrome One-Click Install */
                    <div className="space-y-2">
                      <button
                        onClick={handleInstallClick}
                        className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500 hover:from-purple-500 hover:to-emerald-400 text-white font-bold text-sm shadow-[0_10px_30px_rgba(138,43,226,0.4)] flex items-center justify-center gap-2 active:scale-98 transition-all"
                      >
                        <Download className="w-5 h-5" />
                        <span>Baixar e Instalar no Celular</span>
                      </button>
                      <button
                        onClick={handleDismiss}
                        className="w-full py-2.5 text-xs text-white/50 hover:text-white transition-colors"
                      >
                        Agora não, continuar pelo navegador
                      </button>
                    </div>
                  ) : isIOS ? (
                    /* iPhone / Safari Instructions */
                    <div className="space-y-3">
                      <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-white/90 space-y-2">
                        <p className="font-bold text-indigo-300 flex items-center gap-1.5">
                          <Smartphone className="w-4 h-4" /> Como instalar no iPhone (Safari):
                        </p>
                        <ol className="list-decimal list-inside space-y-1.5 text-white/80 text-[11px]">
                          <li>
                            Toque no botão <strong className="text-white inline-flex items-center gap-1"><Share className="w-3.5 h-3.5 text-blue-400 inline" /> Compartilhar</strong> na barra do Safari.
                          </li>
                          <li>
                            Role para baixo e selecione <strong className="text-white inline-flex items-center gap-1"><PlusSquare className="w-3.5 h-3.5 text-emerald-400 inline" /> Adicionar à Tela de Início</strong>.
                          </li>
                          <li>
                            Toque em <strong className="text-emerald-400">Adicionar</strong> no canto superior direito.
                          </li>
                        </ol>
                      </div>
                      <button
                        onClick={handleDismiss}
                        className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors"
                      >
                        Entendi, fechar instruções
                      </button>
                    </div>
                  ) : (
                    /* Fallback / Desktop / General Android */
                    <div className="space-y-2">
                      <button
                        onClick={handleInstallClick}
                        className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500 hover:from-purple-500 hover:to-emerald-400 text-white font-bold text-sm shadow-[0_10px_30px_rgba(138,43,226,0.4)] flex items-center justify-center gap-2 active:scale-98 transition-all"
                      >
                        <Download className="w-5 h-5" />
                        <span>Adicionar à Tela de Início</span>
                      </button>
                      <p className="text-[11px] text-white/40 text-center">
                        Ou clique no menu do navegador (⋮) e escolha <strong>"Instalar aplicativo"</strong>
                      </p>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
