import { useState, useEffect } from 'react';
import {
  Scroll,
  Plus,
  Sparkles,
  Trash2,
  Copy,
  Check,
  BookOpen,
  Edit3,
  ArrowLeft,
  Save,
  Loader2,
  ListPlus,
  X,
} from 'lucide-react';
import { searchVerseByReference } from '../../services/bibleService';

export interface SermonPoint {
  id: string;
  heading: string;
  body: string;
}

export interface SermonDraft {
  id: string;
  title: string;
  baseReference: string;
  baseVerseText: string;
  category: string;
  introduction: string;
  points: SermonPoint[];
  application: string;
  conclusion: string;
  aiNotes?: string;
  updatedAt: string;
}

const STORAGE_KEY = 'bible_sermons_v1';

const SERMON_CATEGORIES = [
  'Culto de Domingo',
  'Estudo Bíblico',
  'Célula / Grupo',
  'Jovens',
  'Santa Ceia',
  'Evangelístico',
];

function createEmptySermon(initialRef = '', initialText = ''): SermonDraft {
  return {
    id: `sermon_${Date.now()}`,
    title: '',
    baseReference: initialRef,
    baseVerseText: initialText,
    category: 'Culto de Domingo',
    introduction: '',
    points: [
      { id: 'p1', heading: '1. Contexto e Verdade Central', body: '' },
      { id: 'p2', heading: '2. Princípio Espiritual', body: '' },
      { id: 'p3', heading: '3. Chamado à Ação', body: '' },
    ],
    application: '',
    conclusion: '',
    aiNotes: '',
    updatedAt: new Date().toISOString(),
  };
}

interface SermonStudioProps {
  translation: string;
  prefillReference?: string;
  prefillVerseText?: string;
  onConsumePrefill?: () => void;
}

export default function SermonStudio({
  translation,
  prefillReference,
  prefillVerseText,
  onConsumePrefill,
}: SermonStudioProps) {
  const [sermons, setSermons] = useState<SermonDraft[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [editing, setEditing] = useState<SermonDraft | null>(null);
  const [loadingVerse, setLoadingVerse] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sermons));
    } catch {}
  }, [sermons]);

  useEffect(() => {
    if (prefillReference) {
      setEditing(createEmptySermon(prefillReference, prefillVerseText || ''));
      onConsumePrefill?.();
    }
  }, [prefillReference, prefillVerseText, onConsumePrefill]);

  const showToast = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 2800);
  };

  const handleLoadBaseVerse = async () => {
    if (!editing?.baseReference.trim()) return;
    setLoadingVerse(true);
    try {
      const verse = await searchVerseByReference(editing.baseReference, translation);
      setEditing((prev) =>
        prev
          ? {
              ...prev,
              baseReference: `${verse.book_name} ${verse.chapter}:${verse.verse}`,
              baseVerseText: verse.text,
            }
          : prev
      );
    } catch (err: any) {
      showToast(err?.message || 'Não foi possível localizar essa referência.');
    } finally {
      setLoadingVerse(false);
    }
  };

  const handleGenerateWithAI = async () => {
    if (!editing) return;
    const topic = editing.title.trim() || editing.baseReference.trim();
    if (!topic) {
      showToast('Informe um título ou texto bíblico base para gerar o esboço.');
      return;
    }

    setLoadingAI(true);
    try {
      const res = await fetch('/api/ai/theology', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'sermon',
          prompt: `Crie um esboço expositivo completo de sermão para "${editing.title || 'Mensagem Bíblica'}" baseado em "${editing.baseReference || 'Escrituras Sagradas'}" (${editing.category}). Inclua introdução, 3 pontos expositivos com referências, aplicação prática e conclusão.`,
          context: editing.baseVerseText || undefined,
        }),
      });
      const data = await res.json();
      const text = data.response || data.content || '';
      if (text) {
        setEditing((prev) => (prev ? { ...prev, aiNotes: text } : prev));
        showToast('Esboço gerado pela IA! Você pode adaptar nos campos abaixo.');
      } else {
        showToast('Não foi possível gerar o esboço agora.');
      }
    } catch {
      showToast('Erro ao consultar o Mentor Teológico IA.');
    } finally {
      setLoadingAI(false);
    }
  };

  const handleSave = () => {
    if (!editing) return;
    const toSave: SermonDraft = {
      ...editing,
      title: editing.title.trim() || editing.baseReference.trim() || 'Sermão sem título',
      updatedAt: new Date().toISOString(),
    };
    setSermons((prev) => {
      const exists = prev.some((s) => s.id === toSave.id);
      return exists
        ? prev.map((s) => (s.id === toSave.id ? toSave : s))
        : [toSave, ...prev];
    });
    setEditing(null);
    showToast('Sermão salvo no seu acervo!');
  };

  const handleDelete = (id: string) => {
    setSermons((prev) => prev.filter((s) => s.id !== id));
    if (editing?.id === id) setEditing(null);
  };

  const formatSermonForCopy = (s: SermonDraft) => {
    const lines = [
      `📖 ${s.title || 'Sermão'}`,
      `Categoria: ${s.category}`,
      s.baseReference ? `Texto Base: ${s.baseReference}` : '',
      s.baseVerseText ? `"${s.baseVerseText}"` : '',
      '',
      s.introduction ? `INTRODUÇÃO:\n${s.introduction}\n` : '',
      ...s.points.map((p) => `${p.heading}\n${p.body}\n`),
      s.application ? `APLICAÇÃO PRÁTICA:\n${s.application}\n` : '',
      s.conclusion ? `CONCLUSÃO:\n${s.conclusion}\n` : '',
      s.aiNotes ? `NOTAS / EXEGESE IA:\n${s.aiNotes}` : '',
    ];
    return lines.filter(Boolean).join('\n');
  };

  const handleCopy = (s: SermonDraft) => {
    navigator.clipboard.writeText(formatSermonForCopy(s));
    setCopiedId(s.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (editing) {
    return (
      <div className="space-y-5 pb-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => setEditing(null)}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar aos Sermões
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateWithAI}
              disabled={loadingAI}
              className="px-3.5 py-2 rounded-xl bg-purple-600/25 hover:bg-purple-600/40 border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
            >
              {loadingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {loadingAI ? 'Gerando...' : 'Gerar Esboço IA'}
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-[var(--theme-color)] text-white text-xs font-bold flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
            >
              <Save className="w-3.5 h-3.5" /> Salvar Sermão
            </button>
          </div>
        </div>

        {statusMsg && (
          <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs font-semibold">
            {statusMsg}
          </div>
        )}

        <div className="bg-[#121218] border border-white/10 rounded-[28px] p-5 sm:p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-white/50">
                Título do Sermão
              </label>
              <input
                type="text"
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                placeholder="Ex: O Bom Pastor que Guia Nossos Passos"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[var(--theme-color)]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-white/50">
                Ocasião / Tipo
              </label>
              <select
                value={editing.category}
                onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-[var(--theme-color)]"
              >
                {SERMON_CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-[#121218]">
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Texto Base */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-white/50">
              Texto Bíblico Base
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={editing.baseReference}
                onChange={(e) => setEditing({ ...editing, baseReference: e.target.value })}
                placeholder="Ex: Salmos 23:1 ou Romanos 8:28"
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[var(--theme-color)]"
              />
              <button
                type="button"
                onClick={handleLoadBaseVerse}
                disabled={loadingVerse}
                className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 shrink-0"
              >
                {loadingVerse ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookOpen className="w-3.5 h-3.5" />}
                Buscar Texto
              </button>
            </div>
            {editing.baseVerseText && (
              <blockquote className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs sm:text-sm text-amber-100/90 italic leading-relaxed">
                "{editing.baseVerseText}"
              </blockquote>
            )}
          </div>

          {/* Introdução */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-white/50">
              Introdução & Gancho Inicial
            </label>
            <textarea
              rows={3}
              value={editing.introduction}
              onChange={(e) => setEditing({ ...editing, introduction: e.target.value })}
              placeholder="Contextualize a passagem, apresente o tema central e conecte com a realidade da igreja..."
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[var(--theme-color)] resize-y"
            />
          </div>

          {/* Pontos Principais */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-white/50">
                Desenvolvimento (Tópicos da Mensagem)
              </label>
              <button
                type="button"
                onClick={() =>
                  setEditing({
                    ...editing,
                    points: [
                      ...editing.points,
                      {
                        id: `p_${Date.now()}`,
                        heading: `${editing.points.length + 1}. Novo Ponto`,
                        body: '',
                      },
                    ],
                  })
                }
                className="text-xs font-bold text-[var(--theme-color)] hover:underline flex items-center gap-1"
              >
                <ListPlus className="w-3.5 h-3.5" /> Adicionar Ponto
              </button>
            </div>

            {editing.points.map((pt, index) => (
              <div key={pt.id} className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-2.5">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={pt.heading}
                    onChange={(e) => {
                      const next = [...editing.points];
                      next[index] = { ...pt, heading: e.target.value };
                      setEditing({ ...editing, points: next });
                    }}
                    className="flex-1 bg-transparent border-b border-white/10 pb-1 text-sm font-bold text-white outline-none focus:border-[var(--theme-color)]"
                    placeholder={`Ponto ${index + 1}`}
                  />
                  {editing.points.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setEditing({
                          ...editing,
                          points: editing.points.filter((p) => p.id !== pt.id),
                        })
                      }
                      className="text-white/40 hover:text-red-400 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <textarea
                  rows={3}
                  value={pt.body}
                  onChange={(e) => {
                    const next = [...editing.points];
                    next[index] = { ...pt, body: e.target.value };
                    setEditing({ ...editing, points: next });
                  }}
                  placeholder="Desenvolva a explicação bíblica, versículos de apoio e observações..."
                  className="w-full bg-black/30 border border-white/5 rounded-xl px-3 py-2 text-xs sm:text-sm text-white/90 placeholder:text-white/25 outline-none focus:border-[var(--theme-color)] resize-y"
                />
              </div>
            ))}
          </div>

          {/* Aplicação e Conclusão */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-white/50">
                Ilustração & Aplicação Prática
              </label>
              <textarea
                rows={3}
                value={editing.application}
                onChange={(e) => setEditing({ ...editing, application: e.target.value })}
                placeholder="Como aplicar esta Palavra no dia a dia?"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[var(--theme-color)] resize-y"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-white/50">
                Conclusão & Apelo
              </label>
              <textarea
                rows={3}
                value={editing.conclusion}
                onChange={(e) => setEditing({ ...editing, conclusion: e.target.value })}
                placeholder="Resumo final, oração e chamado..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[var(--theme-color)] resize-y"
              />
            </div>
          </div>

          {/* Sugestão / Esboço IA */}
          {editing.aiNotes && (
            <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Sugestão de Esboço (Mentor IA)
                </span>
                <button
                  type="button"
                  onClick={() => setEditing({ ...editing, aiNotes: '' })}
                  className="text-xs text-white/40 hover:text-white"
                >
                  Limpar
                </button>
              </div>
              <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm text-white/85 leading-relaxed max-h-72 overflow-y-auto">
                {editing.aiNotes}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Scroll className="w-5 h-5 text-amber-400" /> Oficina de Sermões
          </h2>
          <p className="text-xs text-white/50">
            Desenvolva esboços expositivos, conecte versículos e organize suas pregações
          </p>
        </div>

        <button
          onClick={() => setEditing(createEmptySermon())}
          className="px-4 py-2.5 rounded-2xl bg-[var(--theme-color)] text-white text-xs font-bold flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> Novo Sermão
        </button>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs font-semibold">
          {statusMsg}
        </div>
      )}

      {sermons.length === 0 ? (
        <div className="bg-[#121218] border border-white/10 rounded-[28px] p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <Scroll className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-white">Nenhum sermão criado ainda</h3>
            <p className="text-xs text-white/55 leading-relaxed">
              Crie seu primeiro sermão com introdução, tópicos expositivos, busca automática de texto bíblico e apoio do Mentor IA.
            </p>
          </div>
          <button
            onClick={() => setEditing(createEmptySermon())}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Começar Primeiro Sermão
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sermons.map((s) => (
            <div
              key={s.id}
              className="bg-[#121218] border border-white/10 hover:border-white/20 rounded-3xl p-5 flex flex-col justify-between gap-4 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                    {s.category}
                  </span>
                  <span className="text-[10px] text-white/40">
                    {new Date(s.updatedAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white line-clamp-1">{s.title}</h3>
                {s.baseReference && (
                  <p className="text-xs font-semibold text-[var(--theme-color)]">{s.baseReference}</p>
                )}
                {s.introduction && (
                  <p className="text-xs text-white/55 line-clamp-2">{s.introduction}</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <button
                  onClick={() => setEditing(s)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Editar
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopy(s)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
                    title="Copiar sermão"
                  >
                    {copiedId === s.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-400"
                    title="Excluir sermão"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
