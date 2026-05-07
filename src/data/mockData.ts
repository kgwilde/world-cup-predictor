import type { MatchResult, Player, Prediction } from '@/lib/types';

// A handful of plausible results for the first group-stage matches (fixture IDs from fixtures.ts)
export const mockResults: MatchResult[] = [
  { fixtureId: 'm001', homeGoals: 2, awayGoals: 0 },
  { fixtureId: 'm002', homeGoals: 1, awayGoals: 1 },
  { fixtureId: 'm003', homeGoals: 2, awayGoals: 2 },
  { fixtureId: 'm004', homeGoals: 1, awayGoals: 2 },
];

// Deterministic hash so predictions are stable across renders
function hashInt(s: string): number {
  let h = 0;
  for (const c of s) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

// Generate plausible predictions for whoever is signed up, keyed to mock results
export function generateMockPredictions(players: Player[]): Prediction[] {
  return players.flatMap((player) =>
    mockResults.map(({ fixtureId }) => ({
      playerId: player.id,
      fixtureId,
      homeGoals: hashInt(player.id + fixtureId + 'h') % 4,
      awayGoals: hashInt(player.id + fixtureId + 'a') % 3,
    })),
  );
}
