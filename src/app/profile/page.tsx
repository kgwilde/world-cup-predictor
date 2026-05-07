'use client';

import { ProfileSettings } from '@/components/profile/ProfileSettings';
import { SignIn } from '@/components/profile/SignIn';
import { useAuthStore } from '@/app/stores/useAuthStore';

export default function ProfilePage() {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-wc-ink border-t-wc-gold rounded-full animate-spin" />
      </div>
    );
  }

  return user ? <ProfileSettings /> : <SignIn />;
}
