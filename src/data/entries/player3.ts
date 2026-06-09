import type { BonusPredictions, Prediction, TournamentPicks } from '@/lib/types';

// Team codes reference:
//   Group A: MX, ZA, KR, CZ      Group B: CA, BA, QA, CH
//   Group C: BR, MA, HT, GB_SCT  Group D: US, PY, AU, TR
//   Group E: DE, CW, CI, EC      Group F: NL, JP, SE, TN
//   Group G: BE, EG, IR, NZ      Group H: ES, CV, SA, UY
//   Group I: FR, SN, IQ, NO      Group J: AR, DZ, AT, JO
//   Group K: PT, CD, UZ, CO      Group L: GB_ENG, HR, GH, PA

const PLAYER_ID = 'cEuAUK2K9HX2s6mPc6nd2YvOsyC2'; // Dyl

// ─── Match Predictions ────────────────────────────────────────────────────────

export const predictions: Prediction[] = [
  // Matchday 1
  { playerId: PLAYER_ID, fixtureId: 'm001', homeGoals: 0, awayGoals: 0 }, // Mexico vs South Africa
  { playerId: PLAYER_ID, fixtureId: 'm002', homeGoals: 0, awayGoals: 0 }, // South Korea vs Czech Republic
  { playerId: PLAYER_ID, fixtureId: 'm003', homeGoals: 0, awayGoals: 0 }, // Canada vs Bosnia & Herzegovina
  { playerId: PLAYER_ID, fixtureId: 'm004', homeGoals: 0, awayGoals: 0 }, // United States vs Paraguay
  { playerId: PLAYER_ID, fixtureId: 'm005', homeGoals: 0, awayGoals: 0 }, // Qatar vs Switzerland
  { playerId: PLAYER_ID, fixtureId: 'm006', homeGoals: 0, awayGoals: 0 }, // Brazil vs Morocco
  { playerId: PLAYER_ID, fixtureId: 'm007', homeGoals: 0, awayGoals: 0 }, // Haiti vs Scotland
  { playerId: PLAYER_ID, fixtureId: 'm008', homeGoals: 0, awayGoals: 0 }, // Australia vs Turkey
  { playerId: PLAYER_ID, fixtureId: 'm009', homeGoals: 0, awayGoals: 0 }, // Germany vs Curaçao
  { playerId: PLAYER_ID, fixtureId: 'm010', homeGoals: 0, awayGoals: 0 }, // Netherlands vs Japan
  { playerId: PLAYER_ID, fixtureId: 'm011', homeGoals: 0, awayGoals: 0 }, // Ivory Coast vs Ecuador
  { playerId: PLAYER_ID, fixtureId: 'm012', homeGoals: 0, awayGoals: 0 }, // Sweden vs Tunisia
  { playerId: PLAYER_ID, fixtureId: 'm013', homeGoals: 0, awayGoals: 0 }, // Spain vs Cape Verde
  { playerId: PLAYER_ID, fixtureId: 'm014', homeGoals: 0, awayGoals: 0 }, // Belgium vs Egypt
  { playerId: PLAYER_ID, fixtureId: 'm015', homeGoals: 0, awayGoals: 0 }, // Saudi Arabia vs Uruguay
  { playerId: PLAYER_ID, fixtureId: 'm016', homeGoals: 0, awayGoals: 0 }, // Iran vs New Zealand
  { playerId: PLAYER_ID, fixtureId: 'm017', homeGoals: 0, awayGoals: 0 }, // France vs Senegal
  { playerId: PLAYER_ID, fixtureId: 'm018', homeGoals: 0, awayGoals: 0 }, // Iraq vs Norway
  { playerId: PLAYER_ID, fixtureId: 'm019', homeGoals: 0, awayGoals: 0 }, // Argentina vs Algeria
  { playerId: PLAYER_ID, fixtureId: 'm020', homeGoals: 0, awayGoals: 0 }, // Austria vs Jordan
  { playerId: PLAYER_ID, fixtureId: 'm021', homeGoals: 0, awayGoals: 0 }, // Portugal vs DR Congo
  { playerId: PLAYER_ID, fixtureId: 'm022', homeGoals: 0, awayGoals: 0 }, // England vs Croatia
  { playerId: PLAYER_ID, fixtureId: 'm023', homeGoals: 0, awayGoals: 0 }, // Ghana vs Panama
  { playerId: PLAYER_ID, fixtureId: 'm024', homeGoals: 0, awayGoals: 0 }, // Uzbekistan vs Colombia

  // Matchday 2
  { playerId: PLAYER_ID, fixtureId: 'm025', homeGoals: 0, awayGoals: 0 }, // Czech Republic vs South Africa
  { playerId: PLAYER_ID, fixtureId: 'm026', homeGoals: 0, awayGoals: 0 }, // Switzerland vs Bosnia & Herzegovina
  { playerId: PLAYER_ID, fixtureId: 'm027', homeGoals: 0, awayGoals: 0 }, // Canada vs Qatar
  { playerId: PLAYER_ID, fixtureId: 'm028', homeGoals: 0, awayGoals: 0 }, // Mexico vs South Korea
  { playerId: PLAYER_ID, fixtureId: 'm029', homeGoals: 0, awayGoals: 0 }, // United States vs Australia
  { playerId: PLAYER_ID, fixtureId: 'm030', homeGoals: 0, awayGoals: 0 }, // Scotland vs Morocco
  { playerId: PLAYER_ID, fixtureId: 'm031', homeGoals: 0, awayGoals: 0 }, // Brazil vs Haiti
  { playerId: PLAYER_ID, fixtureId: 'm032', homeGoals: 0, awayGoals: 0 }, // Turkey vs Paraguay
  { playerId: PLAYER_ID, fixtureId: 'm033', homeGoals: 0, awayGoals: 0 }, // Netherlands vs Sweden
  { playerId: PLAYER_ID, fixtureId: 'm034', homeGoals: 0, awayGoals: 0 }, // Germany vs Ivory Coast
  { playerId: PLAYER_ID, fixtureId: 'm035', homeGoals: 0, awayGoals: 0 }, // Ecuador vs Curaçao
  { playerId: PLAYER_ID, fixtureId: 'm036', homeGoals: 0, awayGoals: 0 }, // Tunisia vs Japan
  { playerId: PLAYER_ID, fixtureId: 'm037', homeGoals: 0, awayGoals: 0 }, // Spain vs Saudi Arabia
  { playerId: PLAYER_ID, fixtureId: 'm038', homeGoals: 0, awayGoals: 0 }, // Belgium vs Iran
  { playerId: PLAYER_ID, fixtureId: 'm039', homeGoals: 0, awayGoals: 0 }, // Uruguay vs Cape Verde
  { playerId: PLAYER_ID, fixtureId: 'm040', homeGoals: 0, awayGoals: 0 }, // New Zealand vs Egypt
  { playerId: PLAYER_ID, fixtureId: 'm041', homeGoals: 0, awayGoals: 0 }, // Argentina vs Austria
  { playerId: PLAYER_ID, fixtureId: 'm042', homeGoals: 0, awayGoals: 0 }, // France vs Iraq
  { playerId: PLAYER_ID, fixtureId: 'm043', homeGoals: 0, awayGoals: 0 }, // Norway vs Senegal
  { playerId: PLAYER_ID, fixtureId: 'm044', homeGoals: 0, awayGoals: 0 }, // Jordan vs Algeria
  { playerId: PLAYER_ID, fixtureId: 'm045', homeGoals: 0, awayGoals: 0 }, // Portugal vs Uzbekistan
  { playerId: PLAYER_ID, fixtureId: 'm046', homeGoals: 0, awayGoals: 0 }, // England vs Ghana
  { playerId: PLAYER_ID, fixtureId: 'm047', homeGoals: 0, awayGoals: 0 }, // Panama vs Croatia
  { playerId: PLAYER_ID, fixtureId: 'm048', homeGoals: 0, awayGoals: 0 }, // Colombia vs DR Congo

  // Matchday 3
  { playerId: PLAYER_ID, fixtureId: 'm049', homeGoals: 0, awayGoals: 0 }, // Switzerland vs Canada
  { playerId: PLAYER_ID, fixtureId: 'm050', homeGoals: 0, awayGoals: 0 }, // Bosnia & Herzegovina vs Qatar
  { playerId: PLAYER_ID, fixtureId: 'm051', homeGoals: 0, awayGoals: 0 }, // Morocco vs Haiti
  { playerId: PLAYER_ID, fixtureId: 'm052', homeGoals: 0, awayGoals: 0 }, // Scotland vs Brazil
  { playerId: PLAYER_ID, fixtureId: 'm053', homeGoals: 0, awayGoals: 0 }, // South Africa vs South Korea
  { playerId: PLAYER_ID, fixtureId: 'm054', homeGoals: 0, awayGoals: 0 }, // Czech Republic vs Mexico
  { playerId: PLAYER_ID, fixtureId: 'm055', homeGoals: 0, awayGoals: 0 }, // Curaçao vs Ivory Coast
  { playerId: PLAYER_ID, fixtureId: 'm056', homeGoals: 0, awayGoals: 0 }, // Ecuador vs Germany
  { playerId: PLAYER_ID, fixtureId: 'm057', homeGoals: 0, awayGoals: 0 }, // Tunisia vs Netherlands
  { playerId: PLAYER_ID, fixtureId: 'm058', homeGoals: 0, awayGoals: 0 }, // Japan vs Sweden
  { playerId: PLAYER_ID, fixtureId: 'm059', homeGoals: 0, awayGoals: 0 }, // Turkey vs United States
  { playerId: PLAYER_ID, fixtureId: 'm060', homeGoals: 0, awayGoals: 0 }, // Paraguay vs Australia
  { playerId: PLAYER_ID, fixtureId: 'm061', homeGoals: 0, awayGoals: 0 }, // Norway vs France
  { playerId: PLAYER_ID, fixtureId: 'm062', homeGoals: 0, awayGoals: 0 }, // Senegal vs Iraq
  { playerId: PLAYER_ID, fixtureId: 'm063', homeGoals: 0, awayGoals: 0 }, // Cape Verde vs Saudi Arabia
  { playerId: PLAYER_ID, fixtureId: 'm064', homeGoals: 0, awayGoals: 0 }, // Uruguay vs Spain
  { playerId: PLAYER_ID, fixtureId: 'm065', homeGoals: 0, awayGoals: 0 }, // New Zealand vs Belgium
  { playerId: PLAYER_ID, fixtureId: 'm066', homeGoals: 0, awayGoals: 0 }, // Egypt vs Iran
  { playerId: PLAYER_ID, fixtureId: 'm067', homeGoals: 0, awayGoals: 0 }, // Panama vs England
  { playerId: PLAYER_ID, fixtureId: 'm068', homeGoals: 0, awayGoals: 0 }, // Croatia vs Ghana
  { playerId: PLAYER_ID, fixtureId: 'm069', homeGoals: 0, awayGoals: 0 }, // Colombia vs Portugal
  { playerId: PLAYER_ID, fixtureId: 'm070', homeGoals: 0, awayGoals: 0 }, // DR Congo vs Uzbekistan
  { playerId: PLAYER_ID, fixtureId: 'm071', homeGoals: 0, awayGoals: 0 }, // Algeria vs Austria
  { playerId: PLAYER_ID, fixtureId: 'm072', homeGoals: 0, awayGoals: 0 }, // Jordan vs Argentina
];

// ─── Tournament Picks ─────────────────────────────────────────────────────────

export const tournamentPicks: TournamentPicks = {
  playerId: PLAYER_ID,
  groups: {
    A: { winner: '', runnerUp: '' }, // MX, ZA, KR, CZ
    B: { winner: '', runnerUp: '' }, // CA, BA, QA, CH
    C: { winner: '', runnerUp: '' }, // BR, MA, HT, GB_SCT
    D: { winner: '', runnerUp: '' }, // US, PY, AU, TR
    E: { winner: '', runnerUp: '' }, // DE, CW, CI, EC
    F: { winner: '', runnerUp: '' }, // NL, JP, SE, TN
    G: { winner: '', runnerUp: '' }, // BE, EG, IR, NZ
    H: { winner: '', runnerUp: '' }, // ES, CV, SA, UY
    I: { winner: '', runnerUp: '' }, // FR, SN, IQ, NO
    J: { winner: '', runnerUp: '' }, // AR, DZ, AT, JO
    K: { winner: '', runnerUp: '' }, // PT, CD, UZ, CO
    L: { winner: '', runnerUp: '' }, // GB_ENG, HR, GH, PA
  },
  bestThirdPlace: ['', '', '', '', '', '', '', ''], // 8 team codes
  roundOf16: ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''], // 16 team codes
  quarterFinalists: ['', '', '', '', '', '', '', ''], // 8 team codes
  semiFinalists: ['', '', '', ''], // 4 team codes
  finalists: ['', ''], // 2 team codes
  winner: '',
};

// ─── Bonus Predictions ────────────────────────────────────────────────────────

export const bonusPredictions: BonusPredictions = {
  playerId: PLAYER_ID,
  topScorer: '', // Player name (free text)
  highestScoringTeam: '', // Team code — group stage highest scorers
  bestDefence: '', // Team code — best group stage defence
  totalYellowCards: 0,
  totalRedCards: 0,
  penaltyShootouts: 0,
};
