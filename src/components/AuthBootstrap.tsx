'use client';

import { useEffect } from 'react';

import { useAuthStore } from '@/app/stores/useAuthStore';

export function AuthBootstrap() {
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    const unsubscribe = init();
    return unsubscribe;
  }, [init]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
  }, []);

  return null;
}
