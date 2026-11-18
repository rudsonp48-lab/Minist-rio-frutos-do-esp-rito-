import { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Sparkles,
  CheckCircle2,
  Share2,
  Calendar,
  ChevronRight,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Search,
  Type,
  Flame,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { DEVOCIONAIS, getDailyDevotional } from '../lib/devotionalsData';
import { devotionalAudio } from '../lib/devotionalAudioEngine';

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
  const [fontSize, setFontSize] = useState<number>(16);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(() => devotionalAudio.isPlaying());
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'unread' | 'read'>('all');

  const current = DEVOCIONAIS[selectedIdx] || daily;
  const isRead = readTitles.includes(current.title);
  const progressPct = Math.round((readTitles.length / Math.max(1, DEVOCIONAIS.length)) * 100);

  useEffect(() => {
    try {
      localStorage.setItem('ecclesia_read_devotionals', JSON.stringify(readTitles));
    } catch {}
  }, [readTitles]);

  useEffect(() => {
    devotionalAudio.onStateChange((playing) => {
      setIsAudioPlaying(playing);
    });
    return () => {
      devotionalAudio.stop();
    };
  }, []);

  const toggleRead = () => {
    setReadTitles((prev) =>
      prev.includes(current.title) ? prev.filter((t) => t !== current.title) : [...prev, current.title]
    );
  };

  const handleToggleAudio = () => {
    if (isAudioPlaying) {
      devotionalAudio.stop();
      return;
    }
    void devotionalAudio.narrateText(
      current.title,
      `${current.verse}. ${current.reference}. ${current.text}`
    );
  };

  const handleCopy = async () => {
    const text = `📖 *${current.title}*\n\n"${current.verse}" — ${current.reference}\n\n${current.text}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleShare = async () => {
    const text = `📖 Devocional: ${current.title}\n"${current.verse}" (${current.reference})\n\n${current.text}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: current.title, text });
        return;
      } catch {}
    }
    await handleCopy();
  };

  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return DEVOCIONAIS.map((item, index) => ({ item, index })).filter(({ item }) => {
      const matchesRead =
        filterMode === 'all' ||
        (filterMode === 'read' && readTitles.includes(item.title)) ||
        (filterMode === 'unread' && !readTitles.includes(item.title));
      if (!matchesRead) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.reference.toLowerCase().includes(q) ||
        item.verse.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, filterMode, readTitles]);

  return (
    <div className="max-w-4xl mx-auto px-4 pt-4 pb-28 space-y-6">
      {/* Header + Progress */}
      <div className="bg-[#14141C]/95 border border-white/10 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-[var(--theme-color)] flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-display font-bold text-white">Devocional Diário</h1>
              <p className="text-xs text-white/55 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                {readTitles.length} de {DEVOCIONAIS.length} meditações concluídas ({progressPct}%)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl p-1">
            <Type className="w-3.5 h-3.5 text-white/40 ml-1.5" />
            <button
              onClick={() => setFontSize((s) => Math.max(14, s - 2))}
              className="px-2 py-1 rounded-lg text-xs font-bold text-white/70 hover:text-white hover:bg-white/10"
              title="Diminuir fonte"
            >
              A-
            </button>
            <button
              onClick={() => setFontSize((s) => Math.min(22, s + 2))}
              className="px-2 py-1 rounded-lg text-xs font-bold text-white/70 hover:text-white hover:bg-white/10"
              title="Aumentar fonte"
            >
              A+
            </button>
          </div>
        </div>

        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--theme-color)] to-amber-400 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Featured Devotional */}
      <article className="rounded-[32px] bg-gradient-to-b from-[#171524] to-[#111117] border border-white/10 overflow-hidden shadow-2xl">
        <div className="relative h-52 sm:h-64 overflow-hidden">
          {current.image ? (
            <img src={current.image} alt={current.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-900/50 via-indigo-950/60 to-black" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#111117] via-black/45 to-black/15" />

          <div className="absolute top-4 left-5 right-5 flex items-center justify-between gap-2">
            <span className="px-3 py-1 rounded-full bg-amber-500 text-black text-[10px] font-extrabold uppercase tracking-wider shadow">
              {current.title === daily.title ? 'Palavra de Hoje' : 'Acervo Devocional'}
            </span>
            <button
              onClick={handleToggleAudio}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 backdrop-blur-md transition-all shadow-lg ${
                isAudioPlaying
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-black/60 hover:bg-black/80 text-white border border-white/20'
              }`}
            >
              {isAudioPlaying ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
              {isAudioPlaying ? 'Parar Áudio' : 'Ouvir Reflexão'}
            </button>
          </div>

          <div className="absolute bottom-4 left-5 right-5">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white leading-tight drop-shadow-lg">
              {current.title}
            </h2>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <blockquote className="p-5 rounded-2xl bg-[var(--theme-color)]/10 border-l-4 border-[var(--theme-color)] space-y-2">
            <p className="text-base sm:text-lg italic text-white/95 leading-relaxed font-serif">
              "{current.verse}"
            </p>
            <footer className="text-xs font-extrabold text-[var(--theme-color)] uppercase tracking-wider">
              — {current.reference}
            </footer>
          </blockquote>

          <p
            style={{ fontSize: `${fontSize}px` }}
            className="text-white/85 leading-relaxed whitespace-pre-line font-sans"
          >
            {current.text}
          </p>

          <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-white/10">
            <button
              onClick={toggleRead}
              className={`px-4 py-2.5 rounded-2xl border text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition active:scale-95 ${
                isRead
                  ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
                  : 'bg-white/10 border-white/15 text-white hover:bg-white/15'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {isRead ? 'Meditação Concluída' : 'Marcar como Lido'}
            </button>

            <Link
              to="/bible"
              state={{
                book: (current as any).book,
                chapter: (current as any).chapter,
                verse: (current as any).verseNumber,
              }}
              className="px-4 py-2.5 rounded-2xl bg-[var(--theme-color)] hover:opacity-90 text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition active:scale-95"
            >
              <BookOpen className="w-4 h-4" />
              Abrir na Bíblia
            </Link>

            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={handleCopy}
                className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/85 transition"
                title="Copiar devocional"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={handleShare}
                className="px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/85 text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition"
              >
                <Share2 className="w-4 h-4" />
                Compartilhar
              </button>
            </div>
          </div>
        </div>
      </article>

      {/* History List with Search & Filter */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-white/60 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[var(--theme-color)]" />
            Acervo de Devocionais ({filteredList.length})
          </h3>

          <div className="flex items-center gap-1.5">
            {(
              [
                { id: 'all', label: 'Todos' },
                { id: 'unread', label: 'Não Lidos' },
                { id: 'read', label: 'Lidos' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterMode(f.id)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold border transition ${
                  filterMode === f.id
                    ? 'bg-white text-black border-white'
                    : 'bg-[#14141B] text-white/60 border-white/10 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar devocional por título, tema ou versículo..."
            className="w-full bg-[#14141B] border border-white/10 rounded-2xl py-2.5 pl-11 pr-4 text-xs sm:text-sm text-white placeholder:text-white/35 outline-none focus:border-[var(--theme-color)]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredList.map(({ item, index }) => {
            const active = index === selectedIdx;
            const itemRead = readTitles.includes(item.title);
            return (
              <button
                key={item.title}
                onClick={() => {
                  devotionalAudio.stop();
                  setSelectedIdx(index);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`text-left p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                  active
                    ? 'bg-[var(--theme-color)]/20 border-[var(--theme-color)]/60 text-white shadow-lg'
                    : 'bg-[#14141B]/90 border-white/10 hover:border-white/25 text-white/80'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt=""
                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-white/10"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-white/40" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate flex items-center gap-1.5">
                      {item.title}
                      {itemRead && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    </p>
                    <p className="text-xs text-white/55 truncate mt-0.5">{item.reference}</p>
                  </div>
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
