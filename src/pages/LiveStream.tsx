import { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Youtube, 
  Users, 
  Share2, 
  Radio, 
  Bell, 
  Send, 
  Heart, 
  Sparkles, 
  Flame, 
  Hand, 
  MessageSquare, 
  ChevronLeft 
} from 'lucide-react';
import { 
  doc, 
  onSnapshot, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import NotificationCenter from '../components/NotificationCenter';

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  text: string;
  createdAt: any;
}

const QUICK_REACTIONS = [
  { emoji: '🙏', label: 'Amém' },
  { emoji: '❤️', label: 'Glória a Deus' },
  { emoji: '🔥', label: 'Fogo' },
  { emoji: '📖', label: 'Aleluia' },
  { emoji: '🙌', label: 'Santo' },
];

export default function LiveStream() {
  const [config, setConfig] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<{ id: number; emoji: string; left: number }[]>([]);
  const [viewerCount, setViewerCount] = useState(142);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'app_config', 'main'), (docSnap) => {
      if (docSnap.exists()) {
        setConfig(docSnap.data());
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Listen to live chat stream
  useEffect(() => {
    const q = query(
      collection(db, 'live_chat'),
      orderBy('createdAt', 'desc'),
      limit(40)
    );

    const unsubChat = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as ChatMessage[];
      setMessages(msgs.reverse());
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubChat();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !auth.currentUser) return;

    setIsSending(true);
    try {
      await addDoc(collection(db, 'live_chat'), {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Membro',
        userPhoto: auth.currentUser.photoURL || '',
        text: newMsg.trim(),
        createdAt: serverTimestamp()
      });
      setNewMsg('');
    } catch (err) {
      console.error('Error sending chat message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendReaction = (emoji: string) => {
    const newId = Date.now() + Math.random();
    const left = Math.random() * 80 + 10;
    setFloatingReactions(prev => [...prev, { id: newId, emoji, left }]);

    setTimeout(() => {
      setFloatingReactions(prev => prev.filter(r => r.id !== newId));
    }, 2000);
  };

  const videoId = config.liveVideoId || 'u31qwQUeGuM';
  const isLive = config.isLiveActive !== undefined ? config.isLiveActive : true;

  return (
    <div className="min-h-screen bg-transparent w-full text-white font-sans max-w-7xl mx-auto px-4 sm:px-6 pb-32">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-3xl border-b border-white/5 py-4 px-0 flex items-center justify-between mb-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <Link 
            to="/" 
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10 group"
          >
            <ChevronLeft className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
          </Link>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-red-500 font-bold uppercase text-[10px] tracking-widest">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>{isLive ? 'Ao Vivo Agora' : 'Transmissão'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-serif">
              Culto & Celebração
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <NotificationCenter />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Video Player & Control Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className={`w-full aspect-video rounded-[28px] overflow-hidden relative border bg-black shadow-2xl ${
            isLive ? 'border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.15)]' : 'border-white/10'
          }`}>
            <iframe 
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0`}
              title="YouTube video player" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              allowFullScreen
              className="w-full h-full absolute inset-0 z-10"
            />

            {/* Floating Live Reactions Canvas Overlay */}
            <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
              <AnimatePresence>
                {floatingReactions.map(r => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 1, y: 300, scale: 0.8 }}
                    animate={{ opacity: 0, y: 50, scale: 1.8 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.8, ease: "easeOut" }}
                    style={{ left: `${r.left}%` }}
                    className="absolute bottom-8 text-3xl select-none"
                  >
                    {r.emoji}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Player Metadata & Quick Reactions Bar */}
          <div className="bg-[#121216] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                AO VIVO
              </span>
              <div className="flex items-center gap-1.5 text-xs text-white/60">
                <Users className="w-3.5 h-3.5" />
                <span>{viewerCount} conectados</span>
              </div>
            </div>

            {/* Live Quick Reaction Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
              {QUICK_REACTIONS.map((reac, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendReaction(reac.emoji)}
                  title={reac.label}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-base transition-transform active:scale-125 flex items-center justify-center"
                >
                  {reac.emoji}
                </button>
              ))}

              <a 
                href={`https://wa.me/?text=${encodeURIComponent(`Assista ao culto ao vivo conosco agora! 📺 ${window.location.origin}/live`)}`}
                target="_blank"
                rel="noreferrer"
                className="h-9 px-3.5 rounded-xl bg-green-600 hover:bg-green-500 transition-colors flex items-center gap-1.5 text-xs font-bold text-white shadow-md active:scale-95"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Convidar</span>
              </a>
            </div>
          </div>
        </div>

        {/* Real-time Interactive Chat & Prayer Requests */}
        <div className="lg:col-span-1 flex flex-col h-[520px] bg-[#121216] border border-white/10 rounded-[28px] overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[var(--theme-color)]" />
              <h3 className="font-bold text-sm text-white">Chat da Comunhão</h3>
            </div>
            <Link
              to="/prayers"
              className="text-[11px] text-[var(--theme-color)] hover:underline font-bold uppercase tracking-wider flex items-center gap-1"
            >
              <Heart className="w-3 h-3" /> Pedir Oração
            </Link>
          </div>

          {/* Chat message feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-16 text-white/40 text-xs">
                Seja o primeiro a dar a paz do Senhor no chat!
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-purple-600/30 border border-purple-500/30 flex items-center justify-center font-bold text-[10px] text-white shrink-0 mt-0.5">
                    {msg.userName?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-bold text-white/90 truncate">{msg.userName}</span>
                      <span className="text-[9px] text-white/40">
                        {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className="text-xs text-white/80 mt-0.5 leading-relaxed break-words">
                      {msg.text}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Message input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 bg-black/50 flex gap-2">
            <input
              type="text"
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              placeholder="Digite sua mensagem de fé..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-[var(--theme-color)]"
            />
            <button
              type="submit"
              disabled={isSending || !newMsg.trim()}
              className="w-9 h-9 rounded-xl bg-[var(--theme-color)] text-white flex items-center justify-center active:scale-95 disabled:opacity-40 transition-transform"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
