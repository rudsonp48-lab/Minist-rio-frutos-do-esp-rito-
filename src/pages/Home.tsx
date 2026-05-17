import { motion, AnimatePresence } from 'motion/react';
import { Play, Calendar, BookOpen, Radio, Search, User, Heart, Edit3, ChevronRight, Copy, CheckCircle2, QrCode, CreditCard, Church } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';
import { useTheme } from '../lib/ThemeContext';

const DEFAULT_BANNERS = [
  { id: 1, title: 'Conferência Profética', subtitle: 'Uma experiência de avivamento', image: 'https://images.unsplash.com/photo-1510076857177-7470076d4098?auto=format&fit=crop&q=80&w=1600' },
  { id: 2, title: 'Nova Série', subtitle: 'Atlas Digital: Descobrindo a Verdade', image: 'https://images.unsplash.com/photo-1544427920-c49ccfb85579?auto=format&fit=crop&q=80&w=1600' }
];

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
  const { churchName, logoUrl } = useTheme();

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

  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  useEffect(() => {
    if (!banners || banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners]);

  return (
    <div className="min-h-screen pt-12 pb-32 px-6 max-w-lg mx-auto bg-black text-white font-sans">
      {/* Navigation / Header */}
      <div className="flex items-center justify-between mb-8 mt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/5 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10 overflow-hidden">
             {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
             ) : (
                <Church className="w-5 h-5 text-white" />
             )}
          </div>
          <div>
            <h1 className="text-xl tracking-tight text-white font-bold leading-none">{churchName || 'Ecclesia'}</h1>
            <p className="text-[10px] text-gray-400 font-medium tracking-wide uppercase mt-1">Bem-vindo(a)</p>
          </div>
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
      <div className="relative mb-8 -mx-6 px-6">
        <div className="relative w-full aspect-[4/5] sm:aspect-square overflow-hidden rounded-3xl shadow-2xl">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={activeBannerIndex}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute inset-0 w-full h-full"
            >
              <Link to="/media" className="relative w-full h-full flex flex-col group block">
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-[10s] group-hover:scale-110" 
                  style={{ backgroundImage: `url(${banners[activeBannerIndex]?.image})`}}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/90"></div>
                
                <div className="flex items-start justify-between relative z-10 p-6">
                  <span className="px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider text-[var(--theme-color)] ring-1 ring-[var(--theme-color)]/30 bg-[var(--theme-color)]/10 backdrop-blur-sm">Destaque</span>
                </div>

                <div className="mt-auto relative z-10 p-6">
                  <h3 className="text-3xl text-white tracking-tight mb-2 font-black leading-tight drop-shadow-md">{banners[activeBannerIndex]?.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-300 mb-6 line-clamp-2">{banners[activeBannerIndex]?.subtitle}</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[var(--theme-color)] flex items-center justify-center shadow-[0_0_20px_rgba(var(--theme-color-rgb),0.4)]">
                      <Play className="w-5 h-5 text-white fill-current ml-1" />
                    </div>
                    <div className="text-xs">
                      <div className="text-white font-bold uppercase tracking-wide">Assistir Agora</div>
                      <div className="text-gray-400">Ao vivo ou online</div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          </AnimatePresence>

          {/* Carousel Indicators */}
          {banners.length > 1 && (
            <div className="absolute bottom-6 right-6 z-20 flex gap-2 border border-white/10 bg-black/20 backdrop-blur-md px-3 py-2 rounded-full">
              {banners.map((_: any, idx: number) => (
                <button 
                  key={idx}
                  onClick={() => setActiveBannerIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${activeBannerIndex === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/40'}`}
                />
              ))}
            </div>
          )}
        </div>
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

      {/* Prayer Requests Section */}
      <section className="pt-4" id="prayer">
        <div className="rounded-3xl bg-[#1C1C1E] border border-white/5 p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
               <Heart className="w-6 h-6 text-blue-400 fill-current" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Pedidos de Oração</h2>
              <p className="text-sm text-gray-400">Como podemos orar por você?</p>
            </div>
          </div>
          
          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const request = (form.elements.namedItem('request') as HTMLTextAreaElement).value;
              if (!request.trim()) return;
              try {
                // We'll write this to a 'prayers' collection
                const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
                await addDoc(collection(db, 'prayers'), {
                  request,
                  createdAt: serverTimestamp(),
                  status: 'pending'
                });
                alert('Pedido enviado! Estaremos orando por você.');
                form.reset();
              } catch (err) {
                console.error(err);
                alert('Erro ao enviar.');
              }
            }}
            className="space-y-4"
          >
            <textarea 
              name="request"
              placeholder="Escreva seu pedido aqui..." 
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-blue-500/50 resize-none h-24 placeholder:text-gray-600"
            />
            <button 
              type="submit"
              className="w-full h-12 bg-blue-500 text-white rounded-xl flex items-center justify-center font-semibold active:scale-95 transition-all text-sm"
            >
              Enviar Pedido
            </button>
          </form>
        </div>
      </section>

    </div>
  );
}
