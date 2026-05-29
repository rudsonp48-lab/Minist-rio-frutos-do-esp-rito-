import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Heart, Zap, PlayCircle, BookOpen } from 'lucide-react';

export function Onboarding() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const hasSeen = localStorage.getItem('has_seen_onboarding');
    if (!hasSeen) {
      setShow(true);
    }
  }, []);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(prev => prev + 1);
    } else {
      localStorage.setItem('has_seen_onboarding', 'true');
      setShow(false);
    }
  };

  const skip = () => {
    localStorage.setItem('has_seen_onboarding', 'true');
    setShow(false);
  };

  const STEPS = [
    {
      title: "Bem-vindo ao\nEcclesia",
      description: "Sua jornada de fé agora está na palma da sua mão com muito mais tecnologia e proximidade.",
      icon: Zap,
      color: "text-purple-500",
      bg: "bg-purple-500/10"
    },
    {
      title: "Devocional\nDiário",
      description: "Crie uma constância! Leia seu devocional, acumule ofensivas diárias e ganhe recompensas em sua jornada.",
      icon: BookOpen,
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    {
      title: "Louvor &\nPalavra",
      description: "Ouça nossas webrádios, playlists exclusivas e assista aos cultos da onde você estiver.",
      icon: PlayCircle,
      color: "text-red-500",
      bg: "bg-red-500/10"
    },
    {
      title: "Família\nUnida",
      description: "Compartilhe seus momentos na galeria, envie pedidos de oração e ajude a comunidade a crescer.",
      icon: Heart,
      color: "text-[var(--theme-color)]",
      bg: "bg-[var(--theme-color)]/10"
    }
  ];

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[999] bg-black text-white flex flex-col pointer-events-auto"
      >
        {/* Dynamic Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
             animate={{ 
                x: [0, 50, -50, 0], 
                y: [0, -50, 50, 0],
                scale: [1, 1.2, 1]
             }}
             transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
             className={`absolute top-0 left-0 w-96 h-96 blur-[120px] rounded-full mix-blend-screen transition-colors duration-1000 ${STEPS[step].bg.replace('/10', '/30')}`} 
          />
        </div>

        <div className="flex-1 flex flex-col justify-center px-8 relative z-10">
           <AnimatePresence mode="wait">
             <motion.div
               key={step}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               transition={{ duration: 0.4 }}
             >
                <div className={`w-20 h-20 rounded-3xl ${STEPS[step].bg} flex items-center justify-center mb-8 ios-shadow`}>
                   {(() => {
                     const IconElement = STEPS[step].icon;
                     return <IconElement className={`w-10 h-10 ${STEPS[step].color}`} />;
                   })()}
                </div>
                <h1 className="text-4xl font-display font-bold leading-tight mb-4 whitespace-pre-line">
                  {STEPS[step].title}
                </h1>
                <p className="text-lg text-white/60">
                  {STEPS[step].description}
                </p>
             </motion.div>
           </AnimatePresence>
        </div>

        <div className="p-8 pb-safe-bottom relative z-10 flex flex-col gap-6">
           <div className="flex gap-2 mb-4 justify-center">
             {STEPS.map((_, i) => (
               <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-white' : 'w-2 bg-white/20'}`} />
             ))}
           </div>
           
           <div className="flex items-center gap-4">
             <button onClick={skip} className="px-6 py-4 font-bold text-white/50 active:scale-95 transition-transform">
               Pular
             </button>
             <button 
               onClick={handleNext}
               className="flex-1 rounded-[20px] bg-white text-black py-4 font-bold flex items-center justify-center gap-2 ios-shadow active:scale-[0.98] transition-transform"
             >
               {step === STEPS.length - 1 ? 'Começar agora' : 'Continuar'}
               <ChevronRight className="w-5 h-5" />
             </button>
           </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
