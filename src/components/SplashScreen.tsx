'use client';

import { useEffect, useLayoutEffect, useState } from 'react';

import Image from 'next/image';

import { useAuthStore } from '@/app/stores/useAuthStore';

const PARTICLES: { left: string; size: number; color: string; duration: string; delay: string }[] = [
  { left: '5%',  size: 6, color: 'rgba(239,191,4,0.80)',   duration: '7s',   delay: '0s'   },
  { left: '12%', size: 4, color: 'rgba(239,191,4,0.60)',   duration: '9s',   delay: '1.5s' },
  { left: '22%', size: 5, color: 'rgba(239,191,4,0.75)',   duration: '6s',   delay: '0.5s' },
  { left: '33%', size: 7, color: 'rgba(239,191,4,0.65)',   duration: '8s',   delay: '2s'   },
  { left: '44%', size: 4, color: 'rgba(239,191,4,0.55)',   duration: '10s',  delay: '3s'   },
  { left: '55%', size: 6, color: 'rgba(239,191,4,0.80)',   duration: '7.5s', delay: '1s'   },
  { left: '64%', size: 5, color: 'rgba(239,191,4,0.70)',   duration: '8.5s', delay: '4s'   },
  { left: '73%', size: 4, color: 'rgba(239,191,4,0.60)',   duration: '6.5s', delay: '0.8s' },
  { left: '82%', size: 7, color: 'rgba(239,191,4,0.75)',   duration: '9s',   delay: '2.5s' },
  { left: '91%', size: 5, color: 'rgba(239,191,4,0.65)',   duration: '7s',   delay: '3.5s' },
  { left: '8%',  size: 4, color: 'rgba(239,191,4,0.55)',   duration: '11s',  delay: '5s'   },
  { left: '28%', size: 6, color: 'rgba(239,191,4,0.80)',   duration: '8s',   delay: '6s'   },
  { left: '50%', size: 5, color: 'rgba(239,191,4,0.70)',   duration: '9.5s', delay: '1.2s' },
  { left: '70%', size: 4, color: 'rgba(239,191,4,0.60)',   duration: '7s',   delay: '4.5s' },
  { left: '88%', size: 6, color: 'rgba(239,191,4,0.75)',   duration: '8s',   delay: '2.8s' },
];

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
      <div className="splash-particles" aria-hidden="true">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="splash-particle"
            style={
              {
                left: p.left,
                width: `${p.size}px`,
                height: `${p.size}px`,
                animationDuration: p.duration,
                animationDelay: p.delay,
                '--particle-color': p.color,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
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
