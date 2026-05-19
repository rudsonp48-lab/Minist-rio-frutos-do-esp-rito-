import { useState } from 'react';
import { ChevronLeft, UserPlus, Heart, HandHeart, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTheme } from '../lib/ThemeContext';

export default function Volunteer() {
  const { themeColor } = useTheme();
  const [submitted, setSubmitted] = useState(false);
  
  const handleSubmit = (e: any) => {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-transparent w-full text-white font-sans max-w-7xl mx-auto px-6 pb-32">
      <header className="sticky top-0 z-40 bg-black/50 backdrop-blur-3xl border-b border-white/5 py-6 px-0 lg:px-6 flex items-center justify-between mb-8 shadow-2xl">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10 group">
             <ChevronLeft className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-2xl font-serif font-bold tracking-widest text-white uppercase">Voluntariado</h1>
            <div className="flex items-center gap-2 mt-1">
              <HandHeart className="w-3.5 h-3.5 text-[var(--theme-color)]" />
              <span className="text-[10px] font-bold text-[var(--theme-color)] uppercase tracking-[0.2em]">Servir com Amor</span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto items-center">
         <div>
            <div className="w-16 h-16 rounded-3xl bg-[var(--theme-color)]/20 flex items-center justify-center mb-6">
               <Heart className="w-8 h-8 text-[var(--theme-color)]" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-serif font-bold mb-6">Junte-se à nossa equipe.</h2>
            <p className="text-white/60 text-lg leading-relaxed mb-8">
              Acreditamos que cada pessoa tem dons e talentos únicos dados por Deus. Ao servir como voluntário, você não apenas ajuda a igreja, mas também cresce ministerialmente e abençoa vidas.
            </p>
            
            <div className="space-y-4">
               {['Mídia e Transmissão', 'Recepção e Acolhimento', 'Louvor e Adoração', 'Ministério Infantil', 'Ação Social'].map((area, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                     <CheckCircle2 className="w-5 h-5 text-[var(--theme-color)]" />
                     <span className="text-white/80 font-medium">{area}</span>
                  </div>
               ))}
            </div>
         </div>

         <div className="bg-[#111111] p-8 lg:p-10 rounded-[2rem] border border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--theme-color)]/10 blur-[80px] pointer-events-none rounded-full" />
            
            {submitted ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
                 <div className="w-20 h-20 rounded-full bg-[var(--theme-color)]/20 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-[var(--theme-color)]" />
                 </div>
                 <h3 className="text-2xl font-bold mb-4">Inscrição Recebida!</h3>
                 <p className="text-white/60">Nossa liderança entrará em contato em breve para os próximos passos. Obrigado por decidir servir!</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                <h3 className="text-xl font-bold mb-6">Ficha de Inscrição</h3>
                
                <div>
                  <input type="text" placeholder="Nome Completo" required className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-[var(--theme-color)] transition-colors text-white" />
                </div>
                <div>
                  <input type="email" placeholder="E-mail" required className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-[var(--theme-color)] transition-colors text-white" />
                </div>
                <div>
                  <input type="tel" placeholder="WhatsApp" required className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-[var(--theme-color)] transition-colors text-white" />
                </div>
                
                <div>
                  <select required className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-[var(--theme-color)] transition-colors text-white/70 appearance-none">
                    <option value="" disabled selected>Selecione uma Área de Interesse</option>
                    <option value="midia">Mídia e Transmissão</option>
                    <option value="recepcao">Recepção</option>
                    <option value="louvor">Louvor</option>
                    <option value="infantil">Infantil</option>
                    <option value="social">Ação Social</option>
                  </select>
                </div>

                <button type="submit" className="w-full h-14 bg-[var(--theme-color)] text-white shadow-[0_0_20px_var(--theme-color)]/30 rounded-2xl font-bold uppercase tracking-widest text-[12px] flex items-center justify-center gap-3 transition-transform active:scale-95 hover:bg-[var(--color-primary-focused)] mt-4">
                  <UserPlus className="w-4 h-4"/> Quero Servir
                </button>
              </form>
            )}
         </div>
      </div>
    </div>
  );
}
