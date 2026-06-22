'use client';

import { useAuthStore } from '@/app/stores/useAuthStore';
import { ProfileSettings } from '@/components/profile/ProfileSettings';
import { SignIn } from '@/components/profile/SignIn';

export default function ProfilePage() {
  const { user, profile, loading, profileError } = useAuthStore();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-wc-black/15 dark:border-wc-ink border-t-wc-blue rounded-full animate-spin" />
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <p className="text-wc-black dark:text-wc-white font-semibold mb-2">Couldn&apos;t load your profile</p>
        <p className="text-wc-black/60 dark:text-wc-bone text-sm mb-6">
          There was a problem setting up your account. Please try signing out and signing in again.
        </p>
        <button
          onClick={() => useAuthStore.getState().signOut()}
          className="bg-wc-blue text-wc-white font-semibold py-2 px-6 rounded-lg hover:opacity-90 transition-opacity"
        >
          Sign out
        </button>
      </div>
    );
  }

  if (!user) return <SignIn />;
  if (!profile) return null;
  return <ProfileSettings />;
}
