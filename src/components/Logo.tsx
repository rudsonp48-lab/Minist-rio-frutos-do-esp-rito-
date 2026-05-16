import { BookOpen, Leaf } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from '../lib/ThemeContext';

export function Logo({ className, textClassName }: { className?: string, textClassName?: string }) {
  const { logoUrl, churchName, themeColor } = useTheme();

  if (logoUrl) {
    return (
      <div className={cn("flex flex-col items-center justify-center", className)}>
        <img src={logoUrl} alt={churchName || "Logo"} className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-xl" />
      </div>
    );
  }

  // Fallback to default
  const titleParts = churchName ? churchName.split(' ') : ['MINISTÉRIO', 'FRUTOS DO', 'ESPÍRITO'];

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div className="relative flex items-end justify-center mb-1">
        <Leaf className="w-8 h-8 absolute bottom-3 transition-all" style={{ color: themeColor }} strokeWidth={1.5} />
        <BookOpen className="w-10 h-10 text-[#C7C7CC] transition-all" strokeWidth={1} />
      </div>
      <div className={cn("flex flex-col items-center leading-none text-center", textClassName)}>
        <span className="text-[10px] sm:text-xs font-serif uppercase tracking-[0.2em] mb-0.5" style={{ color: themeColor }}>
          {titleParts[0] || 'MINISTÉRIO'}
        </span>
        <span className="text-xl sm:text-2xl font-serif uppercase tracking-widest text-[#F2F2F7] dark:text-[#1C1C1E] mt-1" style={{ letterSpacing: '0.1em', WebkitTextStroke: '0.5px ' + themeColor, color: 'transparent' }}>
          {titleParts.slice(1).join(' ') || 'ECCLESIA'}
        </span>
      </div>
    </div>
  );
}
