'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/store/themeStore';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-color-mode', 'dark');
      document.documentElement.setAttribute('data-dark-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-color-mode', 'light');
      document.documentElement.setAttribute('data-light-theme', 'light');
    }
  }, [theme]);

  return <>{children}</>;
}
