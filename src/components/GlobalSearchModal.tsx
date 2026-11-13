import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, BookOpen, GraduationCap, Sparkles, Calendar, MessageSquare, Headphones, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_COURSES } from '../services/courseService';
import { DEVOCIONAIS } from '../lib/devotionalsData';

interface SearchEntry {
  title: string;
  subtitle: string;
  category: string;
  to: string;
  icon: any;
}

const STATIC_ENTRIES: SearchEntry[] = [
  { title: 'Bíblia Sagrada', subtitle: 'Leitura completa de Gênesis a Apocalipse', category: 'Bíblia', to: '/bible', icon: BookOpen },
  { title: 'Chat da Comunidade', subtitle: 'Mensagens e chamadas com os irmãos', category: 'Comunidade', to: '/chat', icon: MessageSquare },
  { title: 'Louvores & Mídia', subtitle: 'Músicas, cultos e pregações', category: 'Mídia', to: '/media', icon: Headphones },
  { title: 'Agenda & Eventos', subtitle: 'Cultos, retiros e programação da igreja', category: 'Agenda', to: '/events', icon: Calendar },
  { title: 'Validar Certificado', subtitle: 'Verificar autenticidade por código MFE', category: 'Cursos', to: '/validar-certificado', icon: GraduationCap },
  ...DEFAULT_COURSES.map((c) => ({
    title: c.title,
    subtitle: `${c.category} • ${c.workloadHours}h • ${c.instructor}`,
    category: 'Curso',
    to: '/courses',
    icon: GraduationCap,
  })),
  ...DEVOCIONAIS.slice(0, 12).map((d) => ({
    title: d.title,
    subtitle: `${d.reference} — ${d.text.slice(0, 60)}...`,
    category: 'Devocional',
    to: '/devotional',
    icon: Sparkles,
  })),
];

export default function GlobalSearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [queryText, setQueryText] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => {
      setIsOpen(true);
      setQueryText('');
    };
    window.addEventListener('open-global-search', handler);
    return () => window.removeEventListener('open-global-search', handler);
  }, []);

  const results = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    if (!q) return STATIC_ENTRIES.slice(0, 8);
    return STATIC_ENTRIES.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    ).slice(0, 12);
  }, [queryText]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[160] bg-black/80 backdrop-blur-md flex items-start justify-center p-4 pt-16 sm:pt-24"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-full max-w-xl rounded-3xl bg-[#14141B] border border-white/15 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10">
          <Search className="w-5 h-5 text-purple-400 shrink-0" />
          <input
            autoFocus
            type="text"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="Buscar cursos, devocionais, Bíblia, eventos..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
          />
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg bg-white/5 text-white/60 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto divide-y divide-white/5">
          {results.length === 0 ? (
            <p className="p-6 text-center text-sm text-white/50">
              Nenhum resultado encontrado para "{queryText}".
            </p>
          ) : (
            results.map((item, idx) => (
              <button
                key={`${item.title}-${idx}`}
                onClick={() => {
                  setIsOpen(false);
                  navigate(item.to);
                }}
                className="w-full text-left px-4 py-3.5 hover:bg-white/5 transition flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-400/25 flex items-center justify-center text-purple-300 shrink-0">
                  <item.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{item.title}</p>
                  <p className="text-xs text-white/55 truncate">{item.subtitle}</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-white/60">
                  {item.category}
                </span>
                <ChevronRight className="w-4 h-4 text-white/30 shrink-0" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
