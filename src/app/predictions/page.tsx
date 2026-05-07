'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { fixtures } from '@/data/fixtures';
import { predictions } from '@/data/predictions';
import type { Fixture } from '@/lib/types';
import { groupPredictionsByScore } from '@/lib/predictions';
import { FixtureCard } from '@/components/FixtureSlider';
import PredictionRow from '@/components/predictions/PredictionRow';

const MOCK_DATE_OVERRIDE: string | null = null;

function getCurrentDate() {
  if (MOCK_DATE_OVERRIDE) {
    return new Date(MOCK_DATE_OVERRIDE);
  }
  return new Date();
}

function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat('en-IE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
}

function getFixtureDateKey(kickoffUtc: string) {
  const kickoffDate = new Date(kickoffUtc);
  const year = kickoffDate.getFullYear();
  const month = String(kickoffDate.getMonth() + 1).padStart(2, '0');
  const day = String(kickoffDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getPredictionsForFixture(fixtureId: string) {
  return predictions.filter((prediction) => prediction.fixtureId === fixtureId);
}

function buildAvailableDates(allFixtures: Fixture[]) {
  const uniqueDateKeys = [
    ...new Set(allFixtures.map((fixture) => getFixtureDateKey(fixture.kickoff))),
  ];
  return uniqueDateKeys.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
}

function getDefaultSelectedDate(dateKeys: string[], today: Date) {
  const todayKey = getFixtureDateKey(today.toISOString());

  if (dateKeys.includes(todayKey)) {
    return todayKey;
  }

  const pastDates = dateKeys.filter((key) => key < todayKey);
  if (pastDates.length > 0) {
    return pastDates[pastDates.length - 1];
  }

  return dateKeys[0];
}

function MatchPredictionCard({ fixture, now }: { fixture: Fixture; now: Date }) {
  const fixturePredictions = useMemo(() => getPredictionsForFixture(fixture.id), [fixture.id]);

  const predictionGroups = useMemo(
    () => groupPredictionsByScore(fixturePredictions),
    [fixturePredictions]
  );

  return (
    <div className="space-y-3 rounded-3xl border border-white/10 bg-white/[0.02] p-3 shadow-xl backdrop-blur-sm">
      <FixtureCard fixture={fixture} now={now} isFullWidth />

      <div className="space-y-2">
        {predictionGroups.length > 0 ? (
          predictionGroups.map((group) => (
            <PredictionRow
              key={`${group.homeGoals}-${group.awayGoals}`}
              group={group}
              fixture={fixture}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-6 text-center text-sm text-white/60">
            No predictions have been submitted yet
          </div>
        )}
      </div>
    </div>
  );
}

export default function PredictionsPage() {
  const now = useMemo(() => getCurrentDate(), []);
  const availableDates = useMemo(() => buildAvailableDates(fixtures), []);

  const [selectedDate, setSelectedDate] = useState<string>(() =>
    getDefaultSelectedDate(availableDates, now)
  );

  const fixturesForDay = useMemo(
    () => fixtures.filter((fixture) => getFixtureDateKey(fixture.kickoff) === selectedDate),
    [selectedDate]
  );

  const activeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (activeButtonRef.current) {
      activeButtonRef.current.scrollIntoView({
        inline: 'center',
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [selectedDate]);

  return (
    <main className="min-h-screen bg-wc-black px-4 py-2 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Match Predictions</h1>
          <p className="mt-2 text-sm text-white/60">
            Browse each match day and see how everyone predicted the scorelines.
          </p>
        </div>

        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
          {availableDates.map((dateKey) => {
            const isActive = dateKey === selectedDate;
            const date = new Date(dateKey);

            return (
              <button
                key={dateKey}
                ref={isActive ? activeButtonRef : null}
                type="button"
                onClick={() => setSelectedDate(dateKey)}
                className={`shrink-0 rounded-2xl border px-4 py-3 text-left transition ${
                  isActive
                    ? 'border-white/30 bg-white/10'
                    : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                }`}
              >
                <div className="text-sm font-semibold">{formatDateLabel(date)}</div>
              </button>
            );
          })}
        </div>

        <div className="space-y-6">
          {fixturesForDay.map((fixture) => (
            <MatchPredictionCard key={fixture.id} fixture={fixture} now={now} />
          ))}
        </div>
      </div>
    </main>
  );
}
