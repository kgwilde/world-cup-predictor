import type { Prediction } from '@/lib/types';

export const predictions: Prediction[] = [
  // Alice
  { playerId: 'p_abc123', fixtureId: 'm001', homeGoals: 2, awayGoals: 0 },
  { playerId: 'p_abc123', fixtureId: 'm002', homeGoals: 1, awayGoals: 1 },
  { playerId: 'p_abc123', fixtureId: 'm003', homeGoals: 2, awayGoals: 1 },
  { playerId: 'p_abc123', fixtureId: 'm004', homeGoals: 1, awayGoals: 2 },
  { playerId: 'p_abc123', fixtureId: 'm005', homeGoals: 1, awayGoals: 1 },
  // Bruno
  { playerId: 'p_def456', fixtureId: 'm001', homeGoals: 2, awayGoals: 0 },
  { playerId: 'p_def456', fixtureId: 'm002', homeGoals: 2, awayGoals: 1 },
  { playerId: 'p_def456', fixtureId: 'm003', homeGoals: 1, awayGoals: 1 },
  { playerId: 'p_def456', fixtureId: 'm004', homeGoals: 2, awayGoals: 0 },
  { playerId: 'p_def456', fixtureId: 'm005', homeGoals: 2, awayGoals: 1 },
  // Caitlin
  { playerId: 'p_ghi789', fixtureId: 'm001', homeGoals: 2, awayGoals: 0 },
  { playerId: 'p_ghi789', fixtureId: 'm002', homeGoals: 0, awayGoals: 0 },
  { playerId: 'p_ghi789', fixtureId: 'm003', homeGoals: 2, awayGoals: 2 },
  { playerId: 'p_ghi789', fixtureId: 'm004', homeGoals: 1, awayGoals: 1 },
  { playerId: 'p_ghi789', fixtureId: 'm005', homeGoals: 0, awayGoals: 1 },
  // Diego
  { playerId: 'p_jkl012', fixtureId: 'm001', homeGoals: 2, awayGoals: 1 },
  { playerId: 'p_jkl012', fixtureId: 'm002', homeGoals: 1, awayGoals: 0 },
  { playerId: 'p_jkl012', fixtureId: 'm003', homeGoals: 3, awayGoals: 1 },
  { playerId: 'p_jkl012', fixtureId: 'm004', homeGoals: 2, awayGoals: 2 },
  { playerId: 'p_jkl012', fixtureId: 'm005', homeGoals: 1, awayGoals: 2 },
  // Eimear
  { playerId: 'p_mno345', fixtureId: 'm001', homeGoals: 2, awayGoals: 1 },
  { playerId: 'p_mno345', fixtureId: 'm002', homeGoals: 2, awayGoals: 0 },
  { playerId: 'p_mno345', fixtureId: 'm003', homeGoals: 1, awayGoals: 0 },
  { playerId: 'p_mno345', fixtureId: 'm004', homeGoals: 3, awayGoals: 1 },
  { playerId: 'p_mno345', fixtureId: 'm005', homeGoals: 1, awayGoals: 1 },
];
