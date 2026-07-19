import { NextRequest, NextResponse } from 'next/server';

import { verifyAdminToken } from '@/lib/admin';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { idToken, finalized } = await request.json();

    if (!idToken || typeof finalized !== 'boolean') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const uid = verifyAdminToken(idToken);
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getAdminDb();
    await db
      .collection('meta')
      .doc('tournament')
      .set(
        { finalized, finalizedAt: finalized ? new Date().toISOString() : null },
        { merge: true },
      );

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Request failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
