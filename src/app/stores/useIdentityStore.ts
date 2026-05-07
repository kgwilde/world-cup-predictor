import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type IdentityStore = {
  playerId: string | null;
  hasHydrated: boolean;

  setPlayerId: (id: string | null) => void;
  clearPlayerId: () => void;
  setHasHydrated: (value: boolean) => void;
};

export const useIdentityStore = create<IdentityStore>()(
  persist(
    (set) => ({
      playerId: null,
      hasHydrated: false,
      setPlayerId: (id) => {
        set({ playerId: id });
      },
      clearPlayerId: () => {
        set({ playerId: null });
      },
      setHasHydrated: (value) => {
        set({ hasHydrated: value });
      },
    }),
    {
      name: 'wc26-player-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
