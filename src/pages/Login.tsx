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

export default function Login() {
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
      setError("Erro ao autenticar.");
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
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white font-sans overflow-hidden">
      {/* iOS Blur Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-[#1C1C1E] to-[#2C2C2E]" />
      <div className="absolute top-[-20%] left-[-20%] w-[100%] aspect-square bg-[#007AFF]/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[100%] aspect-square bg-[#AF52DE]/10 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[360px] relative z-10 space-y-12"
      >
        <div className="text-center space-y-4">
           <div className="w-20 h-20 bg-gradient-to-br from-white to-gray-200 rounded-[1.5rem] flex items-center justify-center mx-auto ios-shadow">
             <div className="w-16 h-16 rounded-[1.2rem] bg-black flex items-center justify-center">
               <Apple className="w-10 h-10 text-white fill-current" />
             </div>
           </div>
           <div className="space-y-1">
             <h1 className="text-3xl font-bold tracking-tight">Ecclesia</h1>
             <p className="text-sm font-medium text-[#8E8E93]">O Reino em sua mão.</p>
           </div>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div className="ios-card bg-white/10 backdrop-blur-3xl overflow-hidden divide-y divide-white/10">
            <input 
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="E-mail"
              className="w-full h-14 px-6 bg-transparent outline-none text-[17px] font-medium placeholder:text-[#8E8E93]"
            />
            <input 
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Senha"
              className="w-full h-14 px-6 bg-transparent outline-none text-[17px] font-medium placeholder:text-[#8E8E93]"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-white text-black rounded-2xl font-bold active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <span>{isRegister ? 'Continuar' : 'Entrar'}</span>}
          </button>

          <button 
            type="button"
            onClick={handleGoogleLogin}
            className="w-full h-14 bg-white/10 rounded-2xl font-bold active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
            <span>Continuar com Google</span>
          </button>
        </form>

        <div className="text-center">
          <button 
            onClick={() => setIsRegister(!isRegister)}
            className="text-[#007AFF] font-bold text-sm"
          >
            {isRegister ? 'Já tenho conta' : 'Criar minha conta agora'}
          </button>
        </div>

        {error && (
          <p className="text-[#FF3B30] text-center text-xs font-bold px-8 leading-snug">{error}</p>
        )}

        <footer className="pt-12 text-center text-[11px] font-bold text-[#8E8E93] uppercase tracking-widest opacity-50">
          Sync Protocol v4.2.0 • 2026
        </footer>
      </motion.div>
    </div>
  );
}
