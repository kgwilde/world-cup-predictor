import { arrayRemove, arrayUnion, collection, doc, getDoc, getDocsFromServer, onSnapshot, query, setDoc, updateDoc, where } from 'firebase/firestore';

import { db } from './firebase';
import type { MatchResult, PublicProfile, SpecialEvent, SpecialEventType, SpecialOutcomes, UserProfile } from './types';

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function createUserProfile(profile: UserProfile): Promise<void> {
  await setDoc(doc(db, 'users', profile.uid), profile);
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  await updateDoc(doc(db, 'users', uid), data as Record<string, unknown>);
}

export async function getAllUsers(): Promise<PublicProfile[]> {
  const q = query(collection(db, 'users'), where('approved', '==', true));
  const snap = await getDocsFromServer(q);
  return snap.docs.map((d) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { email: _email, ...pub } = d.data() as UserProfile;
    return pub;
  });
}

export async function getAllUsersAdmin(): Promise<UserProfile[]> {
  const snap = await getDocsFromServer(collection(db, 'users'));
  return snap.docs.map((d) => d.data() as UserProfile);
}

export async function getResults(): Promise<MatchResult[]> {
  const snap = await getDoc(doc(db, 'results', 'all'));
  if (!snap.exists()) return [];
  return Object.values(snap.data() as Record<string, unknown>).filter(
    (v): v is MatchResult => typeof v === 'object' && v !== null && 'fixtureId' in v,
  );
}

function parseResultsDoc(data: Record<string, unknown>): {
  results: MatchResult[];
  lastSyncedAt: Date | null;
} {
  const results = Object.values(data).filter(
    (v): v is MatchResult => typeof v === 'object' && v !== null && 'fixtureId' in v,
  );
  const raw = data['lastSyncedAt'];
  const lastSyncedAt =
    raw != null && typeof raw === 'object' && 'toDate' in raw
      ? (raw as { toDate: () => Date }).toDate()
      : null;
  return { results, lastSyncedAt };
}

export function subscribeToResults(
  onUpdate: (results: MatchResult[], lastSyncedAt: Date | null) => void,
  onError?: () => void,
): () => void {
  return onSnapshot(
    doc(db, 'results', 'all'),
    (snap) => {
      if (snap.exists()) {
        const { results, lastSyncedAt } = parseResultsDoc(snap.data() as Record<string, unknown>);
        onUpdate(results, lastSyncedAt);
      } else {
        onUpdate([], null);
      }
    },
    () => onError?.(),
  );
}

export async function getSpecialOutcomes(): Promise<SpecialOutcomes | null> {
  const snap = await getDoc(doc(db, 'specials', 'outcomes'));
  return snap.exists() ? (snap.data() as SpecialOutcomes) : null;
}

export function subscribeToSpecialOutcomes(
  onUpdate: (outcomes: SpecialOutcomes | null) => void,
): () => void {
  return onSnapshot(
    doc(db, 'specials', 'outcomes'),
    (snap) => onUpdate(snap.exists() ? (snap.data() as SpecialOutcomes) : null),
  );
}

export async function getSpecialEvents(): Promise<SpecialEvent[]> {
  const snap = await getDoc(doc(db, 'specials', 'events'));
  if (!snap.exists()) return [];
  return Object.values(snap.data() as Record<SpecialEventType, SpecialEvent>);
}

export function subscribeToSpecialEvents(
  onUpdate: (events: SpecialEvent[]) => void,
  onError?: () => void,
): () => void {
  return onSnapshot(
    doc(db, 'specials', 'events'),
    (snap) => {
      if (snap.exists()) {
        onUpdate(Object.values(snap.data() as Record<SpecialEventType, SpecialEvent>));
      } else {
        onUpdate([]);
      }
    },
    () => onError?.(),
  );
}

export async function applyMultiChip(uid: string, fixtureId: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { multiChips: arrayUnion(fixtureId) });
}

export async function removeMultiChip(uid: string, fixtureId: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { multiChips: arrayRemove(fixtureId) });
}

export async function saveKnockoutPrediction(
  uid: string,
  fixtureId: string,
  homeGoals: number,
  awayGoals: number,
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    [`knockoutPredictions.${fixtureId}`]: { homeGoals, awayGoals },
  });
}
