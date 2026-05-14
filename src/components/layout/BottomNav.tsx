import { Link, useLocation } from 'react-router-dom';
import { Home, Book, Play, Calendar, Edit3 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export default function BottomNav() {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Início', color: 'text-yellow-400', theme: 'glow-yellow' },
    { path: '/media', icon: Activity, label: 'Fluxo', color: 'text-cyan-400', theme: 'glow-blue' },
    { path: '/notes', icon: Edit3, label: 'NexNotes', color: 'text-pink-400', theme: 'glow-pink' },
    { path: '/events', icon: Calendar, label: 'Matrix', color: 'text-emerald-400', theme: 'glow-green' },
  ];

  return (
    <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[90%] z-50 md:hidden">
      <div className="glass-dark bg-black/60 rounded-[2.5rem] p-2 flex items-center justify-around shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative border border-white/5 backdrop-blur-3xl group">
        <div className="absolute inset-0 bg-yellow-400/5 opacity-50 pointer-events-none rounded-[2.5rem]" />
        
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 transition-all relative z-10 flex-1 py-4",
                isActive ? "text-white" : "text-zinc-700"
              )}
            >
              <div className={cn(
                "p-3 rounded-2xl transition-all duration-500",
                isActive ? cn("glass group-hover:scale-110", item.theme) : "hover:bg-white/5"
              )}>
                <Icon className={cn("w-5 h-5", isActive ? item.color : "text-zinc-600")} />
              </div>
              
              <AnimatePresence>
                {isActive && (
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[8px] font-black uppercase tracking-[0.2em] mt-1 text-white text-glow"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
