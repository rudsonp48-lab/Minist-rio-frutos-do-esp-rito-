import { useState, useEffect } from 'react';
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
import { Church } from 'lucide-react';

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { churchName, logoUrl } = useTheme();

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
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6 text-white font-sans overflow-hidden relative">
      {/* Background Animation */}
      <div className="absolute inset-0 w-full h-full z-0 opacity-40 pointer-events-none">
        <iframe src="https://my.spline.design/particlesmoment-kW3xyVny6weIhXJ3vbs2M2bB" frameBorder="0" width="100%" height="100%"></iframe>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent z-0 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-[360px] relative z-10 space-y-12"
      >
        <div className="text-center space-y-4">
           <div className="w-24 h-24 bg-white/5 backdrop-blur-xl rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl border border-white/10 overflow-hidden">
             {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-16 h-16 object-contain" />
             ) : (
                <Church className="w-12 h-12 text-white" />
             )}
           </div>
           <div className="space-y-1">
             <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">{churchName || 'Ecclesia'}</h1>
             <p className="text-sm font-medium text-white/50 tracking-wide uppercase">Acesso Global</p>
           </div>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden divide-y divide-white/10">
            <input 
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="E-mail"
              className="w-full h-14 px-6 bg-transparent outline-none text-[16px] font-medium placeholder:text-white/30 text-white transition-colors focus:bg-white/5"
            />
            <input 
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Senha"
              className="w-full h-14 px-6 bg-transparent outline-none text-[16px] font-medium placeholder:text-white/30 text-white transition-colors focus:bg-white/5"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-white text-black rounded-2xl font-bold active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_0_40px_rgba(255,255,255,0.3)]"
          >
            {loading ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <span>{isRegister ? 'Criar Conta' : 'Entrar'}</span>}
          </button>

          <button 
            type="button"
            onClick={handleGoogleLogin}
            className="w-full h-14 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-2xl font-bold active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-white/80 hover:text-white"
          >
            <img src="https://www.google.com/favicon.ico" className="w-4 h-4 opacity-80" alt="Google" />
            <span>Continuar com Google</span>
          </button>
        </form>

        <div className="text-center">
          <button 
            onClick={() => setIsRegister(!isRegister)}
            className="text-white/40 hover:text-white font-medium text-sm transition-colors"
          >
            {isRegister ? 'Já tenho uma conta? Entrar' : 'Novo por aqui? Crie uma conta'}
          </button>
        </div>

        {error && (
          <p className="text-[#FF3B30] text-center text-xs font-bold px-8 leading-snug">{error}</p>
        )}

      </motion.div>
    </div>
  );
}
