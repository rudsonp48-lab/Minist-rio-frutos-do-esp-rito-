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
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-white font-sans overflow-hidden relative">
      {/* Dynamic Colorful Backgrounds */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-purple-600/30 blur-[120px] rounded-full mix-blend-screen animate-[pulse_8s_ease-in-out_infinite] z-0 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen animate-[pulse_10s_ease-in-out_infinite_2s] z-0 pointer-events-none" />
      <div className="absolute top-[40%] left-[60%] w-[40vw] h-[40vw] bg-pink-600/20 blur-[100px] rounded-full mix-blend-screen animate-[pulse_9s_ease-in-out_infinite_4s] z-0 pointer-events-none" />

      {/* Spline particles - subtle */}
      <div className="spline-container absolute inset-0 w-full h-full z-0 pointer-events-none opacity-30 mix-blend-screen overflow-hidden">
        <iframe src="https://my.spline.design/particlesmoment-kW3xyVny6weIhXJ3vbs2M2bB" frameBorder="0" width="100%" height="100%"></iframe>
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black z-0 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[380px] relative z-10 space-y-12"
      >
        <div className="text-center space-y-10 flex flex-col items-center">
           <motion.div 
             initial={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
             animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
             transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
             className="flex flex-col items-center justify-center pt-8 gap-5"
           >
             {/* Animated Church Logo */}
             <motion.div 
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(168, 85, 247, 0.3)",
                    "0 0 50px rgba(59, 130, 246, 0.5)",
                    "0 0 20px rgba(168, 85, 247, 0.3)"
                  ]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="w-24 h-24 rounded-[2rem] bg-gradient-to-tr from-purple-500 via-blue-500 to-pink-500 p-[2px] shadow-2xl relative"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500 via-blue-500 to-pink-500 blur-xl opacity-50 rounded-[2rem]" />
                <div className="w-full h-full rounded-[2rem] bg-black/80 flex items-center justify-center backdrop-blur-xl relative z-10">
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Church className="w-10 h-10 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
                  </motion.div>
                </div>
             </motion.div>
             
             <h1 
               className="text-4xl md:text-5xl font-serif tracking-[0.3em] leading-[1.1] uppercase ml-3 mt-2"
               style={{ 
                 fontFamily: '"Playfair Display", "Cinzel", serif',
                 fontWeight: 300,
                 background: 'linear-gradient(135deg, #FFFFFF 0%, #E0E0E0 50%, #ECECEC 100%)',
                 WebkitBackgroundClip: 'text',
                 WebkitTextFillColor: 'transparent',
                 filter: 'drop-shadow(0 4px 12px rgba(255,255,255,0.15))',
                 fontVariantLigatures: 'common-ligatures'
               }}
             >
               ÉCLÉSIA
             </h1>
             <div className="flex items-center gap-4 mt-2 mb-4 w-full px-8">
               <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
               <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300">Ministério</span>
               <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
             </div>
           </motion.div>
           
           <div className="space-y-2">
             <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Bem-vindo(a)</h2>
             <p className="text-[15px] font-medium text-white/60">Acesse sua conta para curtir a experiência.</p>
           </div>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-5">
          <div className="bg-white/[0.03] backdrop-blur-3xl rounded-[1.5rem] p-3 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] space-y-3 relative overflow-hidden group">
            {/* Ambient inner glow on hover */}
            <div className="absolute -inset-10 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-pink-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
            
            <div className="relative">
              <input 
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="E-mail"
                className="w-full h-[60px] pl-14 pr-6 bg-black/40 rounded-xl outline-none text-[16px] font-medium placeholder:text-white/30 text-white transition-all focus:bg-white/10 border border-white/5 focus:border-purple-500/50 focus:shadow-[0_0_20px_rgba(168,85,247,0.2)]"
              />
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-purple-400 transition-colors" />
            </div>

            <div className="relative">
              <input 
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Senha"
                className="w-full h-[60px] pl-14 pr-6 bg-black/40 rounded-xl outline-none text-[16px] font-medium placeholder:text-white/30 text-white transition-all focus:bg-white/10 border border-white/5 focus:border-blue-500/50 focus:shadow-[0_0_20px_rgba(59,130,246,0.2)]"
              />
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-blue-400 transition-colors" />
            </div>
          </div>

          <div className="pt-4 flex flex-col gap-4">
            <button 
              type="submit"
              disabled={loading}
              className="w-full h-[60px] bg-gradient-to-r from-purple-600 via-blue-500 to-pink-500 text-white rounded-xl font-bold text-[16px] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 mix-blend-overlay opacity-0 hover:opacity-100 transition-opacity" />
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span>{isRegister ? 'Criar Conta' : 'Entrar'}</span>}
            </button>

            <button 
              type="button"
              onClick={handleGoogleLogin}
              className="w-full h-[60px] bg-white/5 backdrop-blur-xl border border-white/10 text-white rounded-xl font-bold text-[16px] active:scale-[0.98] transition-all flex items-center justify-center gap-3 hover:bg-white/10 hover:border-white/20"
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5 opacity-90" alt="Google" />
              <span>Continuar com Google</span>
            </button>
          </div>
        </form>

        <div className="text-center pt-2 pb-6">
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
      </motion.div>
    </div>
  );
}
