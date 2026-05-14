import { User, signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { LogOut, User as UserIcon, Settings, Heart, Image as ImageIcon, Bell, ChevronRight, ShieldCheck, Trophy } from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';

interface ProfileProps {
  user: User;
}

export default function Profile({ user }: ProfileProps) {
  const navigate = useNavigate();
  const handleLogout = () => {
    signOut(auth);
  };

  const [xp, setXp] = useState(0);

  useEffect(() => {
    const q = query(collection(db, 'notes'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const total = snapshot.docs.reduce((acc, doc) => acc + (doc.data().xp || 0), 0);
      setXp(total);
    });
    return () => unsubscribe();
  }, [user.uid]);

  const getLevel = (xp: number) => Math.floor(xp / 100) + 1;

  const sections = [
    { label: `Domínio Espiritual (Nível ${getLevel(xp)})`, icon: Trophy, color: 'text-yellow-400', path: '/notes' },
    { label: 'Meus Momentos', icon: ImageIcon, color: 'text-blue-400', path: '/gallery' },
    { label: 'Favoritos', icon: Heart, color: 'text-red-400', path: '/media' },
    { label: 'Notificações', icon: Bell, color: 'text-yellow-400', path: '/settings' },
    { label: 'Configurações', icon: Settings, color: 'text-zinc-400', path: '/settings' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-16 pb-24">
      {/* Profile Header 2.0 */}
      <section className="text-center pt-20 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-yellow-400/5 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative inline-block mb-10">
          <div className="absolute inset-0 bg-yellow-400 blur-2xl opacity-20 animate-pulse" />
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || 'User'} className="relative w-48 h-48 rounded-[4rem] border-4 border-yellow-400 object-cover p-1 shadow-3xl grayscale group-hover:grayscale-0 transition-all" />
          ) : (
            <div className="relative w-48 h-48 rounded-[4rem] glass border-4 border-white/5 flex items-center justify-center">
              <UserIcon className="w-20 h-20 text-zinc-800" />
            </div>
          )}
          <div className="absolute -bottom-4 -right-4 bg-yellow-400 p-5 rounded-3xl border-8 border-black shadow-2xl glow-yellow">
             <ShieldCheck className="w-8 h-8 text-black" />
          </div>
        </div>
        
        <div className="space-y-4 relative z-10">
           <h1 className="text-5xl md:text-7xl font-display font-black uppercase italic tracking-tighter text-white leading-none">
             {user.displayName || 'Membro Ecclesia'}
           </h1>
           <p className="text-yellow-400 font-display font-bold uppercase tracking-[0.4em] text-[10px] opacity-60">
             {user.email || 'Node-Identity: 0x88X-ECCLESIA'}
           </p>
        </div>

        <div className="grid grid-cols-3 gap-3 md:gap-6 mt-12 md:mt-16 px-4">
           {[
             { val: '12', label: 'Nodes' },
             { val: '342', label: 'Impact' },
             { val: '2.5y', label: 'Uptime' }
           ].map((stat, i) => (
             <div key={i} className="glass py-6 md:py-8 rounded-[2.5rem] border-white/5 group hover:border-yellow-400/20 transition-all">
                <p className="text-2xl md:text-3xl font-display font-black italic text-white group-hover:text-yellow-400 transition-colors uppercase">{stat.val}</p>
                <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600 mt-2">{stat.label}</p>
             </div>
           ))}
        </div>
      </section>

      {/* Futuristic Menu 2.0 */}
      <section className="glass rounded-[3rem] md:rounded-[4rem] p-1 shadow-3xl relative overflow-hidden group mx-4 md:mx-0">
        <div className="glass-dark bg-zinc-950/40 rounded-[2.9rem] md:rounded-[3.9rem] overflow-hidden">
          {sections.map((item, idx) => (
            <button 
              key={idx}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center justify-between p-6 md:p-10 hover:bg-white/[0.05] transition-all border-b border-white/5 last:border-0 group/row"
            >
              <div className="flex items-center gap-6 md:gap-8">
                 <div className={`w-12 h-12 md:w-14 md:h-14 glass flex items-center justify-center rounded-2xl group-hover/row:scale-110 transition-transform ${item.color} group-hover/row:glow-yellow shadow-xl`}>
                    <item.icon className="w-5 h-5 md:w-7 md:h-7" />
                 </div>
                 <span className="font-display font-black italic uppercase tracking-tighter text-base md:text-xl text-zinc-400 group-hover/row:text-white transition-colors">{item.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-zinc-800 group-hover/row:text-yellow-400 group-hover/row:translate-x-2 transition-all" />
            </button>
          ))}
        </div>
      </section>

      {/* Cyber Logout Button */}
      <button 
        onClick={handleLogout}
        className="w-full glass bg-red-500/5 hover:bg-red-500/20 border-red-500/10 py-8 rounded-[3rem] flex items-center justify-center gap-6 transition-all group mt-12 mb-20"
      >
        <div className="p-4 glass rounded-2xl border-red-500/20">
           <LogOut className="w-6 h-6 text-red-500" />
        </div>
        <span className="text-[12px] font-black uppercase tracking-[0.4em] text-red-500 transition-colors">Terminar Sincronização</span>
      </button>

      <footer className="text-center pb-12">
        <div className="flex items-center justify-center gap-4 mb-4">
           <div className="w-12 h-[1px] bg-zinc-800" />
           <span className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-700">Ecclesia OS v3.1</span>
           <div className="w-12 h-[1px] bg-zinc-800" />
        </div>
        <p className="text-zinc-800 text-[8px] font-black uppercase tracking-widest">
           © 2026 NEXUS CORE • TODOS OS DIREITOS RESERVADOS
        </p>
      </footer>
    </div>
  );
}
