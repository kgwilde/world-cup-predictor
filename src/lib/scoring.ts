import type {
  Fixture,
  MatchResult,
  Prediction,
  MatchPoints,
  Player,
  PlayerStanding,
} from './types';

export function scoreMatch(prediction: Prediction, result: MatchResult): MatchPoints {
  const resultCorrect =
    Math.sign(prediction.homeGoals - prediction.awayGoals) ===
    Math.sign(result.homeGoals - result.awayGoals);

  const homeGoalsCorrect = prediction.homeGoals === result.homeGoals;
  const awayGoalsCorrect = prediction.awayGoals === result.awayGoals;

  const base = (resultCorrect ? 3 : 0) + (homeGoalsCorrect ? 1 : 0) + (awayGoalsCorrect ? 1 : 0);
  const multiChipApplied = !!prediction.multiChip;
  const points = multiChipApplied ? base * 2 : base;

  return {
    playerId: prediction.playerId,
    fixtureId: prediction.fixtureId,
    points,
    resultCorrect,
    homeGoalsCorrect,
    awayGoalsCorrect,
    multiChipApplied,
  };
}

function buildCumulativeHistory(matchPoints: MatchPoints[], orderedFixtureIds: string[]): number[] {
  const pointsByFixture = new Map(matchPoints.map((mp) => [mp.fixtureId, mp.points]));
  let running = 0;
  return orderedFixtureIds.map((id) => (running += pointsByFixture.get(id) ?? 0));
}

export function calculateStandings(
  players: Player[],
  predictions: Prediction[],
  results: MatchResult[],
  upToFixtureId?: string,
  fixtures?: Fixture[]
): PlayerStanding[] {
  let includedResults = results;

  if (upToFixtureId && fixtures) {
    const orderedFixtures = [...fixtures].sort(
      (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
    );
    const cutoffIndex = orderedFixtures.findIndex((f) => f.id === upToFixtureId);
    const includedIds = new Set(orderedFixtures.slice(0, cutoffIndex + 1).map((f) => f.id));
    includedResults = results.filter((r) => includedIds.has(r.fixtureId));
  }

  const resultMap = new Map(includedResults.map((r) => [r.fixtureId, r]));

  const orderedFixtureIds: string[] = fixtures
    ? [...fixtures]
        .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime())
        .map((f) => f.id)
    : [];

  const standings: PlayerStanding[] = players.map((player) => {
    const playerPredictions = predictions.filter((p) => p.playerId === player.id);

    const matchPoints: MatchPoints[] = playerPredictions
      .map((pred) => {
        const result = resultMap.get(pred.fixtureId);
        if (!result) return null;
        return scoreMatch(pred, result);
      })
      .filter((mp): mp is MatchPoints => mp !== null);

    const totalPoints = matchPoints.reduce((sum, mp) => sum + mp.points, 0);

    return { player, totalPoints, rank: 0, matchPoints };
  });

  standings.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (orderedFixtureIds.length > 0) {
      const aCum = buildCumulativeHistory(a.matchPoints, orderedFixtureIds);
      const bCum = buildCumulativeHistory(b.matchPoints, orderedFixtureIds);
      for (let i = 0; i < orderedFixtureIds.length; i++) {
        if (aCum[i] !== bCum[i]) return bCum[i] - aCum[i];
      }
    }
    return a.player.name.localeCompare(b.player.name);
  });

  standings.forEach((s, i) => {
    s.rank = i + 1;
  });

  return standings;
}

export type Scoreline = {
  homeGoals: number;
  awayGoals: number;
};

export type ScoreBreakdown = {
  resultPoints: number;
  homeGoalsPoints: number;
  awayGoalsPoints: number;
  multiChipBonus: number;
  multiChipApplied: boolean;
  total: number;
};

const RESULT_POINTS = 3;
const HOME_GOALS_POINTS = 1;
const AWAY_GOALS_POINTS = 1;

function getMatchOutcome({ homeGoals, awayGoals }: Scoreline) {
  if (homeGoals > awayGoals) {
    return 'home';
  }
  if (awayGoals > homeGoals) {
    return 'away';
  }
  return 'draw';
}

export function calculateScoreBreakdown(
  prediction: Scoreline,
  actual: Scoreline,
  multiChip = false
): ScoreBreakdown {
  const isResultCorrect = getMatchOutcome(prediction) === getMatchOutcome(actual);
  const isHomeGoalsCorrect = prediction.homeGoals === actual.homeGoals;
  const isAwayGoalsCorrect = prediction.awayGoals === actual.awayGoals;

  const resultPoints = isResultCorrect ? RESULT_POINTS : 0;
  const homeGoalsPoints = isHomeGoalsCorrect ? HOME_GOALS_POINTS : 0;
  const awayGoalsPoints = isAwayGoalsCorrect ? AWAY_GOALS_POINTS : 0;

  const base = resultPoints + homeGoalsPoints + awayGoalsPoints;
  const multiChipBonus = multiChip ? base : 0;

  return {
    resultPoints,
    homeGoalsPoints,
    awayGoalsPoints,
    multiChipBonus,
    multiChipApplied: multiChip,
    total: base + multiChipBonus,
  };
}
