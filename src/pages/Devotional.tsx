import React, { useState, useEffect } from 'react';
import { BookOpen, Sparkles, CheckCircle2, Share2, Calendar, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DEVOCIONAIS, getDailyDevotional } from '../lib/devotionalsData';

export default function Devotional() {
  const daily = getDailyDevotional();
  const [selectedIdx, setSelectedIdx] = useState<number>(() => {
    const idx = DEVOCIONAIS.findIndex((d) => d.title === daily.title);
    return idx >= 0 ? idx : 0;
  });
  const [readTitles, setReadTitles] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('ecclesia_read_devotionals');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const current = DEVOCIONAIS[selectedIdx] || daily;
  const isRead = readTitles.includes(current.title);

  useEffect(() => {
    try {
      localStorage.setItem('ecclesia_read_devotionals', JSON.stringify(readTitles));
    } catch {}
  }, [readTitles]);

  const toggleRead = () => {
    setReadTitles((prev) =>
      prev.includes(current.title) ? prev.filter((t) => t !== current.title) : [...prev, current.title]
    );
  };

  const handleShare = async () => {
    const text = `📖 Devocional: ${current.title}\n"${current.verse}" (${current.reference})\n\n${current.text}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: current.title, text });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(text);
      alert('Devocional copiado para compartilhar!');
    } catch {}
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pt-4 pb-28 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-white">Devocionais Diários</h1>
            <p className="text-xs text-white/60">{readTitles.length} meditações concluídas</p>
          </div>
        </div>
      </div>

      {/* Featured Devotional */}
      <div className="rounded-3xl bg-[#14141B]/95 border border-white/10 overflow-hidden shadow-2xl">
        {current.image && (
          <div className="h-48 sm:h-60 relative overflow-hidden">
            <img src={current.image} alt={current.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#14141B] via-black/40 to-transparent" />
            <div className="absolute bottom-4 left-5 right-5">
              <span className="px-2.5 py-1 rounded-full bg-amber-500/90 text-black text-[11px] font-bold uppercase tracking-wider">
                {current.title === daily.title ? 'Palavra de Hoje' : 'Acervo Devocional'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mt-2">
                {current.title}
              </h2>
            </div>
          </div>
        )}

        <div className="p-6 space-y-5">
          <blockquote className="p-4 rounded-2xl bg-purple-600/15 border border-purple-400/25 space-y-1.5">
            <p className="text-sm sm:text-base italic text-white/95 leading-relaxed">
              "{current.verse}"
            </p>
            <footer className="text-xs font-bold text-purple-300">— {current.reference}</footer>
          </blockquote>

          <p className="text-sm sm:text-base text-white/85 leading-relaxed">{current.text}</p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={toggleRead}
              className={`px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition ${
                isRead
                  ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
                  : 'bg-white/10 border-white/15 text-white hover:bg-white/15'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {isRead ? 'Meditação Lida' : 'Marcar como Lido'}
            </button>

            <Link
              to="/bible"
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition"
            >
              <BookOpen className="w-4 h-4" />
              Abrir na Bíblia
            </Link>

            <button
              onClick={handleShare}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/85 text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition ml-auto"
            >
              <Share2 className="w-4 h-4" />
              Compartilhar
            </button>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-white/60 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-purple-400" />
          Mais Devocionais ({DEVOCIONAIS.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DEVOCIONAIS.map((item, idx) => {
            const active = idx === selectedIdx;
            const itemRead = readTitles.includes(item.title);
            return (
              <button
                key={item.title}
                onClick={() => {
                  setSelectedIdx(idx);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`text-left p-4 rounded-2xl border transition flex items-center justify-between gap-3 ${
                  active
                    ? 'bg-purple-600/25 border-purple-400/50 text-white'
                    : 'bg-[#14141B]/90 border-white/10 hover:border-white/25 text-white/80'
                }`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate flex items-center gap-2">
                    {item.title}
                    {itemRead && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  </p>
                  <p className="text-xs text-white/55 truncate mt-0.5">{item.reference}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/40 shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
