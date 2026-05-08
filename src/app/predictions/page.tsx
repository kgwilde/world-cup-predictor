'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { fixtures } from '@/data/fixtures';
import { generateMockPredictions } from '@/data/mockData';
import type { Fixture, Player, Prediction, UserProfile } from '@/lib/types';
import { groupPredictionsByScore } from '@/lib/predictions';
import { getAllUsers } from '@/lib/firestore';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { FixtureCard } from '@/components/FixtureSlider';
import PredictionRow from '@/components/predictions/PredictionRow';

const IS_MOCK = process.env.NEXT_PUBLIC_MOCK_RESULTS === 'true';
const MOCK_DATE_OVERRIDE: string | null = null;

function resolveAvatarSrc(url: string | null): string | undefined {
  if (!url) return undefined;
  if (url.includes('.blob.vercel-storage.com/'))
    return `/api/blob-proxy?url=${encodeURIComponent(url)}`;
  return url;
}

function userToPlayer(profile: UserProfile): Player {
  return {
    id: profile.uid,
    name: profile.displayName ?? 'Unknown',
    teamName: profile.teamName ?? undefined,
    photoUrl: resolveAvatarSrc(profile.avatarUrl),
  };
}

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

function MatchPredictionCard({
  fixture,
  now,
  players,
  allPredictions,
}: {
  fixture: Fixture;
  now: Date;
  players: Player[];
  allPredictions: Prediction[];
}) {
  const fixturePredictions = useMemo(
    () => allPredictions.filter((p) => p.fixtureId === fixture.id),
    [fixture.id, allPredictions]
  );

  const predictionGroups = useMemo(
    () => groupPredictionsByScore(fixturePredictions),
    [fixturePredictions]
  );

  return (
    <div className="overflow-hidden rounded-2xl bg-wc-ink">
      <div className="p-3">
        <FixtureCard fixture={fixture} now={now} isFullWidth />
      </div>
      <div className="border-t border-white/10">
        {predictionGroups.length > 0 ? (
          <div className="px-4">
            {predictionGroups.map((group) => (
              <PredictionRow
                key={`${group.homeGoals}-${group.awayGoals}`}
                group={group}
                fixture={fixture}
                players={players}
              />
            ))}
          </div>
        ) : (
          <p className="py-5 text-center text-sm text-white/40">No predictions submitted yet</p>
        )}
      </div>
    </div>
  );
}

export default function PredictionsPage() {
  const now = useMemo(() => getCurrentDate(), []);
  const availableDates = useMemo(() => buildAvailableDates(fixtures), []);
  const authLoading = useAuthStore((s) => s.loading);

  const [selectedDate, setSelectedDate] = useState<string>(() =>
    getDefaultSelectedDate(availableDates, now)
  );
  const [firestoreUsers, setFirestoreUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    if (authLoading) return;
    getAllUsers().then(setFirestoreUsers).catch(console.error);
  }, [authLoading]);

  const players = useMemo<Player[]>(
    () => firestoreUsers.filter((u) => u.approved && !!u.teamName).map(userToPlayer),
    [firestoreUsers]
  );

  const allPredictions = useMemo<Prediction[]>(
    () => (IS_MOCK ? generateMockPredictions(players) : []),
    [players]
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
    <main className="min-h-screen bg-wc-black px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Match Predictions</h1>
          <p className="mt-2 max-w-lg text-sm text-white/55">
            Browse each match day and see how everyone predicted the scorelines.
          </p>
        </div>

        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2">
          {availableDates.map((dateKey) => {
            const isActive = dateKey === selectedDate;
            const date = new Date(dateKey);

            return (
              <button
                key={dateKey}
                ref={isActive ? activeButtonRef : null}
                type="button"
                onClick={() => setSelectedDate(dateKey)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-wc-gold text-wc-black'
                    : 'bg-wc-ink text-white/60 hover:text-white/80'
                }`}
              >
                {formatDateLabel(date)}
              </button>
            );
          })}
        </div>

        <div className="space-y-4">
          {fixturesForDay.map((fixture) => (
            <MatchPredictionCard
              key={fixture.id}
              fixture={fixture}
              now={now}
              players={players}
              allPredictions={allPredictions}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
