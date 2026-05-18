import { useState } from 'react';
import { auth } from '../lib/firebase';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { Mail, Lock, Plus, LogIn, ChevronRight, Apple } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../lib/ThemeContext';

export default function Login() {
  const { churchName, themeColor } = useTheme();
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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white font-sans overflow-hidden relative">
      {/* Background Frame */}
      <div className="spline-container absolute inset-0 w-full h-full z-0 pointer-events-none opacity-50 mix-blend-screen overflow-hidden">
        <iframe src="https://my.spline.design/particlesmoment-kW3xyVny6weIhXJ3vbs2M2bB" frameBorder="0" width="100%" height="100%"></iframe>
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-0" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[380px] relative z-10 space-y-12"
      >
        <div className="text-center space-y-12 flex flex-col items-center">
           <motion.div 
             initial={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
             animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
             transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
             className="flex items-center justify-center pt-8"
           >
             <h1 
               className="text-4xl md:text-5xl font-serif tracking-[0.15em] leading-[1.1] uppercase"
               style={{ 
                 fontFamily: '"Playfair Display", "Cinzel", serif',
                 fontWeight: 400,
                 background: 'linear-gradient(135deg, #FFFFFF 0%, #A0A0A0 100%)',
                 WebkitBackgroundClip: 'text',
                 WebkitTextFillColor: 'transparent',
                 filter: 'drop-shadow(0 4px 12px rgba(255,255,255,0.15))',
                 fontVariantLigatures: 'common-ligatures'
               }}
             >
               {churchName || 'ECCLESIA'}
             </h1>
           </motion.div>
           
           <div className="space-y-2">
             <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Bem-vindo(a)</h2>
             <p className="text-[15px] font-medium text-white/50">Acesse sua conta para continuar.</p>
           </div>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-5">
          <div className="bg-black/40 backdrop-blur-3xl rounded-[2rem] p-3 border border-white/10 shadow-2xl space-y-3 relative overflow-hidden group">
            {/* Ambient inner glow */}
            <div className="absolute -inset-10 bg-white/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
            
            <div className="relative">
              <input 
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="E-mail"
                className="w-full h-[60px] pl-14 pr-6 bg-white/5 rounded-2xl outline-none text-[16px] font-medium placeholder:text-white/30 text-white transition-all focus:bg-white/10 border border-transparent focus:border-white/10"
              />
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            </div>

            <div className="relative">
              <input 
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Senha"
                className="w-full h-[60px] pl-14 pr-6 bg-white/5 rounded-2xl outline-none text-[16px] font-medium placeholder:text-white/30 text-white transition-all focus:bg-white/10 border border-transparent focus:border-white/10"
              />
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <button 
              type="submit"
              disabled={loading}
              className="w-full h-[60px] bg-white text-black rounded-2xl font-bold text-[16px] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)]"
            >
              {loading ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <span>{isRegister ? 'Criar Conta' : 'Entrar'}</span>}
            </button>

            <button 
              type="button"
              onClick={handleGoogleLogin}
              className="w-full h-[60px] bg-white/5 backdrop-blur-md border border-white/10 text-white rounded-2xl font-bold text-[16px] active:scale-[0.98] transition-all flex items-center justify-center gap-3 hover:bg-white/10"
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5 grayscale opacity-80" alt="Google" />
              <span>Continuar com Google</span>
            </button>
          </div>
        </form>

        <div className="text-center pt-2">
          <button 
            onClick={() => setIsRegister(!isRegister)}
            className="text-white/60 hover:text-white font-medium text-[15px] transition-colors"
          >
            {isRegister ? 'Já tem uma conta? Entre aqui' : 'Ainda não tem conta? Crie uma'}
          </button>
        </div>

        <AnimatePresence>
          {error && (
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-[#FF3B30] text-center text-sm font-medium px-8 leading-snug bg-[#FF3B30]/10 py-3 rounded-xl border border-[#FF3B30]/20 backdrop-blur-md"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <footer className="pt-6 pb-2 text-center text-[11px] font-bold text-white/30 uppercase tracking-[0.3em]">
          Sync Protocol v4.2.0 • 2026
        </footer>
      </motion.div>
    </div>
  );
}
