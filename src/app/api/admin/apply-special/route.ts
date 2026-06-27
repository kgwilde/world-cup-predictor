import { NextRequest, NextResponse } from 'next/server';

import { verifyAdminToken } from '@/lib/admin';
import { getAdminDb } from '@/lib/firebase-admin';
import { scoreSpecialEvent, SPECIAL_EVENT_LABELS } from '@/lib/scoring-specials';
import { allTournamentPicks, allBonusPredictions } from '@/data/entries';
import type { SpecialEvent, SpecialEventType, SpecialOutcomes } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken, eventType, outcomes } = body as {
      idToken: string;
      eventType: SpecialEventType;
      outcomes: SpecialOutcomes;
    };

    if (!idToken || !eventType || !outcomes) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const uid = verifyAdminToken(idToken);
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const playerPoints: Record<string, number> = {};
    for (const picks of allTournamentPicks) {
      const bonus = allBonusPredictions.find((b) => b.playerId === picks.playerId) ?? null;
      playerPoints[picks.playerId] = scoreSpecialEvent(eventType, picks, bonus, outcomes);
    }

    const event: SpecialEvent = {
      id: eventType,
      label: SPECIAL_EVENT_LABELS[eventType],
      appliedAt: new Date().toISOString(),
      playerPoints,
    };

    const db = getAdminDb();
    await Promise.all([
      db.collection('specials').doc('outcomes').set(outcomes, { merge: true }),
      db.collection('specials').doc('events').set({ [eventType]: event }, { merge: true }),
    ]);

    return NextResponse.json({ ok: true, event });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Request failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
