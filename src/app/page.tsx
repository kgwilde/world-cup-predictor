'use client';

import Leaderboard from '@/components/leaderboard/Leaderboard';

import { FixtureSlider } from '@/components/FixtureSlider';

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 max-w-3xl mx-auto">
      <div className="flex-1 h-px bg-wc-white/8" />
      <span className="font-display font-bold text-[10px] tracking-[0.3em] text-wc-white/20 uppercase">
        {label}
      </span>
      <div className="flex-1 h-px bg-wc-white/8" />
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-wc-black">
      <FixtureSlider />
      <SectionDivider label="— Standings —" />
      <Leaderboard />
    </main>
  );
}
