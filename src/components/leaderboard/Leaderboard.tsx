'use client';

import { useEffect, useMemo, useState } from 'react';

import { useAuthStore } from '@/app/stores/useAuthStore';
import { useStandings, buildTimeline, applySpecialPoints } from '@/components/hooks/use_standings';
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
  MatchResult,
  Player,
  PlayerStanding,
  Prediction,
  PublicProfile,
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
  const firestoreUsers = useAuthStore((s) => s.allUsers);
  const usersLoading = useAuthStore((s) => s.usersLoading);
  const storeResults = useAuthStore((s) => s.results);
  const resultsLoading = useAuthStore((s) => s.resultsLoading);
  const specialEvents = useAuthStore((s) => s.specialEvents);
  const specialEventsLoading = useAuthStore((s) => s.specialEventsLoading);

  const activeResults: MatchResult[] = storeResults.filter((r) => r.status !== 'live' && r.status !== 'half_time');

  const playedFixtures = useMemo(() => {
    const withResults = new Set(activeResults.map((r) => r.fixtureId));
    return fixtures
      .filter((f) => withResults.has(f.id))
      .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime());
  }, [activeResults]);

  const timeline = useMemo(
    () => buildTimeline(playedFixtures, specialEvents),
    [playedFixtures, specialEvents],
  );

  const [replayIndex, setReplayIndex] = useState(-1);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const { chips: allChips } = useMultiChips();

  useEffect(() => {
    if (!resultsLoading && !specialEventsLoading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReplayIndex(timeline.length - 1);
    }
  }, [resultsLoading, specialEventsLoading, timeline.length]);

  const deadlinePassed = getNow() >= PREDICTIONS_DEADLINE;
  const players: Player[] = firestoreUsers
    .filter((u) => u.approved === true)
    .filter((u) => !deadlinePassed || !!u.predictionFileUrl)
    .map(userToPlayer);
  const predictions = useMemo<Prediction[]>(() => {
    const staticWithChips = allPredictions.map((p) => ({
      ...p,
      multiChip: allChips.some((c) => c.playerId === p.playerId && c.fixtureId === p.fixtureId),
    }));

    const nowMs = getNow().getTime();
    const knockoutPreds: Prediction[] = [];
    for (const user of firestoreUsers) {
      const kp = user.knockoutPredictions;
      if (!kp) continue;
      for (const [fixtureId, { homeGoals, awayGoals }] of Object.entries(kp)) {
        const f = fixtures.find((fix) => fix.id === fixtureId);
        if (!f) continue;
        if (new Date(f.kickoff).getTime() > nowMs && user.uid !== viewerId) continue;
        knockoutPreds.push({
          playerId: user.uid,
          fixtureId,
          homeGoals,
          awayGoals,
          multiChip: allChips.some((c) => c.playerId === user.uid && c.fixtureId === fixtureId),
        });
      }
    }

    return [...staticWithChips, ...knockoutPreds];
  }, [allChips, firestoreUsers, viewerId]);

  const { currentStandings, previousStandings, currentStep } = useStandings(
    players,
    predictions,
    activeResults,
    timeline,
    replayIndex,
  );

  const latestStandings = useMemo(() => {
    const base = calculateStandings(players, predictions, activeResults);
    return applySpecialPoints(base, specialEvents);
  }, [players, predictions, activeResults, specialEvents]);

  const selectedPlayer = useMemo(
    () => players.find((p) => p.id === selectedPlayerId) ?? null,
    [players, selectedPlayerId]
  );

  const selectedStanding = useMemo(
    () => latestStandings.find((s) => s.player.id === selectedPlayerId) ?? null,
    [latestStandings, selectedPlayerId]
  );

  const selectedTournamentPicks = useMemo(
    () => allTournamentPicks.find((t) => t.playerId === selectedPlayerId) ?? null,
    [selectedPlayerId]
  );

  const selectedBonusPredictions = useMemo(
    () => allBonusPredictions.find((b) => b.playerId === selectedPlayerId) ?? null,
    [selectedPlayerId]
  );

  const now = useMemo(() => new Date(), []);
  const isLoading = usersLoading || resultsLoading || specialEventsLoading;

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 space-y-4 pb-8">
        <div className="space-y-4">
          <ReplayControls
            timeline={timeline}
            currentIndex={replayIndex}
            onPrev={() => setReplayIndex((i) => Math.max(-1, i - 1))}
            onNext={() => setReplayIndex((i) => Math.min(timeline.length - 1, i + 1))}
          />

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
                      allTournamentPicks.find((t) => t.playerId === standing.player.id)?.winner
                    }
                    onClick={() => setSelectedPlayerId(standing.player.id)}
                    matchDelta={buildDelta(currentStandings, previousStandings, currentStep, standing.player.id)}
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

function getSpecialEventPoints(standings: PlayerStanding[], playerId: string, eventId: string) {
  const standing = standings.find((s) => s.player.id === playerId);
  return standing?.specialPoints.find((sp) => sp.eventId === eventId)?.points ?? 0;
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

function buildDelta(
  standings: PlayerStanding[],
  previousStandings: PlayerStanding[] | null,
  currentStep: import('@/components/hooks/use_standings').TimelineStep | null,
  playerId: string,
) {
  if (!currentStep) return null;
  if (!standings.some((s) => s.player.id === playerId)) return null;

  const rankChange = getRankChange(standings, previousStandings, playerId);

  if (currentStep.kind === 'fixture') {
    return {
      points: getFixturePoints(standings, playerId, currentStep.fixture.id),
      rankChange,
      multiChipApplied: getMultiChipApplied(standings, playerId, currentStep.fixture.id),
    };
  }

  return {
    points: getSpecialEventPoints(standings, playerId, currentStep.event.id),
    rankChange,
    multiChipApplied: false,
  };
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="font-display text-4xl font-bold text-wc-black/20 dark:text-wc-white/20 mb-2">WE ARE</div>
      <div className="font-display text-6xl font-bold text-wc-black/20 dark:text-wc-white/20">26</div>
      <p className="text-wc-black/40 dark:text-wc-white/40 text-sm font-body mt-4">
        No results yet. Check back after the first match.
      </p>
    </div>
  );
}

const SKELETON_NAME_WIDTHS = ['w-36', 'w-24', 'w-32', 'w-28', 'w-40', 'w-20'];

function SkeletonRow({ index }: { index: number }) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-gradient-to-r from-gray-100 to-gray-50 dark:from-[#10151f] dark:to-[#131a26] border border-black/[0.07] dark:border-white/[0.07] animate-pulse"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="w-[18px] h-5 rounded bg-wc-black/10 dark:bg-wc-white/10 shrink-0" />
      <div className="w-[42px] h-[42px] rounded-full bg-wc-black/10 dark:bg-wc-white/10 shrink-0" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className={`h-5 rounded bg-wc-black/10 dark:bg-wc-white/10 ${SKELETON_NAME_WIDTHS[index]}`} />
        <div className="h-3 rounded bg-wc-black/10 dark:bg-wc-white/10 w-16" />
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <div className="h-5 flex items-center justify-end">
          <div className="w-8 h-4 rounded-md bg-wc-black/10 dark:bg-wc-white/10" />
        </div>
        <div className="flex items-baseline gap-1">
          <div className="w-9 h-7 rounded bg-wc-black/10 dark:bg-wc-white/10" />
          <div className="w-5 h-2.5 rounded bg-wc-black/10 dark:bg-wc-white/10" />
        </div>
      </div>
      <div className="w-4 h-4 rounded bg-wc-black/10 dark:bg-wc-white/10 shrink-0" />
    </div>
  );
}
