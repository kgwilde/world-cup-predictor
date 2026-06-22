'use client';

import dynamic from 'next/dynamic';

import { ThemeProvider } from '@/components/ThemeProvider';

// Firebase auth listener must be client-only — SSR has no auth state
const AuthBootstrap = dynamic(
  () => import('@/components/AuthBootstrap').then((m) => ({ default: m.AuthBootstrap })),
  { ssr: false }
);

export function ClientProviders() {
  return (
    <>
      <ThemeProvider />
      <AuthBootstrap />
    </>
  );
}
