import { createContext, useContext, useState, useEffect } from 'react';
import { db } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';

type ThemeContextType = {
  themeColor: string;
  setThemeColor: (color: string) => void;
  logoUrl?: string;
  churchName?: string;
};

const ThemeContext = createContext<ThemeContextType>({
  themeColor: '#8A2BE2',
  setThemeColor: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [themeColor, setThemeColor] = useState(() => {
    return localStorage.getItem('app_theme_color') || '#8A2BE2';
  });
  
  const [logoUrl, setLogoUrl] = useState<string | undefined>();
  const [churchName, setChurchName] = useState<string | undefined>('Ministério Frutos do Espírito');

  useEffect(() => {
    localStorage.setItem('app_theme_color', themeColor);
    document.documentElement.style.setProperty('--theme-color', themeColor);
  }, [themeColor]);

  useEffect(() => {
    try {
      const unsub = onSnapshot(doc(db, 'app_config', 'main'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.logoUrl) setLogoUrl(data.logoUrl);
          if (data.churchName) setChurchName(data.churchName);
          if (data.themeColor) {
             setThemeColor(data.themeColor);
             document.documentElement.style.setProperty('--theme-color', data.themeColor);
          }
        }
      }, (err) => {
        console.debug('[ThemeContext] onSnapshot fallback (benign):', err);
      });
      return () => unsub();
    } catch (e) {
      console.debug('[ThemeContext] Init error (benign):', e);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ themeColor, setThemeColor, logoUrl, churchName }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
