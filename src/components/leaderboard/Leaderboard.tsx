'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

import { useAuthStore } from '@/app/stores/useAuthStore';
import { useStandings } from '@/components/hooks/use_standings';
import LeaderboardRow from '@/components/leaderboard/LeaderboardRow';
import ReplayControls from '@/components/leaderboard/ReplayControls';
import { fixtures } from '@/data/fixtures';
import { generateMockPredictions, mockResults } from '@/data/mockData';
import { getAllUsers } from '@/lib/firestore';
import type { MatchResult, Player, PlayerStanding, Prediction, UserProfile } from '@/lib/types';

const IS_MOCK = process.env.NEXT_PUBLIC_MOCK_RESULTS === 'true';

const ACTIVE_RESULTS: MatchResult[] = IS_MOCK ? mockResults : [];

const PLAYED_FIXTURES = (() => {
  const withResults = new Set(ACTIVE_RESULTS.map((r) => r.fixtureId));
  return fixtures
    .filter((f) => withResults.has(f.id))
    .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime());
})();

function resolveAvatarSrc(url: string | null): string | undefined {
  if (!url) return undefined;
  if (url.includes('.blob.vercel-storage.com/')) {
    return `/api/blob-proxy?url=${encodeURIComponent(url)}`;
  }
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

export default function Leaderboard() {
  const viewerId = useAuthStore((s) => s.user?.uid ?? null);
  const authLoading = useAuthStore((s) => s.loading);
  const isGuest = !authLoading && !viewerId;
  const [firestoreUsers, setFirestoreUsers] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [replayIndex, setReplayIndex] = useState(PLAYED_FIXTURES.length - 1);

  // Wait for auth to resolve before querying Firestore so security rules can evaluate correctly
  useEffect(() => {
    if (authLoading) return;
    getAllUsers()
      .then(setFirestoreUsers)
      .catch(console.error)
      .finally(() => setUsersLoading(false));
  }, [authLoading]);
  const players: Player[] = firestoreUsers
    .filter((u) => u.approved === true && !!u.teamName)
    .map(userToPlayer);
  const predictions: Prediction[] = IS_MOCK ? generateMockPredictions(players) : [];

  const { currentStandings, previousStandings, currentFixture } = useStandings(
    players,
    predictions,
    ACTIVE_RESULTS,
    PLAYED_FIXTURES,
    replayIndex
  );

  if (usersLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-wc-white/30 border-t-wc-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 space-y-4">
      <div className="space-y-4">
        <ReplayControls
          fixtures={PLAYED_FIXTURES}
          currentIndex={replayIndex}
          onPrev={() => setReplayIndex((i) => Math.max(-1, i - 1))}
          onNext={() => setReplayIndex((i) => Math.min(PLAYED_FIXTURES.length - 1, i + 1))}
        />

        {isGuest && <SignUpPrompt />}

        {currentStandings.length === 0 && <EmptyState />}

        <div className="space-y-2">
          {currentStandings.map((standing: PlayerStanding) => (
            <LeaderboardRow
              key={standing.player.id}
              standing={standing}
              isViewer={standing.player.id === viewerId}
              matchDelta={
                currentFixture
                  ? buildMatchDelta(
                      currentStandings,
                      previousStandings,
                      currentFixture.id,
                      standing.player.id
                    )
                  : null
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function getFixturePoints(standings: PlayerStanding[], playerId: string, fixtureId: string) {
  const standing = standings.find((s) => s.player.id === playerId);
  return standing?.matchPoints.find((mp) => mp.fixtureId === fixtureId)?.points ?? 0;
}

function getRankChange(
  currentStandings: PlayerStanding[],
  previousStandings: PlayerStanding[] | null,
  playerId: string
) {
  if (!previousStandings) return 0;
  const currentRank = currentStandings.find((s) => s.player.id === playerId)?.rank ?? 0;
  const previousRank = previousStandings.find((s) => s.player.id === playerId)?.rank ?? 0;
  return previousRank - currentRank;
}

function buildMatchDelta(
  standings: PlayerStanding[],
  previousStandings: PlayerStanding[] | null,
  currentFixtureId: string,
  playerId: string
) {
  if (!standings.some((s) => s.player.id === playerId)) return null;
  return {
    points: getFixturePoints(standings, playerId, currentFixtureId),
    rankChange: getRankChange(standings, previousStandings, playerId),
  };
}

function SignUpPrompt() {
  return (
    <Link
      href="/profile"
      className="flex items-center justify-between px-4 py-3 rounded-xl bg-wc-gold/10 border border-wc-gold/30 hover:bg-wc-gold/20 transition-colors group"
    >
      <div>
        <p className="font-display font-bold text-wc-gold text-sm tracking-wide">
          Want to join the competition?
        </p>
        <p className="text-wc-white/50 text-xs font-body mt-0.5">
          Sign up on your Profile to get on the leaderboard.
        </p>
      </div>
      <span className="text-wc-gold/60 group-hover:text-wc-gold text-lg transition-colors">→</span>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="font-display text-4xl font-bold text-wc-white/20 mb-2">WE ARE</div>
      <div className="font-display text-6xl font-bold text-wc-white/20">26</div>
      <p className="text-wc-white/40 text-sm font-body mt-4">
        No results yet. Check back after the first match.
      </p>
    </div>
  );
}
