'use client';

import { useEffect, useRef } from 'react';

import { fixtures } from '@/data/fixtures';
import { isFixtureLive } from '@/components/FixtureSlider';
import { useAuthStore } from '@/app/stores/useAuthStore';
import type { MatchResult } from '@/lib/types';

const SYNC_INTERVAL_MS = 30_000;

function anyFixtureLive(results: MatchResult[]): boolean {
  const now = new Date();
  const resultMap = new Map(results.map((r) => [r.fixtureId, r]));
  return fixtures.some((f) => isFixtureLive(new Date(f.kickoff), now, resultMap.get(f.id)));
}

export function useLiveSync(): void {
  const user = useAuthStore((s) => s.user);
  const resultsLoading = useAuthStore((s) => s.resultsLoading);
  const results = useAuthStore((s) => s.results);

  const resultsRef = useRef(results);
  useEffect(() => {
    resultsRef.current = results;
  }, [results]);

  useEffect(() => {
    if (!user || resultsLoading) return;

    const sync = async () => {
      if (!anyFixtureLive(resultsRef.current)) return;
      try {
        const token = await user.getIdToken();
        await fetch('/api/sync-scores', {
          headers: { Authorization: `Bearer ${token}` },
        });
        // No explicit refresh needed — the onSnapshot listener in the store
        // picks up the Firestore write and updates all open clients automatically.
      } catch {
        // network failure — next tick will retry
      }
    };

    sync();
    const id = setInterval(sync, SYNC_INTERVAL_MS);
    return () => clearInterval(id);
  }, [user, resultsLoading]);
}
