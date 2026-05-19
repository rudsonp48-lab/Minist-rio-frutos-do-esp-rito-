import { useState } from 'react';
import { ChevronLeft, Search, Play, Mic, Headphones, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTheme } from '../lib/ThemeContext';

export default function Podcast() {
  const { themeColor } = useTheme();
  
  return (
    <div className="min-h-screen bg-transparent w-full text-white font-sans max-w-7xl mx-auto px-6 pb-32">
      <header className="sticky top-0 z-40 bg-black/50 backdrop-blur-3xl border-b border-white/5 py-6 px-0 lg:px-6 flex items-center justify-between mb-8 shadow-2xl">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10 group">
             <ChevronLeft className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-2xl font-serif font-bold tracking-widest text-white uppercase">Podcasts</h1>
            <div className="flex items-center gap-2 mt-1">
              <Mic className="w-3.5 h-3.5 text-[var(--theme-color)]" />
              <span className="text-[10px] font-bold text-[var(--theme-color)] uppercase tracking-[0.2em]">Série de Áudios</span>
            </div>
          </div>
        </div>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { id: 1, title: 'Descobrindo o Propósito', host: 'Pr. Marcos Silva', duration: '45 min', img: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&q=80&w=800' },
          { id: 2, title: 'Fé Inabalável', host: 'Pra. Sarah Oliveira', duration: '38 min', img: 'https://images.unsplash.com/photo-1589903308904-1010c2294adc?auto=format&fit=crop&q=80&w=800' },
          { id: 3, title: 'Relacionamento com Deus', host: 'Pr. Lucas Ferreira', duration: '52 min', img: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&q=80&w=800' },
          { id: 4, title: 'Superando o Medo', host: 'Pra. Sarah Oliveira', duration: '41 min', img: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800' },
          { id: 5, title: 'Vida Financeira Abundante', host: 'Pr. Marcos Silva', duration: '55 min', img: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=800' },
          { id: 6, title: 'O Poder da Oração', host: 'Pr. Lucas Ferreira', duration: '48 min', img: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&q=80&w=800' },
        ].map((podcast, idx) => (
          <motion.div
            key={podcast.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-[#111111] border border-white/5 rounded-3xl p-4 flex gap-4 items-center group cursor-pointer hover:border-[var(--theme-color)]/30 transition-colors relative"
          >
            <div className="absolute top-4 right-4 text-white/20 group-hover:text-[var(--theme-color)] transition-colors">
               <Headphones className="w-5 h-5" />
            </div>
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0">
              <img src={podcast.img} alt={podcast.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Play className="w-8 h-8 text-white fill-current opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
              </div>
            </div>
            <div className="flex flex-col flex-1 overflow-hidden pr-6">
              <p className="text-[10px] text-[var(--theme-color)] font-bold uppercase tracking-widest mb-1">{podcast.duration}</p>
              <h4 className="text-white font-bold leading-tight line-clamp-2 mb-1">{podcast.title}</h4>
              <p className="text-white/50 text-xs">{podcast.host}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
