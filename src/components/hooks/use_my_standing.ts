'use client';

import { useMemo } from 'react';

import { useAuthStore } from '@/app/stores/useAuthStore';
import { fixtures } from '@/data/fixtures';
import { allPredictions } from '@/data/entries';
import { resolveAvatarSrc } from '@/lib/avatar';
import { calculateStandings } from '@/lib/scoring';
import type { Player, Prediction, PublicProfile } from '@/lib/types';

function userToPlayer(profile: PublicProfile): Player {
  return {
    id: profile.uid,
    name: (profile.displayName ?? 'Unknown').split(' ')[0],
    teamName: profile.teamName ?? undefined,
    photoUrl: resolveAvatarSrc(profile.avatarUrl, profile.avatarUpdatedAt),
  };
}

export function useMyStanding(): { rank: number; totalPoints: number } | null {
  const uid = useAuthStore((s) => s.user?.uid ?? null);
  const allUsers = useAuthStore((s) => s.allUsers);
  const usersLoading = useAuthStore((s) => s.usersLoading);
  const storeResults = useAuthStore((s) => s.results);
  const resultsLoading = useAuthStore((s) => s.resultsLoading);

  return useMemo(() => {
    if (!uid || usersLoading || resultsLoading) return null;

    const finalResults = storeResults.filter((r) => r.status !== 'live' && r.status !== 'half_time');

    const playedFixtures = (() => {
      const withResults = new Set(finalResults.map((r) => r.fixtureId));
      return fixtures
        .filter((f) => withResults.has(f.id))
        .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime());
    })();

    const players = allUsers
      .filter((u) => u.approved === true && !!u.teamName)
      .map(userToPlayer);

    if (playedFixtures.length === 0) {
      const sorted = [...players].sort((a, b) => a.name.localeCompare(b.name));
      const index = sorted.findIndex((p) => p.id === uid);
      return index === -1 ? null : { rank: index + 1, totalPoints: 0 };
    }

    const predictions: Prediction[] = allPredictions;
    const lastFixture = playedFixtures[playedFixtures.length - 1];
    const standings = calculateStandings(players, predictions, finalResults, lastFixture.id, fixtures);
    const mine = standings.find((s) => s.player.id === uid);

    return mine ? { rank: mine.rank, totalPoints: mine.totalPoints } : null;
  }, [uid, allUsers, usersLoading, storeResults, resultsLoading]);
}
