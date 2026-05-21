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
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom lg:hidden px-4 pb-4 pointer-events-none flex justify-center">
      <div className="pointer-events-auto bg-white/70 dark:bg-[#1C1C1E]/80 backdrop-blur-[40px] border border-black/5 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-[2rem] w-full max-w-[400px]">
        <div className="relative flex items-center justify-around h-[68px] px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-300 active:scale-90",
                  isActive ? "font-bold" : "text-[#8E8E93] dark:text-[#98989D] font-medium hover:text-black dark:hover:text-white"
                )}
                style={isActive ? { color: themeColor } : {}}
              >
                <div className="relative">
                  <Icon className={cn("w-[26px] h-[26px] transition-transform duration-300", isActive ? "scale-110 fill-current" : "")} strokeWidth={isActive ? 2 : 1.5} />
                  {isActive && (
                    <motion.div
                      layoutId="bottom-nav-indicator"
                      className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: themeColor }}
                    />
                  )}
                </div>
                {/* <span className="text-[10px] leading-none tracking-tight mt-1 opacity-0 group-hover:opacity-100">{item.label}</span> */}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
