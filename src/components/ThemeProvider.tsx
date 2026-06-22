'use client';

import { useEffect } from 'react';

import { useThemeStore } from '@/app/stores/useThemeStore';

export function ThemeProvider() {
  const theme = useThemeStore((s) => s.theme);
  const hasHydrated = useThemeStore((s) => s._hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme, hasHydrated]);

  return null;
}
