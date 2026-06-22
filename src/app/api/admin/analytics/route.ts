import { NextRequest, NextResponse } from 'next/server';

import { verifyAdminToken } from '@/lib/admin';
import { getAdminDb } from '@/lib/firebase-admin';
import type { MatchResult } from '@/lib/types';

export async function POST(request: NextRequest) {
  const { idToken } = await request.json();
  if (!verifyAdminToken(idToken)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getAdminDb();
  const resultsSnap = await db.collection('results').doc('all').get();
  const resultsData = (resultsSnap.exists ? (resultsSnap.data() ?? {}) : {}) as Record<
    string,
    unknown
  >;

  const rawSyncedAt = resultsData['lastSyncedAt'];
  const lastSyncedAt =
    rawSyncedAt != null && typeof rawSyncedAt === 'object' && 'toDate' in rawSyncedAt
      ? (rawSyncedAt as { toDate: () => Date }).toDate().toISOString()
      : null;

  const liveResults = Object.values(resultsData).filter(
    (v): v is MatchResult =>
      typeof v === 'object' &&
      v !== null &&
      'fixtureId' in v &&
      ['live', 'half_time'].includes((v as { status?: string }).status ?? ''),
  );

  return NextResponse.json({ sync: { lastSyncedAt, liveResults } });
}
