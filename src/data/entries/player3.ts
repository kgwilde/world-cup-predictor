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
  { playerId: PLAYER_ID, fixtureId: 'm001', homeGoals: 2, awayGoals: 0 }, // Mexico 2-0 South Africa
  { playerId: PLAYER_ID, fixtureId: 'm002', homeGoals: 1, awayGoals: 1 }, // South Korea 1-1 Czech Republic
  { playerId: PLAYER_ID, fixtureId: 'm003', homeGoals: 2, awayGoals: 1 }, // Canada 2-1 Bosnia & Herzegovina
  { playerId: PLAYER_ID, fixtureId: 'm004', homeGoals: 2, awayGoals: 1 }, // United States 2-1 Paraguay

  { playerId: PLAYER_ID, fixtureId: 'm005', homeGoals: 0, awayGoals: 2 }, // Qatar 0-2 Switzerland
  { playerId: PLAYER_ID, fixtureId: 'm006', homeGoals: 2, awayGoals: 1 }, // Brazil 2-1 Morocco
  { playerId: PLAYER_ID, fixtureId: 'm007', homeGoals: 0, awayGoals: 1 }, // Haiti 0-1 Scotland
  { playerId: PLAYER_ID, fixtureId: 'm008', homeGoals: 1, awayGoals: 1 }, // Australia 1-1 Turkey

  { playerId: PLAYER_ID, fixtureId: 'm009', homeGoals: 3, awayGoals: 0 }, // Germany 3-0 Curaçao
  { playerId: PLAYER_ID, fixtureId: 'm010', homeGoals: 2, awayGoals: 1 }, // Netherlands 2-1 Japan
  { playerId: PLAYER_ID, fixtureId: 'm011', homeGoals: 1, awayGoals: 1 }, // Ivory Coast 1-1 Ecuador
  { playerId: PLAYER_ID, fixtureId: 'm012', homeGoals: 1, awayGoals: 0 }, // Sweden 1-0 Tunisia

  { playerId: PLAYER_ID, fixtureId: 'm013', homeGoals: 3, awayGoals: 0 }, // Spain 3-0 Cape Verde
  { playerId: PLAYER_ID, fixtureId: 'm014', homeGoals: 2, awayGoals: 0 }, // Belgium 2-0 Egypt
  { playerId: PLAYER_ID, fixtureId: 'm015', homeGoals: 1, awayGoals: 2 }, // Saudi Arabia 1-2 Uruguay
  { playerId: PLAYER_ID, fixtureId: 'm016', homeGoals: 1, awayGoals: 0 }, // Iran 1-0 New Zealand

  { playerId: PLAYER_ID, fixtureId: 'm017', homeGoals: 2, awayGoals: 0 }, // France 2-0 Senegal
  { playerId: PLAYER_ID, fixtureId: 'm018', homeGoals: 0, awayGoals: 2 }, // Iraq 0-2 Norway
  { playerId: PLAYER_ID, fixtureId: 'm019', homeGoals: 3, awayGoals: 0 }, // Argentina 3-0 Algeria
  { playerId: PLAYER_ID, fixtureId: 'm020', homeGoals: 2, awayGoals: 0 }, // Austria 2-0 Jordan

  { playerId: PLAYER_ID, fixtureId: 'm021', homeGoals: 3, awayGoals: 0 }, // Portugal 3-0 DR Congo
  { playerId: PLAYER_ID, fixtureId: 'm022', homeGoals: 2, awayGoals: 1 }, // England 2-1 Croatia
  { playerId: PLAYER_ID, fixtureId: 'm023', homeGoals: 1, awayGoals: 1 }, // Ghana 1-1 Panama
  { playerId: PLAYER_ID, fixtureId: 'm024', homeGoals: 0, awayGoals: 2 }, // Uzbekistan 0-2 Colombia

  // Matchday 2
  { playerId: PLAYER_ID, fixtureId: 'm025', homeGoals: 2, awayGoals: 0 }, // Czech Republic 2-0 South Africa
  { playerId: PLAYER_ID, fixtureId: 'm026', homeGoals: 2, awayGoals: 0 }, // Switzerland 2-0 Bosnia & Herzegovina
  { playerId: PLAYER_ID, fixtureId: 'm027', homeGoals: 2, awayGoals: 1 }, // Canada 2-1 Qatar
  { playerId: PLAYER_ID, fixtureId: 'm028', homeGoals: 2, awayGoals: 1 }, // Mexico 2-1 South Korea

  { playerId: PLAYER_ID, fixtureId: 'm029', homeGoals: 2, awayGoals: 1 }, // United States 2-1 Australia
  { playerId: PLAYER_ID, fixtureId: 'm030', homeGoals: 1, awayGoals: 2 }, // Scotland 1-2 Morocco
  { playerId: PLAYER_ID, fixtureId: 'm031', homeGoals: 2, awayGoals: 0 }, // Brazil 2-0 Haiti
  { playerId: PLAYER_ID, fixtureId: 'm032', homeGoals: 2, awayGoals: 1 }, // Turkey 2-1 Paraguay

  { playerId: PLAYER_ID, fixtureId: 'm033', homeGoals: 2, awayGoals: 0 }, // Netherlands 2-0 Sweden
  { playerId: PLAYER_ID, fixtureId: 'm034', homeGoals: 2, awayGoals: 1 }, // Germany 2-1 Ivory Coast
  { playerId: PLAYER_ID, fixtureId: 'm035', homeGoals: 2, awayGoals: 0 }, // Ecuador 2-0 Curaçao
  { playerId: PLAYER_ID, fixtureId: 'm036', homeGoals: 1, awayGoals: 1 }, // Tunisia 1-1 Japan

  { playerId: PLAYER_ID, fixtureId: 'm037', homeGoals: 2, awayGoals: 0 }, // Spain 2-0 Saudi Arabia
  { playerId: PLAYER_ID, fixtureId: 'm038', homeGoals: 2, awayGoals: 1 }, // Belgium 2-1 Iran
  { playerId: PLAYER_ID, fixtureId: 'm039', homeGoals: 2, awayGoals: 0 }, // Uruguay 2-0 Cape Verde
  { playerId: PLAYER_ID, fixtureId: 'm040', homeGoals: 0, awayGoals: 2 }, // New Zealand 0-2 Egypt

  { playerId: PLAYER_ID, fixtureId: 'm041', homeGoals: 2, awayGoals: 0 }, // Argentina 2-0 Austria
  { playerId: PLAYER_ID, fixtureId: 'm042', homeGoals: 2, awayGoals: 0 }, // France 2-0 Iraq
  { playerId: PLAYER_ID, fixtureId: 'm043', homeGoals: 1, awayGoals: 1 }, // Norway 1-1 Senegal
  { playerId: PLAYER_ID, fixtureId: 'm044', homeGoals: 0, awayGoals: 2 }, // Jordan 0-2 Algeria

  { playerId: PLAYER_ID, fixtureId: 'm045', homeGoals: 2, awayGoals: 0 }, // Portugal 2-0 Uzbekistan
  { playerId: PLAYER_ID, fixtureId: 'm046', homeGoals: 2, awayGoals: 1 }, // England 2-1 Ghana
  { playerId: PLAYER_ID, fixtureId: 'm047', homeGoals: 0, awayGoals: 2 }, // Panama 0-2 Croatia
  { playerId: PLAYER_ID, fixtureId: 'm048', homeGoals: 2, awayGoals: 1 }, // Colombia 2-1 DR Congo

  // Matchday 3
  { playerId: PLAYER_ID, fixtureId: 'm049', homeGoals: 2, awayGoals: 2 }, // Switzerland 2-2 Canada
  { playerId: PLAYER_ID, fixtureId: 'm050', homeGoals: 1, awayGoals: 1 }, // Bosnia & Herzegovina 1-1 Qatar
  { playerId: PLAYER_ID, fixtureId: 'm051', homeGoals: 2, awayGoals: 0 }, // Morocco 2-0 Haiti
  { playerId: PLAYER_ID, fixtureId: 'm052', homeGoals: 0, awayGoals: 3 }, // Scotland 0-3 Brazil

  { playerId: PLAYER_ID, fixtureId: 'm053', homeGoals: 0, awayGoals: 2 }, // South Africa 0-2 South Korea
  { playerId: PLAYER_ID, fixtureId: 'm054', homeGoals: 1, awayGoals: 1 }, // Czech Republic 1-1 Mexico
  { playerId: PLAYER_ID, fixtureId: 'm055', homeGoals: 0, awayGoals: 3 }, // Curaçao 0-3 Ivory Coast
  { playerId: PLAYER_ID, fixtureId: 'm056', homeGoals: 1, awayGoals: 1 }, // Ecuador 1-1 Germany

  { playerId: PLAYER_ID, fixtureId: 'm057', homeGoals: 0, awayGoals: 2 }, // Tunisia 0-2 Netherlands
  { playerId: PLAYER_ID, fixtureId: 'm058', homeGoals: 1, awayGoals: 1 }, // Japan 1-1 Sweden
  { playerId: PLAYER_ID, fixtureId: 'm059', homeGoals: 1, awayGoals: 1 }, // Turkey 1-1 United States
  { playerId: PLAYER_ID, fixtureId: 'm060', homeGoals: 1, awayGoals: 1 }, // Paraguay 1-1 Australia

  { playerId: PLAYER_ID, fixtureId: 'm061', homeGoals: 1, awayGoals: 2 }, // Norway 1-2 France
  { playerId: PLAYER_ID, fixtureId: 'm062', homeGoals: 1, awayGoals: 0 }, // Senegal 1-0 Iraq
  { playerId: PLAYER_ID, fixtureId: 'm063', homeGoals: 0, awayGoals: 1 }, // Cape Verde 0-1 Saudi Arabia
  { playerId: PLAYER_ID, fixtureId: 'm064', homeGoals: 1, awayGoals: 2 }, // Uruguay 1-2 Spain

  { playerId: PLAYER_ID, fixtureId: 'm065', homeGoals: 0, awayGoals: 3 }, // New Zealand 0-3 Belgium
  { playerId: PLAYER_ID, fixtureId: 'm066', homeGoals: 1, awayGoals: 1 }, // Egypt 1-1 Iran
  { playerId: PLAYER_ID, fixtureId: 'm067', homeGoals: 0, awayGoals: 2 }, // Panama 0-2 England
  { playerId: PLAYER_ID, fixtureId: 'm068', homeGoals: 2, awayGoals: 1 }, // Croatia 2-1 Ghana

  { playerId: PLAYER_ID, fixtureId: 'm069', homeGoals: 1, awayGoals: 2 }, // Colombia 1-2 Portugal
  { playerId: PLAYER_ID, fixtureId: 'm070', homeGoals: 1, awayGoals: 1 }, // DR Congo 1-1 Uzbekistan
  { playerId: PLAYER_ID, fixtureId: 'm071', homeGoals: 1, awayGoals: 1 }, // Algeria 1-1 Austria
  { playerId: PLAYER_ID, fixtureId: 'm072', homeGoals: 0, awayGoals: 3 }, // Jordan 0-3 Argentina
];

// ─── Tournament Picks ─────────────────────────────────────────────────────────

export const tournamentPicks: TournamentPicks = {
  playerId: PLAYER_ID,
  groups: {
    A: { winner: 'Mexico', runnerUp: 'South Korea' }, // Mexico, South Africa, South Korea, CZ
    B: { winner: 'Switzerland', runnerUp: 'Canada' }, // Canada, Bosnia & Herzegovina, Qatar, CH
    C: { winner: 'Brazil', runnerUp: 'Morocco' }, // Brazil, Morocco, Haiti, GB_SCT
    D: { winner: 'United States', runnerUp: 'Turkey' }, // United States, Paraguay, Australia, TR
    E: { winner: 'Germany', runnerUp: 'Ecuador' }, // Germany, Curaçao, Ivory Coast, EC
    F: { winner: 'Netherlands', runnerUp: 'Japan' }, // Netherlands, Japan, Sweden, TN
    G: { winner: 'Belgium', runnerUp: 'Iran' }, // Belgium, Egypt, Iran, NZ
    H: { winner: 'Spain', runnerUp: 'Uruguay' }, // Spain, Cape Verde, Saudi Arabia, UY
    I: { winner: 'France', runnerUp: 'Senegal' }, // France, Senegal, Iraq, NO
    J: { winner: 'Argentina', runnerUp: 'Austria' }, // Argentina, Algeria, Austria, JO
    K: { winner: 'Portugal', runnerUp: 'Colombia' }, // Portugal, DR Congo, Uzbekistan, CO
    L: { winner: 'England', runnerUp: 'Croatia' }, // England, Croatia, Ghana, Panama
  },
  bestThirdPlace: [
    'Czech Republic',
    'Scotland',
    'Australia',
    'Ivory Coast',
    'Sweden',
    'Norway',
    'Algeria',
    'Panama',
  ], // 8 team codes
  roundOf16: [
    'Mexico',
    'Germany',
    'France',
    'Portugal',
    'Switzerland',
    'Netherlands',
    'Morocco',
    'Croatia',
    'Brazil',
    'Belgium',
    'Argentina',
    'Japan',
    'United States',
    'Spain',
    'England',
    'Senegal',
  ], // 16 team codes
  quarterFinalists: [
    'Spain',
    'England',
    'Argentina',
    'Brazil',
    'France',
    'Portugal',
    'Germany',
    'Netherlands',
  ], // 8 team codes
  semiFinalists: ['Spain', 'France', 'England', 'Portugal'], // 4 team codes
  finalists: ['Spain', 'France'], // 2 team codes
  winner: 'Spain',
};

// ─── Bonus Predictions ────────────────────────────────────────────────────────

export const bonusPredictions: BonusPredictions = {
  playerId: PLAYER_ID,
  topScorer: 'Harry Kane', // Player name (free text)
  highestScoringTeam: 'Spain', // Team code — group stage highest scorers
  bestDefence: 'Spain', // Team code — best group stage defence
  totalYellowCards: 352,
  totalRedCards: 6,
  penaltyShootouts: 8,
};
