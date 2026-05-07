'use client';

import { players } from '@/data/players';
import { useIdentityStore } from '../stores/useIdentityStore';

export default function ProfilePage() {
  const playerId = useIdentityStore((state) => state.playerId) as string;
  const hasHydrated = useIdentityStore((state) => state.hasHydrated);

  if (!hasHydrated || !playerId) {
    return null;
  }

  const player = players.find((p) => p.id === playerId);

  return <div>Hey {player?.name}, this is your profile page!</div>;
}
