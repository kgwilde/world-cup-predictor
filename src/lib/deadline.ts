// June 9 2026 18:00 Dublin time (IST = UTC+1 in summer)
export const PREDICTIONS_DEADLINE = new Date('2026-06-09T19:00:00+01:00');

// Set to an ISO string (e.g. '2026-06-14T20:00:00Z') to freeze time for testing. Null = live.
const TEST_NOW_OVERRIDE: string | null = null;

export function getNow(): Date {
  return TEST_NOW_OVERRIDE ? new Date(TEST_NOW_OVERRIDE) : new Date();
}
