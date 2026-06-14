'use client';

import { useEffect, useLayoutEffect, useState } from 'react';

import Image from 'next/image';

import { useAuthStore } from '@/app/stores/useAuthStore';

export function SplashScreen() {
  const usersLoading = useAuthStore((s) => s.usersLoading);
  const resultsLoading = useAuthStore((s) => s.resultsLoading);
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  // Remove the component from the tree after hydration for the reload case.
  // The inline script in layout.tsx has already hidden it visually via CSS before first paint.
  useLayoutEffect(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (nav?.type === 'reload') {
      setVisible(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    if (!usersLoading && !resultsLoading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFading(true);
      const t = setTimeout(() => setVisible(false), 600);
      return () => clearTimeout(t);
    }
  }, [usersLoading, resultsLoading, visible]);

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
