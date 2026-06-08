'use client';

import Leaderboard from '@/components/leaderboard/Leaderboard';

import { FixtureSlider } from '@/components/FixtureSlider';

export default function Home() {
  return (
    <main className="min-h-screen bg-wc-black">
      <FixtureSlider />
      <Leaderboard />
    </main>
  );
}
