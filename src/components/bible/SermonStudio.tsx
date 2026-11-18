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
  Search,
  Link2,
  Wand2,
  Compass,
  Languages,
  Layers,
} from 'lucide-react';
import {
  BibleVerse,
  searchBibleByKeyword,
  searchVerseByReference,
} from '../../services/bibleService';

export interface SermonPoint {
  id: string;
  heading: string;
  body: string;
}

export interface WordConnection {
  word: string;
  original: string;
  meaning: string;
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
  exegesisContext?: string;
  hermeneuticsPrinciple?: string;
  homileticBridge?: string;
  wordConnections?: WordConnection[];
  relatedVerses?: string[];
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

function createEmptySermon(initialRef = '', initialText = '', initialTitle = ''): SermonDraft {
  return {
    id: `sermon_${Date.now()}`,
    title: initialTitle,
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
    exegesisContext: '',
    hermeneuticsPrinciple: '',
    homileticBridge: '',
    wordConnections: [],
    relatedVerses: [],
    aiNotes: '',
    updatedAt: new Date().toISOString(),
  };
}

function tryParseStructuredSermon(raw: string): Partial<{
  title: string;
  baseReference: string;
  introduction: string;
  points: { heading: string; body: string }[];
  application: string;
  conclusion: string;
  exegesisContext: string;
  hermeneuticsPrinciple: string;
  homileticBridge: string;
  wordConnections: WordConnection[];
  relatedVerses: string[];
}> | null {
  if (!raw) return null;
  const cleaned = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end <= start) return null;

  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
  } catch {}
  return null;
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
  const [editorTab, setEditorTab] = useState<'structure' | 'exegesis' | 'connections'>('structure');
  const [loadingVerse, setLoadingVerse] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingExegesis, setLoadingExegesis] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Dynamic Bible Keyword Search & Verse Connections
  const [keywordQuery, setKeywordQuery] = useState('');
  const [keywordResults, setKeywordResults] = useState<BibleVerse[]>([]);
  const [searchingKeyword, setSearchingKeyword] = useState(false);
  const [quickTitleInput, setQuickTitleInput] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sermons));
    } catch {}
  }, [sermons]);

  useEffect(() => {
    if (prefillReference) {
      setEditing(createEmptySermon(prefillReference, prefillVerseText || ''));
      setEditorTab('structure');
      onConsumePrefill?.();
    }
  }, [prefillReference, prefillVerseText, onConsumePrefill]);

  const showToast = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const handleLoadBaseVerse = async (customRef?: string) => {
    const refToFetch = (customRef ?? editing?.baseReference ?? '').trim();
    if (!refToFetch) return;
    setLoadingVerse(true);
    try {
      const verse = await searchVerseByReference(refToFetch, translation);
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

  const handleKeywordSearch = async (e?: React.FormEvent, overrideWord?: string) => {
    if (e) e.preventDefault();
    const q = (overrideWord ?? keywordQuery).trim();
    if (q.length < 2) {
      showToast('Digite pelo menos 2 letras para buscar na Bíblia.');
      return;
    }
    setSearchingKeyword(true);
    try {
      const matches = await searchBibleByKeyword(q, translation, 12);
      setKeywordResults(matches);
      if (matches.length === 0) {
        showToast(`Nenhum versículo encontrado com "${q}" nesta versão.`);
      }
    } catch {
      showToast('Erro ao pesquisar palavras na Bíblia.');
    } finally {
      setSearchingKeyword(false);
    }
  };

  const handleGenerateFullSermon = async (targetDraft?: SermonDraft, keywordHint?: string) => {
    const draft = targetDraft || editing;
    if (!draft) return;

    const topic = draft.title.trim() || draft.baseReference.trim() || keywordHint?.trim() || '';
    if (!topic) {
      showToast('Digite um Título para o Sermão ou uma palavra-chave para gerar!');
      return;
    }

    setLoadingAI(true);
    try {
      const searchSeed = keywordHint?.trim() || draft.title.trim();
      const mainWord = searchSeed
        .split(/\s+/)
        .filter((w) => w.length > 3)
        .sort((a, b) => b.length - a.length)[0];

      let foundContextVerses: BibleVerse[] = [];
      if (mainWord) {
        try {
          foundContextVerses = await searchBibleByKeyword(mainWord, translation, 6);
          if (foundContextVerses.length > 0) {
            setKeywordResults(foundContextVerses);
          }
        } catch {}
      }

      const versesContextText = foundContextVerses
        .map((v) => `${v.book_name} ${v.chapter}:${v.verse} - "${v.text}"`)
        .join('\n');

      const prompt =
        `Gere um sermão expositivo completo e rico em Exegese e Hermenêutica bíblica em português do Brasil.\n` +
        `Título do sermão: "${draft.title || topic}"\n` +
        `Ocasião: ${draft.category}\n` +
        (draft.baseReference ? `Texto base informado: ${draft.baseReference}\n` : '') +
        (draft.baseVerseText ? `Texto do versículo: "${draft.baseVerseText}"\n` : '') +
        (versesContextText ? `Versículos relacionados encontrados na Bíblia:\n${versesContextText}\n` : '') +
        `\nResponda EXCLUSIVAMENTE com um JSON válido (sem markdown extra) neste formato exato:\n` +
        `{\n` +
        `  "baseReference": "Livro Capítulo:Versículo principal",\n` +
        `  "introduction": "Introdução envolvente conectando o tema à vida prática (3 a 5 linhas)",\n` +
        `  "points": [\n` +
        `    { "heading": "1. Título do Ponto 1", "body": "Explicação bíblica profunda com referências de versículos conectados" },\n` +
        `    { "heading": "2. Título do Ponto 2", "body": "Explicação bíblica profunda com referências de versículos conectados" },\n` +
        `    { "heading": "3. Título do Ponto 3", "body": "Explicação bíblica profunda com referências de versículos conectados" }\n` +
        `  ],\n` +
        `  "application": "Ilustração e aplicação prática para a igreja",\n` +
        `  "conclusion": "Conclusão forte com oração e apelo final",\n` +
        `  "exegesisContext": "Exegese detalhada: autor, contexto histórico, cultural, literário e intenção original do texto",\n` +
        `  "hermeneuticsPrinciple": "Hermenêutica: princípio teológico atemporal, harmonia com o restante das Escrituras e visão cristocêntrica",\n` +
        `  "homileticBridge": "Ponte homilética e cuidados de interpretação (o que evitar distorcer e como aplicar fielmente hoje)",\n` +
        `  "wordConnections": [\n` +
        `    { "word": "Palavra-chave 1", "original": "Termo em Grego/Hebraico + Strong", "meaning": "Significado exegético resumido" },\n` +
        `    { "word": "Palavra-chave 2", "original": "Termo em Grego/Hebraico + Strong", "meaning": "Significado exegético resumido" }\n` +
        `  ],\n` +
        `  "relatedVerses": ["Ref 1", "Ref 2", "Ref 3", "Ref 4"]\n` +
        `}`;

      const res = await fetch('/api/ai/theology', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'sermon',
          prompt,
          context: draft.baseVerseText || versesContextText || undefined,
        }),
      });

      const data = await res.json();
      const rawText = data.result || data.response || data.content || '';
      const structured = tryParseStructuredSermon(rawText);

      if (structured) {
        const chosenRef = draft.baseReference.trim() || structured.baseReference || '';
        let loadedVerseText = draft.baseVerseText;
        let canonicalRef = chosenRef;

        if (chosenRef && !loadedVerseText) {
          try {
            const v = await searchVerseByReference(chosenRef, translation);
            canonicalRef = `${v.book_name} ${v.chapter}:${v.verse}`;
            loadedVerseText = v.text;
          } catch {}
        }

        const nextPoints: SermonPoint[] =
          Array.isArray(structured.points) && structured.points.length > 0
            ? structured.points.map((p, idx) => ({
                id: `p_${Date.now()}_${idx}`,
                heading: p.heading || `${idx + 1}. Tópico`,
                body: p.body || '',
              }))
            : draft.points;

        setEditing({
          ...draft,
          title: draft.title.trim() || structured.title || topic,
          baseReference: canonicalRef,
          baseVerseText: loadedVerseText,
          introduction: structured.introduction || draft.introduction,
          points: nextPoints,
          application: structured.application || draft.application,
          conclusion: structured.conclusion || draft.conclusion,
          exegesisContext: structured.exegesisContext || draft.exegesisContext,
          hermeneuticsPrinciple: structured.hermeneuticsPrinciple || draft.hermeneuticsPrinciple,
          homileticBridge: structured.homileticBridge || draft.homileticBridge,
          wordConnections: Array.isArray(structured.wordConnections) ? structured.wordConnections : [],
          relatedVerses: Array.isArray(structured.relatedVerses) ? structured.relatedVerses : [],
          aiNotes: '',
        });
        showToast('Sermão completo gerado com Exegese, Hermenêutica e conexões!');
      } else if (rawText) {
        setEditing({
          ...draft,
          aiNotes: rawText,
        });
        showToast('Esboço gerado nas notas abaixo!');
      } else {
        showToast('Não foi possível gerar o sermão agora.');
      }
    } catch {
      showToast('Erro ao consultar o Mentor Teológico IA.');
    } finally {
      setLoadingAI(false);
    }
  };

  const handleEnrichExegesisOnly = async () => {
    if (!editing) return;
    const topic = editing.baseReference.trim() || editing.title.trim();
    if (!topic) {
      showToast('Informe o Título ou Texto Base para gerar Exegese e Hermenêutica.');
      return;
    }

    setLoadingExegesis(true);
    try {
      const prompt =
        `Faça uma análise profunda de EXEGESE e HERMENÊUTICA para enriquecer o sermão:\n` +
        `Título: "${editing.title || topic}"\n` +
        `Texto Base: "${editing.baseReference || 'Não especificado'}"\n` +
        (editing.baseVerseText ? `Texto: "${editing.baseVerseText}"\n` : '') +
        `\nResponda EXCLUSIVAMENTE com um JSON válido neste formato:\n` +
        `{\n` +
        `  "exegesisContext": "Contexto histórico, cultural, geográfico e literário da passagem",\n` +
        `  "hermeneuticsPrinciple": "Interpretação hermenêutica, teologia bíblica e conexão cristocêntrica",\n` +
        `  "homileticBridge": "Ponte para o púlpito atual e erros interpretativos a evitar",\n` +
        `  "wordConnections": [\n` +
        `    { "word": "Termo 1", "original": "Hebraico/Grego + transliteração", "meaning": "Significado exegético" },\n` +
        `    { "word": "Termo 2", "original": "Hebraico/Grego + transliteração", "meaning": "Significado exegético" }\n` +
        `  ],\n` +
        `  "relatedVerses": ["Ref 1", "Ref 2", "Ref 3"]\n` +
        `}`;

      const res = await fetch('/api/ai/theology', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'exegesis',
          prompt,
          context: editing.baseVerseText || undefined,
        }),
      });
      const data = await res.json();
      const rawText = data.result || data.response || data.content || '';
      const parsed = tryParseStructuredSermon(rawText);

      if (parsed) {
        setEditing((prev) =>
          prev
            ? {
                ...prev,
                exegesisContext: parsed.exegesisContext || prev.exegesisContext,
                hermeneuticsPrinciple: parsed.hermeneuticsPrinciple || prev.hermeneuticsPrinciple,
                homileticBridge: parsed.homileticBridge || prev.homileticBridge,
                wordConnections:
                  Array.isArray(parsed.wordConnections) && parsed.wordConnections.length > 0
                    ? parsed.wordConnections
                    : prev.wordConnections,
                relatedVerses:
                  Array.isArray(parsed.relatedVerses) && parsed.relatedVerses.length > 0
                    ? parsed.relatedVerses
                    : prev.relatedVerses,
              }
            : prev
        );
        showToast('Exegese e Hermenêutica atualizadas com sucesso!');
      } else if (rawText) {
        setEditing((prev) => (prev ? { ...prev, exegesisContext: rawText } : prev));
        showToast('Análise exegética adicionada!');
      }
    } catch {
      showToast('Erro ao gerar Exegese e Hermenêutica.');
    } finally {
      setLoadingExegesis(false);
    }
  };

  const handleQuickCreateAndGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = quickTitleInput.trim();
    if (!title) {
      showToast('Digite um título ou tema para gerar o sermão.');
      return;
    }
    const fresh = createEmptySermon('', '', title);
    setEditing(fresh);
    setEditorTab('structure');
    setQuickTitleInput('');
    await handleGenerateFullSermon(fresh, title);
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
      s.exegesisContext ? `EXEGESE (CONTEXTO HISTÓRICO & LITERÁRIO):\n${s.exegesisContext}\n` : '',
      s.hermeneuticsPrinciple ? `HERMENÊUTICA (PRINCÍPIO TEOLÓGICO):\n${s.hermeneuticsPrinciple}\n` : '',
      s.homileticBridge ? `PONTE HOMILÉTICA & CUIDADOS:\n${s.homileticBridge}\n` : '',
      s.wordConnections?.length
        ? `PALAVRAS NO ORIGINAL:\n${s.wordConnections.map((w) => `• ${w.word} (${w.original}): ${w.meaning}`).join('\n')}\n`
        : '',
      s.introduction ? `INTRODUÇÃO:\n${s.introduction}\n` : '',
      ...s.points.map((p) => `${p.heading}\n${p.body}\n`),
      s.application ? `APLICAÇÃO PRÁTICA:\n${s.application}\n` : '',
      s.conclusion ? `CONCLUSÃO:\n${s.conclusion}\n` : '',
      s.relatedVerses?.length ? `VERSÍCULOS CONECTADOS: ${s.relatedVerses.join(', ')}\n` : '',
      s.aiNotes ? `NOTAS COMPLEMENTARES:\n${s.aiNotes}` : '',
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
      <div className="space-y-4 pb-14">
        {/* Top Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 bg-[#12121A]/90 border border-white/10 rounded-2xl p-3">
          <button
            onClick={() => setEditing(null)}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => void handleGenerateFullSermon()}
              disabled={loadingAI}
              className="px-3.5 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/45 border border-purple-400/40 text-purple-100 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
            >
              {loadingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
              {loadingAI ? 'Gerando...' : 'Gerar Sermão IA'}
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-[var(--theme-color)] text-white text-xs font-bold flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
            >
              <Save className="w-3.5 h-3.5" /> Salvar
            </button>
          </div>
        </div>

        {statusMsg && (
          <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs font-semibold">
            {statusMsg}
          </div>
        )}

        {/* Identity & Base Scripture Card */}
        <div className="bg-gradient-to-br from-[#171525] via-[#12121A] to-[#0E0E14] border border-white/10 rounded-[28px] p-5 space-y-4 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-white/50">
                Título do Sermão
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  placeholder="Ex: O Verdadeiro Evangelho"
                  className="flex-1 bg-black/45 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white placeholder:text-white/30 outline-none focus:border-[var(--theme-color)]"
                />
                <button
                  type="button"
                  onClick={() => void handleGenerateFullSermon()}
                  disabled={loadingAI}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[var(--theme-color)] to-purple-600 hover:opacity-90 text-white text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shrink-0 disabled:opacity-50"
                >
                  {loadingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                  {loadingAI ? 'Gerando...' : 'Gerar deste Título'}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-white/50">
                Ocasião / Tipo
              </label>
              <select
                value={editing.category}
                onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                className="w-full bg-black/45 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-[var(--theme-color)]"
              >
                {SERMON_CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-[#121218]">
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-white/50">
              Texto Bíblico Base
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={editing.baseReference}
                onChange={(e) => setEditing({ ...editing, baseReference: e.target.value })}
                placeholder="Ex: Romanos 1:16 ou Salmos 23:1"
                className="flex-1 bg-black/45 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[var(--theme-color)]"
              />
              <button
                type="button"
                onClick={() => void handleLoadBaseVerse()}
                disabled={loadingVerse}
                className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 shrink-0"
              >
                {loadingVerse ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookOpen className="w-3.5 h-3.5" />}
                Buscar Texto
              </button>
            </div>
            {editing.baseVerseText && (
              <blockquote className="p-3.5 rounded-xl bg-amber-500/10 border-l-4 border-amber-400 text-xs sm:text-sm text-amber-100/95 italic leading-relaxed font-serif">
                "{editing.baseVerseText}"
              </blockquote>
            )}
          </div>
        </div>

        {/* Clean Tab Switcher inside Editor */}
        <div className="grid grid-cols-3 gap-2 bg-[#121218] border border-white/10 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => setEditorTab('structure')}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              editorTab === 'structure'
                ? 'bg-[var(--theme-color)] text-white shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Estrutura</span>
          </button>
          <button
            type="button"
            onClick={() => setEditorTab('exegesis')}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              editorTab === 'exegesis'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Exegese & Herm.</span>
          </button>
          <button
            type="button"
            onClick={() => setEditorTab('connections')}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              editorTab === 'connections'
                ? 'bg-cyan-500 text-black font-extrabold shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Conexões</span>
          </button>
        </div>

        {/* TAB 1: Estrutura do Sermão */}
        {editorTab === 'structure' && (
          <div className="bg-[#121218] border border-white/10 rounded-[28px] p-5 space-y-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-white/55">
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

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-white/55">
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
                <div key={pt.id} className="p-4 rounded-2xl bg-black/35 border border-white/10 space-y-2.5 relative">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-[var(--theme-color)]/20 text-[var(--theme-color)] text-[11px] font-extrabold flex items-center justify-center shrink-0">
                      0{index + 1}
                    </span>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-white/55">
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
                <label className="text-[11px] font-bold uppercase tracking-wider text-white/55">
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
          </div>
        )}

        {/* TAB 2: Exegese & Hermenêutica */}
        {editorTab === 'exegesis' && (
          <div className="bg-[#121218] border border-purple-500/25 rounded-[28px] p-5 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Compass className="w-4 h-4 text-purple-400" />
                  Exegese & Hermenêutica Bíblica
                </h3>
                <p className="text-xs text-white/55">
                  Enriqueça seu sermão com contexto histórico, análise léxica e interpretação teológica fiel
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleEnrichExegesisOnly()}
                disabled={loadingExegesis}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg disabled:opacity-50"
              >
                {loadingExegesis ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                {loadingExegesis ? 'Analisando...' : 'Gerar Exegese & Hermenêutica'}
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-purple-300">
                1. Exegese — Contexto Histórico, Cultural & Literário
              </label>
              <textarea
                rows={4}
                value={editing.exegesisContext || ''}
                onChange={(e) => setEditing({ ...editing, exegesisContext: e.target.value })}
                placeholder="Quem escreveu, destinatários originais, época, cenário histórico e gênero literário..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-purple-400 resize-y"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                2. Hermenêutica — Princípio Teológico & Visão Cristocêntrica
              </label>
              <textarea
                rows={4}
                value={editing.hermeneuticsPrinciple || ''}
                onChange={(e) => setEditing({ ...editing, hermeneuticsPrinciple: e.target.value })}
                placeholder="Qual a verdade teológica eterna deste texto e como ele se conecta com toda a Escritura e com Cristo?"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-amber-400 resize-y"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                3. Ponte Homilética & Cuidados Interpretativos
              </label>
              <textarea
                rows={3}
                value={editing.homileticBridge || ''}
                onChange={(e) => setEditing({ ...editing, homileticBridge: e.target.value })}
                placeholder="Como trazer o sentido original para a igreja hoje sem tirar o texto do contexto..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-emerald-400 resize-y"
              />
            </div>

            {/* Word Connections in Original Languages */}
            <div className="space-y-2.5 pt-2 border-t border-white/10">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5" /> Análise Léxica (Hebraico / Grego)
              </span>
              {(editing.wordConnections?.length || 0) === 0 ? (
                <p className="text-xs text-white/40 italic">
                  Clique em "Gerar Exegese & Hermenêutica" acima para extrair as palavras-chave no original.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {editing.wordConnections!.map((wc, i) => (
                    <div key={i} className="p-3 rounded-2xl bg-purple-950/30 border border-purple-500/25">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-bold text-white">{wc.word}</span>
                        <span className="text-xs font-mono text-purple-300">({wc.original})</span>
                      </div>
                      <p className="text-xs text-white/75 mt-1 leading-relaxed">{wc.meaning}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Conexões & Versículos */}
        {editorTab === 'connections' && (
          <div className="bg-[#121218] border border-cyan-500/25 rounded-[28px] p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Link2 className="w-4 h-4 text-cyan-400" />
                Buscador de Palavras & Conexões Bíblicas
              </h3>
              <p className="text-xs text-white/55">
                Pesquise qualquer palavra na Bíblia inteira e conecte versículos direto ao seu sermão
              </p>
            </div>

            <form onSubmit={(e) => void handleKeywordSearch(e)} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={keywordQuery}
                  onChange={(e) => setKeywordQuery(e.target.value)}
                  placeholder="Buscar palavra (ex: evangelho, graça, fé, pastor, espírito)..."
                  className="w-full bg-black/45 border border-white/15 rounded-xl py-2.5 pl-10 pr-3 text-xs sm:text-sm text-white placeholder:text-white/35 outline-none focus:border-cyan-400"
                />
              </div>
              <button
                type="submit"
                disabled={searchingKeyword}
                className="px-4 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-200 text-xs font-bold shrink-0"
              >
                {searchingKeyword ? 'Buscando...' : 'Buscar'}
              </button>
            </form>

            {(editing.relatedVerses?.length || 0) > 0 && (
              <div className="p-3.5 rounded-2xl bg-black/30 border border-white/10 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  Referências Conectadas pela IA (clique para carregar como Base)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {editing.relatedVerses!.map((rv) => (
                    <button
                      key={rv}
                      type="button"
                      onClick={() => void handleLoadBaseVerse(rv)}
                      className="px-3 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-xs font-semibold text-amber-200"
                    >
                      {rv}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {keywordResults.length > 0 && (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {keywordResults.map((v) => {
                  const ref = `${v.book_name} ${v.chapter}:${v.verse}`;
                  return (
                    <div key={ref} className="p-3.5 rounded-2xl bg-black/35 border border-white/10 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-amber-300">{ref}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditing((prev) =>
                                prev ? { ...prev, baseReference: ref, baseVerseText: v.text } : prev
                              );
                              showToast(`${ref} definido como Texto Base!`);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-200 text-[11px] font-bold hover:bg-amber-500/30"
                          >
                            Usar como Base
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditing((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      points: [
                                        ...prev.points,
                                        {
                                          id: `p_${Date.now()}`,
                                          heading: `${prev.points.length + 1}. Conexão: ${ref}`,
                                          body: `"${v.text}" (${ref}) — `,
                                        },
                                      ],
                                    }
                                  : prev
                              );
                              setEditorTab('structure');
                              showToast(`${ref} adicionado aos tópicos do sermão!`);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-200 text-[11px] font-bold hover:bg-cyan-500/30"
                          >
                            + Adicionar Ponto
                          </button>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-white/80 leading-relaxed">{v.text}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {editing.aiNotes && (
          <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Notas Complementares (Mentor IA)
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
            Gere sermões completos com Exegese, Hermenêutica e conexões bíblicas
          </p>
        </div>

        <button
          onClick={() => {
            setEditing(createEmptySermon());
            setEditorTab('structure');
          }}
          className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> Em Branco
        </button>
      </div>

      {/* Quick Automatic Sermon Generator Bar */}
      <form
        onSubmit={(e) => void handleQuickCreateAndGenerate(e)}
        className="bg-gradient-to-r from-purple-950/40 via-[#14141E] to-amber-950/20 border border-purple-500/30 rounded-3xl p-4 sm:p-5 space-y-3 shadow-xl"
      >
        <div className="flex items-center gap-2 text-xs font-bold text-purple-200">
          <Wand2 className="w-4 h-4 text-amber-400" />
          Gerador Automático de Sermão (com Exegese & Hermenêutica)
        </div>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={quickTitleInput}
            onChange={(e) => setQuickTitleInput(e.target.value)}
            placeholder="Ex: O Verdadeiro Evangelho, Fé que Move Montanhas, Graça..."
            className="flex-1 bg-black/45 border border-white/15 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-[var(--theme-color)]"
          />
          <button
            type="submit"
            disabled={loadingAI}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[var(--theme-color)] to-purple-600 hover:opacity-90 text-white text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shrink-0 active:scale-95 transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            Gerar Sermão
          </button>
        </div>
      </form>

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
            <h3 className="text-base font-bold text-white">Nenhum sermão salvo ainda</h3>
            <p className="text-xs text-white/55 leading-relaxed">
              Digite um título acima e clique em <strong>Gerar Sermão</strong> para criar estrutura, exegese, hermenêutica e versículos conectados automaticamente.
            </p>
          </div>
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
                  onClick={() => {
                    setEditing(s);
                    setEditorTab('structure');
                  }}
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
