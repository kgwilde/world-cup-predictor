'use client';

import { useAuthStore } from '@/app/stores/useAuthStore';
import { ProfileSettings } from '@/components/profile/ProfileSettings';
import { SignIn } from '@/components/profile/SignIn';

export default function ProfilePage() {
  const { user, profile, loading } = useAuthStore();

  if (loading || (user && !profile)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-wc-ink border-t-wc-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <SignIn />;
  return <ProfileSettings />;
}
