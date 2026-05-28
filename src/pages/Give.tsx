import { motion } from 'motion/react';
import { Heart, CreditCard, QrCode, ArrowRight, Building, Copy, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Give() {
  const [copiedPix, setCopiedPix] = useState(false);
  const [copiedBanco, setCopiedBanco] = useState(false);
  
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'app_config', 'main'), (snapshot) => {
      if (snapshot.exists()) {
        setConfig(snapshot.data());
      }
    });
    return () => unsubscribe();
  }, []);

  const pixKey = config?.pixKey || "00.000.000/0001-00";
  const bankDetails = config?.bankDetails || "Agência: 0001\nConta: 12345-6\nBanco Inter";

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
  };

  const handleCopyBanco = () => {
    navigator.clipboard.writeText(bankDetails);
    setCopiedBanco(true);
    setTimeout(() => setCopiedBanco(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-black/95">
      {/* Header */}
      <div className="pt-20 lg:pt-12 px-6 mb-8 max-w-5xl mx-auto flex items-end justify-between">
         <div>
           <div className="flex items-center gap-3 mb-2">
             <div className="w-10 h-10 rounded-full bg-[var(--theme-color)]/10 flex items-center justify-center">
               <Heart className="w-5 h-5 text-[var(--theme-color)]" />
             </div>
             <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[var(--theme-color)]">Contribuição</span>
           </div>
           <h1 className="text-4xl lg:text-5xl font-display font-bold tracking-tight text-black dark:text-white">Dízimos e Ofertas</h1>
         </div>
      </div>

      <div className="px-6 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 pb-32">
        {/* Intro / Vision */}
        <div className="flex flex-col gap-6">
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="ios-card bg-gradient-to-br from-[var(--theme-color)] to-purple-600 p-8 rounded-[32px] text-white overflow-hidden relative"
           >
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
             <div className="relative z-10">
               <Heart className="w-12 h-12 mb-6 opacity-90 fill-white/20" />
               <h2 className="text-3xl font-bold mb-4 font-display leading-tight">Cada um dê conforme determinou em seu coração.</h2>
               <p className="text-white/80 font-medium leading-relaxed mb-8">Não com pesar ou por obrigação, pois Deus ama quem dá com alegria. (2 Coríntios 9:7)</p>
               <div className="flex items-center gap-2 text-sm font-bold bg-white/20 px-4 py-2 rounded-full w-fit backdrop-blur-md border border-white/20">
                 <CheckCircle2 className="w-4 h-4" />
                 Ambiente 100% Seguro
               </div>
             </div>
           </motion.div>
           
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.1 }}
             className="ios-card bg-white dark:bg-[#1C1C1E] p-8 rounded-[32px] border border-black/5 dark:border-white/5"
           >
              <div className="flex items-center gap-3 mb-6 block">
                 <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                   <CreditCard className="w-6 h-6 text-blue-500" />
                 </div>
                 <div>
                   <h3 className="text-xl font-bold text-black dark:text-white">Cartão de Crédito</h3>
                   <p className="text-sm text-black/60 dark:text-white/60 font-medium">Contribua de forma rápida e segura</p>
                 </div>
              </div>
              <button 
                onClick={() => {
                  if (config?.cardUrl) {
                    window.open(config.cardUrl, '_blank');
                  } else {
                    alert("Link de pagamento não configurado no painel de controle.");
                  }
                }}
                className="w-full flex items-center justify-center gap-2 h-14 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-[15px] hover:scale-[1.02] transition-transform shadow-lg"
              >
                <CreditCard className="w-5 h-5" />
                Contribuir com Cartão
              </button>
           </motion.div>
        </div>

        {/* Payment Methods */}
        <div className="flex flex-col gap-6">
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.2 }}
             className="ios-card bg-white dark:bg-[#1C1C1E] p-8 rounded-[32px] border border-black/5 dark:border-white/5"
           >
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                   <QrCode className="w-6 h-6 text-emerald-500" />
                 </div>
                 <div>
                   <h3 className="text-xl font-bold text-black dark:text-white mb-0.5">PIX (Transferência)</h3>
                   <p className="text-sm text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">CNPJ</p>
                 </div>
              </div>
              
              <div className="flex flex-col gap-4">
                 <div className="bg-black/5 dark:bg-white/5 p-6 rounded-[24px] text-center border border-black/5 dark:border-white/5">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(pixKey)}`} alt="QR Code PIX" className="w-32 h-32 mx-auto mix-blend-darken dark:mix-blend-screen opacity-90 mb-4" />
                    <p className="text-[13px] font-mono text-black/60 dark:text-white/60 mb-1">Chave CNPJ</p>
                    <p className="text-xl font-bold font-mono tracking-wider text-black dark:text-white mb-4">{pixKey}</p>
                    <button 
                      onClick={handleCopyPix}
                      className="w-full flex items-center justify-center gap-2 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold hover:bg-emerald-500/20 transition-colors"
                    >
                      {copiedPix ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copiedPix ? 'Chave Copiada!' : 'Copiar Chave PIX'}
                    </button>
                 </div>
              </div>
           </motion.div>
           
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.3 }}
             className="ios-card bg-white dark:bg-[#1C1C1E] p-8 rounded-[32px] border border-black/5 dark:border-white/5"
           >
              <div className="flex items-center gap-3 mb-6 block">
                 <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                   <Building className="w-6 h-6 text-amber-500" />
                 </div>
                 <div>
                   <h3 className="text-xl font-bold text-black dark:text-white">Transferência Bancária</h3>
                   <p className="text-sm text-black/60 dark:text-white/60 font-medium">Dados para TED, DOC ou Depósito</p>
                 </div>
              </div>
              
              <div className="bg-black/5 dark:bg-white/5 p-5 rounded-[20px] flex flex-col gap-3 font-mono text-sm border border-black/5 dark:border-white/5">
                <p className="text-black dark:text-white whitespace-pre-wrap font-bold leading-relaxed">{bankDetails}</p>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-black/50 dark:text-white/50">CNPJ</span>
                  <span className="font-bold text-black dark:text-white">{pixKey}</span>
                </div>
                <button 
                  onClick={handleCopyBanco}
                  className="w-full flex items-center justify-center gap-2 h-10 mt-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold hover:bg-amber-500/20 transition-colors"
                >
                  {copiedBanco ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedBanco ? 'Dados Copiados!' : 'Copiar Dados Conta'}
                </button>
              </div>
           </motion.div>
        </div>
      </div>
    </div>
  );
}
