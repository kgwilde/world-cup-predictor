import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';

import { fixtures } from '@/data/fixtures';
import { getAdminDb } from '@/lib/firebase-admin';
import { Fixture, GoalEvent } from '@/lib/types';

const MATCH_DURATION_MS = 150 * 60 * 1000;

function getLiveMatches(): Fixture[] {
  const now = Date.now();
  return fixtures.filter((f) => {
    const kickoff = new Date(f.kickoff).getTime();
    return now >= kickoff && now < kickoff + MATCH_DURATION_MS;
  });
}

const TEAM_NAME_ALIASES: Record<string, string> = {
  'Korea Republic': 'South Korea',
  'Bosnia and Herzegovina': 'Bosnia & Herzegovina',
  'Bosnia-Herzegovina': 'Bosnia & Herzegovina',
  "Côte d'Ivoire": 'Ivory Coast',
  "Cote d'Ivoire": 'Ivory Coast',
  Türkiye: 'Turkey',
  'Congo DR': 'DR Congo',
  'Democratic Republic of Congo': 'DR Congo',
  'Cape Verde Islands': 'Cape Verde',
  'Cabo Verde': 'Cape Verde',
  Curacao: 'Curaçao',
  USA: 'United States',
  Czechia: 'Czech Republic',
};

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
  // Round of 32
  ['South Africa:Canada', 'm073'],
  ['Germany:Paraguay', 'm074'],
  ['Netherlands:Morocco', 'm075'],
  ['Brazil:Japan', 'm076'],
  ['France:Sweden', 'm077'],
  ['Ivory Coast:Norway', 'm078'],
  ['Mexico:Ecuador', 'm079'],
  ['England:DR Congo', 'm080'],
  ['United States:Bosnia & Herzegovina', 'm081'],
  ['Belgium:Senegal', 'm082'],
  ['Portugal:Croatia', 'm083'],
  ['Spain:Austria', 'm084'],
  ['Switzerland:Algeria', 'm085'],
  ['Argentina:Cape Verde', 'm086'],
  ['Colombia:Ghana', 'm087'],
  ['Australia:Egypt', 'm088'],
]);

const API_STATUS_MAP: Record<string, string> = {
  FINISHED: 'final',
  IN_PLAY: 'live',
  PAUSED: 'half_time',
};

function normalizeTeamName(name: string): string {
  return TEAM_NAME_ALIASES[name] ?? name;
}

export async function GET(request: Request) {
  const syncSecret = request.headers.get('x-sync-secret');
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  const isLegacyCron = syncSecret === process.env.SYNC_SECRET;
  const isVercelCron = bearerToken !== null && bearerToken === process.env.CRON_SECRET;

  if (!isLegacyCron && !isVercelCron) {
    // Fall back to Firebase ID token for client-side calls
    if (!bearerToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Ensures Admin SDK is initialised before getAuth()
    getAdminDb();
    try {
      await getAuth().verifyIdToken(bearerToken);
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'FOOTBALL_DATA_API_KEY not set' }, { status: 500 });
  }

  const db = getAdminDb();
  const summaryRef = db.collection('results').doc('all');
  const summarySnap = await summaryRef.get();
  const existing = (summarySnap.exists ? (summarySnap.data() ?? {}) : {}) as Record<
    string,
    { status?: string; goals?: unknown[]; homeGoals?: number; awayGoals?: number }
  > & { lastSyncedAt?: FirebaseFirestore.Timestamp };

  const hasStuckLiveMatch = Object.values(existing).some(
    (r): r is { status?: string } =>
      typeof r === 'object' &&
      r !== null &&
      'status' in r &&
      (r.status === 'live' || r.status === 'half_time' || r.status === 'extra_time' || r.status === 'penalties'),
  );

  const hasFinalMatchWithoutGoals = Object.values(existing).some(
    (r): r is { status?: string; goals?: unknown[] } =>
      typeof r === 'object' &&
      r !== null &&
      'status' in r &&
      r.status === 'final' &&
      !Array.isArray(r.goals),
  );

  if (getLiveMatches().length === 0 && !hasStuckLiveMatch && !hasFinalMatchWithoutGoals) {
    return NextResponse.json({ written: 0, skipped: 0, warnings: [], noLiveMatches: true });
  }

  // Server-side cooldown guard — prevents multiple clients racing to call the
  // external API in the same 15s window.
  const lastSyncedAt = existing.lastSyncedAt?.toDate();
  if (lastSyncedAt && Date.now() - lastSyncedAt.getTime() < 15_000) {
    return NextResponse.json({ written: 0, skipped: 0, warnings: [], recentlySynced: true });
  }

  // Claim this sync window before hitting the external API so concurrent
  // requests bail out on the check above.
  await summaryRef.set({ lastSyncedAt: new Date() }, { merge: true });

  const competitionId = 'WC';
  const res = await fetch(
    `https://api.football-data.org/v4/competitions/${competitionId}/matches`,
    { headers: { 'X-Auth-Token': apiKey, 'X-Api-Version': 'v4.1' } },
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: `football-data.org returned ${res.status}` },
      { status: 502 },
    );
  }

  const { matches } = await res.json();

  let written = 0;
  let skipped = 0;
  const warnings: string[] = [];
  const updates: Record<string, object> = {};

  for (const match of matches) {
    const { status, homeTeam, awayTeam, score, minute, injuryTime, goals: apiGoals } = match;

    if (!['FINISHED', 'IN_PLAY', 'PAUSED', 'PENALTY_SHOOTOUT'].includes(status)) {
      skipped++;
      continue;
    }

    const isLive = status === 'IN_PLAY' || status === 'PAUSED' || status === 'PENALTY_SHOOTOUT';
    // score.fullTime is cumulative (regular + ET + pens). Use score.regularTime for the
    // 90-min result, which is what predictions are scored against. regularTime is only
    // populated by the API for matches that went beyond 90 minutes.
    const homeGoals = score.regularTime?.home ?? score.fullTime?.home ?? score.halfTime?.home ?? (isLive ? 0 : null);
    const awayGoals = score.regularTime?.away ?? score.fullTime?.away ?? score.halfTime?.away ?? (isLive ? 0 : null);

    if (homeGoals === null || homeGoals === undefined || awayGoals === null || awayGoals === undefined) {
      skipped++;
      continue;
    }

    const normHome = normalizeTeamName(homeTeam.name);
    const normAway = normalizeTeamName(awayTeam.name);
    const fixtureId = FIXTURE_LOOKUP.get(`${normHome}:${normAway}`);

    if (!fixtureId) {
      warnings.push(`No fixture found for: ${normHome} vs ${normAway}`);
      skipped++;
      continue;
    }

    const isPenalties = status === 'PENALTY_SHOOTOUT';
    // Matches in extra time (minute > 90 while still IN_PLAY or PAUSED for ET half-time).
    const isExtraTime = !isPenalties && (status === 'IN_PLAY' || status === 'PAUSED') && minute != null && minute > 90;
    const matchStatus = isPenalties ? 'penalties' : isExtraTime ? 'extra_time' : API_STATUS_MAP[status];

    // Skip if already recorded as final with goals — score and goals won't change.
    if (matchStatus === 'final' && existing[fixtureId]?.status === 'final' && Array.isArray(existing[fixtureId]?.goals)) {
      skipped++;
      continue;
    }

    // Only derive duration/AET data for finished matches — score.duration may not be set during live play.
    const duration = status === 'FINISHED' ? (score.duration as 'REGULAR' | 'EXTRA_TIME' | 'PENALTY_SHOOTOUT' | undefined) : undefined;
    const aetHomeGoals = duration === 'EXTRA_TIME' ? score.fullTime?.home : undefined;
    const aetAwayGoals = duration === 'EXTRA_TIME' ? score.fullTime?.away : undefined;
    // Pen score: populated for finished PEN matches; the API may also return a partial tally during live PENALTY_SHOOTOUT.
    const penHomeGoals = (duration === 'PENALTY_SHOOTOUT' || isPenalties) ? (score.penalties?.home ?? undefined) : undefined;
    const penAwayGoals = (duration === 'PENALTY_SHOOTOUT' || isPenalties) ? (score.penalties?.away ?? undefined) : undefined;

    if (apiGoals !== undefined) {
      console.log(`sync-scores goals [${fixtureId}]:`, JSON.stringify(apiGoals));
    }

    const goals: GoalEvent[] = Array.isArray(apiGoals)
      ? apiGoals
          .filter((g: { minute?: number; scorer?: { shortName?: string } }) => g.minute != null && g.scorer != null)
          .map((g: {
            minute: number;
            injuryTime?: number;
            type: string;
            team: { name: string };
            scorer: { shortName?: string; name: string };
            assist?: { shortName?: string; name: string } | null;
          }) => {
            const normGoalTeam = normalizeTeamName(g.team.name);
            // For OWN goals, the API reports the team that scored into their own net —
            // so the goal benefits the OTHER side.
            let side: 'home' | 'away';
            if (g.type === 'OWN') {
              side = normGoalTeam === normHome ? 'away' : 'home';
            } else {
              side = normGoalTeam === normHome ? 'home' : 'away';
            }
            const event: GoalEvent = {
              minute: g.minute,
              type: (g.type === 'OWN' || g.type === 'PENALTY') ? g.type : 'NORMAL',
              scorer: g.scorer.shortName ?? g.scorer.name,
              side,
            };
            if (g.injuryTime != null) event.injuryTime = g.injuryTime;
            if (g.assist?.shortName || g.assist?.name) {
              event.assist = g.assist.shortName ?? g.assist.name;
            }
            return event;
          })
      : [];

    // Once a match enters ET or penalties the 90-min score is settled — lock it on first detection
    // and only update the minute/pen tally on subsequent syncs.
    const scoreIsLocked =
      existing[fixtureId]?.status === 'extra_time' || existing[fixtureId]?.status === 'penalties';
    const needsScoreLock = matchStatus === 'extra_time' || matchStatus === 'penalties';

    if (needsScoreLock && scoreIsLocked) {
      updates[fixtureId] = {
        fixtureId,
        homeGoals: existing[fixtureId]!.homeGoals ?? homeGoals,
        awayGoals: existing[fixtureId]!.awayGoals ?? awayGoals,
        status: matchStatus,
        ...(minute != null ? { minute } : {}),
        ...(injuryTime != null ? { injuryTime } : {}),
        ...(penHomeGoals != null ? { penHomeGoals } : {}),
        ...(penAwayGoals != null ? { penAwayGoals } : {}),
        goals,
      };
    } else {
      updates[fixtureId] = {
        fixtureId,
        homeGoals,
        awayGoals,
        status: matchStatus,
        ...(minute != null ? { minute } : {}),
        ...(injuryTime != null ? { injuryTime } : {}),
        ...(duration ? { duration } : {}),
        ...(aetHomeGoals != null ? { aetHomeGoals } : {}),
        ...(aetAwayGoals != null ? { aetAwayGoals } : {}),
        ...(penHomeGoals != null ? { penHomeGoals } : {}),
        ...(penAwayGoals != null ? { penAwayGoals } : {}),
        goals,
      };
    }
    written++;
  }

  if (Object.keys(updates).length > 0) {
    await summaryRef.set(updates, { merge: true });
  }

  console.log(`sync-scores: written=${written} skipped=${skipped} warnings=${warnings.length}`);
  if (warnings.length) console.warn('sync-scores warnings:', warnings);

  return NextResponse.json({ written, skipped, warnings });
}
