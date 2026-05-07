import { NextRequest, NextResponse } from 'next/server';

// Proxy private Vercel Blob files server-side using BLOB_READ_WRITE_TOKEN.
// Only allows URLs belonging to this Vercel Blob store.
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  const asDownload = request.nextUrl.searchParams.has('download');

  if (!url) {
    return NextResponse.json({ error: 'Missing url param' }, { status: 400 });
  }

  if (!url.startsWith('https://') || !url.includes('.blob.vercel-storage.com/')) {
    return NextResponse.json({ error: 'Invalid blob URL' }, { status: 400 });
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
    },
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Blob not found' }, { status: res.status });
  }

  const contentType = res.headers.get('content-type') ?? 'application/octet-stream';
  const buffer = await res.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=3600',
      ...(asDownload ? { 'Content-Disposition': 'attachment' } : {}),
    },
  });
}
