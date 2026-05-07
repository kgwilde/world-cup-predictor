'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useIdentityStore } from '@/app/stores/useIdentityStore';

export default function IdentityBootstrap() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const setPlayerId = useIdentityStore((state) => state.setPlayerId);

  useEffect(() => {
    const playerIdFromUrl = searchParams.get('player');

    if (playerIdFromUrl) {
      setPlayerId(playerIdFromUrl);
      router.replace(window.location.pathname);
    }
  }, [searchParams, router, setPlayerId]);

  return null;
}
