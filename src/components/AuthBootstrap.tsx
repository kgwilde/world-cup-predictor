'use client';

import { useEffect } from 'react';

import { useAuthStore } from '@/app/stores/useAuthStore';
import { useLiveSync } from '@/components/hooks/useLiveSync';

export function AuthBootstrap() {
  const init = useAuthStore((s) => s.init);
  useLiveSync();

  useEffect(() => {
    const unsubscribe = init();
    return unsubscribe;
  }, [init]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    } else {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((r) => r.unregister());
      });
    }
  }, []);

  return null;
}
