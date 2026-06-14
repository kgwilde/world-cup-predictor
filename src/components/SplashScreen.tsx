'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';

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
      <Image
        src="/logo.webp"
        alt="FIFA World Cup 2026"
        width={320}
        height={480}
        className="splash-logo"
        priority
      />
      <p className="splash-text">MATCH PREDICTOR</p>
    </div>
  );
}
