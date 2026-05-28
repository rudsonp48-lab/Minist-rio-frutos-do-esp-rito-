import { motion } from 'motion/react';
import { Radio, Play, Pause, Volume2, Share2, Heart, Music2, Waves } from 'lucide-react';
import { usePlayer } from '../lib/PlayerContext';
import { useState, useEffect } from 'react';

const RECENT_TRACKS = [
  { id: 1, title: 'Way Maker', artist: 'Leeland', time: '10:45', img: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&auto=format&fit=crop' },
  { id: 2, title: 'Graça Soberana', artist: 'Lagoinha', time: '10:38', img: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&auto=format&fit=crop' },
  { id: 3, title: 'Oceans', artist: 'Hillsong United', time: '10:30', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop' }
];

export default function WebRadio() {
  const { playing, setPlaying, selectedVideo, setSelectedVideo } = usePlayer();
  const [isLiked, setIsLiked] = useState(false);
  const [isPlayingRadio, setIsPlayingRadio] = useState(false);

  useEffect(() => {
    if (selectedVideo?.id === 'radio-1') {
      setIsPlayingRadio(playing);
    } else {
      setIsPlayingRadio(false);
    }
  }, [selectedVideo, playing]);

  const handlePlayRadio = () => {
    if (selectedVideo?.id === 'radio-1') {
      setPlaying(!playing);
    } else {
      setSelectedVideo({
        id: 'radio-1',
        title: 'Web Rádio Ao Vivo',
        author: 'Transmitindo',
        publishedAt: new Date().toISOString(),
        type: 'music', // Let's use 'music' or wait, 'audio' might fail if YouTube tries to play it. We can add native audio in GlobalPlayer.
        thumbnail: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&q=80&w=800',
        src: 'https://stream.zeno.fm/8x934z3m8mzuv' // Need to add src to YouTubeVideo interface if not there. Let's just pass it and cast it.
      } as any);
      // We will handle 'radio-1' in GlobalPlayer.tsx!
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-black/95">
      {/* Header */}
      <div className="pt-20 lg:pt-12 px-6 mb-8 max-w-4xl mx-auto flex items-end justify-between">
         <div>
           <div className="flex items-center gap-3 mb-2">
             <div className="w-10 h-10 rounded-full bg-[var(--theme-color)]/10 flex items-center justify-center">
               <Radio className="w-5 h-5 text-[var(--theme-color)]" />
             </div>
             <motion.div
               animate={{ scale: [1, 1.2, 1] }}
               transition={{ repeat: Infinity, duration: 2 }}
               className="flex items-center gap-1.5 bg-red-500/10 text-red-500 px-3 py-1 rounded-full border border-red-500/20"
             >
               <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
               <span className="text-xs font-bold uppercase tracking-wider">Ao Vivo</span>
             </motion.div>
           </div>
           <h1 className="text-4xl lg:text-5xl font-display font-bold tracking-tight text-black dark:text-white">Web Rádio</h1>
         </div>
      </div>

      <div className="px-6 max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 pb-32">
        {/* Main Player Area */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="ios-card bg-white dark:bg-[#1C1C1E] p-6 lg:p-8 rounded-[32px] border border-black/5 dark:border-white/5 relative overflow-hidden"
          >
            {/* Abstract Background Shapes */}
             <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[var(--theme-color)]/10 to-transparent rounded-full blur-[80px] translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
             
             {/* Player UI */}
             <div className="relative z-10 flex flex-col items-center text-center">
                <div className="relative w-48 h-48 lg:w-64 lg:h-64 rounded-full overflow-hidden mb-8 ios-shadow border-4 border-white/10 p-2">
                   <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[var(--theme-color)] to-purple-600 animate-spin-slow opacity-20"></div>
                   <div className="w-full h-full rounded-full overflow-hidden">
                     <img src="https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&auto=format&fit=crop" alt="Rádio Capa" className="w-full h-full object-cover scale-105" />
                   </div>
                   
                   {/* Centered Play Button Overlay */}
                   <button 
                     onClick={handlePlayRadio}
                     className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors group"
                   >
                     <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform shadow-xl">
                       {isPlayingRadio ? <Pause className="w-8 h-8 text-white fill-current" /> : <Play className="w-8 h-8 text-white fill-current ml-1" />}
                     </div>
                   </button>
                </div>

                <div className="flex items-center gap-2 mb-2 justify-center">
                   <Waves className="w-4 h-4 text-[var(--theme-color)] animate-pulse" />
                   <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[var(--theme-color)]">Tocando Agora</span>
                </div>
                <h2 className="text-2xl font-bold text-black dark:text-white mb-2">Programação Local</h2>
                <p className="text-black/60 dark:text-white/60 mb-8 font-medium">Louvores e Adoração</p>

                <div className="w-full flex items-center gap-4 justify-between pt-6 border-t border-black/5 dark:border-white/5">
                   <button onClick={() => setIsLiked(!isLiked)} className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                     <Heart className={`w-5 h-5 ${isLiked ? 'text-red-500 fill-red-500' : 'text-black/60 dark:text-white/60'}`} />
                   </button>
                   
                   <button 
                     onClick={handlePlayRadio}
                     className="flex-1 max-w-[200px] h-14 rounded-full bg-[var(--theme-color)] text-white font-bold flex items-center justify-center shadow-lg shadow-[var(--theme-color)]/30 hover:scale-105 transition-transform"
                   >
                     {isPlayingRadio ? 'Pausar' : 'Ouvir Agora'}
                   </button>
                   
                   <button className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                     <Share2 className="w-5 h-5 text-black/60 dark:text-white/60" />
                   </button>
                </div>
             </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-4 bg-[var(--theme-color)]/10 p-5 rounded-2xl border border-[var(--theme-color)]/20"
          >
             <Music2 className="w-6 h-6 text-[var(--theme-color)] shrink-0" />
             <p className="text-sm text-black dark:text-white font-medium leading-relaxed">Você está ouvindo a Web Rádio oficial. Uma seleção de louvores 24 horas para edificar sua vida.</p>
          </motion.div>
        </div>

        {/* Sidebar / Recent Tracks */}
        <div className="lg:col-span-5 flex flex-col gap-6">
           <div className="flex items-end justify-between px-2">
              <h3 className="text-xl font-bold text-black dark:text-white">Tocadas Recentemente</h3>
           </div>
           
           <div className="flex flex-col gap-3">
             {RECENT_TRACKS.map((track, idx) => (
               <motion.div
                 key={track.id}
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: idx * 0.1 }}
                 className="flex items-center gap-4 p-3 ios-card rounded-[20px] bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5"
               >
                  <img src={track.img} alt={track.title} className="w-14 h-14 rounded-xl object-cover" />
                  <div className="flex-1 overflow-hidden">
                    <h4 className="text-black dark:text-white font-bold text-sm line-clamp-1">{track.title}</h4>
                    <p className="text-black/50 dark:text-white/50 text-xs font-medium">{track.artist}</p>
                  </div>
                  <span className="text-black/30 dark:text-white/30 text-xs font-medium font-mono">{track.time}</span>
               </motion.div>
             ))}
           </div>
           
           {/* Ad / Support Banner */}
           <div className="mt-4 p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-[24px] border border-blue-500/20 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              <Heart className="w-8 h-8 text-blue-500 mx-auto mb-3" />
              <h4 className="font-bold text-black dark:text-white mb-2">Apoie nosso Projeto</h4>
              <p className="text-sm text-black/60 dark:text-white/60 mb-4 font-medium leading-relaxed">Sua contribuição ajuda a manter nossa rádio no ar.</p>
              <button className="w-full py-3 rounded-xl bg-black/5 dark:bg-white/10 font-bold text-[13px] hover:bg-black/10 dark:hover:bg-white/20 transition-colors">Saiba Mais</button>
           </div>
        </div>
      </div>
    </div>
  );
}
