import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { useTheme } from '../lib/ThemeContext';
import { makeTransparentLogo } from '../lib/transparentLogo';

export function Logo({ className }: { className?: string, textClassName?: string }) {
  const { logoUrl, churchName } = useTheme();
  const [cleanLogo, setCleanLogo] = useState<string>(() => {
    return localStorage.getItem('app_clean_logo_url') || '/church_logo_transparent.png';
  });

  useEffect(() => {
    const targetUrl = logoUrl || '/church_logo_transparent.png';
    if (targetUrl === '/church_logo_transparent.png' || targetUrl.includes('church_logo_transparent.png')) {
      setCleanLogo('/church_logo_transparent.png');
      return;
    }
    let active = true;
    makeTransparentLogo(targetUrl)
      .then((res) => {
        if (active) {
          setCleanLogo(res);
          try {
            localStorage.setItem('app_clean_logo_url', res);
          } catch (e) {}
        }
      })
      .catch(() => {
        if (active) setCleanLogo(targetUrl);
      });
    return () => {
      active = false;
    };
  }, [logoUrl]);

  return (
    <div className={cn("flex flex-col items-center justify-center relative", className)}>
      <img 
        src={cleanLogo || logoUrl || '/church_logo_transparent.png'} 
        alt={churchName || "Ministério Frutos do Espírito"} 
        className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-xl" 
      />
    </div>
  );
}
