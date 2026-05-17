import { Link } from 'react-router-dom';
import { User } from 'firebase/auth';
import { Church, User as UserIcon, Shield, Settings } from 'lucide-react';
import { useTheme } from '../../lib/ThemeContext';

interface NavbarProps {
  user: User | null;
  isAdmin: boolean;
}

export default function Navbar({ user, isAdmin }: NavbarProps) {
  const { churchName, logoUrl } = useTheme();

  return (
    <nav className="fixed top-8 left-1/2 -translate-x-1/2 w-full max-w-5xl z-50 hidden md:block">
      <div className="glass rounded-3xl mx-4 px-8 py-4 flex justify-between items-center shadow-2xl relative overflow-hidden group/nav">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/0 via-yellow-400/5 to-yellow-400/0 opacity-0 group-hover/nav:opacity-100 transition-opacity duration-1000" />
        
        <Link to="/" className="flex items-center gap-3 group relative z-10">
          <div className="w-10 h-10 glass flex items-center justify-center rounded-xl group-hover:glow-yellow transition-all overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt={churchName || "Logo"} className="w-full h-full object-contain" />
            ) : (
              <Church className="w-6 h-6 text-yellow-400" />
            )}
          </div>
          <div>
            <span className="text-xl font-display font-black italic uppercase tracking-tighter block leading-none">{churchName || 'Ecclesia'}</span>
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-yellow-400/60 leading-none mt-1">V 3.1</span>
          </div>
        </Link>

        <div className="flex items-center gap-1 relative z-10">
          {[
            { to: '/', label: 'Início' },
            { to: '/bible', label: 'Bíblia' },
            { to: '/media', label: 'Mídia' },
            { to: '/events', label: 'Matrix' },
            { to: '/gallery', label: 'Atlas' },
          ].map((link) => (
            <Link 
              key={link.to}
              to={link.to} 
              className="text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-white/5 hover:text-yellow-400 transition-all"
            >
              {link.label}
            </Link>
          ))}
          <a 
            href="#nexdonate" 
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('nexdonate')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-yellow-400 hover:text-black transition-all bg-yellow-400/5 text-yellow-400"
          >
            Contribuições
          </a>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          {isAdmin && (
            <Link to="/admin" className="w-10 h-10 glass flex items-center justify-center rounded-xl hover:bg-yellow-400/10 transition-all group">
              <Shield className="w-5 h-5 text-yellow-500 group-hover:scale-110" />
            </Link>
          )}
          <Link to="/settings" className="w-10 h-10 glass flex items-center justify-center rounded-xl hover:bg-white/10 transition-all group">
            <Settings className="w-5 h-5 text-zinc-400 group-hover:rotate-90 transition-all" />
          </Link>
          <div className="w-[1px] h-6 bg-white/10 mx-1" />
          <Link to="/profile" className="flex items-center gap-3 glass-dark pl-2 pr-5 py-2 rounded-2xl hover:bg-white/10 transition-all">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-xl object-cover border border-white/10" />
            ) : (
              <div className="w-8 h-8 glass flex items-center justify-center rounded-xl">
                <UserIcon className="w-4 h-4 text-zinc-500" />
              </div>
            )}
            <span className="text-[10px] font-black uppercase tracking-widest leading-none truncate max-w-[80px]">
              {user?.displayName || 'Perfil'}
            </span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
