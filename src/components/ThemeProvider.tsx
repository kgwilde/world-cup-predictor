'use client';

import { useEffect } from 'react';

import { useThemeStore } from '@/app/stores/useThemeStore';

export function ThemeProvider() {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return null;
}
