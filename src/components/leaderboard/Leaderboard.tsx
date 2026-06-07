'use client';

import { useEffect, useMemo, useState } from 'react';

import Link from 'next/link';

import { useAuthStore } from '@/app/stores/useAuthStore';
import { useStandings } from '@/components/hooks/use_standings';
import { useMultiChips } from '@/components/hooks/use_multi_chips';
import LeaderboardRow from '@/components/leaderboard/LeaderboardRow';
import PlayerCardModal from '@/components/PlayerCardModal';
import ReplayControls from '@/components/leaderboard/ReplayControls';
import { fixtures } from '@/data/fixtures';
import { mockResults } from '@/data/mockData';
import { predictions as staticPredictions } from '@/data/predictions';
import { resolveAvatarSrc } from '@/lib/avatar';
import { calculateStandings } from '@/lib/scoring';
import type { MatchResult, Player, PlayerStanding, Prediction, PublicProfile } from '@/lib/types';

const IS_MOCK = process.env.NEXT_PUBLIC_MOCK_RESULTS === 'true';

function userToPlayer(profile: PublicProfile): Player {
  return {
    id: profile.uid,
    name: (profile.displayName ?? 'Unknown').split(' ')[0],
    teamName: profile.teamName ?? undefined,
    photoUrl: resolveAvatarSrc(profile.avatarUrl, profile.avatarUpdatedAt),
  };
}

export default function Leaderboard() {
  const viewerId = useAuthStore((s) => s.user?.uid ?? null);
  const authLoading = useAuthStore((s) => s.loading);
  const isGuest = !authLoading && !viewerId;
  const firestoreUsers = useAuthStore((s) => s.allUsers);
  const usersLoading = useAuthStore((s) => s.usersLoading);
  const storeResults = useAuthStore((s) => s.results);
  const resultsLoading = useAuthStore((s) => s.resultsLoading);

  const activeResults: MatchResult[] = IS_MOCK ? mockResults : storeResults;

  const playedFixtures = useMemo(() => {
    const withResults = new Set(activeResults.map((r) => r.fixtureId));
    return fixtures
      .filter((f) => withResults.has(f.id))
      .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime());
  }, [activeResults]);

  const [replayIndex, setReplayIndex] = useState(-1);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const { chips: allChips } = useMultiChips();

  useEffect(() => {
    if (!resultsLoading) {
      setReplayIndex(playedFixtures.length - 1);
    }
  }, [resultsLoading, playedFixtures.length]);

  const players: Player[] = firestoreUsers
    .filter((u) => u.approved === true)
    .map(userToPlayer);
  const predictions: Prediction[] = IS_MOCK ? staticPredictions : [];

  const { currentStandings, previousStandings, currentFixture } = useStandings(
    players,
    predictions,
    activeResults,
    playedFixtures,
    replayIndex
  );

  // Always use full standings (not replay-sliced) for the player card modal
  const latestStandings = useMemo(
    () => calculateStandings(players, predictions, activeResults),
    [players, predictions, activeResults]
  );

  const selectedPlayer = useMemo(
    () => players.find((p) => p.id === selectedPlayerId) ?? null,
    [players, selectedPlayerId]
  );

  const selectedStanding = useMemo(
    () => latestStandings.find((s) => s.player.id === selectedPlayerId) ?? null,
    [latestStandings, selectedPlayerId]
  );

  const now = useMemo(() => new Date(), []);

  if (usersLoading || resultsLoading) {
    return <LeaderboardSkeleton />;
  }

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 space-y-4">
        <div className="space-y-4">
          <ReplayControls
            fixtures={playedFixtures}
            currentIndex={replayIndex}
            onPrev={() => setReplayIndex((i) => Math.max(-1, i - 1))}
            onNext={() => setReplayIndex((i) => Math.min(playedFixtures.length - 1, i + 1))}
          />

          {isGuest && <SignUpPrompt />}

          {currentStandings.length === 0 && <EmptyState />}

          <div className="space-y-2">
            {currentStandings.map((standing: PlayerStanding) => (
              <LeaderboardRow
                key={standing.player.id}
                standing={standing}
                isViewer={standing.player.id === viewerId}
                onClick={() => setSelectedPlayerId(standing.player.id)}
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

      {selectedPlayer && (
        <PlayerCardModal
          player={selectedPlayer}
          standing={selectedStanding}
          predictions={predictions}
          multiChips={allChips}
          fixtures={fixtures}
          results={activeResults}
          now={now}
          isViewer={selectedPlayer.id === viewerId}
          onClose={() => setSelectedPlayerId(null)}
        />
      )}
    </>
  );
}

function getFixturePoints(standings: PlayerStanding[], playerId: string, fixtureId: string) {
  const standing = standings.find((s) => s.player.id === playerId);
  return standing?.matchPoints.find((mp) => mp.fixtureId === fixtureId)?.points ?? 0;
}

function getMultiChipApplied(standings: PlayerStanding[], playerId: string, fixtureId: string) {
  const standing = standings.find((s) => s.player.id === playerId);
  return standing?.matchPoints.find((mp) => mp.fixtureId === fixtureId)?.multiChipApplied ?? false;
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
    multiChipApplied: getMultiChipApplied(standings, playerId, currentFixtureId),
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

const SKELETON_NAME_WIDTHS = ['w-36', 'w-24', 'w-32', 'w-28', 'w-40'];

function SkeletonRow({ index }: { index: number }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-lg bg-wc-ink border border-wc-white/10 animate-pulse"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="w-7 h-5 rounded bg-wc-white/10 shrink-0" />
      <div className="w-10 h-10 rounded-full bg-wc-white/10 shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className={`h-5 rounded bg-wc-white/10 ${SKELETON_NAME_WIDTHS[index]}`} />
        <div className="h-3 rounded bg-wc-white/10 w-20" />
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <div className="w-8 h-7 rounded bg-wc-white/10" />
        <div className="w-5 h-2.5 rounded bg-wc-white/10" />
      </div>
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 space-y-2">
      {SKELETON_NAME_WIDTHS.map((_, i) => (
        <SkeletonRow key={i} index={i} />
      ))}
    </div>
  );
}
