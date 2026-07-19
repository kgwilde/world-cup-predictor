'use client';

import { onAuthStateChanged, signOut as firebaseSignOut, type User } from 'firebase/auth';
import { create } from 'zustand';

import { auth } from '@/lib/firebase';
import { applyMultiChip, createUserProfile, getAllUsers, getUserProfile, removeMultiChip, saveKnockoutPrediction as saveKnockoutPredictionToFirestore, subscribeToResults, subscribeToSpecialEvents, subscribeToSpecialOutcomes, subscribeToTournamentStatus } from '@/lib/firestore';
import { preloadedAvatarUrls, resolveAvatarSrc } from '@/lib/avatar';
import type { MatchResult, PublicProfile, SpecialEvent, SpecialOutcomes, TournamentStatus, UserProfile } from '@/lib/types';

function preloadAvatars(users: PublicProfile[]): Promise<void> {
  const urls = users
    .map((u) => resolveAvatarSrc(u.avatarUrl, u.avatarUpdatedAt))
    .filter((url): url is string => !!url);
  return Promise.all(
    urls.map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            preloadedAvatarUrls.add(url);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = url;
        }),
    ),
  ).then(() => undefined);
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  profileError: boolean;
  allUsers: PublicProfile[];
  usersLoading: boolean;
  results: MatchResult[];
  resultsLoading: boolean;
  lastSyncedAt: Date | null;
  specialEvents: SpecialEvent[];
  specialEventsLoading: boolean;
  specialOutcomes: SpecialOutcomes | null;
  tournamentFinalized: boolean;
  tournamentFinalizedAt: string | null;
  init: () => () => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  applyChip: (uid: string, fixtureId: string) => Promise<void>;
  removeChip: (uid: string, fixtureId: string) => Promise<void>;
  saveKnockoutPrediction: (uid: string, fixtureId: string, homeGoals: number, awayGoals: number) => Promise<void>;
}

// Module-level guards so we only ever fire one request per session
let allUsersFetchPromise: Promise<void> | null = null;
let resultsUnsubscribe: (() => void) | null = null;
let specialEventsUnsubscribe: (() => void) | null = null;
let specialOutcomesUnsubscribe: (() => void) | null = null;
let tournamentStatusUnsubscribe: (() => void) | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  profileError: false,
  allUsers: [],
  usersLoading: true,
  results: [],
  resultsLoading: true,
  lastSyncedAt: null,
  specialEvents: [],
  specialEventsLoading: true,
  specialOutcomes: null,
  tournamentFinalized: false,
  tournamentFinalizedAt: null,

  init: () => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Always mark loading at the start so consumers don't render with stale profile
      set({ loading: true, profileError: false });
      if (user) {
        try {
          // Ensure the auth token is flushed to Firestore before any write —
          // onAuthStateChanged can fire before the SDK propagates the token internally.
          await user.getIdToken();
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
              predictionFileName: null,
              predictionUploadedAt: null,
              approved: false,
            };
            await createUserProfile(profile);
          }
          set({ user, profile, loading: false });
        } catch {
          set({ user, profile: null, loading: false, profileError: true });
        }
      } else {
        set({ user: null, profile: null, loading: false });
      }

      // Fetch approved players once per session — shared by Leaderboard and Predictions.
      // Preload avatars before clearing usersLoading so the skeleton stays up until images are cached.
      if (!allUsersFetchPromise) {
        allUsersFetchPromise = getAllUsers()
          .then(async (users) => {
            await preloadAvatars(users);
            set({ allUsers: users, usersLoading: false });
          })
          .catch(() => set({ usersLoading: false }));
      }

      // Subscribe to live result updates — fires immediately with current data,
      // then again whenever any client writes a new score to Firestore.
      if (!resultsUnsubscribe) {
        resultsUnsubscribe = subscribeToResults(
          (results, lastSyncedAt) => set({ results, lastSyncedAt, resultsLoading: false }),
          () => set({ resultsLoading: false }),
        );
      }

      if (!specialEventsUnsubscribe) {
        specialEventsUnsubscribe = subscribeToSpecialEvents(
          (specialEvents) => set({ specialEvents, specialEventsLoading: false }),
          () => set({ specialEventsLoading: false }),
        );
      }

      if (!specialOutcomesUnsubscribe) {
        specialOutcomesUnsubscribe = subscribeToSpecialOutcomes(
          (specialOutcomes) => set({ specialOutcomes }),
        );
      }

      if (!tournamentStatusUnsubscribe) {
        tournamentStatusUnsubscribe = subscribeToTournamentStatus(
          (status: TournamentStatus) =>
            set({ tournamentFinalized: status.finalized, tournamentFinalizedAt: status.finalizedAt }),
        );
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

  applyChip: async (uid: string, fixtureId: string) => {
    set((state) => ({
      allUsers: state.allUsers.map((u) =>
        u.uid === uid
          ? { ...u, multiChips: [...new Set([...(u.multiChips ?? []), fixtureId])] }
          : u,
      ),
    }));
    try {
      await applyMultiChip(uid, fixtureId);
    } catch {
      set((state) => ({
        allUsers: state.allUsers.map((u) =>
          u.uid === uid
            ? { ...u, multiChips: (u.multiChips ?? []).filter((f) => f !== fixtureId) }
            : u,
        ),
      }));
    }
  },

  removeChip: async (uid: string, fixtureId: string) => {
    set((state) => ({
      allUsers: state.allUsers.map((u) =>
        u.uid === uid
          ? { ...u, multiChips: (u.multiChips ?? []).filter((f) => f !== fixtureId) }
          : u,
      ),
    }));
    try {
      await removeMultiChip(uid, fixtureId);
    } catch {
      set((state) => ({
        allUsers: state.allUsers.map((u) =>
          u.uid === uid ? { ...u, multiChips: [...(u.multiChips ?? []), fixtureId] } : u,
        ),
      }));
    }
  },

  saveKnockoutPrediction: async (uid: string, fixtureId: string, homeGoals: number, awayGoals: number) => {
    const prediction = { homeGoals, awayGoals };
    set((state) => ({
      allUsers: state.allUsers.map((u) =>
        u.uid === uid
          ? { ...u, knockoutPredictions: { ...u.knockoutPredictions, [fixtureId]: prediction } }
          : u,
      ),
    }));
    try {
      await saveKnockoutPredictionToFirestore(uid, fixtureId, homeGoals, awayGoals);
    } catch {
      set((state) => ({
        allUsers: state.allUsers.map((u) => {
          if (u.uid !== uid) return u;
          const kp = { ...u.knockoutPredictions };
          delete kp[fixtureId];
          return { ...u, knockoutPredictions: kp };
        }),
      }));
    }
  },

}));
