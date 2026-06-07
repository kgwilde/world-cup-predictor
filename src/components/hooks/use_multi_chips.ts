'use client';

import { useCallback, useEffect, useState } from 'react';

import { getAllMultiChips, applyMultiChip, removeMultiChip } from '@/lib/firestore';
import type { MultiChip } from '@/lib/types';

export function useMultiChips() {
  const [chips, setChips] = useState<MultiChip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllMultiChips()
      .then(setChips)
      .finally(() => setLoading(false));
  }, []);

  const apply = useCallback(async (uid: string, fixtureId: string) => {
    const newChip: MultiChip = { playerId: uid, fixtureId, appliedAt: new Date().toISOString() };
    setChips((prev) => [
      ...prev.filter((c) => !(c.playerId === uid && c.fixtureId === fixtureId)),
      newChip,
    ]);
    try {
      await applyMultiChip(uid, fixtureId);
    } catch {
      getAllMultiChips().then(setChips);
    }
  }, []);

  const remove = useCallback(async (uid: string, fixtureId: string) => {
    setChips((prev) => prev.filter((c) => !(c.playerId === uid && c.fixtureId === fixtureId)));
    try {
      await removeMultiChip(uid, fixtureId);
    } catch {
      getAllMultiChips().then(setChips);
    }
  }, []);

  return { chips, loading, apply, remove };
}
