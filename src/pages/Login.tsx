import { useState } from 'react';
import { auth } from '../lib/firebase';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { Church, Mail, ArrowRight, Lock, UserPlus, LogIn, Plus } from 'lucide-react';
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
      setError("Erro ao autenticar com Google. Tente novamente.");
      console.error(err);
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
      setError(
        err.code === 'auth/user-not-found' ? 'Usuário não encontrado.' :
        err.code === 'auth/wrong-password' ? 'Senha incorreta.' :
        err.code === 'auth/email-already-in-use' ? 'E-mail em uso.' :
        err.code === 'auth/weak-password' ? 'Senha muito fraca.' :
        'Ocorreu um erro. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Cyber Glows */}
      <div className="absolute top-1/4 -left-20 w-[600px] h-[600px] bg-yellow-400/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-1/4 -right-20 w-[600px] h-[600px] bg-yellow-400/5 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[340px] relative px-2"
      >
        <div className="glass p-px rounded-[1.2rem] shadow-4xl relative overflow-hidden backdrop-blur-3xl">
           <div className="glass-dark bg-zinc-950/90 rounded-[1.15rem] p-5 md:p-7 relative">
              
              {/* Top Accent */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-yellow-400 rounded-b-full glow-yellow" />
              
              <div className="flex flex-col items-center mb-6 text-center">
                <motion.div
                  initial={{ rotate: -10, scale: 0.9 }}
                  animate={{ rotate: 0, scale: 1 }}
                  whileHover={{ rotate: 5, scale: 1.1 }}
                  className="w-10 h-10 glass flex items-center justify-center rounded-xl glow-yellow shadow-xl mb-4 border-yellow-400/20"
                >
                  {isRegister ? <Plus className="w-5 h-5 text-yellow-400" /> : <LogIn className="w-5 h-5 text-yellow-400" />}
                </motion.div>
                
                <h1 className="text-xl md:text-2xl font-display font-black italic uppercase tracking-tighter mb-1 text-white">
                  {isRegister ? 'Nova' : 'Bem'}-<span className="text-yellow-400">{isRegister ? 'Conta' : 'Vindo'}</span>
                </h1>
                <p className="text-zinc-600 text-[7px] uppercase font-black tracking-[0.4em] opacity-50">
                   Nexus Core ID
                </p>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-2.5">
                <div className="space-y-2.5">
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 glass flex items-center justify-center rounded-lg border-white/5 group-focus-within:border-yellow-400/40 transition-all">
                       <Mail className="w-3 h-3 text-zinc-600 group-focus-within:text-yellow-400 transition-colors" />
                    </div>
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email" 
                      className="w-full glass-dark bg-zinc-900/40 border border-white/5 rounded-xl py-3 pl-12 pr-4 font-display font-black italic tracking-tighter text-sm focus:outline-none focus:border-yellow-400/40 transition-all text-white placeholder:text-zinc-800"
                    />
                  </div>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 glass flex items-center justify-center rounded-lg border-white/5 group-focus-within:border-yellow-400/40 transition-all">
                       <Lock className="w-3 h-3 text-zinc-600 group-focus-within:text-yellow-400 transition-colors" />
                    </div>
                    <input 
                      type="password" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Senha" 
                      className="w-full glass-dark bg-zinc-900/40 border border-white/5 rounded-xl py-3 pl-12 pr-4 font-display font-black italic tracking-tighter text-sm focus:outline-none focus:border-yellow-400/40 transition-all text-white placeholder:text-zinc-800"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-black font-display font-black italic uppercase tracking-tighter text-sm py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-yellow-400 hover:scale-[1.02] active:scale-95 transition-all shadow-4xl glow-yellow disabled:opacity-50 mt-4"
                >
                  {isRegister ? <Plus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                  <span>{isRegister ? 'GERAR ID' : 'ENTRAR'}</span>
                </button>
              </form>

              <div className="relative py-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/5"></div>
                </div>
                <div className="relative flex justify-center text-[6px] font-black uppercase tracking-[0.5em] text-zinc-800">
                  <span className="glass-dark bg-zinc-950 px-3 py-1 rounded-full">Legacy Auth</span>
                </div>
              </div>

              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full glass-dark bg-white/5 border border-white/5 text-white font-display font-black uppercase italic tracking-widest text-[7px] py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-yellow-400/10 transition-all group"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-3.5 h-3.5 grayscale group-hover:grayscale-0 transition-all" />
                <span>GOOGLE SYNC</span>
              </button>

              <div className="mt-5 text-center">
                <button 
                  onClick={() => setIsRegister(!isRegister)}
                  className="text-[7px] font-black uppercase tracking-[0.3em] text-zinc-600 hover:text-yellow-400 transition-all"
                >
                  {isRegister ? 'VOLTAR ' : 'NOVO? '}
                  <span className="text-yellow-400 underline underline-offset-2 decoration-yellow-400/40 ml-1">
                    {isRegister ? 'LOGIN' : 'CRIAR ID'}
                  </span>
                </button>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="mt-4 p-3 glass-dark bg-red-500/5 border border-red-500/20 rounded-xl text-red-500 text-[7px] text-center font-black uppercase tracking-[0.2em] leading-relaxed"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-col items-center mt-8 space-y-2">
                 <div className="w-8 h-[1px] bg-zinc-900" />
                 <p className="text-[6px] text-zinc-800 uppercase font-black tracking-[0.4em]">
                   NXR • V3.1
                 </p>
              </div>
           </div>
        </div>
      </motion.div>
    </div>
  );
}
