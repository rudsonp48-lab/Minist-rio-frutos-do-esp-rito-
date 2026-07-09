import { useState, useEffect } from 'react';
import { Play, Youtube, Users, Share2, Radio, Bell } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'motion/react';

export default function LiveStream() {
  const [config, setConfig] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'app_config', 'main'), (docSnap) => {
      if (docSnap.exists()) {
        setConfig(docSnap.data());
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const videoId = config.liveVideoId || 'u31qwQUeGuM'; // example
  const isLive = config.isLiveActive || false;

  return (
    <div className="min-h-screen bg-transparent w-full text-white font-sans max-w-7xl mx-auto px-6 pb-32">
      <header className="py-8 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-red-500 font-bold tracking-widest uppercase text-sm">
          <Radio className="w-4 h-4 animate-pulse" />
          <span>Transmissão</span>
        </div>
        <h1 className="text-4xl lg:text-5xl font-display font-bold tracking-tight text-white mb-2">Culto Ao Vivo</h1>
        <p className="text-white/60 text-lg">Acompanhe nossa celebração em tempo real, de onde você estiver.</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
         <div className="flex-1">
            <div className={`w-full aspect-video rounded-[32px] overflow-hidden relative ios-card border ${isLive ? 'border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.15)]' : 'border-white/5 shadow-2xl'}`}>
              <iframe 
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0`}
                title="YouTube video player" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowFullScreen
                className="w-full h-full absolute inset-0 z-10"
              ></iframe>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 {isLive ? (
                   <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      AO VIVO AGORA
                   </span>
                 ) : (
                   <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/60 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                      Gravado
                   </span>
                 )}
                 <span className="text-sm font-medium text-white/50">{config.churchName || 'Igreja'}</span>
              </div>
              <div className="flex gap-2">
                 <button className="h-10 px-4 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2 text-sm font-bold">
                    <Bell className="w-4 h-4" /> Notificar
                 </button>
                 <a 
                    href={`https://wa.me/?text=${encodeURIComponent(`Assista ao culto da nossa igreja agora mesmo! 📺 ${window.location.origin}/live`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="h-10 px-4 rounded-full bg-green-500 hover:bg-green-600 transition-colors flex items-center gap-2 text-sm font-bold shadow-lg"
                 >
                    <Share2 className="w-4 h-4" /> Compartilhar
                 </a>
              </div>
            </div>
         </div>

         <div className="w-full lg:w-80 space-y-6">
            <div className="ios-card bg-white/5 border-white/10 p-6 rounded-[24px]">
               <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                 <Youtube className="w-5 h-5 text-red-500" />
                 Nossa Programação
               </h3>
               <ul className="space-y-4">
                 <li className="flex justify-between items-center text-sm border-b border-white/5 pb-4">
                   <span className="text-white/70">Domingo</span>
                   <span className="font-bold text-white">18:00</span>
                 </li>
                 <li className="flex justify-between items-center text-sm border-b border-white/5 pb-4">
                   <span className="text-white/70">Quarta-feira</span>
                   <span className="font-bold text-white">19:30</span>
                 </li>
                 <li className="flex justify-between items-center text-sm">
                   <span className="text-white/70">Sexta (Jovens)</span>
                   <span className="font-bold text-white">20:00</span>
                 </li>
               </ul>
            </div>
         </div>
      </div>
    </div>
  );
}
