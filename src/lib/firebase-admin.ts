import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { MatchResult } from './types';

export function getAdminDb() {
  if (!getApps().length) {
    initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!)),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }
  return getFirestore();
}

export async function getResultsAdmin(): Promise<MatchResult[]> {
  const snap = await getAdminDb().collection('results').doc('all').get();
  if (!snap.exists) return [];
  return Object.values(snap.data() ?? {}).filter(
    (v): v is MatchResult => typeof v === 'object' && v !== null && 'fixtureId' in v,
  );
}
