import { collection, deleteDoc, doc, getDoc, getDocsFromServer, query, setDoc, updateDoc, where } from 'firebase/firestore';

import { db } from './firebase';
import type { MatchResult, MultiChip, PublicProfile, UserProfile } from './types';

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
  const snap = await getDocsFromServer(collection(db, 'results'));
  return snap.docs.map((d) => d.data() as MatchResult);
}

export async function getAllMultiChips(): Promise<MultiChip[]> {
  const snap = await getDocsFromServer(collection(db, 'multiChips'));
  return snap.docs.map((d) => d.data() as MultiChip);
}

export async function applyMultiChip(uid: string, fixtureId: string): Promise<void> {
  await setDoc(doc(db, 'multiChips', `${uid}_${fixtureId}`), {
    playerId: uid,
    fixtureId,
    appliedAt: new Date().toISOString(),
  });
}

export async function removeMultiChip(uid: string, fixtureId: string): Promise<void> {
  await deleteDoc(doc(db, 'multiChips', `${uid}_${fixtureId}`));
}
