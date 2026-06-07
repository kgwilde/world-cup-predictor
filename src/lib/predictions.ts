export type MatchResultType = 'home-win' | 'draw' | 'away-win';

export function getResultType(homeGoals: number, awayGoals: number): MatchResultType {
  if (homeGoals > awayGoals) return 'home-win';
  if (homeGoals < awayGoals) return 'away-win';
  return 'draw';
}
