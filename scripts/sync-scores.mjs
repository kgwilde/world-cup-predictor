/**
 * Fetches World Cup match scores from football-data.org and writes them to Firestore.
 * Run via GitHub Actions on a cron schedule, or manually via workflow_dispatch.
 *
 * Required env vars:
 *   FOOTBALL_DATA_API_KEY     — api.football-data.org API key
 *   FIREBASE_PROJECT_ID       — Firebase project ID
 *   FIREBASE_SERVICE_ACCOUNT  — Firebase service account JSON (stringified)
 */

import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// ─── Config ──────────────────────────────────────────────────────────────────

const COMPETITION_ID = process.env.FOOTBALL_DATA_COMPETITION_ID ?? 'WC';
const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!API_KEY || !PROJECT_ID || !SERVICE_ACCOUNT) {
  console.error('Missing required env vars: FOOTBALL_DATA_API_KEY, FIREBASE_PROJECT_ID, FIREBASE_SERVICE_ACCOUNT');
  process.exit(1);
}

// ─── Team name normalisation ──────────────────────────────────────────────────
// Maps football-data.org team names → names used in our fixture lookup below.

const TEAM_NAME_ALIASES = {
  'Korea Republic': 'South Korea',
  'Bosnia and Herzegovina': 'Bosnia & Herzegovina',
  "Côte d'Ivoire": 'Ivory Coast',
  "Cote d'Ivoire": 'Ivory Coast',
  'Türkiye': 'Turkey',
  'Congo DR': 'DR Congo',
  'Democratic Republic of Congo': 'DR Congo',
  'Cape Verde Islands': 'Cape Verde',
  'Cabo Verde': 'Cape Verde',
  'Curacao': 'Curaçao',
  'USA': 'United States',
  'Czechia': 'Czech Republic',
};

function normalizeTeamName(name) {
  return TEAM_NAME_ALIASES[name] ?? name;
}

// ─── Fixture lookup ───────────────────────────────────────────────────────────
// Key: "HomeTeam:AwayTeam" (normalised), Value: our fixture ID.
// Covers group stage only (m001–m072). Knockout teams are TBD until drawn.

const FIXTURE_LOOKUP = new Map([
  // Group A
  ['Mexico:South Africa', 'm001'],
  ['South Korea:Czech Republic', 'm002'],
  ['Czech Republic:South Africa', 'm025'],
  ['Mexico:South Korea', 'm028'],
  ['South Africa:South Korea', 'm053'],
  ['Czech Republic:Mexico', 'm054'],
  // Group B
  ['Canada:Bosnia & Herzegovina', 'm003'],
  ['Qatar:Switzerland', 'm005'],
  ['Switzerland:Bosnia & Herzegovina', 'm026'],
  ['Canada:Qatar', 'm027'],
  ['Switzerland:Canada', 'm049'],
  ['Bosnia & Herzegovina:Qatar', 'm050'],
  // Group C
  ['Brazil:Morocco', 'm006'],
  ['Haiti:Scotland', 'm007'],
  ['Scotland:Morocco', 'm030'],
  ['Brazil:Haiti', 'm031'],
  ['Morocco:Haiti', 'm051'],
  ['Scotland:Brazil', 'm052'],
  // Group D
  ['United States:Paraguay', 'm004'],
  ['Australia:Turkey', 'm008'],
  ['United States:Australia', 'm029'],
  ['Turkey:Paraguay', 'm032'],
  ['Turkey:United States', 'm059'],
  ['Paraguay:Australia', 'm060'],
  // Group E
  ['Germany:Curaçao', 'm009'],
  ['Ivory Coast:Ecuador', 'm011'],
  ['Germany:Ivory Coast', 'm034'],
  ['Ecuador:Curaçao', 'm035'],
  ['Curaçao:Ivory Coast', 'm055'],
  ['Ecuador:Germany', 'm056'],
  // Group F
  ['Netherlands:Japan', 'm010'],
  ['Sweden:Tunisia', 'm012'],
  ['Netherlands:Sweden', 'm033'],
  ['Tunisia:Japan', 'm036'],
  ['Tunisia:Netherlands', 'm057'],
  ['Japan:Sweden', 'm058'],
  // Group G
  ['Belgium:Egypt', 'm014'],
  ['Iran:New Zealand', 'm016'],
  ['Belgium:Iran', 'm038'],
  ['New Zealand:Egypt', 'm040'],
  ['New Zealand:Belgium', 'm065'],
  ['Egypt:Iran', 'm066'],
  // Group H
  ['Spain:Cape Verde', 'm013'],
  ['Saudi Arabia:Uruguay', 'm015'],
  ['Spain:Saudi Arabia', 'm037'],
  ['Uruguay:Cape Verde', 'm039'],
  ['Cape Verde:Saudi Arabia', 'm063'],
  ['Uruguay:Spain', 'm064'],
  // Group I
  ['France:Senegal', 'm017'],
  ['Iraq:Norway', 'm018'],
  ['France:Iraq', 'm042'],
  ['Norway:Senegal', 'm043'],
  ['Norway:France', 'm061'],
  ['Senegal:Iraq', 'm062'],
  // Group J
  ['Argentina:Algeria', 'm019'],
  ['Austria:Jordan', 'm020'],
  ['Argentina:Austria', 'm041'],
  ['Jordan:Algeria', 'm044'],
  ['Algeria:Austria', 'm071'],
  ['Jordan:Argentina', 'm072'],
  // Group K
  ['Portugal:DR Congo', 'm021'],
  ['Uzbekistan:Colombia', 'm024'],
  ['Portugal:Uzbekistan', 'm045'],
  ['Colombia:DR Congo', 'm048'],
  ['Colombia:Portugal', 'm069'],
  ['DR Congo:Uzbekistan', 'm070'],
  // Group L
  ['England:Croatia', 'm022'],
  ['Ghana:Panama', 'm023'],
  ['England:Ghana', 'm046'],
  ['Panama:Croatia', 'm047'],
  ['Panama:England', 'm067'],
  ['Croatia:Ghana', 'm068'],
]);

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Init Firestore
  const serviceAccount = JSON.parse(SERVICE_ACCOUNT);
  initializeApp({ credential: cert(serviceAccount), projectId: PROJECT_ID });
  const db = getFirestore();

  // Fetch matches from football-data.org
  const res = await fetch(`https://api.football-data.org/v4/competitions/${COMPETITION_ID}/matches`, {
    headers: { 'X-Auth-Token': API_KEY },
  });

  if (!res.ok) {
    console.error(`football-data.org returned ${res.status}: ${await res.text()}`);
    process.exit(1);
  }

  const { matches } = await res.json();
  console.log(`Fetched ${matches.length} matches for competition ${COMPETITION_ID}`);

  let written = 0;
  let skipped = 0;

  for (const match of matches) {
    const { status, homeTeam, awayTeam, score } = match;

    // Only sync matches that have a score
    if (!['FINISHED', 'IN_PLAY', 'PAUSED'].includes(status)) {
      skipped++;
      continue;
    }

    const homeGoals = score.fullTime?.home;
    const awayGoals = score.fullTime?.away;

    if (homeGoals === null || homeGoals === undefined || awayGoals === null || awayGoals === undefined) {
      skipped++;
      continue;
    }

    const normHome = normalizeTeamName(homeTeam.name);
    const normAway = normalizeTeamName(awayTeam.name);
    const fixtureId = FIXTURE_LOOKUP.get(`${normHome}:${normAway}`);

    if (!fixtureId) {
      console.warn(`No fixture found for: ${normHome} vs ${normAway}`);
      skipped++;
      continue;
    }

    const matchStatus = status === 'FINISHED' ? 'final' : 'live';

    await db.collection('results').doc(fixtureId).set({
      fixtureId,
      homeGoals,
      awayGoals,
      status: matchStatus,
    });

    console.log(`  ✓ ${fixtureId}: ${normHome} ${homeGoals}–${awayGoals} ${normAway} (${matchStatus})`);
    written++;
  }

  console.log(`Done. Written: ${written}, Skipped: ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
