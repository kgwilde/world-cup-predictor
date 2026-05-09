'use client';

import { onAuthStateChanged, signOut as firebaseSignOut, type User } from 'firebase/auth';
import { create } from 'zustand';

import { auth } from '@/lib/firebase';
import { createUserProfile, getAllUsers, getResults, getUserProfile } from '@/lib/firestore';
import type { MatchResult, PublicProfile, UserProfile } from '@/lib/types';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  allUsers: PublicProfile[];
  usersLoading: boolean;
  results: MatchResult[];
  resultsLoading: boolean;
  init: () => () => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// Module-level guards so we only ever fire one request per session
let allUsersFetchPromise: Promise<void> | null = null;
let resultsFetchPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  allUsers: [],
  usersLoading: true,
  results: [],
  resultsLoading: true,

  init: () => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Always mark loading at the start so consumers don't render with stale profile
      set({ loading: true });
      if (user) {
        let profile = await getUserProfile(user.uid);
        if (!profile) {
          profile = {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            avatarUrl: user.photoURL,
            avatarUpdatedAt: null,
            teamName: null,
            predictionFileUrl: null,
            predictionUploadedAt: null,
            approved: false,
          };
          await createUserProfile(profile);
        }
        set({ user, profile, loading: false });
      } else {
        set({ user: null, profile: null, loading: false });
      }

      // Fetch approved players once per session — shared by Leaderboard and Predictions
      if (!allUsersFetchPromise) {
        allUsersFetchPromise = getAllUsers()
          .then((users) => set({ allUsers: users, usersLoading: false }))
          .catch(() => set({ usersLoading: false }));
      }

      // Fetch match results once per session
      if (!resultsFetchPromise) {
        resultsFetchPromise = getResults()
          .then((results) => set({ results, resultsLoading: false }))
          .catch(() => set({ resultsLoading: false }));
      }
    });
    return unsubscribe;
  },

  signOut: async () => {
    await firebaseSignOut(auth);
    set({ user: null, profile: null });
  },

  refreshProfile: async () => {
    const { user } = get();
    if (!user) return;
    const profile = await getUserProfile(user.uid);
    if (!profile) return;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { email: _email, ...publicProfile } = profile;
    set((state) => ({
      profile,
      allUsers: state.allUsers.map((u) => (u.uid === profile.uid ? publicProfile : u)),
    }));
  },
}));
