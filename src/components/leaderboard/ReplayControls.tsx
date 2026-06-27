import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { TimelineStep } from '@/components/hooks/use_standings';

interface Props {
  timeline: TimelineStep[];
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
}

function StatusLine({ currentIndex, currentStep }: { currentIndex: number; currentStep: TimelineStep | undefined }) {
  if (currentIndex === -1) {
    return (
      <div className="text-xs font-body text-wc-black/60 dark:text-wc-white/60">
        <span className="font-semibold text-wc-black dark:text-wc-white">Before any matches</span>
      </div>
    );
  }

  if (!currentStep) {
    return <div className="text-xs font-body text-wc-black/40 dark:text-wc-white/40">No updates yet</div>;
  }

  if (currentStep.kind === 'special') {
    return (
      <div className="text-xs font-body text-wc-black/60 dark:text-wc-white/60 truncate">
        <span className="text-wc-blue font-semibold">Special: </span>
        <span className="font-semibold text-wc-black dark:text-wc-white">{currentStep.event.label}</span>
      </div>
    );
  }

  return (
    <div className="text-xs font-body text-wc-black/60 dark:text-wc-white/60 truncate">
      <span className="font-semibold text-wc-black dark:text-wc-white">
        Latest: {currentStep.fixture.homeTeam.name} vs {currentStep.fixture.awayTeam.name}
      </span>
    </div>
  );
}

export default function ReplayControls({ timeline, currentIndex, onPrev, onNext }: Props) {
  const currentStep = timeline[currentIndex];
  const isAtStart = currentIndex === -1;
  const isAtEnd = currentIndex === timeline.length - 1;
  const progressPct = timeline.length > 0 ? (Math.max(0, currentIndex + 1) / timeline.length) * 100 : 0;

  const totalUpdates = timeline.length;
  const currentUpdateNumber = currentIndex === -1 ? 0 : currentIndex + 1;

  const buttonClasses =
    'w-8 h-8 flex items-center justify-center rounded text-wc-black/60 dark:text-wc-bone hover:text-wc-black dark:hover:text-wc-white hover:bg-wc-black/5 dark:hover:bg-wc-white/5 cursor-pointer disabled:text-wc-gray disabled:cursor-not-allowed transition-colors';

  return (
    <div className="bg-white dark:bg-wc-ink border border-black/10 dark:border-wc-white/10 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2">
        <button onClick={onPrev} disabled={isAtStart} className={buttonClasses} aria-label="Previous">
          <ArrowLeft />
        </button>

        <div className="flex-1 text-center min-w-0">
          <StatusLine currentIndex={currentIndex} currentStep={currentStep} />
          <div className="text-[10px] text-wc-black/30 dark:text-wc-white/30 uppercase tracking-wider">
            {currentUpdateNumber} / {totalUpdates} updates
          </div>
        </div>

        <button onClick={onNext} disabled={isAtEnd} className={buttonClasses} aria-label="Next">
          <ArrowRight />
        </button>
      </div>

      <div className="h-0.5 bg-black/5 dark:bg-wc-white/5">
        <div
          className="h-full bg-wc-blue transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  );
}
