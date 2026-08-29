import React, { useState } from 'react';
import { BookOpen, Search, X, Sparkles, Check, Flame, Heart, Shield, Sun } from 'lucide-react';
import { motion } from 'motion/react';
import { BibleVerseSnippet, POPULAR_BIBLE_VERSES } from '../../services/chatService';

interface BibleVersePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVerse: (verse: BibleVerseSnippet) => void;
}

const THEMATIC_VERSES: Record<string, BibleVerseSnippet[]> = {
  paz: [
    {
      reference: 'João 14:27',
      text: 'Deixo-lhes a paz; a minha paz lhes dou. Não lha dou como o mundo a dá. Não se perturbe o seu coração, nem tenham medo.',
      version: 'NVI',
      theme: 'Paz'
    },
    {
      reference: 'Filipenses 4:7',
      text: 'E a paz de Deus, que excede todo o entendimento, guardará os seus corações e as suas mentes em Cristo Jesus.',
      version: 'NVI',
      theme: 'Paz'
    }
  ],
  cura: [
    {
      reference: 'Isaías 53:5',
      text: 'Mas ele foi traspassado por causa das nossas transgressões, foi esmagado por causa de nossas iniquidades; o castigo que nos trouxe a paz estava sobre ele, e pelas suas feridas fomos curados.',
      version: 'NVI',
      theme: 'Cura Divina'
    },
    {
      reference: 'Salmos 103:2-3',
      text: 'Bendiga ao Senhor a minha alma! Não esqueça de nenhuma de suas bênçãos! É ele quem perdoa todos os seus pecados e cura todas as suas doenças.',
      version: 'NVI',
      theme: 'Cura e Louvor'
    }
  ],
  fe: [
    {
      reference: 'Hebreus 11:1',
      text: 'Ora, a fé é a certeza daquilo que esperamos e a prova das coisas que não vemos.',
      version: 'NVI',
      theme: 'Fé e Convicção'
    },
    {
      reference: 'Marcos 11:24',
      text: 'Por isso lhes digo: tudo o que vocês pedirem em oração, creiam que já o receberam, e assim lhes sucederá.',
      version: 'NVI',
      theme: 'Fé na Oração'
    }
  ],
  vitoria: [
    {
      reference: 'Romanos 8:37',
      text: 'Mas em todas estas coisas somos mais que vencedores, por meio daquele que nos amou.',
      version: 'NVI',
      theme: 'Mais que Vencedores'
    },
    {
      reference: '1 Coríntios 15:57',
      text: 'Mas graças a Deus, que nos dá a vitória por meio de nosso Senhor Jesus Cristo.',
      version: 'NVI',
      theme: 'Vitória em Cristo'
    }
  ]
};

export default function BibleVersePickerModal({
  isOpen,
  onClose,
  onSelectVerse
}: BibleVersePickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<string>('all');
  const [customRef, setCustomRef] = useState('');
  const [customText, setCustomText] = useState('');

  if (!isOpen) return null;

  const allVerses: BibleVerseSnippet[] = [
    ...POPULAR_BIBLE_VERSES,
    ...THEMATIC_VERSES.paz,
    ...THEMATIC_VERSES.cura,
    ...THEMATIC_VERSES.fe,
    ...THEMATIC_VERSES.vitoria
  ];

  const filteredVerses = allVerses.filter((v) => {
    const matchesSearch =
      v.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.theme && v.theme.toLowerCase().includes(searchQuery.toLowerCase()));

    if (selectedTheme === 'all') return matchesSearch;
    if (selectedTheme === 'paz') return matchesSearch && (v.theme?.toLowerCase().includes('paz') || v.reference.includes('João 14') || v.reference.includes('Filipenses 4'));
    if (selectedTheme === 'cura') return matchesSearch && (v.theme?.toLowerCase().includes('cura') || v.reference.includes('Isaías 53'));
    if (selectedTheme === 'fe') return matchesSearch && (v.theme?.toLowerCase().includes('fé') || v.reference.includes('Hebreus') || v.reference.includes('Marcos'));
    if (selectedTheme === 'vitoria') return matchesSearch && (v.theme?.toLowerCase().includes('vencedores') || v.reference.includes('1 Coríntios'));

    return matchesSearch;
  });

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRef.trim() || !customText.trim()) return;
    onSelectVerse({
      reference: customRef.trim(),
      text: customText.trim(),
      version: 'Bíblia Sagrada',
      theme: 'Citação do Irmão'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-xl bg-[#15151C] border border-white/15 rounded-[32px] p-6 shadow-2xl relative max-h-[85vh] flex flex-col overflow-hidden text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Inserir Versículo Bíblico
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold uppercase">
                  Palavra Viva
                </span>
              </h3>
              <p className="text-xs text-white/50">Compartilhe uma promessa ou passagem com os irmãos</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Themes Filter */}
        <div className="space-y-3 mb-4">
          <div className="relative">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por referência, livro ou palavra-chave (ex: Salmos, paz, vitória)..."
              className="w-full bg-black/40 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white outline-none focus:border-amber-400 placeholder:text-white/30"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { id: 'all', label: 'Todos', icon: Sparkles },
              { id: 'paz', label: 'Paz & Conforto', icon: Sun },
              { id: 'cura', label: 'Cura Divina', icon: Heart },
              { id: 'fe', label: 'Fé & Oração', icon: Flame },
              { id: 'vitoria', label: 'Vitória & Proteção', icon: Shield }
            ].map((theme) => {
              const Icon = theme.icon;
              return (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all border ${
                    selectedTheme === theme.id
                      ? 'bg-amber-500 text-black border-amber-400 shadow-md'
                      : 'bg-white/5 text-white/70 border-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {theme.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Verses List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 mb-4">
          {filteredVerses.map((verse, idx) => (
            <div
              key={`${verse.reference}-${idx}`}
              onClick={() => {
                onSelectVerse(verse);
                onClose();
              }}
              className="p-3.5 rounded-2xl bg-black/40 hover:bg-white/5 border border-white/10 hover:border-amber-500/40 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-bold text-amber-400 group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  {verse.reference}
                </span>
                {verse.theme && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-white/50">
                    {verse.theme}
                  </span>
                )}
              </div>
              <p className="text-xs text-white/80 line-clamp-2 leading-relaxed italic">
                "{verse.text}"
              </p>
            </div>
          ))}
        </div>

        {/* Custom Verse Drawer Form */}
        <div className="pt-3 border-t border-white/10">
          <form onSubmit={handleCustomSubmit} className="space-y-2">
            <span className="text-[10px] uppercase tracking-wider font-bold text-white/50">
              Ou digite uma passagem personalizada:
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                value={customRef}
                onChange={(e) => setCustomRef(e.target.value)}
                placeholder="Livro e Cap (ex: Salmos 121:1-2)"
                className="w-1/3 bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 placeholder:text-white/30"
              />
              <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Texto bíblico..."
                className="flex-1 bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 placeholder:text-white/30"
              />
              <button
                type="submit"
                disabled={!customRef.trim() || !customText.trim()}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold text-xs shrink-0 transition-all active:scale-95"
              >
                Inserir
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
