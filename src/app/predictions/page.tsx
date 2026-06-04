'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { fixtures } from '@/data/fixtures';
import { mockResults } from '@/data/mockData';
import { predictions as staticPredictions } from '@/data/predictions';
import type { Fixture, MatchResult, Player, Prediction, PublicProfile } from '@/lib/types';
import { groupPredictionsByScore } from '@/lib/predictions';
import { scoreMatch } from '@/lib/scoring';
import { resolveAvatarSrc } from '@/lib/avatar';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { FixtureCard } from '@/components/FixtureSlider';
import Avatar from '@/components/leaderboard/Avatar';
import PredictionRow from '@/components/predictions/PredictionRow';

const IS_MOCK = process.env.NEXT_PUBLIC_MOCK_RESULTS === 'true';
const ACTIVE_RESULTS: MatchResult[] = IS_MOCK ? mockResults : [];
const MOCK_DATE_OVERRIDE: string | null = null;

function userToPlayer(profile: PublicProfile): Player {
  return {
    id: profile.uid,
    name: profile.displayName ?? 'Unknown',
    teamName: profile.teamName ?? undefined,
    photoUrl: resolveAvatarSrc(profile.avatarUrl, profile.avatarUpdatedAt),
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

function PlaceholderScoreChip() {
  return (
    <div className="rounded-lg border border-dashed border-white/20 px-3 py-1 text-sm font-semibold text-white/20 tabular-nums">
      ? – ?
    </div>
  );
}

function UnpredictedRow({ player }: { player: Player }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/10 py-3 last:border-0">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar name={player.name} photoUrl={player.photoUrl} size={30} />
        <span className="text-sm font-medium leading-snug text-white/90">{player.name}</span>
      </div>
      <PlaceholderScoreChip />
    </div>
  );
}

function MatchPredictionCard({
  fixture,
  now,
  players,
  allPredictions,
  result,
}: {
  fixture: Fixture;
  now: Date;
  players: Player[];
  allPredictions: Prediction[];
  result?: MatchResult;
}) {
  const fixturePredictions = useMemo(
    () => allPredictions.filter((p) => p.fixtureId === fixture.id),
    [fixture.id, allPredictions]
  );

  const predictionGroups = useMemo(
    () => groupPredictionsByScore(fixturePredictions),
    [fixturePredictions]
  );

  const sortedGroups = useMemo(() => {
    if (!result) return predictionGroups;
    return [...predictionGroups].sort((a, b) => {
      const ptsA = scoreMatch(
        { playerId: '', fixtureId: fixture.id, homeGoals: a.homeGoals, awayGoals: a.awayGoals, multiChip: a.multiChip },
        result
      ).points;
      const ptsB = scoreMatch(
        { playerId: '', fixtureId: fixture.id, homeGoals: b.homeGoals, awayGoals: b.awayGoals, multiChip: b.multiChip },
        result
      ).points;
      if (ptsB !== ptsA) return ptsB - ptsA;
      return b.playerIds.length - a.playerIds.length;
    });
  }, [predictionGroups, result, fixture.id]);

  const unpredictedPlayers = useMemo(() => {
    const predictingIds = new Set(fixturePredictions.map((p) => p.playerId));
    return players.filter((p) => !predictingIds.has(p.id));
  }, [fixturePredictions, players]);

  return (
    <div className="overflow-hidden rounded-2xl bg-wc-ink">
      <div className="p-3">
        <FixtureCard fixture={fixture} now={now} isFullWidth result={result} />
      </div>
      <div className="border-t border-white/10">
        <div className="px-4">
          {sortedGroups.map((group) => {
            const pts = result
              ? scoreMatch(
                  {
                    playerId: '',
                    fixtureId: fixture.id,
                    homeGoals: group.homeGoals,
                    awayGoals: group.awayGoals,
                    multiChip: group.multiChip,
                  },
                  result
                ).points
              : undefined;
            return (
              <PredictionRow
                key={`${group.homeGoals}-${group.awayGoals}-${group.multiChip}`}
                group={group}
                fixture={fixture}
                players={players}
                points={pts}
              />
            );
          })}
          {unpredictedPlayers.map((player) => (
            <UnpredictedRow key={player.id} player={player} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PredictionsPage() {
  const now = useMemo(() => getCurrentDate(), []);
  const availableDates = useMemo(() => buildAvailableDates(fixtures), []);
  const resultMap = useMemo(() => new Map(ACTIVE_RESULTS.map((r) => [r.fixtureId, r])), []);
  const firestoreUsers = useAuthStore((s) => s.allUsers);

  const [selectedDate, setSelectedDate] = useState<string>(() =>
    getDefaultSelectedDate(availableDates, now)
  );

  const players = useMemo<Player[]>(
    () => firestoreUsers.filter((u) => u.approved && !!u.teamName).map(userToPlayer),
    [firestoreUsers]
  );

  const allPredictions = useMemo<Prediction[]>(
    () => (IS_MOCK ? staticPredictions : []),
    []
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
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Match Predictions</h1>
          <p className="mt-2 max-w-lg text-sm text-white/55">
            Browse each match day and see how everyone predicted the scorelines.
          </p>
        </div>

        <div className="space-y-4">
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
              result={resultMap.get(fixture.id)}
            />
          ))}
        </div>
        </div>
      </div>
    </main>
  );
}
