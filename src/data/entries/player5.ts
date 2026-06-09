import type { BonusPredictions, Prediction, TournamentPicks } from '@/lib/types';

// Team codes reference:
//   Group A: MX, ZA, KR, CZ      Group B: CA, BA, QA, CH
//   Group C: BR, MA, HT, GB_SCT  Group D: US, PY, AU, TR
//   Group E: DE, CW, CI, EC      Group F: NL, JP, SE, TN
//   Group G: BE, EG, IR, NZ      Group H: ES, CV, SA, UY
//   Group I: FR, SN, IQ, NO      Group J: AR, DZ, AT, JO
//   Group K: PT, CD, UZ, CO      Group L: GB_ENG, HR, GH, PA

const PLAYER_ID = 'hD3t2Gqh7OZnndX4Scr1r4uGNaz2'; // Kenny

// ─── Match Predictions ────────────────────────────────────────────────────────

export const predictions: Prediction[] = [
  // Matchday 1
  { playerId: PLAYER_ID, fixtureId: 'm001', homeGoals: 3, awayGoals: 1 }, // Mexico 3-1 South Africa
  { playerId: PLAYER_ID, fixtureId: 'm002', homeGoals: 2, awayGoals: 1 }, // South Korea 2-1 Czech Republic
  { playerId: PLAYER_ID, fixtureId: 'm003', homeGoals: 1, awayGoals: 1 }, // Canada 1-1 Bosnia & Herzegovina
  { playerId: PLAYER_ID, fixtureId: 'm004', homeGoals: 2, awayGoals: 1 }, // United States 2-1 Paraguay

  { playerId: PLAYER_ID, fixtureId: 'm005', homeGoals: 0, awayGoals: 3 }, // Qatar 0-3 Switzerland
  { playerId: PLAYER_ID, fixtureId: 'm006', homeGoals: 4, awayGoals: 1 }, // Brazil 4-1 Morocco
  { playerId: PLAYER_ID, fixtureId: 'm007', homeGoals: 2, awayGoals: 3 }, // Haiti 2-3 Scotland
  { playerId: PLAYER_ID, fixtureId: 'm008', homeGoals: 1, awayGoals: 2 }, // Australia 1-2 Turkey

  { playerId: PLAYER_ID, fixtureId: 'm009', homeGoals: 2, awayGoals: 0 }, // Germany 2-0 Curaçao
  { playerId: PLAYER_ID, fixtureId: 'm010', homeGoals: 3, awayGoals: 0 }, // Netherlands 3-0 Japan
  { playerId: PLAYER_ID, fixtureId: 'm011', homeGoals: 2, awayGoals: 3 }, // Ivory Coast 2-3 Ecuador
  { playerId: PLAYER_ID, fixtureId: 'm012', homeGoals: 2, awayGoals: 0 }, // Sweden 2-0 Tunisia

  { playerId: PLAYER_ID, fixtureId: 'm013', homeGoals: 2, awayGoals: 0 }, // Spain 2-0 Cape Verde
  { playerId: PLAYER_ID, fixtureId: 'm014', homeGoals: 2, awayGoals: 1 }, // Belgium 2-1 Egypt
  { playerId: PLAYER_ID, fixtureId: 'm015', homeGoals: 0, awayGoals: 2 }, // Saudi Arabia 0-2 Uruguay
  { playerId: PLAYER_ID, fixtureId: 'm016', homeGoals: 1, awayGoals: 1 }, // Iran 1-1 New Zealand

  { playerId: PLAYER_ID, fixtureId: 'm017', homeGoals: 3, awayGoals: 1 }, // France 3-1 Senegal
  { playerId: PLAYER_ID, fixtureId: 'm018', homeGoals: 0, awayGoals: 1 }, // Iraq 0-1 Norway
  { playerId: PLAYER_ID, fixtureId: 'm019', homeGoals: 2, awayGoals: 0 }, // Argentina 2-0 Algeria
  { playerId: PLAYER_ID, fixtureId: 'm020', homeGoals: 2, awayGoals: 0 }, // Austria 2-0 Jordan

  { playerId: PLAYER_ID, fixtureId: 'm021', homeGoals: 3, awayGoals: 0 }, // Portugal 3-0 DR Congo
  { playerId: PLAYER_ID, fixtureId: 'm022', homeGoals: 2, awayGoals: 1 }, // England 2-1 Croatia
  { playerId: PLAYER_ID, fixtureId: 'm023', homeGoals: 1, awayGoals: 1 }, // Ghana 1-1 Panama
  { playerId: PLAYER_ID, fixtureId: 'm024', homeGoals: 1, awayGoals: 3 }, // Uzbekistan 1-3 Colombia

  // Matchday 2
  { playerId: PLAYER_ID, fixtureId: 'm025', homeGoals: 0, awayGoals: 0 }, // Czech Republic 0-0 South Africa
  { playerId: PLAYER_ID, fixtureId: 'm026', homeGoals: 2, awayGoals: 2 }, // Switzerland 2-2 Bosnia & Herzegovina
  { playerId: PLAYER_ID, fixtureId: 'm027', homeGoals: 2, awayGoals: 1 }, // Canada 2-1 Qatar
  { playerId: PLAYER_ID, fixtureId: 'm028', homeGoals: 3, awayGoals: 1 }, // Mexico 3-1 South Korea

  { playerId: PLAYER_ID, fixtureId: 'm029', homeGoals: 2, awayGoals: 0 }, // United States 2-0 Australia
  { playerId: PLAYER_ID, fixtureId: 'm030', homeGoals: 2, awayGoals: 1 }, // Scotland 2-1 Morocco
  { playerId: PLAYER_ID, fixtureId: 'm031', homeGoals: 4, awayGoals: 0 }, // Brazil 4-0 Haiti
  { playerId: PLAYER_ID, fixtureId: 'm032', homeGoals: 2, awayGoals: 2 }, // Turkey 2-2 Paraguay

  { playerId: PLAYER_ID, fixtureId: 'm033', homeGoals: 2, awayGoals: 1 }, // Netherlands 2-1 Sweden
  { playerId: PLAYER_ID, fixtureId: 'm034', homeGoals: 3, awayGoals: 2 }, // Germany 3-2 Ivory Coast
  { playerId: PLAYER_ID, fixtureId: 'm035', homeGoals: 3, awayGoals: 1 }, // Ecuador 3-1 Curaçao
  { playerId: PLAYER_ID, fixtureId: 'm036', homeGoals: 1, awayGoals: 1 }, // Tunisia 1-1 Japan

  { playerId: PLAYER_ID, fixtureId: 'm037', homeGoals: 2, awayGoals: 0 }, // Spain 2-0 Saudi Arabia
  { playerId: PLAYER_ID, fixtureId: 'm038', homeGoals: 3, awayGoals: 0 }, // Belgium 3-0 Iran
  { playerId: PLAYER_ID, fixtureId: 'm039', homeGoals: 1, awayGoals: 0 }, // Uruguay 1-0 Cape Verde
  { playerId: PLAYER_ID, fixtureId: 'm040', homeGoals: 0, awayGoals: 2 }, // New Zealand 0-2 Egypt

  { playerId: PLAYER_ID, fixtureId: 'm041', homeGoals: 2, awayGoals: 1 }, // Argentina 2-1 Austria
  { playerId: PLAYER_ID, fixtureId: 'm042', homeGoals: 4, awayGoals: 0 }, // France 4-0 Iraq
  { playerId: PLAYER_ID, fixtureId: 'm043', homeGoals: 2, awayGoals: 2 }, // Norway 2-2 Senegal
  { playerId: PLAYER_ID, fixtureId: 'm044', homeGoals: 1, awayGoals: 2 }, // Jordan 1-2 Algeria

  { playerId: PLAYER_ID, fixtureId: 'm045', homeGoals: 3, awayGoals: 1 }, // Portugal 3-1 Uzbekistan
  { playerId: PLAYER_ID, fixtureId: 'm046', homeGoals: 3, awayGoals: 1 }, // England 3-1 Ghana
  { playerId: PLAYER_ID, fixtureId: 'm047', homeGoals: 0, awayGoals: 1 }, // Panama 0-1 Croatia
  { playerId: PLAYER_ID, fixtureId: 'm048', homeGoals: 2, awayGoals: 1 }, // Colombia 2-1 DR Congo

  // Matchday 3
  { playerId: PLAYER_ID, fixtureId: 'm049', homeGoals: 1, awayGoals: 1 }, // Switzerland 1-1 Canada
  { playerId: PLAYER_ID, fixtureId: 'm050', homeGoals: 2, awayGoals: 1 }, // Bosnia & Herzegovina 2-1 Qatar
  { playerId: PLAYER_ID, fixtureId: 'm051', homeGoals: 2, awayGoals: 1 }, // Morocco 2-1 Haiti
  { playerId: PLAYER_ID, fixtureId: 'm052', homeGoals: 1, awayGoals: 3 }, // Scotland 1-3 Brazil

  { playerId: PLAYER_ID, fixtureId: 'm053', homeGoals: 0, awayGoals: 0 }, // South Africa 0-0 South Korea
  { playerId: PLAYER_ID, fixtureId: 'm054', homeGoals: 0, awayGoals: 3 }, // Czech Republic 0-3 Mexico
  { playerId: PLAYER_ID, fixtureId: 'm055', homeGoals: 1, awayGoals: 2 }, // Curaçao 1-2 Ivory Coast
  { playerId: PLAYER_ID, fixtureId: 'm056', homeGoals: 2, awayGoals: 3 }, // Ecuador 2-3 Germany

  { playerId: PLAYER_ID, fixtureId: 'm057', homeGoals: 2, awayGoals: 2 }, // Tunisia 2-2 Netherlands
  { playerId: PLAYER_ID, fixtureId: 'm058', homeGoals: 1, awayGoals: 2 }, // Japan 1-2 Sweden
  { playerId: PLAYER_ID, fixtureId: 'm059', homeGoals: 2, awayGoals: 1 }, // Turkey 2-1 United States
  { playerId: PLAYER_ID, fixtureId: 'm060', homeGoals: 0, awayGoals: 1 }, // Paraguay 0-1 Australia

  { playerId: PLAYER_ID, fixtureId: 'm061', homeGoals: 1, awayGoals: 4 }, // Norway 1-4 France
  { playerId: PLAYER_ID, fixtureId: 'm062', homeGoals: 2, awayGoals: 0 }, // Senegal 2-0 Iraq
  { playerId: PLAYER_ID, fixtureId: 'm063', homeGoals: 2, awayGoals: 2 }, // Cape Verde 2-2 Saudi Arabia
  { playerId: PLAYER_ID, fixtureId: 'm064', homeGoals: 2, awayGoals: 4 }, // Uruguay 2-4 Spain

  { playerId: PLAYER_ID, fixtureId: 'm065', homeGoals: 0, awayGoals: 2 }, // New Zealand 0-2 Belgium
  { playerId: PLAYER_ID, fixtureId: 'm066', homeGoals: 3, awayGoals: 2 }, // Egypt 3-2 Iran
  { playerId: PLAYER_ID, fixtureId: 'm067', homeGoals: 0, awayGoals: 2 }, // Panama 0-2 England
  { playerId: PLAYER_ID, fixtureId: 'm068', homeGoals: 2, awayGoals: 2 }, // Croatia 2-2 Ghana

  { playerId: PLAYER_ID, fixtureId: 'm069', homeGoals: 1, awayGoals: 3 }, // Colombia 1-3 Portugal
  { playerId: PLAYER_ID, fixtureId: 'm070', homeGoals: 0, awayGoals: 1 }, // DR Congo 0-1 Uzbekistan
  { playerId: PLAYER_ID, fixtureId: 'm071', homeGoals: 2, awayGoals: 1 }, // Algeria 2-1 Austria
  { playerId: PLAYER_ID, fixtureId: 'm072', homeGoals: 0, awayGoals: 3 }, // Jordan 0-3 Argentina
];

// ─── Tournament Picks ─────────────────────────────────────────────────────────

export const tournamentPicks: TournamentPicks = {
  playerId: PLAYER_ID,
  groups: {
    A: { winner: 'Mexico', runnerUp: 'South Korea' }, // Mexico, South Africa, South Korea, CZ
    B: { winner: 'Switzerland', runnerUp: 'Canada' }, // Canada, Bosnia & Herzegovina, Qatar, CH
    C: { winner: 'Brazil', runnerUp: 'Scotland' }, // Brazil, Morocco, Haiti, GB_SCT
    D: { winner: 'Turkey', runnerUp: 'United States' }, // United States, Paraguay, Australia, TR
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
    'Bosnia & Herzegovina',
    'Senegal',
    'Morocco',
    'Algeria',
    'Ivory Coast',
    'Ghana',
    'Japan',
    'Czech Republic',
  ], // 8 team codes
  roundOf16: [
    'Germany',
    'Argentina',
    'Belgium',
    'Senegal',
    'Spain',
    'England',
    'Scotland',
    'Netherlands',
    'France',
    'Brazil',
    'Colombia',
    'Mexico',
    'Portugal',
    'Ivory Coast',
    'Sweden',
    'United States',
  ], // 16 team codes
  quarterFinalists: [
    'Germany',
    'France',
    'Spain',
    'England',
    'Portugal',
    'Brazil',
    'Argentina',
    'Netherlands',
  ], // 8 team codes
  semiFinalists: ['France', 'England', 'Spain', 'Portugal'], // 4 team codes
  finalists: ['France', 'Portugal'], // 2 team codes
  winner: 'France',
};

// ─── Bonus Predictions ────────────────────────────────────────────────────────

export const bonusPredictions: BonusPredictions = {
  playerId: PLAYER_ID,
  topScorer: 'Harry Kane', // Player name (free text)
  highestScoringTeam: 'France', // Team code — group stage highest scorers
  bestDefence: 'England', // Team code — best group stage defence
  totalYellowCards: 360,
  totalRedCards: 8,
  penaltyShootouts: 5,
};
