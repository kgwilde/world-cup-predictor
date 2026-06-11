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
import { allPredictions, allTournamentPicks, allBonusPredictions } from '@/data/entries';
import { resolveAvatarSrc } from '@/lib/avatar';
import { getNow, PREDICTIONS_DEADLINE } from '@/lib/deadline';
import { calculateStandings } from '@/lib/scoring';
import type {
  BonusPredictions,
  MatchResult,
  Player,
  PlayerStanding,
  Prediction,
  PublicProfile,
  TournamentPicks,
} from '@/lib/types';

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

  const activeResults: MatchResult[] = storeResults.filter((r) => r.status !== 'live');

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

  const deadlinePassed = getNow() >= PREDICTIONS_DEADLINE;
  const players: Player[] = firestoreUsers
    .filter((u) => u.approved === true)
    .filter((u) => !deadlinePassed || !!u.predictionFileUrl)
    .map(userToPlayer);
  const predictions = useMemo<Prediction[]>(
    () =>
      allPredictions.map((p) => ({
        ...p,
        multiChip: allChips.some((c) => c.playerId === p.playerId && c.fixtureId === p.fixtureId),
      })),
    [allChips]
  );

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

  const tournamentPicksList: TournamentPicks[] = allTournamentPicks;
  const bonusPredictionsList: BonusPredictions[] = allBonusPredictions;

  const selectedTournamentPicks = useMemo(
    () => tournamentPicksList.find((t) => t.playerId === selectedPlayerId) ?? null,
    [selectedPlayerId]
  );

  const selectedBonusPredictions = useMemo(
    () => bonusPredictionsList.find((b) => b.playerId === selectedPlayerId) ?? null,
    [selectedPlayerId]
  );

  const now = useMemo(() => new Date(), []);

  const isLoading = usersLoading || resultsLoading;

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 space-y-4 pb-8">
        <div className="space-y-4">
          <ReplayControls
            fixtures={playedFixtures}
            currentIndex={replayIndex}
            onPrev={() => setReplayIndex((i) => Math.max(-1, i - 1))}
            onNext={() => setReplayIndex((i) => Math.min(playedFixtures.length - 1, i + 1))}
          />

          {!isLoading && isGuest && <SignUpPrompt />}

          {!isLoading && currentStandings.length === 0 && <EmptyState />}

          <div className="space-y-2">
            {isLoading
              ? SKELETON_NAME_WIDTHS.map((_, i) => <SkeletonRow key={i} index={i} />)
              : currentStandings.map((standing: PlayerStanding) => (
                  <LeaderboardRow
                    key={standing.player.id}
                    standing={standing}
                    isViewer={standing.player.id === viewerId}
                    winnerPick={
                      tournamentPicksList.find((t) => t.playerId === standing.player.id)?.winner
                    }
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
          tournamentPicks={selectedTournamentPicks}
          bonusPredictions={selectedBonusPredictions}
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

const SKELETON_NAME_WIDTHS = ['w-36', 'w-24', 'w-32', 'w-28', 'w-40', 'w-20'];

function SkeletonRow({ index }: { index: number }) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-gradient-to-r from-[#10151f] to-[#131a26] border border-white/[0.07] animate-pulse"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="w-[18px] h-5 rounded bg-wc-white/10 shrink-0" />
      <div className="w-[42px] h-[42px] rounded-full bg-wc-white/10 shrink-0" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className={`h-5 rounded bg-wc-white/10 ${SKELETON_NAME_WIDTHS[index]}`} />
        <div className="h-3 rounded bg-wc-white/10 w-16" />
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <div className="h-5 flex items-center justify-end">
          <div className="w-8 h-4 rounded-md bg-wc-white/10" />
        </div>
        <div className="flex items-baseline gap-1">
          <div className="w-9 h-7 rounded bg-wc-white/10" />
          <div className="w-5 h-2.5 rounded bg-wc-white/10" />
        </div>
      </div>
      <div className="w-4 h-4 rounded bg-wc-white/10 shrink-0" />
    </div>
  );
}
