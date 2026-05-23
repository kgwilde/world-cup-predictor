'use client';

import { useState, type ReactNode } from 'react';
import { calculateScoreBreakdown, type Scoreline } from '@/lib/scoring';

type ScoringRule = {
  points: number;
  title: string;
  description: string;
  multiplier?: boolean;
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
  {
    points: 2,
    multiplier: true,
    title: 'Multi chip',
    description:
      'Apply a multi chip to up to 10 matches in your predictions. Any points earned on that match are doubled.',
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

function RuleCard({ rule }: { rule: ScoringRule }) {
  return (
    <div className="flex items-start gap-5 border-l-2 border-wc-gold pl-4 py-0.5">
      <div className="flex-1 space-y-1">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-base font-semibold">{rule.title}</h3>
          <span className="shrink-0 text-xl font-bold tabular-nums text-wc-gold">
            {rule.multiplier ? `×${rule.points}` : `+${rule.points}`}
          </span>
        </div>
        <p className="text-sm text-white/55">{rule.description}</p>
      </div>
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
    if (value <= MIN_GOALS) return;
    onChange(value - 1);
  }

  function increment() {
    if (value >= MAX_GOALS) return;
    onChange(value + 1);
  }

  return (
    <div>
      <div className="mb-3 text-center text-xs uppercase tracking-wider text-white/40">{label}</div>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={decrement}
          disabled={value <= MIN_GOALS}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-lg font-bold transition hover:border-wc-gold/60 hover:text-wc-gold disabled:cursor-not-allowed disabled:opacity-25"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <div className="text-4xl font-bold tabular-nums">{value}</div>
        <button
          type="button"
          onClick={increment}
          disabled={value >= MAX_GOALS}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-lg font-bold transition hover:border-wc-gold/60 hover:text-wc-gold disabled:cursor-not-allowed disabled:opacity-25"
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
      <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">{title}</h3>
      <div className="grid grid-cols-2 gap-4">
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
    <div className="flex items-start justify-between gap-3 border-b border-white/10 py-3 last:border-0">
      <div className="space-y-0.5">
        <div className={`text-sm font-semibold ${isAwarded ? 'text-white' : 'text-white/35'}`}>
          {title}
        </div>
        <div className={`text-xs ${isAwarded ? 'text-white/55' : 'text-white/25'}`}>{detail}</div>
      </div>
      <span
        className={`shrink-0 pt-0.5 text-sm font-bold tabular-nums ${
          isAwarded ? 'text-wc-gold' : 'text-white/25'
        }`}
      >
        {isAwarded ? `+${points}` : '—'}
      </span>
    </div>
  );
}

function getOutcomeLabel({ homeGoals, awayGoals }: Scoreline) {
  if (homeGoals > awayGoals) return 'Home win';
  if (awayGoals > homeGoals) return 'Away win';
  return 'Draw';
}

function ScoringCalculator() {
  const [prediction, setPrediction] = useState<Scoreline>({ homeGoals: 2, awayGoals: 1 });
  const [actual, setActual] = useState<Scoreline>({ homeGoals: 2, awayGoals: 1 });
  const [multiChip, setMultiChip] = useState(false);

  const breakdown = calculateScoreBreakdown(prediction, actual, multiChip);

  const predictedOutcome = getOutcomeLabel(prediction);
  const actualOutcome = getOutcomeLabel(actual);

  const isResultAwarded = breakdown.resultPoints > 0;
  const isHomeAwarded = breakdown.homeGoalsPoints > 0;
  const isAwayAwarded = breakdown.awayGoalsPoints > 0;

  function reset() {
    setPrediction({ homeGoals: 0, awayGoals: 0 });
    setActual({ homeGoals: 0, awayGoals: 0 });
    setMultiChip(false);
  }

  return (
    <div className="space-y-5 rounded-2xl bg-wc-ink p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold">Try it yourself</h3>
          <p className="mt-0.5 text-sm text-white/50">
            Set a prediction and result to see how points are awarded.
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="mt-0.5 shrink-0 text-xs font-semibold text-wc-gold/60 transition hover:text-wc-gold"
        >
          Reset
        </button>
      </div>

      <div className="grid gap-5 border-t border-white/10 pt-5 sm:grid-cols-2">
        <ScorelineEditor title="Your prediction" scoreline={prediction} onChange={setPrediction} />
        <ScorelineEditor title="Actual result" scoreline={actual} onChange={setActual} />
      </div>

      <div className="border-t border-white/10 pt-4">
        <button
          type="button"
          onClick={() => setMultiChip((v) => !v)}
          className={`mb-4 flex w-full items-center justify-between rounded-xl border px-4 py-3 transition-colors ${
            multiChip
              ? 'border-wc-gold/40 bg-wc-gold/10'
              : 'border-white/10 bg-white/5 hover:border-white/20'
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`text-base font-bold leading-none ${multiChip ? 'text-wc-gold' : 'text-white/30'}`}
            >
              ×2
            </span>
            <div className="text-left">
              <div
                className={`text-sm font-semibold ${multiChip ? 'text-white' : 'text-white/50'}`}
              >
                Multi chip
              </div>
              <div className="text-xs text-white/35">Doubles points earned on this match</div>
            </div>
          </div>
          <div
            className={`h-5 w-9 rounded-full transition-colors ${multiChip ? 'bg-wc-gold' : 'bg-white/15'}`}
          >
            <div
              className={`mt-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${multiChip ? 'translate-x-[18px]' : 'translate-x-0.5'}`}
            />
          </div>
        </button>

        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-white/40">Points earned</span>
          <span className="text-2xl font-bold tabular-nums text-wc-gold">
            {breakdown.total}
            <span className="ml-1 text-sm font-semibold text-wc-gold/70">
              {breakdown.total === 1 ? 'pt' : 'pts'}
            </span>
          </span>
        </div>

        <div>
          <CalculatorBreakdownLine
            title="Match result"
            points={3}
            isAwarded={isResultAwarded}
            detail={
              isResultAwarded ? (
                <>You picked {predictedOutcome.toLowerCase()} — that&apos;s what happened.</>
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
              <>
                You predicted {prediction.homeGoals}, actual was {actual.homeGoals}.
              </>
            }
          />
          <CalculatorBreakdownLine
            title="Away team goals"
            points={1}
            isAwarded={isAwayAwarded}
            detail={
              <>
                You predicted {prediction.awayGoals}, actual was {actual.awayGoals}.
              </>
            }
          />
          {multiChip && (
            <CalculatorBreakdownLine
              title="×2 Multi chip"
              points={breakdown.multiChipBonus}
              isAwarded={breakdown.multiChipBonus > 0}
              detail={
                breakdown.multiChipBonus > 0 ? (
                  <>Doubles your {breakdown.total / 2} base {breakdown.total / 2 === 1 ? 'point' : 'points'}.</>
                ) : (
                  <>No base points to multiply.</>
                )
              }
            />
          )}
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
    <div className="rounded-2xl bg-wc-ink p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-white/40">{label}</span>
        <span className="text-lg font-bold tabular-nums text-wc-gold">
          {total} {total === 1 ? 'pt' : 'pts'}
        </span>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border border-white/10 px-3 py-2">
          <div className="text-xs text-white/40">You predicted</div>
          <div className="mt-1 font-semibold tabular-nums">{prediction}</div>
        </div>
        <div className="rounded-lg border border-white/10 px-3 py-2">
          <div className="text-xs text-white/40">Actual result</div>
          <div className="mt-1 font-semibold tabular-nums">{actual}</div>
        </div>
      </div>

      <div className="text-sm text-white/60">{breakdown}</div>
    </div>
  );
}

export default function ScoringPage() {
  return (
    <main className="min-h-screen bg-wc-black px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">How Scoring Works</h1>
          <p className="mt-2 max-w-lg text-sm text-white/55">
            Earn points on every match by predicting the result and the final scoreline. The closer
            your prediction, the more points you take home.
          </p>
        </div>

        <section className="space-y-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">Earning points</h2>
            <span className="text-xs text-white/35">max {MAX_POINTS_PER_MATCH} pts per match</span>
          </div>
          <div className="space-y-5">
            {POINT_RULES.map((rule) => (
              <RuleCard key={rule.title} rule={rule} />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Calculator</h2>
          <ScoringCalculator />
        </section>
      </div>
    </main>
  );
}
