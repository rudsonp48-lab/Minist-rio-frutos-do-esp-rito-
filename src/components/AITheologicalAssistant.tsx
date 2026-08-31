import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, BookOpen, Scroll, Heart, MessageSquare, 
  X, Copy, Check, Save, Volume2, VolumeX, Send, 
  ChevronRight, RefreshCw, Cpu, Flame, ShieldAlert, CheckCircle2
} from 'lucide-react';
import { requestTheologyInsight, sendTheologicalChat, ChatMessage } from '../services/aiService';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';
import Markdown from 'react-markdown';
import { useTheme } from '../lib/ThemeContext';

export interface AIAssistantTriggerEvent {
  mode?: 'exegesis' | 'sermon' | 'prayer' | 'chat';
  reference?: string;
  prompt?: string;
}

export default function AITheologicalAssistant() {
  const { themeColor } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'exegesis' | 'sermon' | 'prayer' | 'chat'>('exegesis');
  
  // Exegesis State
  const [verseRef, setVerseRef] = useState('João 3:16');
  const [exegesisResult, setExegesisResult] = useState('');
  const [isExegesisLoading, setIsExegesisLoading] = useState(false);

  // Sermon Outline State
  const [sermonTopic, setSermonTopic] = useState('O Poder da Fé e da Perseverança');
  const [sermonAudience, setSermonAudience] = useState('Igreja Geral');
  const [sermonResult, setSermonResult] = useState('');
  const [isSermonLoading, setIsSermonLoading] = useState(false);

  // Prayer / Counseling State
  const [prayerFeeling, setPrayerFeeling] = useState('Paz e Direção em Momentos de Decisão');
  const [prayerResult, setPrayerResult] = useState('');
  const [isPrayerLoading, setIsPrayerLoading] = useState(false);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'A paz do Senhor! Sou o seu Mentor Teológico e Conselheiro Bíblico da Ecclesia. Como posso abençoar seus estudos ou sua caminhada espiritual hoje?'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Utility states
  const [copied, setCopied] = useState(false);
  const [savedToNotes, setSavedToNotes] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Listen for global triggers
  useEffect(() => {
    const handleTrigger = (e: Event) => {
      const customEvent = e as CustomEvent<AIAssistantTriggerEvent>;
      if (customEvent.detail) {
        if (customEvent.detail.mode) setActiveTab(customEvent.detail.mode);
        if (customEvent.detail.reference) setVerseRef(customEvent.detail.reference);
        if (customEvent.detail.prompt) {
          if (customEvent.detail.mode === 'sermon') setSermonTopic(customEvent.detail.prompt);
          if (customEvent.detail.mode === 'prayer') setPrayerFeeling(customEvent.detail.prompt);
        }
      }
      setIsOpen(true);
    };

    window.addEventListener('open-ai-assistant', handleTrigger);
    return () => window.removeEventListener('open-ai-assistant', handleTrigger);
  }, []);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  // Stop speech when modal closes
  useEffect(() => {
    if (!isOpen && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isOpen]);

  const handleExegesisSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!verseRef.trim()) return;
    setIsExegesisLoading(true);
    setSavedToNotes(false);
    const res = await requestTheologyInsight({ mode: 'exegesis', reference: verseRef });
    setExegesisResult(res);
    setIsExegesisLoading(false);
  };

  const handleSermonSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!sermonTopic.trim()) return;
    setIsSermonLoading(true);
    setSavedToNotes(false);
    const res = await requestTheologyInsight({ 
      mode: 'sermon', 
      prompt: sermonTopic, 
      audience: sermonAudience 
    });
    setSermonResult(res);
    setIsSermonLoading(false);
  };

  const handlePrayerSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prayerFeeling.trim()) return;
    setIsPrayerLoading(true);
    setSavedToNotes(false);
    const res = await requestTheologyInsight({ 
      mode: 'prayer', 
      feelings: prayerFeeling 
    });
    setPrayerResult(res);
    setIsPrayerLoading(false);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const newMsg: ChatMessage = { role: 'user', content: chatInput.trim() };
    const updatedMessages = [...chatMessages, newMsg];
    setChatMessages(updatedMessages);
    setChatInput('');
    setIsChatLoading(true);

    const responseText = await sendTheologicalChat(updatedMessages);
    setChatMessages([...updatedMessages, { role: 'assistant', content: responseText }]);
    setIsChatLoading(false);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToNotes = async (title: string, text: string, ref: string = '') => {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'notes'), {
        userId: auth.currentUser.uid,
        title: title || 'Estudo Teológico IA',
        content: text,
        verseRef: ref,
        wordStudy: 'Gerado via Pastor IA Ecclesia',
        xp: 25,
        createdAt: serverTimestamp(),
      });
      setSavedToNotes(true);
      setTimeout(() => setSavedToNotes(false), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'notes');
    }
  };

  const handleSpeak = (text: string) => {
    if (!window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Strip markdown formatting for cleaner speech
    const cleanText = text
      .replace(/#+\s/g, '')
      .replace(/[*_`]/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  return (
    <>
      {/* Main Interactive Drawer / Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full max-w-4xl max-h-[92vh] bg-[#121214] border border-white/10 rounded-[28px] shadow-[0_25px_70px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden text-white"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[var(--theme-color)] to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/30">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      Mentor Teológico & Exegese
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--theme-color)]/20 border border-[var(--theme-color)]/30 text-[var(--theme-color)] font-semibold uppercase tracking-wider">
                        Gemini IA
                      </span>
                    </h2>
                    <p className="text-xs text-white/50">Estudos profundos, exegese bíblica e auxílio pastoral</p>
                  </div>
                </div>

                <button
                  id="close-ai-assistant-btn"
                  onClick={() => setIsOpen(false)}
                  className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="px-6 pt-3 flex gap-2 overflow-x-auto border-b border-white/5 scrollbar-hide bg-black/20">
                <button
                  id="tab-ai-exegesis"
                  onClick={() => setActiveTab('exegesis')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
                    activeTab === 'exegesis'
                      ? 'border-[var(--theme-color)] text-white bg-white/5'
                      : 'border-transparent text-white/50 hover:text-white hover:bg-white/[0.02]'
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-[var(--theme-color)]" />
                  Exegese Bíblica
                </button>

                <button
                  id="tab-ai-sermon"
                  onClick={() => setActiveTab('sermon')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
                    activeTab === 'sermon'
                      ? 'border-[var(--theme-color)] text-white bg-white/5'
                      : 'border-transparent text-white/50 hover:text-white hover:bg-white/[0.02]'
                  }`}
                >
                  <Scroll className="w-4 h-4 text-amber-400" />
                  Esboço de Sermão
                </button>

                <button
                  id="tab-ai-prayer"
                  onClick={() => setActiveTab('prayer')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
                    activeTab === 'prayer'
                      ? 'border-[var(--theme-color)] text-white bg-white/5'
                      : 'border-transparent text-white/50 hover:text-white hover:bg-white/[0.02]'
                  }`}
                >
                  <Heart className="w-4 h-4 text-rose-400" />
                  Oração & Conforto
                </button>

                <button
                  id="tab-ai-chat"
                  onClick={() => setActiveTab('chat')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
                    activeTab === 'chat'
                      ? 'border-[var(--theme-color)] text-white bg-white/5'
                      : 'border-transparent text-white/50 hover:text-white hover:bg-white/[0.02]'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  Perguntas & Respostas
                </button>
              </div>

              {/* Tab Content Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* 1. EXEGESE TAB */}
                {activeTab === 'exegesis' && (
                  <div className="space-y-6">
                    <form onSubmit={handleExegesisSubmit} className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1 relative">
                        <input
                          id="ai-exegesis-input"
                          type="text"
                          value={verseRef}
                          onChange={(e) => setVerseRef(e.target.value)}
                          placeholder="Digite o versículo ou passagem (ex: Salmos 23:1, João 3:16, Efésios 6:10)"
                          className="w-full h-12 bg-black/40 border border-white/15 rounded-2xl px-4 text-sm text-white placeholder-white/40 outline-none focus:border-[var(--theme-color)] transition-colors"
                        />
                      </div>
                      <button
                        id="ai-exegesis-submit"
                        type="submit"
                        disabled={isExegesisLoading || !verseRef.trim()}
                        className="h-12 px-6 bg-[var(--theme-color)] hover:bg-[var(--color-primary-focused)] text-white rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                      >
                        {isExegesisLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                        {isExegesisLoading ? 'Examinando...' : 'Analisar Exegese'}
                      </button>
                    </form>

                    {/* Quick suggestions */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-white/40">Sugestões rápidas:</span>
                      {['Salmos 23:1', 'João 3:16', 'Romanos 8:28', 'Filipenses 4:6', 'Isaías 40:31'].map((ref) => (
                        <button
                          key={ref}
                          onClick={() => {
                            setVerseRef(ref);
                            requestTheologyInsight({ mode: 'exegesis', reference: ref }).then(setExegesisResult);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/5 transition-colors"
                        >
                          {ref}
                        </button>
                      ))}
                    </div>

                    {/* Result Output */}
                    {exegesisResult ? (
                      <div className="bg-black/50 border border-white/10 rounded-2xl p-6 relative space-y-4">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-color)] flex items-center gap-2">
                            <BookOpen className="w-4 h-4" /> Análise Exegética de {verseRef}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSpeak(exegesisResult)}
                              className={`p-2 rounded-xl border transition-colors ${
                                isSpeaking ? 'bg-purple-600/30 border-purple-500 text-purple-300' : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                              }`}
                              title={isSpeaking ? 'Parar leitura' : 'Ouvir com áudio'}
                            >
                              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleCopy(exegesisResult)}
                              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors"
                              title="Copiar texto"
                            >
                              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleSaveToNotes(`Exegese: ${verseRef}`, exegesisResult, verseRef)}
                              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                                savedToNotes ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-white/5 border-white/10 text-white/80 hover:text-white'
                              }`}
                            >
                              {savedToNotes ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                              {savedToNotes ? 'Salvo (+25 XP)' : 'Salvar nas Notas'}
                            </button>
                          </div>
                        </div>

                        <div className="prose prose-invert max-w-none text-sm text-white/90 leading-relaxed">
                          <Markdown>{exegesisResult}</Markdown>
                        </div>
                      </div>
                    ) : (
                      !isExegesisLoading && (
                        <div className="text-center py-12 text-white/40 border border-dashed border-white/10 rounded-2xl">
                          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30 text-[var(--theme-color)]" />
                          <p className="text-sm">Digite qualquer passagem bíblica para revelar a história, raízes no hebraico/grego e aplicações espirituais.</p>
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* 2. SERMON OUTLINE TAB */}
                {activeTab === 'sermon' && (
                  <div className="space-y-6">
                    <form onSubmit={handleSermonSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-xs text-white/60 mb-1 font-medium">Tema ou Texto Base da Mensagem</label>
                          <input
                            type="text"
                            value={sermonTopic}
                            onChange={(e) => setSermonTopic(e.target.value)}
                            placeholder="Ex: Fé e Graça em tempos difíceis, Salmos 91, O Filho Pródigo"
                            className="w-full h-12 bg-black/40 border border-white/15 rounded-2xl px-4 text-sm text-white placeholder-white/40 outline-none focus:border-amber-400 transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-white/60 mb-1 font-medium">Público / Ocasião</label>
                          <select
                            value={sermonAudience}
                            onChange={(e) => setSermonAudience(e.target.value)}
                            className="w-full h-12 bg-black/40 border border-white/15 rounded-2xl px-3 text-sm text-white outline-none focus:border-amber-400 transition-colors"
                          >
                            <option value="Igreja Geral" className="bg-[#1a1a1e]">Culto de Celebração</option>
                            <option value="Jovens e Adolescentes" className="bg-[#1a1a1e]">Culto de Jovens</option>
                            <option value="Célula / Pequeno Grupo" className="bg-[#1a1a1e]">Reunião de Célula</option>
                            <option value="Casais e Família" className="bg-[#1a1a1e]">Casais e Famílias</option>
                            <option value="Liderança" className="bg-[#1a1a1e]">Treinamento de Líderes</option>
                          </select>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSermonLoading || !sermonTopic.trim()}
                        className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                      >
                        {isSermonLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Scroll className="w-4 h-4" />
                        )}
                        {isSermonLoading ? 'Estruturando Esboço com IA...' : 'Gerar Esboço Expositivo Completo'}
                      </button>
                    </form>

                    {/* Quick sermon topic suggestions */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-white/40">Temas sugeridos:</span>
                      {[
                        'O Poder da Fé e da Perseverança',
                        'Salmos 91: O Refúgio Seguro',
                        'A Parábola do Filho Pródigo (Lucas 15)',
                        'Romanos 8: Mais que Vencedores',
                        'A Armadura de Deus (Efésios 6)'
                      ].map((topic) => (
                        <button
                          key={topic}
                          onClick={() => {
                            setSermonTopic(topic);
                            setIsSermonLoading(true);
                            setSavedToNotes(false);
                            requestTheologyInsight({ mode: 'sermon', prompt: topic, audience: sermonAudience })
                              .then((res) => {
                                setSermonResult(res);
                                setIsSermonLoading(false);
                              });
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-amber-200/80 hover:text-amber-200 border border-white/5 transition-colors"
                        >
                          {topic}
                        </button>
                      ))}
                    </div>

                    {sermonResult && (
                      <div className="bg-black/50 border border-white/10 rounded-2xl p-6 relative space-y-4">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                            <Scroll className="w-4 h-4" /> Esboço de Pregação Gerado
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCopy(sermonResult)}
                              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors"
                            >
                              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleSaveToNotes(`Esboço: ${sermonTopic}`, sermonResult)}
                              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                                savedToNotes ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-white/5 border-white/10 text-white/80 hover:text-white'
                              }`}
                            >
                              {savedToNotes ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                              {savedToNotes ? 'Salvo (+25 XP)' : 'Salvar no Meu Bloco'}
                            </button>
                          </div>
                        </div>

                        <div className="prose prose-invert max-w-none text-sm text-white/90 leading-relaxed">
                          <Markdown>{sermonResult}</Markdown>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. PRAYER / COUNSELING TAB */}
                {activeTab === 'prayer' && (
                  <div className="space-y-6">
                    <form onSubmit={handlePrayerSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs text-white/60 mb-2 font-medium">O que você está vivendo ou sentindo neste momento?</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                          {[
                            'Paz contra a Ansiedade',
                            'Cura e Saúde Física/Emocional',
                            'Restauração Familiar',
                            'Sabedoria para Decisões',
                            'Gratidão e Louvor',
                            'Consolo no Luto',
                            'Portas de Emprego',
                            'Renovo Espiritual'
                          ].map((theme) => (
                            <button
                              key={theme}
                              type="button"
                              onClick={() => {
                                setPrayerFeeling(theme);
                              }}
                              className={`p-2.5 rounded-xl border text-xs text-left transition-all ${
                                prayerFeeling === theme
                                  ? 'bg-rose-500/20 border-rose-400 text-rose-200'
                                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                              }`}
                            >
                              {theme}
                            </button>
                          ))}
                        </div>

                        <textarea
                          rows={3}
                          value={prayerFeeling}
                          onChange={(e) => setPrayerFeeling(e.target.value)}
                          placeholder="Ou descreva com suas próprias palavras sua oração ou momento..."
                          className="w-full bg-black/40 border border-white/15 rounded-2xl p-4 text-sm text-white placeholder-white/40 outline-none focus:border-rose-400 transition-colors resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isPrayerLoading || !prayerFeeling.trim()}
                        className="w-full h-12 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                      >
                        {isPrayerLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Heart className="w-4 h-4" />
                        )}
                        {isPrayerLoading ? 'Gerando Oração e Conforto...' : 'Gerar Oração Pastoral Personalizada'}
                      </button>
                    </form>

                    {prayerResult && (
                      <div className="bg-black/50 border border-white/10 rounded-2xl p-6 relative space-y-4">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
                            <Heart className="w-4 h-4" /> Oração e Palavra de Fé
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSpeak(prayerResult)}
                              className={`p-2 rounded-xl border transition-colors ${
                                isSpeaking ? 'bg-rose-600/30 border-rose-500 text-rose-300' : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                              }`}
                              title={isSpeaking ? 'Parar leitura' : 'Ouvir oração'}
                            >
                              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleCopy(prayerResult)}
                              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors"
                            >
                              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="prose prose-invert max-w-none text-sm text-white/90 leading-relaxed">
                          <Markdown>{prayerResult}</Markdown>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. CHAT TEOLÓGICO TAB */}
                {activeTab === 'chat' && (
                  <div className="flex flex-col h-[52vh] sm:h-[56vh]">
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                      {chatMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                              msg.role === 'user'
                                ? 'bg-[var(--theme-color)] text-white'
                                : 'bg-black/50 border border-white/10 text-white/90'
                            }`}
                          >
                            <Markdown>{msg.content}</Markdown>
                          </div>
                        </div>
                      ))}
                      {isChatLoading && (
                        <div className="flex justify-start">
                          <div className="bg-black/50 border border-white/10 rounded-2xl p-4 flex items-center gap-2 text-xs text-white/60">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[var(--theme-color)]" />
                            Consultando as Escrituras e refletindo...
                          </div>
                        </div>
                      )}
                      <div ref={chatBottomRef} />
                    </div>

                    <form onSubmit={handleChatSubmit} className="pt-4 flex gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Faça uma pergunta sobre a Bíblia, teologia ou fé..."
                        className="flex-1 h-12 bg-black/40 border border-white/15 rounded-2xl px-4 text-sm text-white placeholder-white/40 outline-none focus:border-emerald-400 transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={isChatLoading || !chatInput.trim()}
                        className="h-12 w-12 bg-emerald-500 hover:bg-emerald-600 text-black rounded-2xl flex items-center justify-center transition-transform active:scale-95 disabled:opacity-50 shrink-0"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
