import type { MatchResult } from '@/lib/types';

// Replace these with live Firestore data later
export const results: MatchResult[] = [
  { fixtureId: 'm001', homeGoals: 2, awayGoals: 0 },
  { fixtureId: 'm002', homeGoals: 1, awayGoals: 1 },
  { fixtureId: 'm003', homeGoals: 2, awayGoals: 2 },
  { fixtureId: 'm004', homeGoals: 1, awayGoals: 2 },
];
// m005 has no result yet — simulates an upcoming match
