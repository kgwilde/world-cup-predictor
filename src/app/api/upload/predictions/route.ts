import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'text/csv',
  'application/csv',
];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

async function verifyToken(idToken: string): Promise<string | null> {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return (data.users?.[0]?.localId as string) ?? null;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const idToken = formData.get('idToken') as string | null;

    if (!file || !idToken) {
      return NextResponse.json({ error: 'Missing file or token' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['xlsx', 'csv'].includes(ext)) {
      return NextResponse.json({ error: 'Only .xlsx and .csv files are accepted' }, { status: 400 });
    }

    const typeOk = ALLOWED_TYPES.includes(file.type) || ext === 'xlsx' || ext === 'csv';
    if (!typeOk) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 400 });
    }

    const uid = await verifyToken(idToken);
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const blob = await put(`predictions/${uid}/predictions.${ext}`, file, {
      access: 'private',
      contentType: file.type,
      addRandomSuffix: false,
    });

    return NextResponse.json({ url: blob.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
