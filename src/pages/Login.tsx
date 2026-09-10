import { useState } from 'react';
import { auth } from '../lib/firebase';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { Mail, Lock, Church } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../lib/ThemeContext';

export default function Login() {
  const { churchName, logoUrl } = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      if (err.code === 'auth/unauthorized-domain' || err.message?.includes('unauthorized domain')) {
        setError(`O domínio "${window.location.hostname}" não está autorizado para login. Adicione-o no Console do Firebase > Authentication > Settings > Authorized Domains.`);
      } else {
        setError(`Erro: ${err.message || "Erro desconhecido ao autenticar."}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message || "Erro ao autenticar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full bg-[#050505] flex flex-col items-center justify-between px-5 py-3 sm:py-6 text-white font-sans overflow-hidden relative select-none">
      {/* Dynamic Colorful Backgrounds */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-purple-600/30 blur-[120px] rounded-full mix-blend-screen animate-[pulse_8s_ease-in-out_infinite] z-0 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen animate-[pulse_10s_ease-in-out_infinite_2s] z-0 pointer-events-none" />
      <div className="absolute top-[40%] left-[60%] w-[40vw] h-[40vw] bg-pink-600/20 blur-[100px] rounded-full mix-blend-screen animate-[pulse_9s_ease-in-out_infinite_4s] z-0 pointer-events-none" />

      {/* Spline particles - subtle */}
      <div className="spline-container absolute inset-0 w-full h-full z-0 pointer-events-none opacity-30 mix-blend-screen overflow-hidden">
        <iframe src="https://my.spline.design/particlesmoment-kW3xyVny6weIhXJ3vbs2M2bB" frameBorder="0" width="100%" height="100%"></iframe>
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black z-0 pointer-events-none" />

      {/* Main Card Container - strictly constrained to fit viewport without scroll */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[360px] h-full max-h-[600px] flex flex-col justify-between items-center relative z-10 my-auto py-1 sm:py-2"
      >
        {/* Top: Logo and Welcome Header */}
        <div className="flex flex-col items-center justify-center text-center shrink-0 w-full">
          <motion.div 
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center justify-center"
          >
            {logoUrl ? (
              <div className="w-full max-w-[190px] h-20 sm:h-24 flex items-center justify-center relative mb-1">
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/25 via-blue-500/20 to-pink-500/25 blur-2xl -z-10" />
                <img 
                  src={logoUrl} 
                  alt={churchName || "Logo"} 
                  className="w-full h-full object-contain drop-shadow-xl mix-blend-screen filter brightness-105" 
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500 via-blue-500 to-pink-500 p-[2px] shadow-xl relative mb-1 shrink-0">
                <div className="w-full h-full rounded-2xl bg-black/80 flex items-center justify-center backdrop-blur-xl">
                  <Church className="w-8 h-8 text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
                </div>
              </div>
            )}
          </motion.div>
          
          <div className="mt-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
              Bem-vindo(a)
            </h1>
            <p className="text-xs sm:text-[13px] font-medium text-white/60 mt-0.5">
              Acesse sua conta para curtir a experiência.
            </p>
          </div>
        </div>

        {/* Center: Input Form & Auth Buttons */}
        <form onSubmit={handleEmailAuth} className="w-full space-y-3 sm:space-y-3.5 my-auto">
          <div className="bg-white/[0.04] backdrop-blur-2xl rounded-2xl p-2.5 sm:p-3 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] space-y-2.5 relative overflow-hidden group">
            {/* Ambient inner glow */}
            <div className="absolute -inset-10 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-pink-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            <div className="relative">
              <input 
                type="email" 
                required 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                placeholder="E-mail"
                className="w-full h-11 sm:h-12 pl-11 pr-4 bg-black/50 rounded-xl outline-none text-sm font-medium placeholder:text-white/35 text-white transition-all focus:bg-white/10 border border-white/10 focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/40"
              />
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-purple-400 transition-colors" />
            </div>

            <div className="relative">
              <input 
                type="password" 
                required 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                placeholder="Senha"
                className="w-full h-11 sm:h-12 pl-11 pr-4 bg-black/50 rounded-xl outline-none text-sm font-medium placeholder:text-white/35 text-white transition-all focus:bg-white/10 border border-white/10 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40"
              />
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-blue-400 transition-colors" />
            </div>
          </div>

          <div className="space-y-2.5 pt-0.5">
            {/* Primary Email Auth Button */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full h-11 sm:h-12 bg-gradient-to-r from-purple-600 via-indigo-500 to-pink-500 text-white rounded-xl font-bold text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 mix-blend-overlay opacity-0 hover:opacity-100 transition-opacity" />
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>{isRegister ? 'Criar Conta' : 'Entrar'}</span>
              )}
            </button>

            {/* Google Authentication Button */}
            <button 
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-11 sm:h-12 bg-white/10 hover:bg-white/15 backdrop-blur-xl border border-white/15 text-white rounded-xl font-semibold text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 shadow-sm"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continuar com Google</span>
            </button>
          </div>
        </form>

        {/* Error message alert */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full text-[#FF3B30] text-center text-xs font-medium px-3 py-2 leading-tight bg-[#FF3B30]/15 rounded-xl border border-[#FF3B30]/30 backdrop-blur-md shrink-0 mb-1"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom: Toggle between Login and Register */}
        <div className="text-center pt-1 pb-1 shrink-0">
          <button 
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-white/60 hover:text-white font-medium text-xs sm:text-sm transition-colors py-1 px-3"
          >
            {isRegister ? 'Já tem uma conta? Entre aqui' : 'Ainda não tem conta? Crie uma'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
