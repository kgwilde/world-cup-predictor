'use client';

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { fixtures } from '@/data/fixtures';
import { allPredictions, allTournamentPicks, allBonusPredictions } from '@/data/entries';
import type { Fixture, Player, Prediction, PublicProfile } from '@/lib/types';
import { getNow, PREDICTIONS_DEADLINE } from '@/lib/deadline';
import { resolveAvatarSrc } from '@/lib/avatar';
import { calculateStandings } from '@/lib/scoring';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useMultiChips } from '@/components/hooks/use_multi_chips';
import { MatchPredictionCard } from '@/components/predictions/MatchPredictionCard';
import PlayerCardModal from '@/components/PlayerCardModal';

function userToPlayer(profile: PublicProfile): Player {
  return {
    id: profile.uid,
    name: (profile.displayName ?? 'Unknown').split(' ')[0],
    teamName: profile.teamName ?? undefined,
    photoUrl: resolveAvatarSrc(profile.avatarUrl, profile.avatarUpdatedAt),
  };
}

export function FixturePredictionModal({
  fixture,
  onClose,
}: {
  fixture: Fixture;
  onClose: () => void;
}) {
  const now = useMemo(() => getNow(), []);
  const firestoreUsers = useAuthStore((s) => s.allUsers);
  const usersLoading = useAuthStore((s) => s.usersLoading);
  const viewerId = useAuthStore((s) => s.user?.uid ?? null);
  const storeResults = useAuthStore((s) => s.results);
  const resultsLoading = useAuthStore((s) => s.resultsLoading);
  const isLoading = usersLoading || resultsLoading;
  const resultMap = useMemo(
    () => new Map(storeResults.map((r) => [r.fixtureId, r])),
    [storeResults]
  );
  const { chips: allChips } = useMultiChips();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const deadlinePassed = useMemo(() => getNow() >= PREDICTIONS_DEADLINE, []);
  const players = useMemo<Player[]>(
    () =>
      firestoreUsers
        .filter((u) => u.approved && !!u.teamName)
        .filter((u) => !deadlinePassed || !!u.predictionFileUrl)
        .map(userToPlayer)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [firestoreUsers, deadlinePassed]
  );

  const visiblePredictions = useMemo<Prediction[]>(
    () =>
      allPredictions.map((p) => ({
        ...p,
        multiChip: allChips.some((c) => c.playerId === p.playerId && c.fixtureId === p.fixtureId),
      })),
    [allChips]
  );

  const finalResults = useMemo(
    () => storeResults.filter((r) => r.status !== 'live' && r.status !== 'half_time'),
    [storeResults]
  );

  const standings = useMemo(
    () => calculateStandings(players, visiblePredictions, finalResults),
    [players, visiblePredictions, finalResults]
  );

  const rankMap = useMemo(
    () => new Map(standings.map((s) => [s.player.id, s.rank])),
    [standings]
  );

  const selectedPlayer = useMemo(
    () => players.find((p) => p.id === selectedPlayerId) ?? null,
    [players, selectedPlayerId]
  );
  const selectedStanding = useMemo(
    () => standings.find((s) => s.player.id === selectedPlayerId) ?? null,
    [standings, selectedPlayerId]
  );
  const selectedTournamentPicks = useMemo(
    () => allTournamentPicks.find((t) => t.playerId === selectedPlayerId) ?? null,
    [selectedPlayerId]
  );
  const selectedBonusPredictions = useMemo(
    () => allBonusPredictions.find((b) => b.playerId === selectedPlayerId) ?? null,
    [selectedPlayerId]
  );

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex flex-col bg-wc-bone dark:bg-wc-black"
        style={{ animation: 'modal-slide-up 0.45s cubic-bezier(0.32, 0.72, 0, 1) both' }}
      >
        <div className="flex items-center justify-end px-4 py-3 shrink-0 border-b border-black/10 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-black/10 dark:bg-white/10 text-wc-black/60 dark:text-white/60 hover:text-wc-black dark:hover:text-white hover:bg-black/15 dark:hover:bg-white/15 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-4">
          <MatchPredictionCard
            fixture={fixture}
            now={now}
            players={players}
            allPredictions={visiblePredictions}
            allChips={allChips}
            result={resultMap.get(fixture.id)}
            rankMap={rankMap}
            viewerId={viewerId}
            isLoading={isLoading}
            isLatest={false}
            onPlayerClick={setSelectedPlayerId}
          />
        </div>
      </div>

      {selectedPlayer && (
        <PlayerCardModal
          player={selectedPlayer}
          standing={selectedStanding}
          predictions={visiblePredictions}
          multiChips={allChips}
          fixtures={fixtures}
          results={storeResults}
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
