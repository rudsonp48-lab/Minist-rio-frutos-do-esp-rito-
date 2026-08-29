import { motion } from 'motion/react';
import { 
  Heart, 
  CreditCard, 
  QrCode, 
  ArrowRight, 
  Building, 
  Copy, 
  CheckCircle2, 
  ChevronLeft, 
  Target, 
  Globe2, 
  Gift, 
  FileText, 
  TrendingUp, 
  Sparkles, 
  Calculator 
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Link } from 'react-router-dom';
import NotificationCenter from '../components/NotificationCenter';

interface Campaign {
  id: string;
  title: string;
  category: string;
  goal: number;
  current: number;
  description: string;
  image: string;
  deadline: string;
}

const CAMPAIGNS: Campaign[] = [
  {
    id: 'missoes-2026',
    title: 'Missões Sertão & Base Ribeirinha',
    category: 'Missões Globais',
    goal: 15000,
    current: 11450,
    description: 'Apoio aos missionários com mantimentos, barcos para vilarejos e distribuição de Bíblias no interior.',
    image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=800',
    deadline: 'Até o fim deste mês'
  },
  {
    id: 'reforma-infantil',
    title: 'Ampliação do Espaço Kids & Berçário',
    category: 'Infraestrutura da Igreja',
    goal: 25000,
    current: 19800,
    description: 'Construção de novas salas climatizadas, brinquedoteca segura e materiais pedagógicos cristãos.',
    image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=800',
    deadline: 'Meta em andamento'
  },
  {
    id: 'cestas-comunidade',
    title: 'Ação Social: 100 Cestas Básicas',
    category: 'Amor ao Próximo',
    goal: 8000,
    current: 7200,
    description: 'Atendimento a famílias em vulnerabilidade social cadastradas pelo ministério de ação social.',
    image: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=800',
    deadline: 'Campanha Contínua'
  }
];

export default function Give() {
  const [copiedPix, setCopiedPix] = useState(false);
  const [copiedBanco, setCopiedBanco] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [tab, setTab] = useState<'methods' | 'campaigns' | 'calculator'>('campaigns');
  
  // Tithe Calculator state
  const [titheIncome, setTitheIncome] = useState<string>('');
  const [calculatedTithe, setCalculatedTithe] = useState<number>(0);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'app_config', 'main'), (snapshot) => {
      if (snapshot.exists()) {
        setConfig(snapshot.data());
      }
    });
    return () => unsubscribe();
  }, []);

  const pixKey = config?.pixKey || "igreja.contribuicao@pix.com.br";
  const bankDetails = config?.bankDetails || "Banco: Inter (077)\nAgência: 0001\nConta Corrente: 8934521-0\nFavorecido: Igreja de Cristo";

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  const handleCopyBanco = () => {
    navigator.clipboard.writeText(bankDetails);
    setCopiedBanco(true);
    setTimeout(() => setCopiedBanco(false), 2500);
  };

  const handleCalculateTithe = (val: string) => {
    setTitheIncome(val);
    const num = parseFloat(val.replace(',', '.')) || 0;
    setCalculatedTithe(num * 0.1);
  };

  return (
    <div className="min-h-screen bg-transparent w-full text-white font-sans max-w-7xl mx-auto px-4 sm:px-6 pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-3xl border-b border-white/5 py-4 px-0 flex items-center justify-between mb-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <Link 
            to="/" 
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10 group"
          >
            <ChevronLeft className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-2xl font-serif font-bold tracking-wider text-white uppercase" style={{ fontFamily: '"Playfair Display", serif' }}>
              Dízimos & Campanhas Missionárias
            </h1>
            <span className="text-[10px] font-bold text-[var(--theme-color)] uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
              <Gift className="w-3.5 h-3.5" /> Generosidade & Transparência do Reino
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <NotificationCenter />
        </div>
      </header>

      {/* Main Tabs */}
      <div className="flex bg-[#121216] border border-white/10 rounded-2xl p-1.5 max-w-lg mx-auto mb-8">
        <button
          onClick={() => setTab('campaigns')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
            tab === 'campaigns' ? 'bg-white text-black shadow-md' : 'text-white/60 hover:text-white'
          }`}
        >
          <Target className="w-3.5 h-3.5" /> Metas & Campanhas
        </button>
        <button
          onClick={() => setTab('methods')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
            tab === 'methods' ? 'bg-white text-black shadow-md' : 'text-white/60 hover:text-white'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" /> Dízimos & PIX
        </button>
        <button
          onClick={() => setTab('calculator')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
            tab === 'calculator' ? 'bg-white text-black shadow-md' : 'text-white/60 hover:text-white'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" /> Calculadora
        </button>
      </div>

      {tab === 'campaigns' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CAMPAIGNS.map((camp) => {
              const percentage = Math.min(100, Math.round((camp.current / camp.goal) * 100));

              return (
                <motion.div
                  key={camp.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#121216] border border-white/10 rounded-[28px] overflow-hidden flex flex-col justify-between shadow-2xl group hover:border-white/20 transition-all"
                >
                  <div>
                    <div className="h-44 w-full relative overflow-hidden">
                      <img 
                        src={camp.image} 
                        alt={camp.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#121216] via-transparent to-black/40" />
                      <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider border border-white/10">
                        {camp.category}
                      </span>
                    </div>

                    <div className="p-5">
                      <h3 className="text-base font-bold text-white mb-2 leading-tight">
                        {camp.title}
                      </h3>
                      <p className="text-xs text-white/70 leading-relaxed mb-4">
                        {camp.description}
                      </p>

                      {/* Progress Bar & Thermometer */}
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-white">R$ {camp.current.toLocaleString('pt-BR')}</span>
                          <span className="text-emerald-400">{percentage}% da meta</span>
                        </div>
                        <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden p-[2px] border border-white/10">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-white/40">
                          <span>Meta: R$ {camp.goal.toLocaleString('pt-BR')}</span>
                          <span>{camp.deadline}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    <button
                      onClick={() => {
                        setTab('methods');
                      }}
                      className="w-full h-11 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all active:scale-95 border border-white/10"
                    >
                      <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                      Apoiar Esta Causa
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Transparency Footer Note */}
          <div className="bg-[#121216] border border-white/10 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Transparência e Prestação de Contas</h4>
              <p className="text-[11px] text-white/50">Todos os relatórios financeiros da igreja são auditados pelo Conselho Fiscal e apresentados em assembleia periódica.</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'methods' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* PIX QR Code Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#121216] border border-emerald-500/30 rounded-[32px] p-6 sm:p-8 shadow-2xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <QrCode className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Chave PIX Instantânea</h3>
                  <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Livre de Taxas</p>
                </div>
              </div>

              <div className="bg-black/60 border border-white/10 p-6 rounded-2xl text-center mb-6">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pixKey)}`} 
                  alt="QR Code PIX" 
                  className="w-36 h-36 mx-auto rounded-xl bg-white p-2 mb-4" 
                />
                <p className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-1">Chave Oficial:</p>
                <p className="text-sm sm:text-base font-mono font-bold text-white break-all">{pixKey}</p>
              </div>
            </div>

            <button
              onClick={handleCopyPix}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
            >
              {copiedPix ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedPix ? 'Chave Copiada com Sucesso!' : 'Copiar Chave PIX'}
            </button>
          </motion.div>

          {/* Bank Transfer & Card Details */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-[#121216] border border-white/10 rounded-[32px] p-6 sm:p-8 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <Building className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Transferência Bancária (TED/DOC)</h3>
                  <p className="text-xs text-white/50">Conta Institucional</p>
                </div>
              </div>

              <div className="bg-black/60 p-4 rounded-2xl border border-white/10 font-mono text-xs text-white/90 whitespace-pre-wrap leading-relaxed mb-4">
                {bankDetails}
              </div>

              <button
                onClick={handleCopyBanco}
                className="w-full h-11 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all"
              >
                {copiedBanco ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiedBanco ? 'Dados Copiados!' : 'Copiar Dados Bancários'}
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-[#121216] border border-white/10 rounded-[32px] p-6 sm:p-8 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Cartão de Crédito ou Débito</h3>
                  <p className="text-xs text-white/50">Recorrência mensal disponível</p>
                </div>
              </div>

              <button
                onClick={() => {
                  if (config?.cardUrl) {
                    window.open(config.cardUrl, '_blank');
                  } else {
                    handleCopyPix();
                  }
                }}
                className="w-full h-12 bg-white text-black font-bold uppercase tracking-wider text-xs rounded-2xl flex items-center justify-center gap-2 hover:bg-white/90 transition-all shadow-lg active:scale-95"
              >
                <CreditCard className="w-4 h-4" /> Contribuir Online
              </button>
            </motion.div>
          </div>
        </div>
      )}

      {tab === 'calculator' && (
        <div className="max-w-md mx-auto bg-[#121216] border border-white/10 rounded-[32px] p-6 sm:p-8 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-4">
            <Calculator className="w-6 h-6 text-purple-400" />
          </div>

          <h3 className="text-lg font-bold text-white text-center mb-1">Calculadora Bíblica do Dízimo</h3>
          <p className="text-xs text-white/50 text-center mb-6">
            "Trazei todos os dízimos à casa do tesouro..." (Malaquias 3:10)
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1.5">
                Valor do Rendimento (R$)
              </label>
              <input
                type="number"
                value={titheIncome}
                onChange={(e) => handleCalculateTithe(e.target.value)}
                placeholder="Ex: 2500,00"
                className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-3.5 text-base font-bold text-white outline-none focus:border-[var(--theme-color)]"
              />
            </div>

            <div className="bg-purple-950/30 border border-purple-500/30 rounded-2xl p-5 text-center">
              <div className="text-xs text-purple-300 font-bold uppercase tracking-wider mb-1">
                Dízimo Correspondente (10%)
              </div>
              <div className="text-3xl font-bold text-white font-mono">
                R$ {calculatedTithe.toFixed(2).replace('.', ',')}
              </div>
            </div>

            <button
              onClick={() => setTab('methods')}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
            >
              <QrCode className="w-4 h-4" /> Contribuir este Valor via PIX
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
