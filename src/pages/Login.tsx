import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { Mail, Lock, Church, Eye, EyeOff, Sparkles, CheckCircle2, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../lib/ThemeContext';
import { makeTransparentLogo } from '../lib/transparentLogo';

export default function Login() {
  const { churchName, logoUrl } = useTheme();
  const [cleanLogoUrl, setCleanLogoUrl] = useState<string>(() => {
    return localStorage.getItem('app_clean_logo_url') || '/church_logo_transparent.png';
  });
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Process logo to remove any black/dark background and get a pure transparent PNG
  useEffect(() => {
    if (!logoUrl) {
      setCleanLogoUrl('/church_logo_transparent.png');
      return;
    }
    if (logoUrl === '/church_logo_transparent.png' || logoUrl.includes('church_logo_transparent.png')) {
      setCleanLogoUrl('/church_logo_transparent.png');
      return;
    }

    let isCurrent = true;
    makeTransparentLogo(logoUrl)
      .then((processed) => {
        if (isCurrent && processed) {
          setCleanLogoUrl(processed);
          try {
            localStorage.setItem('app_clean_logo_url', processed);
          } catch (e) {
            // ignore
          }
        }
      })
      .catch(() => {
        if (isCurrent) setCleanLogoUrl(logoUrl);
      });
    return () => {
      isCurrent = false;
    };
  }, [logoUrl]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      if (err.code === 'auth/unauthorized-domain' || err.message?.includes('unauthorized domain')) {
        setError(`O domínio "${window.location.hostname}" não está autorizado para login. Adicione-o no Console do Firebase > Authentication > Settings > Authorized Domains.`);
      } else {
        setError(`Erro: ${err.message || "Erro ao autenticar com Google."}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      if (isResetPassword) {
        await sendPasswordResetEmail(auth, email);
        setSuccessMsg("E-mail de recuperação enviado! Verifique sua caixa de entrada.");
        return;
      }

      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError("E-mail ou senha incorretos.");
      } else if (err.code === 'auth/email-already-in-use') {
        setError("Este e-mail já está cadastrado. Tente entrar.");
      } else if (err.code === 'auth/weak-password') {
        setError("A senha deve ter pelo menos 6 caracteres.");
      } else {
        setError(err.message || "Erro ao autenticar.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full bg-[#07070b] flex flex-col items-center justify-between px-4 sm:px-6 py-4 sm:py-6 text-white font-sans overflow-hidden relative select-none">
      {/* Ambient Lighting & Atmosphere */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[90vw] max-w-[600px] h-[340px] bg-gradient-to-b from-amber-500/15 via-purple-600/15 to-transparent blur-[110px] pointer-events-none rounded-full" />
      <div className="absolute -bottom-20 right-[-10%] w-[50vw] h-[50vw] bg-indigo-600/15 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute top-[35%] left-[-15%] w-[45vw] h-[45vw] bg-purple-700/10 blur-[130px] rounded-full mix-blend-screen pointer-events-none" />

      {/* Spline cosmic particle background */}
      <div className="spline-container absolute inset-0 w-full h-full z-0 pointer-events-none opacity-30 mix-blend-screen overflow-hidden">
        <iframe src="https://my.spline.design/particlesmoment-kW3xyVny6weIhXJ3vbs2M2bB" frameBorder="0" width="100%" height="100%"></iframe>
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/25 to-[#07070b] z-0 pointer-events-none" />

      {/* Central Interactive Content */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[390px] sm:max-w-[430px] h-full max-h-[660px] flex flex-col justify-between items-center relative z-10 my-auto"
      >
        {/* Top: Grand Majestic Transparent Logo */}
        <div className="w-full flex flex-col items-center justify-center shrink-0 pt-2 sm:pt-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full flex flex-col items-center justify-center relative"
          >
            {/* Celestial Golden Halo behind logo */}
            <div className="absolute inset-0 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(234,179,8,0.25)_0%,rgba(147,51,234,0.18)_50%,transparent_75%)] blur-3xl -z-10 scale-135 pointer-events-none" />

            <div className="w-full max-w-[340px] sm:max-w-[380px] h-[210px] sm:h-[240px] flex items-center justify-center relative p-0">
              <img 
                src={cleanLogoUrl || logoUrl || '/church_logo_transparent.png'} 
                alt={churchName || "Ministério Frutos do Espírito"} 
                className="w-full h-full object-contain filter drop-shadow-[0_12px_36px_rgba(0,0,0,0.9)] drop-shadow-[0_0_30px_rgba(234,179,8,0.25)] select-none pointer-events-none scale-105 transform-gpu transition-all duration-300" 
              />
            </div>
          </motion.div>
          
          {/* Subtle mode badge when registering or resetting */}
          {(isRegister || isResetPassword) && (
            <motion.div 
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.08] border border-white/15 text-xs text-white/90 font-medium backdrop-blur-md"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{isResetPassword ? 'Recuperação de Senha' : 'Criar Nova Conta'}</span>
            </motion.div>
          )}
        </div>

        {/* Center: Frosted Glass Form Card */}
        <form onSubmit={handleEmailAuth} className="w-full space-y-3.5 my-auto">
          <div className="w-full bg-[#121217]/85 backdrop-blur-2xl rounded-2xl p-3 sm:p-3.5 border border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.6)] space-y-2.5 relative group">
            {/* Ambient inner card glow */}
            <div className="absolute -inset-10 bg-gradient-to-r from-amber-500/10 via-purple-600/10 to-indigo-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            {/* Email Field */}
            <div className="relative">
              <input 
                id="login-email-input"
                type="email" 
                required 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                placeholder="Seu e-mail"
                className="w-full h-12 pl-12 pr-4 bg-[#0a0a0f] rounded-xl outline-none text-sm font-normal placeholder:text-zinc-500 text-white transition-all focus:bg-[#121218] border border-white/[0.08] focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/40"
              />
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-purple-400 transition-colors" />
            </div>

            {/* Password Field (hidden in reset mode) */}
            {!isResetPassword && (
              <div className="relative">
                <input 
                  id="login-password-input"
                  type={showPassword ? 'text' : 'password'} 
                  required 
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  className="w-full h-12 pl-12 pr-12 bg-[#0a0a0f] rounded-xl outline-none text-sm font-normal placeholder:text-zinc-500 text-white transition-all focus:bg-[#121218] border border-white/[0.08] focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/40"
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-amber-400 transition-colors" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-0.5">
            {/* Primary Action Button */}
            <button 
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-[#6A11CB] via-[#7B1FA2] to-[#8E24AA] hover:brightness-110 text-white rounded-xl font-semibold text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_4px_25px_rgba(123,31,162,0.4)] border border-white/10"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>
                  {isResetPassword 
                    ? 'Enviar Link de Redefinição' 
                    : isRegister 
                      ? 'Cadastrar e Entrar' 
                      : 'Entrar'}
                </span>
              )}
            </button>

            {/* Google Authentication Button */}
            {!isResetPassword && (
              <button 
                id="login-google-btn"
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full h-12 bg-[#121217]/90 hover:bg-[#1a1a22] border border-white/[0.08] text-white rounded-xl font-medium text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-sm"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continuar com Google</span>
              </button>
            )}
          </div>
        </form>

        {/* Feedback Messages */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full text-rose-300 text-center text-xs font-medium px-3 py-2 leading-tight bg-rose-500/15 rounded-xl border border-rose-500/30 backdrop-blur-md shrink-0 mb-1"
            >
              {error}
            </motion.div>
          )}

          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full text-emerald-300 text-center text-xs font-medium px-3 py-2 leading-tight bg-emerald-500/15 rounded-xl border border-emerald-500/30 backdrop-blur-md shrink-0 mb-1 flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Navigation Links */}
        <div className="flex flex-col items-center gap-1.5 pt-1 pb-1 shrink-0 text-xs">
          {isResetPassword ? (
            <button 
              type="button"
              onClick={() => {
                setIsResetPassword(false);
                setError(null);
                setSuccessMsg(null);
              }}
              className="text-white/70 hover:text-white font-medium flex items-center gap-1.5 transition-colors py-1 px-3"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar para o login</span>
            </button>
          ) : (
            <>
              <button 
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="text-zinc-400 hover:text-white font-normal transition-colors py-0.5 px-3 text-xs"
              >
                {isRegister ? 'Já tem uma conta? Entre aqui' : 'Ainda não tem conta? Crie uma'}
              </button>

              {!isRegister && (
                <button
                  type="button"
                  onClick={() => {
                    setIsResetPassword(true);
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors text-xs"
                >
                  Esqueceu a senha?
                </button>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

