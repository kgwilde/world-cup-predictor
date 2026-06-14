'use client';

import { useEffect, useState } from 'react';

import { useAuthStore } from '@/app/stores/useAuthStore';

export function SplashScreen() {
  const usersLoading = useAuthStore((s) => s.usersLoading);
  const resultsLoading = useAuthStore((s) => s.resultsLoading);
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!usersLoading && !resultsLoading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFading(true);
      const t = setTimeout(() => setVisible(false), 600);
      return () => clearTimeout(t);
    }
  }, [usersLoading, resultsLoading]);

  if (!visible) return null;

  return (
    <div className={`splash-screen${fading ? ' splash-fading' : ''}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.svg" alt="FIFA World Cup 2026" className="splash-logo" />
      <p className="splash-text">MATCH PREDICTOR</p>
    </div>
  );
}
