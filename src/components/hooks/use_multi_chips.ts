'use client';

import { useMemo } from 'react';

import { useAuthStore } from '@/app/stores/useAuthStore';
import type { MultiChip } from '@/lib/types';

export function useMultiChips() {
  const allUsers = useAuthStore((s) => s.allUsers);
  const loading = useAuthStore((s) => s.usersLoading);
  const apply = useAuthStore((s) => s.applyChip);
  const remove = useAuthStore((s) => s.removeChip);

  const chips = useMemo<MultiChip[]>(
    () =>
      allUsers.flatMap((u) =>
        (u.multiChips ?? []).map((fixtureId) => ({ playerId: u.uid, fixtureId })),
      ),
    [allUsers],
  );

  return { chips, loading, apply, remove };
}
