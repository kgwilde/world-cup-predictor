import { collection, doc, getDoc, getDocsFromServer, query, setDoc, updateDoc, where } from 'firebase/firestore';

import { db } from './firebase';
import type { UserProfile } from './types';

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

export async function getAllUsers(): Promise<UserProfile[]> {
  const q = query(collection(db, 'users'), where('approved', '==', true));
  const snap = await getDocsFromServer(q);
  return snap.docs.map((d) => d.data() as UserProfile);
}
