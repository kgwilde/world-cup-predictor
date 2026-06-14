'use client';

import dynamic from 'next/dynamic';

// Firebase auth listener must be client-only — SSR has no auth state
const AuthBootstrap = dynamic(
  () => import('@/components/AuthBootstrap').then((m) => ({ default: m.AuthBootstrap })),
  { ssr: false }
);

import { SplashScreen } from '@/components/SplashScreen';

export function ClientProviders() {
  return (
    <>
      <AuthBootstrap />
      <SplashScreen />
    </>
  );
}
