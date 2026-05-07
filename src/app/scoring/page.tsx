'use client';

import { useState, type ReactNode } from 'react';
import { calculateScoreBreakdown, type Scoreline } from '@/lib/scoring';

type ScoringRule = {
  points: number;
  title: string;
  description: string;
};

type ScoringNote = {
  title: string;
  description: string;
};

const POINT_RULES: ScoringRule[] = [
  {
    points: 3,
    title: 'Correct match result',
    description:
      'Awarded when you correctly predict the winning team, or correctly predict that the match ends in a draw.',
  },
  {
    points: 1,
    title: 'Correct home team goals',
    description:
      'Awarded when the number of goals you predicted for the home team matches the actual final score.',
  },
  {
    points: 1,
    title: 'Correct away team goals',
    description:
      'Awarded when the number of goals you predicted for the away team matches the actual final score.',
  },
];

const SCORING_NOTES: ScoringNote[] = [
  {
    title: 'Maximum 5 points per match',
    description:
      'The most you can earn from a single fixture is 5 points — awarded when you predict the exact scoreline correctly.',
  },
  {
    title: 'Final whistle of normal time',
    description:
      'Scores are locked in at the end of 90 minutes (plus stoppage time). Extra time and penalty shootouts do not count toward your prediction.',
  },
];

const MAX_POINTS_PER_MATCH = 5;
const MIN_GOALS = 0;
const MAX_GOALS = 20;

function PointsBadge({ points }: { points: number }) {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-lg font-bold tabular-nums shadow-inner">
      +{points}
    </div>
  );
}

function RuleCard({ rule }: { rule: ScoringRule }) {
  return (
    <div className="flex items-start gap-4 rounded-3xl border border-white/10 bg-white/[0.02] p-4 shadow-xl backdrop-blur-sm">
      <PointsBadge points={rule.points} />
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{rule.title}</h3>
        <p className="text-sm text-white/60">{rule.description}</p>
      </div>
    </div>
  );
}

function NoteCard({ note }: { note: ScoringNote }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-4">
      <h3 className="text-sm font-semibold">{note.title}</h3>
      <p className="mt-1 text-sm text-white/60">{note.description}</p>
    </div>
  );
}

function GoalStepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
}) {
  function decrement() {
    if (value <= MIN_GOALS) {
      return;
    }
    onChange(value - 1);
  }

  function increment() {
    if (value >= MAX_GOALS) {
      return;
    }
    onChange(value + 1);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="text-center text-xs uppercase tracking-wider text-white/50">{label}</div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={decrement}
          disabled={value <= MIN_GOALS}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-lg font-bold transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <div className="text-3xl font-bold tabular-nums">{value}</div>
        <button
          type="button"
          onClick={increment}
          disabled={value >= MAX_GOALS}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-lg font-bold transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

function ScorelineEditor({
  title,
  scoreline,
  onChange,
}: {
  title: string;
  scoreline: Scoreline;
  onChange: (next: Scoreline) => void;
}) {
  function setHomeGoals(homeGoals: number) {
    onChange({ ...scoreline, homeGoals });
  }

  function setAwayGoals(awayGoals: number) {
    onChange({ ...scoreline, awayGoals });
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-white/80">{title}</h3>
      <div className="grid grid-cols-2 gap-3">
        <GoalStepper label="Home" value={scoreline.homeGoals} onChange={setHomeGoals} />
        <GoalStepper label="Away" value={scoreline.awayGoals} onChange={setAwayGoals} />
      </div>
    </div>
  );
}

function CalculatorBreakdownLine({
  title,
  points,
  isAwarded,
  detail,
}: {
  title: string;
  points: number;
  isAwarded: boolean;
  detail: ReactNode;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-3 rounded-2xl border px-3 py-2.5 transition ${
        isAwarded ? 'border-white/20 bg-white/[0.06]' : 'border-white/10 bg-white/[0.02]'
      }`}
    >
      <div className="space-y-0.5">
        <div className={`text-sm font-semibold ${isAwarded ? 'text-white' : 'text-white/50'}`}>
          {title}
        </div>
        <div className={`text-xs ${isAwarded ? 'text-white/70' : 'text-white/40'}`}>{detail}</div>
      </div>
      <span
        className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold tabular-nums ${
          isAwarded
            ? 'border-white/20 bg-white/10 text-white'
            : 'border-white/10 bg-transparent text-white/30'
        }`}
      >
        {isAwarded ? `+${points}` : '0'}
      </span>
    </div>
  );
}

function getOutcomeLabel({ homeGoals, awayGoals }: Scoreline) {
  if (homeGoals > awayGoals) {
    return 'Home win';
  }
  if (awayGoals > homeGoals) {
    return 'Away win';
  }
  return 'Draw';
}

function ScoringCalculator() {
  const [prediction, setPrediction] = useState<Scoreline>({ homeGoals: 2, awayGoals: 1 });
  const [actual, setActual] = useState<Scoreline>({ homeGoals: 2, awayGoals: 1 });

  const breakdown = calculateScoreBreakdown(prediction, actual);

  const predictedOutcome = getOutcomeLabel(prediction);
  const actualOutcome = getOutcomeLabel(actual);

  const isResultAwarded = breakdown.resultPoints > 0;
  const isHomeAwarded = breakdown.homeGoalsPoints > 0;
  const isAwayAwarded = breakdown.awayGoalsPoints > 0;

  function reset() {
    setPrediction({ homeGoals: 0, awayGoals: 0 });
    setActual({ homeGoals: 0, awayGoals: 0 });
  }

  return (
    <div className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.02] p-4 shadow-xl backdrop-blur-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold">Try it yourself</h3>
          <p className="mt-1 text-sm text-white/60">
            Set a prediction and an actual result to see how points are awarded.
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          Reset
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ScorelineEditor title="Your prediction" scoreline={prediction} onChange={setPrediction} />
        <ScorelineEditor title="Actual result" scoreline={actual} onChange={setActual} />
      </div>

      <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-white/50">Points earned</span>
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm font-bold tabular-nums">
            {breakdown.total} {breakdown.total === 1 ? 'pt' : 'pts'}
          </span>
        </div>

        <div className="space-y-2">
          <CalculatorBreakdownLine
            title="Match result"
            points={3}
            isAwarded={isResultAwarded}
            detail={
              isResultAwarded ? (
                <>You picked {predictedOutcome.toLowerCase()} — that's what happened.</>
              ) : (
                <>
                  You picked {predictedOutcome.toLowerCase()}, actual was{' '}
                  {actualOutcome.toLowerCase()}.
                </>
              )
            }
          />
          <CalculatorBreakdownLine
            title="Home team goals"
            points={1}
            isAwarded={isHomeAwarded}
            detail={
              isHomeAwarded ? (
                <>You predicted {prediction.homeGoals} — exact match.</>
              ) : (
                <>
                  You predicted {prediction.homeGoals}, actual was {actual.homeGoals}.
                </>
              )
            }
          />
          <CalculatorBreakdownLine
            title="Away team goals"
            points={1}
            isAwarded={isAwayAwarded}
            detail={
              isAwayAwarded ? (
                <>You predicted {prediction.awayGoals} — exact match.</>
              ) : (
                <>
                  You predicted {prediction.awayGoals}, actual was {actual.awayGoals}.
                </>
              )
            }
          />
        </div>
      </div>
    </div>
  );
}

function WorkedExample({
  label,
  prediction,
  actual,
  breakdown,
  total,
}: {
  label: string;
  prediction: string;
  actual: string;
  breakdown: ReactNode;
  total: number;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-4 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-white/50">{label}</span>
        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm font-bold tabular-nums">
          {total} {total === 1 ? 'pt' : 'pts'}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
          <div className="text-xs text-white/50">You predicted</div>
          <div className="mt-1 font-semibold tabular-nums">{prediction}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
          <div className="text-xs text-white/50">Actual result</div>
          <div className="mt-1 font-semibold tabular-nums">{actual}</div>
        </div>
      </div>

      <div className="mt-3 space-y-1 text-sm text-white/70">{breakdown}</div>
    </div>
  );
}

function BreakdownLine({ points, text }: { points: number; text: string }) {
  const isAwarded = points > 0;
  return (
    <div className="flex items-center justify-between">
      <span className={isAwarded ? 'text-white/80' : 'text-white/40'}>{text}</span>
      <span className={`tabular-nums ${isAwarded ? 'font-semibold text-white' : 'text-white/40'}`}>
        {isAwarded ? `+${points}` : '0'}
      </span>
    </div>
  );
}

export default function ScoringPage() {
  return (
    <main className="min-h-screen bg-wc-black px-4 py-2 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">How Scoring Works</h1>
          <p className="mt-2 text-sm text-white/60">
            Earn points on every match by predicting the result and the final scoreline. The closer
            your prediction, the more points you take home.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Earning points</h2>
          <div className="space-y-3">
            {POINT_RULES.map((rule) => (
              <RuleCard key={rule.title} rule={rule} />
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Calculator</h2>
          <ScoringCalculator />
        </section>
      </div>
    </main>
  );
}
