'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { isThemePreference, resolveTheme, THEME_STORAGE_KEY, type ThemePreference } from '@/lib/theme';

type ThemeContextValue = {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  error: string | null;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(preference: ThemePreference) {
  const theme = resolveTheme(preference, window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.themePreference = preference;
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    'content', theme === 'dark' ? '#0a0f1e' : '#e6e6fa'
  );
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setState] = useState<ThemePreference>('system');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let initial: ThemePreference = 'system';
    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (isThemePreference(stored)) initial = stored;
    } catch (error) {
      console.error('Unable to read theme preference:', error);
      setError('Theme preferences cannot be saved in this browser.');
    }
    setState(initial);
    applyTheme(initial);

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (document.documentElement.dataset.themePreference === 'system') applyTheme('system');
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;
      const next = isThemePreference(event.newValue) ? event.newValue : 'system';
      setState(next);
      applyTheme(next);
    };
    media.addEventListener('change', handleSystemChange);
    window.addEventListener('storage', handleStorage);
    return () => {
      media.removeEventListener('change', handleSystemChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const setPreference = (next: ThemePreference) => {
    setState(next);
    applyTheme(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
      setError(null);
    } catch (error) {
      console.error('Unable to save theme preference:', error);
      setError('Theme changed, but could not be saved in this browser.');
    }
  };

  return <ThemeContext.Provider value={{ preference, setPreference, error }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
