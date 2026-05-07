'use client';

import { onAuthStateChanged, signOut as firebaseSignOut, type User } from 'firebase/auth';
import { create } from 'zustand';

import { auth } from '@/lib/firebase';
import { createUserProfile, getUserProfile } from '@/lib/firestore';
import type { UserProfile } from '@/lib/types';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  init: () => () => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,

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
    set({ profile });
  },
}));
