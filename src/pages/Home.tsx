import { motion, AnimatePresence } from 'motion/react';
import { Play, Calendar, BookOpen, Radio, Search, User, Heart, Edit3, Edit, ChevronRight, Copy, CheckCircle2, QrCode, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';
import { Logo } from '../components/Logo';

const DEFAULT_BANNERS = [
  { id: 1, title: 'Conferência Profética', subtitle: 'Uma experiência de avivamento', image: 'https://images.unsplash.com/photo-1510076857177-7470076d4098?auto=format&fit=crop&q=80&w=1600' },
  { id: 2, title: 'Nova Série', subtitle: 'Atlas Digital: Descobrindo a Verdade', image: 'https://images.unsplash.com/photo-1544427920-c49ccfb85579?auto=format&fit=crop&q=80&w=1600' }
];

const DEVOCIONAL = {
  title: "A Paz que Excede o Entendimento",
  verse: "E a paz de Deus, que excede todo o entendimento, guardará os vossos corações e os vossos sentimentos em Cristo Jesus.",
  reference: "Filipenses 4:7",
  text: "Em meio às tempestades da vida, a ansiedade tenta tomar conta de nossa mente. Mas Deus nos oferece uma paz sobrenatural. Não é a ausência de problemas, mas a presença de Deus no meio deles. Hoje, entregue suas preocupações a Ele e deixe que essa paz guarde seu coração."
};

const RECENT_ITEMS = [
  { id: 1, title: 'Culto de Domingo', category: 'Live | 10:00', img: 'https://images.unsplash.com/photo-1544427920-c49ccfb85579' },
  { id: 2, title: 'Adoração e Fogo', category: 'Louvor', img: 'https://images.unsplash.com/photo-1510076857177-7470076d4098' },
  { id: 3, title: 'Nexus Podcast', category: 'Audio', img: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7' },
  { id: 4, title: 'Seminário Vida', category: 'Ensino', img: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3' }
];

export default function Home() {
  const [config, setConfig] = useState<any>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [givingMethod, setGivingMethod] = useState<'pix' | 'card'>('pix');

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'app_config', 'main'), (snapshot) => {
      if (snapshot.exists()) setConfig(snapshot.data());
    }, (error) => handleFirestoreError(error, OperationType.GET, 'app_config/main'));
    return () => unsubscribe();
  }, []);

  const banners = config?.banners?.length > 0 ? config.banners : DEFAULT_BANNERS;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(config?.pixKey || 'ecclesia@pix.church');
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
  };

  return (
    <div className="min-h-screen pt-12 pb-32 px-6 max-w-lg mx-auto bg-black text-white font-sans">
      {/* Navigation / Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl tracking-tight text-white font-semibold">Descobrir</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-800/80 hover:bg-gray-700 transition">
            <Search className="w-5 h-5 text-gray-200" />
          </button>
          <Link to="/profile" className="w-10 h-10 rounded-full flex items-center justify-center relative bg-gray-800/80 hover:bg-gray-700 transition">
            <User className="w-5 h-5 text-gray-200" />
          </Link>
        </div>
      </div>

      {/* Hero Section / Banners */}
      <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide snap-x -mx-6 px-6">
        {banners.map((banner: any, idx: number) => (
          <Link to="/media" key={idx} className="relative overflow-hidden rounded-3xl min-h-[320px] flex flex-col bg-neutral-800/60 shadow-xl w-72 h-80 flex-shrink-0 snap-center group">
            <div className="relative z-10 p-6 flex flex-col h-full bg-cover bg-center justify-between transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${banner.image})`}}>
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/80"></div>
              
              <div className="flex items-start justify-between relative z-10">
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider text-[var(--theme-color)] ring-1 ring-[var(--theme-color)]/30 bg-[var(--theme-color)]/10 backdrop-blur-sm">Destaque</span>
                </div>
              </div>

              <div className="mt-auto relative z-10">
                <h3 className="text-3xl text-white tracking-tight mb-2 font-bold leading-tight">{banner.title}</h3>
                <p className="text-sm leading-relaxed text-gray-300 mb-4 line-clamp-2">{banner.subtitle}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--theme-color)] flex items-center justify-center shadow-lg">
                    <Play className="w-4 h-4 text-white fill-current ml-1" />
                  </div>
                  <div className="text-xs">
                    <div className="text-white font-medium">Assistir Agora</div>
                    <div className="text-gray-400">Ao vivo ou online</div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Categories */}
      <div className="mb-8 mt-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Categorias</h3>
          <Link to="/events" className="text-sm font-medium text-[var(--theme-color)] hover:underline">Ver Todas</Link>
        </div>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide -mx-6 px-6">
          <Link to="/bible" className="flex-shrink-0 w-[72px] text-center">
            <div className="w-[68px] h-[68px] rounded-2xl flex items-center justify-center mb-2 mx-auto bg-blue-500/10 border border-blue-500/20 transition-transform active:scale-95">
              <BookOpen className="w-7 h-7 text-blue-400" />
            </div>
            <span className="text-xs font-medium text-gray-300">Bíblia</span>
          </Link>
          <Link to="/notes" className="flex-shrink-0 w-[72px] text-center">
            <div className="w-[68px] h-[68px] rounded-2xl flex items-center justify-center mb-2 mx-auto bg-pink-500/10 border border-pink-500/20 transition-transform active:scale-95">
              <Edit3 className="w-7 h-7 text-pink-400" />
            </div>
            <span className="text-xs font-medium text-gray-300">Notas</span>
          </Link>
          <Link to="/media" className="flex-shrink-0 w-[72px] text-center">
            <div className="w-[68px] h-[68px] rounded-2xl flex items-center justify-center mb-2 mx-auto bg-emerald-500/10 border border-emerald-500/20 transition-transform active:scale-95">
              <Radio className="w-7 h-7 text-emerald-400" />
            </div>
            <span className="text-xs font-medium text-gray-300">Rádio</span>
          </Link>
          <Link to="/events" className="flex-shrink-0 w-[72px] text-center">
            <div className="w-[68px] h-[68px] rounded-2xl flex items-center justify-center mb-2 mx-auto bg-orange-500/10 border border-orange-500/20 transition-transform active:scale-95">
              <Calendar className="w-7 h-7 text-orange-400" />
            </div>
            <span className="text-xs font-medium text-gray-300">Agenda</span>
          </Link>
          <a href="#donate" className="flex-shrink-0 w-[72px] text-center">
            <div className="w-[68px] h-[68px] rounded-2xl flex items-center justify-center mb-2 mx-auto bg-purple-500/10 border border-purple-500/20 transition-transform active:scale-95">
              <Heart className="w-7 h-7 text-purple-400" />
            </div>
            <span className="text-xs font-medium text-gray-300">Doar</span>
          </a>
        </div>
      </div>

      {/* Devotional */}
      <div className="mb-8 mt-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Devocional Diário</h3>
        </div>
        <div className="p-6 rounded-[2rem] bg-gradient-to-br from-[#1C1C1E] to-[#2C2C2E] border border-white/5 relative overflow-hidden shadow-2xl">
          <div className="absolute -top-10 -right-10 opacity-5">
            <BookOpen className="w-48 h-48 text-white" />
          </div>
          <div className="relative z-10">
            <span className="text-[10px] font-bold text-[var(--theme-color)] tracking-[0.2em] uppercase mb-3 block">Leitura de Hoje</span>
            <h4 className="text-2xl font-semibold text-white mb-4 leading-tight">{DEVOCIONAL.title}</h4>
            
            <div className="px-5 py-4 bg-black/40 rounded-2xl mb-5 border border-white/5 backdrop-blur-md">
              <p className="text-[15px] text-white/90 italic leading-relaxed">"{DEVOCIONAL.verse}"</p>
              <p className="text-xs text-[var(--theme-color)] font-semibold mt-3 text-right">{DEVOCIONAL.reference}</p>
            </div>
            
            <p className="text-[14px] text-gray-400 leading-relaxed mb-6 font-medium">
              {DEVOCIONAL.text}
            </p>
            
            <Link to="/bible" className="w-full py-3.5 rounded-xl bg-[var(--theme-color)] hover:opacity-90 active:scale-[0.98] transition-all text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[var(--theme-color)]/20">
              <BookOpen className="w-4 h-4 fill-current" />
              Ler na Bíblia
            </Link>
          </div>
        </div>
      </div>

      {/* Featured / Recent Content */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Recentes</h3>
          <Link to="/media" className="text-sm font-medium text-[var(--theme-color)] hover:underline">Ver Tudo</Link>
        </div>
        <div className="space-y-3">
          {RECENT_ITEMS.map((item) => (
            <div key={item.id} className="flex gap-4 p-3 rounded-2xl bg-[#1C1C1E] border border-white/5 items-center">
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 relative">
                <img alt={item.title} className="w-full h-full object-cover" src={item.img} />
                <div className="absolute inset-0 bg-black/20"></div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-white text-[15px] truncate">{item.title}</h4>
                <p className="text-[13px] text-gray-400 truncate">{item.category}</p>
              </div>
              <Link to="/media" className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--theme-color)] flex-shrink-0 shadow-lg active:scale-95 transition-transform">
                <Play className="w-4 h-4 text-white fill-current ml-0.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Donation Section */}
      <section className="pt-4" id="donate">
        <div className="rounded-3xl bg-[#1C1C1E] border border-white/5 p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--theme-color)]/20 border border-[var(--theme-color)]/30 flex items-center justify-center">
               <Heart className="w-6 h-6 text-[var(--theme-color)] fill-current" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Semear e Contribuir</h2>
              <p className="text-sm text-gray-400">Faça sua contribuição com segurança.</p>
            </div>
          </div>

          <div className="flex bg-black/50 p-1 rounded-xl border border-white/5">
            <button 
              onClick={() => setGivingMethod('pix')}
              className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all ${givingMethod === 'pix' ? 'bg-zinc-800 text-white shadow-md' : 'text-gray-500'}`}
            >
              PIX
            </button>
            <button 
              onClick={() => setGivingMethod('card')}
              className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all ${givingMethod === 'card' ? 'bg-zinc-800 text-white shadow-md' : 'text-gray-500'}`}
            >
              Cartão
            </button>
          </div>

          {givingMethod === 'pix' ? (
            <div className="space-y-4">
              <div className="p-4 bg-white/5 border border-white/5 inline-block mx-auto rounded-2xl flex justify-center">
                 <QrCode className="w-32 h-32 text-white/50" />
              </div>
              <button 
                onClick={handleCopyPix}
                className="w-full h-12 bg-[var(--theme-color)] text-white rounded-xl flex items-center justify-center gap-2 font-semibold active:scale-95 transition-all text-sm"
              >
                {copiedPix ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedPix ? 'Chave Copiada!' : 'Copiar Chave PIX'}</span>
              </button>
              <p className="text-[11px] font-mono text-gray-500 text-center">{config?.pixKey || 'contato@frutosdoespirito.com.br'}</p>
            </div>
          ) : (
            <div className="space-y-4 text-center">
              <p className="text-sm text-gray-500 mb-4 px-4">Em breve aceitaremos cartões de crédito via portal de doações online.</p>
              <button disabled className="w-full h-12 bg-white/5 text-gray-500 rounded-xl flex items-center justify-center gap-2 font-semibold cursor-not-allowed text-sm">
                <CreditCard className="w-4 h-4" />
                <span>Pagar com Cartão</span>
              </button>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
