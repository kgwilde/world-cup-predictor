'use client';

import { useState } from 'react';

import { calculateScoreBreakdown, type Scoreline } from '@/lib/scoring';

const MAX_GOALS = 20;

const RULES = [
  { badge: '+3', title: 'Correct result', description: 'Pick the right winner or a draw.' },
  { badge: '+1', title: 'Home goals', description: 'Match the exact home team score.' },
  { badge: '+1', title: 'Away goals', description: 'Match the exact away team score.' },
  {
    badge: '×2',
    title: 'Multi chip',
    description: 'Apply to up to 10 matches to double every point earned on that fixture.',
  },
];

function GoalStepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="mb-3 text-center text-xs uppercase tracking-wider text-wc-black/40 dark:text-white/40">{label}</div>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value === 0}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-black/15 dark:border-white/15 text-lg font-bold transition hover:border-wc-blue/60 hover:text-wc-blue disabled:cursor-not-allowed disabled:opacity-25"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <span className="text-4xl font-bold tabular-nums">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(MAX_GOALS, value + 1))}
          disabled={value === MAX_GOALS}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-black/15 dark:border-white/15 text-lg font-bold transition hover:border-wc-blue/60 hover:text-wc-blue disabled:cursor-not-allowed disabled:opacity-25"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

function ScoreEditor({
  label,
  scoreline,
  onChange,
}: {
  label: string;
  scoreline: Scoreline;
  onChange: (next: Scoreline) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold uppercase tracking-wider text-wc-black/40 dark:text-white/40">{label}</div>
      <div className="grid grid-cols-2 gap-4">
        <GoalStepper
          label="Home"
          value={scoreline.homeGoals}
          onChange={(v) => onChange({ ...scoreline, homeGoals: v })}
        />
        <GoalStepper
          label="Away"
          value={scoreline.awayGoals}
          onChange={(v) => onChange({ ...scoreline, awayGoals: v })}
        />
      </div>
    </div>
  );
}

function outcome({ homeGoals, awayGoals }: Scoreline) {
  if (homeGoals > awayGoals) return 'home win';
  if (awayGoals > homeGoals) return 'away win';
  return 'draw';
}

function BreakdownRow({
  label,
  detail,
  value,
  awarded,
}: {
  label: string;
  detail: string;
  value: string;
  awarded: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 border-b border-black/8 dark:border-white/8 py-3 last:border-0 transition-opacity ${awarded ? 'opacity-100' : 'opacity-30'}`}
    >
      <div className="min-w-0">
        <div className="text-sm font-semibold leading-snug">{label}</div>
        <div className="mt-0.5 text-xs text-wc-black/55 dark:text-white/55 leading-snug">{detail}</div>
      </div>
      <span
        className={`shrink-0 text-sm font-bold tabular-nums ${awarded ? 'text-wc-blue' : 'text-wc-black/40 dark:text-white/40'}`}
      >
        {value}
      </span>
    </div>
  );
}

function ScoringCalculator() {
  const [prediction, setPrediction] = useState<Scoreline>({ homeGoals: 2, awayGoals: 1 });
  const [actual, setActual] = useState<Scoreline>({ homeGoals: 2, awayGoals: 1 });
  const [multiChip, setMultiChip] = useState(false);

  const bd = calculateScoreBreakdown(prediction, actual, multiChip);
  const basePoints = bd.total - bd.multiChipBonus;

  function reset() {
    setPrediction({ homeGoals: 0, awayGoals: 0 });
    setActual({ homeGoals: 0, awayGoals: 0 });
    setMultiChip(false);
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white dark:bg-wc-ink">
      <div className="flex items-start justify-between gap-4 border-b border-black/10 dark:border-white/10 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold">Calculator</h2>
          <p className="mt-0.5 text-sm text-wc-black/50 dark:text-white/50">
            Set a prediction and result to see how points are awarded.
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="mt-0.5 shrink-0 text-xs font-semibold text-wc-blue/60 transition hover:text-wc-blue"
        >
          Reset
        </button>
      </div>

      <div className="space-y-5 p-5">
        <div className="grid gap-6 sm:grid-cols-2">
          <ScoreEditor
            label="Your prediction"
            scoreline={prediction}
            onChange={setPrediction}
          />
          <ScoreEditor label="Actual result" scoreline={actual} onChange={setActual} />
        </div>

        <button
          type="button"
          onClick={() => setMultiChip((v) => !v)}
          className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 transition-colors ${
            multiChip
              ? 'border-wc-gold/40 bg-wc-gold/10'
              : 'border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:border-black/20 dark:hover:border-white/20'
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`text-base font-bold leading-none ${multiChip ? 'text-wc-gold' : 'text-wc-black/30 dark:text-white/30'}`}
            >
              ×2
            </span>
            <span
              className={`text-sm font-semibold ${multiChip ? 'text-wc-black dark:text-white' : 'text-wc-black/50 dark:text-white/50'}`}
            >
              Multi chip
            </span>
          </div>
          <div
            className={`h-5 w-9 rounded-full transition-colors ${multiChip ? 'bg-wc-gold' : 'bg-black/15 dark:bg-white/15'}`}
          >
            <div
              className={`mt-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${multiChip ? 'translate-x-[18px]' : 'translate-x-0.5'}`}
            />
          </div>
        </button>

        <div className="rounded-xl border border-black/10 dark:border-white/10 px-4">
          <BreakdownRow
            label="Match result"
            detail={
              bd.resultPoints > 0
                ? `Correct, you predicted a ${outcome(prediction)}`
                : `Predicted ${outcome(prediction)}, actual was ${outcome(actual)}`
            }
            value="+3"
            awarded={bd.resultPoints > 0}
          />
          <BreakdownRow
            label="Home goals"
            detail={
              bd.homeGoalsPoints > 0
                ? `Correct, you predicted ${prediction.homeGoals}`
                : `Predicted ${prediction.homeGoals}, actual was ${actual.homeGoals}`
            }
            value="+1"
            awarded={bd.homeGoalsPoints > 0}
          />
          <BreakdownRow
            label="Away goals"
            detail={
              bd.awayGoalsPoints > 0
                ? `Correct, you predicted ${prediction.awayGoals}`
                : `Predicted ${prediction.awayGoals}, actual was ${actual.awayGoals}`
            }
            value="+1"
            awarded={bd.awayGoalsPoints > 0}
          />
          {multiChip && (
            <BreakdownRow
              label="Multi chip"
              detail={
                bd.multiChipBonus > 0
                  ? `Doubles your ${basePoints} base ${basePoints === 1 ? 'point' : 'points'}`
                  : 'No base points to double'
              }
              value={`+${bd.multiChipBonus}`}
              awarded={bd.multiChipBonus > 0}
            />
          )}

          <div className="flex items-center justify-between border-t border-black/10 dark:border-white/10 py-4">
            <span className="text-sm font-semibold text-wc-black/60 dark:text-white/60">Total</span>
            <span className="text-2xl font-bold tabular-nums text-wc-blue">
              {bd.total}
              <span className="ml-1 text-sm font-semibold text-wc-blue/60">
                {bd.total === 1 ? 'pt' : 'pts'}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ScoringPage() {
  return (
    <main className="min-h-screen bg-wc-bone dark:bg-wc-black px-4 py-6 text-wc-black dark:text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Scoring</h1>
          <p className="mt-2 max-w-lg text-sm text-wc-black/55 dark:text-white/55">
            Earn points on every match by predicting the result and exact scoreline.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white dark:bg-wc-ink">
          {RULES.map((rule, i) => (
            <div
              key={rule.title}
              className={`flex items-center gap-4 px-5 py-4 ${i < RULES.length - 1 ? 'border-b border-black/8 dark:border-white/8' : ''}`}
            >
              <span className="font-display w-10 shrink-0 text-center text-xl font-bold tabular-nums text-wc-blue">
                {rule.badge}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{rule.title}</div>
                <div className="mt-0.5 text-xs text-wc-black/50 dark:text-white/50">{rule.description}</div>
              </div>
            </div>
          ))}
          <div className="border-t border-black/8 dark:border-white/8 bg-black/[0.02] dark:bg-white/[0.02] px-5 py-3">
            <p className="text-xs text-wc-black/35 dark:text-white/35">
              Up to 5 pts per match, doubled with multi chip
            </p>
          </div>
        </div>

        <ScoringCalculator />
      </div>
    </main>
  );
}
