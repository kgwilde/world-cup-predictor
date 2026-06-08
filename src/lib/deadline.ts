// June 9 2026 00:00 Dublin time (IST = UTC+1 in summer)
export const PREDICTIONS_DEADLINE = new Date('2026-06-09T00:00:00+01:00');

// One day past the deadline — used as the mock "current time" when IS_MOCK is true
const MOCK_NOW = new Date('2026-06-10T12:00:00+01:00');

const IS_MOCK = process.env.NEXT_PUBLIC_MOCK_RESULTS === 'true';

/** Returns the current time, or a post-deadline time when running in mock mode. */
export function getNow(): Date {
  return IS_MOCK ? MOCK_NOW : new Date();
}
