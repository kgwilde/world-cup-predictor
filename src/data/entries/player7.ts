import type { BonusPredictions, Prediction, TournamentPicks } from '@/lib/types';

const PLAYER_ID = 'BT4kIKcu0yRz70hJrLXhcA9P43s2'; // Alan

// ─── Match Predictions ────────────────────────────────────────────────────────

export const predictions: Prediction[] = [
  // Matchday 1
  { playerId: PLAYER_ID, fixtureId: 'm001', homeGoals: 2, awayGoals: 0 },
  { playerId: PLAYER_ID, fixtureId: 'm002', homeGoals: 2, awayGoals: 0 },
  { playerId: PLAYER_ID, fixtureId: 'm003', homeGoals: 2, awayGoals: 0 },
  { playerId: PLAYER_ID, fixtureId: 'm004', homeGoals: 2, awayGoals: 0 },
  { playerId: PLAYER_ID, fixtureId: 'm005', homeGoals: 0, awayGoals: 2 },
  { playerId: PLAYER_ID, fixtureId: 'm006', homeGoals: 2, awayGoals: 0 },
  { playerId: PLAYER_ID, fixtureId: 'm007', homeGoals: 0, awayGoals: 2 },
  { playerId: PLAYER_ID, fixtureId: 'm008', homeGoals: 1, awayGoals: 1 },
  { playerId: PLAYER_ID, fixtureId: 'm009', homeGoals: 4, awayGoals: 0 },
  { playerId: PLAYER_ID, fixtureId: 'm010', homeGoals: 1, awayGoals: 1 },
  { playerId: PLAYER_ID, fixtureId: 'm011', homeGoals: 1, awayGoals: 1 },
  { playerId: PLAYER_ID, fixtureId: 'm012', homeGoals: 1, awayGoals: 1 },
  { playerId: PLAYER_ID, fixtureId: 'm013', homeGoals: 4, awayGoals: 0 },
  { playerId: PLAYER_ID, fixtureId: 'm014', homeGoals: 1, awayGoals: 1 },
  { playerId: PLAYER_ID, fixtureId: 'm015', homeGoals: 1, awayGoals: 1 },
  { playerId: PLAYER_ID, fixtureId: 'm016', homeGoals: 1, awayGoals: 1 },
  { playerId: PLAYER_ID, fixtureId: 'm017', homeGoals: 2, awayGoals: 1 },
  { playerId: PLAYER_ID, fixtureId: 'm018', homeGoals: 1, awayGoals: 1 },
  { playerId: PLAYER_ID, fixtureId: 'm019', homeGoals: 2, awayGoals: 0 },
  { playerId: PLAYER_ID, fixtureId: 'm020', homeGoals: 2, awayGoals: 0 },
  { playerId: PLAYER_ID, fixtureId: 'm021', homeGoals: 2, awayGoals: 0 },
  { playerId: PLAYER_ID, fixtureId: 'm022', homeGoals: 1, awayGoals: 1 },
  { playerId: PLAYER_ID, fixtureId: 'm023', homeGoals: 1, awayGoals: 1 },
  { playerId: PLAYER_ID, fixtureId: 'm024', homeGoals: 0, awayGoals: 2 },

  // Matchday 2
  { playerId: PLAYER_ID, fixtureId: 'm025', homeGoals: 1, awayGoals: 1 },
  { playerId: PLAYER_ID, fixtureId: 'm026', homeGoals: 2, awayGoals: 0 },
  { playerId: PLAYER_ID, fixtureId: 'm027', homeGoals: 2, awayGoals: 0 },
  { playerId: PLAYER_ID, fixtureId: 'm028', homeGoals: 1, awayGoals: 1 },
  { playerId: PLAYER_ID, fixtureId: 'm029', homeGoals: 2, awayGoals: 0 },
  { playerId: PLAYER_ID, fixtureId: 'm030', homeGoals: 2, awayGoals: 0 },
  { playerId: PLAYER_ID, fixtureId: 'm031', homeGoals: 2, awayGoals: 0 },
  { playerId: PLAYER_ID, fixtureId: 'm032', homeGoals: 1, awayGoals: 1 },
  { playerId: PLAYER_ID, fixtureId: 'm033', homeGoals: 2, awayGoals: 0 },
  { playerId: PLAYER_ID, fixtureId: 'm034', homeGoals: 2, awayGoals: 0 },
  { playerId: PLAYER_ID, fixtureId: 'm035', homeGoals: 1, awayGoals: 1 },
  { playerId: PLAYER_ID, fixtureId: 'm036', homeGoals: 0, awayGoals: 2 },
  { playerId: PLAYER_ID, fixtureId: 'm037', homeGoals: 2, awayGoals: 0 },
  { playerId: PLAYER_ID, fixtureId: 'm038', homeGoals: 1, awayGoals: 1 },
  { playerId: PLAYER_ID, fixtureId: 'm039', homeGoals: 1, awayGoals: 1 },
  { playerId: PLAYER_ID, fixtureId: 'm040', homeGoals: 1, awayGoals: 1 },
  { playerId: PLAYER_ID, fixtureId: 'm041', homeGoals: 1, awayGoals: 1 },
  { playerId: PLAYER_ID, fixtureId: 'm042', homeGoals: 1, awayGoals: 1 },
  { playerId: PLAYER_ID, fixtureId: 'm043', homeGoals: 1, awayGoals: 1 },
  { playerId: PLAYER_ID, fixtureId: 'm044', homeGoals: 1, awayGoals: 1 },
  { playerId: PLAYER_ID, fixtureId: 'm045', homeGoals: 2, awayGoals: 0 },
  { playerId: PLAYER_ID, fixtureId: 'm046', homeGoals: 1, awayGoals: 1 },
  { playerId: PLAYER_ID, fixtureId: 'm047', homeGoals: 0, awayGoals: 2 },
  { playerId: PLAYER_ID, fixtureId: 'm048', homeGoals: 2, awayGoals: 0 },

  // Matchday 3
  { playerId: PLAYER_ID, fixtureId: 'm049', homeGoals: 1, awayGoals: 1 },
  { playerId: PLAYER_ID, fixtureId: 'm050', homeGoals: 1, awayGoals: 1 },
  { playerId: PLAYER_ID, fixtureId: 'm051', homeGoals: 1, awayGoals: 1 },
  { playerId: PLAYER_ID, fixtureId: 'm052', homeGoals: 1, awayGoals: 2 },
  { playerId: PLAYER_ID, fixtureId: 'm053', homeGoals: 0, awayGoals: 2 },
  { playerId: PLAYER_ID, fixtureId: 'm054', homeGoals: 0, awayGoals: 2 },
  { playerId: PLAYER_ID, fixtureId: 'm055', homeGoals: 1, awayGoals: 1 },
  { playerId: PLAYER_ID, fixtureId: 'm056', homeGoals: 0, awayGoals: 2 },
  { playerId: PLAYER_ID, fixtureId: 'm057', homeGoals: 0, awayGoals: 2 },
  { playerId: PLAYER_ID, fixtureId: 'm058', homeGoals: 1, awayGoals: 0 },
  { playerId: PLAYER_ID, fixtureId: 'm059', homeGoals: 0, awayGoals: 2 },
  { playerId: PLAYER_ID, fixtureId: 'm060', homeGoals: 1, awayGoals: 1 },
  { playerId: PLAYER_ID, fixtureId: 'm061', homeGoals: 1, awayGoals: 1 },
  { playerId: PLAYER_ID, fixtureId: 'm062', homeGoals: 1, awayGoals: 1 },
  { playerId: PLAYER_ID, fixtureId: 'm063', homeGoals: 1, awayGoals: 1 },
  { playerId: PLAYER_ID, fixtureId: 'm064', homeGoals: 0, awayGoals: 2 },
  { playerId: PLAYER_ID, fixtureId: 'm065', homeGoals: 1, awayGoals: 1 },
  { playerId: PLAYER_ID, fixtureId: 'm066', homeGoals: 1, awayGoals: 1 },
  { playerId: PLAYER_ID, fixtureId: 'm067', homeGoals: 1, awayGoals: 1 },
  { playerId: PLAYER_ID, fixtureId: 'm068', homeGoals: 2, awayGoals: 0 },
  { playerId: PLAYER_ID, fixtureId: 'm069', homeGoals: 1, awayGoals: 1 },
  { playerId: PLAYER_ID, fixtureId: 'm070', homeGoals: 1, awayGoals: 1 },
  { playerId: PLAYER_ID, fixtureId: 'm071', homeGoals: 0, awayGoals: 2 },
  { playerId: PLAYER_ID, fixtureId: 'm072', homeGoals: 0, awayGoals: 2 },
];

// ─── Tournament Picks ─────────────────────────────────────────────────────────

// Team codes reference:
//   Group A: MX, ZA, KR, CZ      Group B: CA, BA, QA, CH
//   Group C: BR, MA, HT, GB_SCT  Group D: US, PY, AU, TR
//   Group E: DE, CW, CI, EC      Group F: NL, JP, SE, TN
//   Group G: BE, EG, IR, NZ      Group H: ES, CV, SA, UY
//   Group I: FR, SN, IQ, NO      Group J: AR, DZ, AT, JO
//   Group K: PT, CD, UZ, CO      Group L: GB_ENG, HR, GH, PA

export const tournamentPicks: TournamentPicks = {
  playerId: PLAYER_ID,
  groups: {
    A: { winner: 'Mexico', runnerUp: 'South Korea' }, // Mexico, South Africa, South Korea, CZ
    B: { winner: 'Switzerland', runnerUp: 'Canada' }, // Canada, Bosnia & Herzegovina, Qatar, CH
    C: { winner: 'Brazil', runnerUp: 'Morocco' }, // Brazil, Morocco, Haiti, GB_SCT
    D: { winner: 'United States', runnerUp: 'Türkiye' }, // United States, Paraguay, Australia, TR
    E: { winner: 'Germany', runnerUp: 'Ecuador' }, // Germany, Curaçao, Ivory Coast, EC
    F: { winner: 'Netherlands', runnerUp: 'Sweden' }, // Netherlands, Japan, Sweden, TN
    G: { winner: 'Belgium', runnerUp: 'Egypt' }, // Belgium, Egypt, Iran, NZ
    H: { winner: 'Spain', runnerUp: 'Uruguay' }, // Spain, Cape Verde, Saudi Arabia, UY
    I: { winner: 'France', runnerUp: 'Norway' }, // France, Senegal, Iraq, NO
    J: { winner: 'Argentina', runnerUp: 'Austria' }, // Argentina, Algeria, Austria, JO
    K: { winner: 'Portugal', runnerUp: 'Colombia' }, // Portugal, DR Congo, Uzbekistan, CO
    L: { winner: 'England', runnerUp: 'Croatia' }, // England, Croatia, Ghana, Panama
  },
  bestThirdPlace: [
    'Czech Republic',
    'Scotland',
    'Australia',
    'Japan',
    'Algeria',
    'Ghana',
    'Senegal',
    'Ivory Coast',
  ], // 8 team codes
  roundOf16: [
    'Germany',
    'France',
    'Croatia',
    'Spain',
    'Canada',
    'Netherlands',
    'United States',
    'Belgium',
    'Brazil',
    'Norway',
    'Argentina',
    'Turkey',
    'Mexico',
    'England',
    'Switzerland',
    'Portugal',
  ], // 16 team codes
  quarterFinalists: [
    'France',
    'Netherlands',
    'Brazil',
    'England',
    'Spain',
    'Belgium',
    'Argentina',
    'Portugal',
  ], // 8 team codes
  semiFinalists: ['France', 'Brazil', 'Spain', 'Argentina'], // 4 team codes
  finalists: ['France', 'Argentina'], // 2 team codes
  winner: 'France',
};

// ─── Bonus Predictions ────────────────────────────────────────────────────────

export const bonusPredictions: BonusPredictions = {
  playerId: PLAYER_ID,
  topScorer: 'Lamine Yamal', // Player name (free text)
  highestScoringTeam: 'Spain', // Team code — group stage highest scorers
  bestDefence: 'Portugal', // Team code — best group stage defence
  totalYellowCards: 425,
  totalRedCards: 12,
  penaltyShootouts: 5,
};
