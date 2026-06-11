import type { Fixture } from '@/lib/types';

import { ArrowLeft, ArrowRight } from 'lucide-react';

interface Props {
  fixtures: Fixture[];
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
}

interface StatusLineProps {
  currentIndex: number;
  currentFixture: Fixture | undefined;
}

function StatusLine({ currentIndex, currentFixture }: StatusLineProps) {
  if (currentIndex === -1) {
    return (
      <div className="text-xs font-body text-wc-white/60">
        <span className="font-semibold text-wc-white">Before any matches</span>
      </div>
    );
  }

  if (!currentFixture) {
    return <div className="text-xs font-body text-wc-white/40">No matches yet</div>;
  }

  return (
    <div className="text-xs font-body text-wc-white/60 truncate">
      <span className="font-semibold text-wc-white">
        Latest Update: {currentFixture.homeTeam.name} vs {currentFixture.awayTeam.name}
      </span>
    </div>
  );
}

export default function ReplayControls({ fixtures, currentIndex, onPrev, onNext }: Props) {
  const currentFixture = fixtures[currentIndex];
  const isAtStart = currentIndex === -1;
  const isAtEnd = currentIndex === fixtures.length - 1;
  const progressPct =
    fixtures.length > 0 ? (Math.max(0, currentIndex + 1) / fixtures.length) * 100 : 0;

  const buttonClasses =
    'w-8 h-8 flex items-center justify-center rounded text-wc-white/40 hover:text-wc-white hover:bg-wc-white/5 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed transition-colors';

  return (
    <div className="bg-wc-ink border border-wc-white/10 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          onClick={onPrev}
          disabled={isAtStart}
          className={buttonClasses}
          aria-label="Previous match"
        >
          <ArrowLeft />
        </button>

        <div className="flex-1 text-center min-w-0">
          <StatusLine currentIndex={currentIndex} currentFixture={currentFixture} />
          <div className="text-[10px] text-wc-white/30 uppercase tracking-wider">
            {Math.max(0, currentIndex + 1)} / {fixtures.length} matches
          </div>
        </div>

        <button
          onClick={onNext}
          disabled={isAtEnd}
          className={buttonClasses}
          aria-label="Next match"
        >
          <ArrowRight />
        </button>
      </div>

      <div className="h-0.5 bg-wc-white/5">
        <div
          className="h-full bg-wc-blue/60 transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  );
}
