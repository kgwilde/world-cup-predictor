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
  if (replayIndex === -1) {
    return {
      currentStandings: buildZeroStandings(players),
      previousStandings: null,
      currentFixture: null,
    };
  }

  const currentFixture = playedFixtures[replayIndex];
  const previousFixture = replayIndex > 0 ? playedFixtures[replayIndex - 1] : null;

  const currentStandings = calculateStandings(
    players,
    predictions,
    results,
    currentFixture?.id,
    fixtures,
  );

  const previousStandings = previousFixture
    ? calculateStandings(players, predictions, results, previousFixture.id, fixtures)
    : null;

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
