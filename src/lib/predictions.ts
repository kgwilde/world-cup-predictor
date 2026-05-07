import type { Fixture, Prediction } from '@/lib/types';

export type MatchResultType = 'home-win' | 'draw' | 'away-win';

export type PredictionGroup = {
  homeGoals: number;
  awayGoals: number;
  resultType: MatchResultType;
  playerIds: string[];
};

export function getResultType(homeGoals: number, awayGoals: number): MatchResultType {
  if (homeGoals > awayGoals) {
    return 'home-win';
  }

  if (homeGoals < awayGoals) {
    return 'away-win';
  }

  return 'draw';
}

export function groupPredictionsByScore(predictions: Prediction[]): PredictionGroup[] {
  const groupsByScore = new Map<string, PredictionGroup>();

  for (const prediction of predictions) {
    const scoreKey = `${prediction.homeGoals}-${prediction.awayGoals}`;
    const existingGroup = groupsByScore.get(scoreKey);

    if (existingGroup) {
      existingGroup.playerIds.push(prediction.playerId);
      continue;
    }

    groupsByScore.set(scoreKey, {
      homeGoals: prediction.homeGoals,
      awayGoals: prediction.awayGoals,
      resultType: getResultType(prediction.homeGoals, prediction.awayGoals),
      playerIds: [prediction.playerId],
    });
  }

  const groups = [...groupsByScore.values()];
  groups.sort((a, b) => b.playerIds.length - a.playerIds.length);

  return groups;
}

export function findConsensusGroup(groups: PredictionGroup[]): PredictionGroup | null {
  if (groups.length < 2) {
    return null;
  }

  const topGroup = groups[0];
  if (topGroup.playerIds.length < 2) {
    return null;
  }

  const isUniquelyTop = groups[1].playerIds.length < topGroup.playerIds.length;
  if (!isUniquelyTop) {
    return null;
  }

  return topGroup;
}
