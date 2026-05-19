import { Link, useLocation } from 'react-router-dom';
import { Home, Play, Calendar, User, LayoutGrid } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../lib/ThemeContext';

export default function BottomNav() {
  const location = useLocation();
  const { themeColor } = useTheme();

  const navItems = [
    { path: '/', icon: Home, label: 'Início' },
    { path: '/media', icon: Play, label: 'Mídia' },
    { path: '/gallery', icon: LayoutGrid, label: 'Galeria' },
    { path: '/events', icon: Calendar, label: 'Agenda' },
    { path: '/profile', icon: User, label: 'Perfil' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom lg:hidden">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl border-t border-white/[0.05]" />
      
      <div className="relative flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors duration-200",
                isActive ? "font-bold" : "text-[#8E8E93] dark:text-[#98989D] font-medium"
              )}
              style={isActive ? { color: themeColor } : {}}
            >
              <div className="relative">
                <Icon className={cn("w-6 h-6", isActive ? "fill-current" : "")} strokeWidth={isActive ? 2 : 1.5} />
              </div>
              <span className="text-[10px] leading-none tracking-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
