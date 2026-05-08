import { NextRequest, NextResponse } from 'next/server';

import { firestorePatch, verifyAdminToken } from '@/lib/admin';

export async function POST(request: NextRequest) {
  try {
    const { idToken, targetUid } = await request.json();

    if (!idToken || !targetUid) {
      return NextResponse.json({ error: 'Missing idToken or targetUid' }, { status: 400 });
    }

    const uid = await verifyAdminToken(idToken);
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await firestorePatch(`users/${targetUid}`, { approved: true }, idToken, ['approved']);

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Request failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
