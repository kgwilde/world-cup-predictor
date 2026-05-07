import { fixtures } from '@/data/fixtures';
import { players } from '@/data/players';
import { predictions } from '@/data/predictions';
import { results } from '@/data/results';
import { calculateStandings } from '@/lib/scoring';
import { Fixture, PlayerStanding } from '@/lib/types';

export function useStandings(playedFixtures: Fixture[], replayIndex: number) {
  if (replayIndex === -1) {
    return {
      currentStandings: buildZeroStandings(),
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
    fixtures
  );

  const previousStandings = previousFixture
    ? calculateStandings(players, predictions, results, previousFixture.id, fixtures)
    : null;

  return { currentStandings, previousStandings, currentFixture };
}

function buildZeroStandings(): PlayerStanding[] {
  return [...players]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((player, index) => ({
      player,
      totalPoints: 0,
      rank: index + 1,
      matchPoints: [],
    }));
}
