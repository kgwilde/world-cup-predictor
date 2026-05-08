import { NextRequest, NextResponse } from 'next/server';

import { firestorePatch, verifyAdminToken } from '@/lib/admin';

export async function POST(request: NextRequest) {
  try {
    const { idToken, fixtureId, homeGoals, awayGoals } = await request.json();

    if (!idToken || !fixtureId || homeGoals === undefined || awayGoals === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const uid = await verifyAdminToken(idToken);
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await firestorePatch(`results/${fixtureId}`, { fixtureId, homeGoals, awayGoals }, idToken);

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Request failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
