import { useMemo } from 'react';

import { fixtures } from '@/data/fixtures';
import { calculateStandings } from '@/lib/scoring';
import type { Fixture, MatchResult, Player, PlayerStanding, Prediction } from '@/lib/types';

export function useStandings(
  players: Player[],
  predictions: Prediction[],
  results: MatchResult[],
  playedFixtures: Fixture[],
  replayIndex: number,
) {
  const currentStandings = useMemo(() => {
    if (replayIndex === -1) return buildZeroStandings(players);
    const fixture = playedFixtures[replayIndex];
    return calculateStandings(players, predictions, results, fixture?.id, fixtures);
  }, [players, predictions, results, playedFixtures, replayIndex]);

  const previousStandings = useMemo(() => {
    if (replayIndex <= 0) return null;
    const prevFixture = playedFixtures[replayIndex - 1];
    return calculateStandings(players, predictions, results, prevFixture.id, fixtures);
  }, [players, predictions, results, playedFixtures, replayIndex]);

  const currentFixture = replayIndex === -1 ? null : playedFixtures[replayIndex];

  return { currentStandings, previousStandings, currentFixture };
}

function buildZeroStandings(players: Player[]): PlayerStanding[] {
  return [...players]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((player, index) => ({
      player,
      totalPoints: 0,
      rank: index + 1,
      matchPoints: [],
    }));
}
