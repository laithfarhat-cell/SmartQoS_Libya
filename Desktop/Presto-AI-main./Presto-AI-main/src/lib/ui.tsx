import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Theme = 'dark' | 'light';
export type Lang = 'ar' | 'en';

type UIState = {
  theme: Theme;
  lang: Lang;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  toggleLang: () => void;
  setLang: (l: Lang) => void;
  dir: 'rtl' | 'ltr';
};

const UIContext = createContext<UIState | undefined>(undefined);

const THEME_KEY = 'prestoeat_theme';
const LANG_KEY = 'prestoeat_lang';

export function UIProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [lang, setLangState] = useState<Lang>('ar');

  useEffect(() => {
    try {
      const t = localStorage.getItem(THEME_KEY) as Theme | null;
      const l = localStorage.getItem(LANG_KEY) as Lang | null;
      if (t) setThemeState(t);
      if (l) setLangState(l);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  const value: UIState = {
    theme,
    lang,
    dir: lang === 'ar' ? 'rtl' : 'ltr',
    toggleTheme: () => setThemeState((t) => (t === 'dark' ? 'light' : 'dark')),
    setTheme: setThemeState,
    toggleLang: () => setLangState((l) => (l === 'ar' ? 'en' : 'ar')),
    setLang: setLangState,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
}
