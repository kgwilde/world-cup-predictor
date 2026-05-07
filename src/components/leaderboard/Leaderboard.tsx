'use client';

import { useState } from 'react';
import { useStandings } from '@/components/hooks/use_standings';
import { PlayerStanding } from '@/lib/types';

import LeaderboardRow from '@/components/leaderboard/LeaderboardRow';
import ReplayControls from '@/components/leaderboard/ReplayControls';

import { fixtures } from '@/data/fixtures';
import { results } from '@/data/results';

const playedFixtures = getPlayedFixtures();

export default function Leaderboard() {
  const [replayIndex, setReplayIndex] = useState(playedFixtures.length - 1);
  const [viewerId] = useState<string | null>(readViewerIdFromStorage());

  const { currentStandings, previousStandings, currentFixture } = useStandings(
    playedFixtures,
    replayIndex
  );

  return (
    <div className="max-w-2xl mx-auto px-4 space-y-4">
      <div className="space-y-4">
        {playedFixtures.length > 0 && (
          <ReplayControls
            fixtures={playedFixtures}
            currentIndex={replayIndex}
            onPrev={() => setReplayIndex((index) => Math.max(-1, index - 1))}
            onNext={() => setReplayIndex((index) => Math.min(playedFixtures.length - 1, index + 1))}
          />
        )}

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

function getPlayedFixtures() {
  const fixtureIdsWithResults = new Set(results.map((result) => result.fixtureId));
  const playedFixtures = fixtures.filter((fixture) => fixtureIdsWithResults.has(fixture.id));
  return playedFixtures.sort(
    (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
  );
}

function readViewerIdFromStorage(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem('playerId');
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
  if (!previousStandings) {
    return 0;
  }
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
  const hasStanding = standings.some((s) => s.player.id === playerId);
  if (!hasStanding) {
    return null;
  }
  return {
    points: getFixturePoints(standings, playerId, currentFixtureId),
    rankChange: getRankChange(standings, previousStandings, playerId),
  };
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="font-display text-4xl font-bold text-wc-black/20 mb-2">WE ARE</div>
      <div className="font-display text-6xl font-bold text-wc-black/20">26</div>
      <p className="text-wc-black/40 text-sm font-body mt-4">
        No results yet. Check back after the first match.
      </p>
    </div>
  );
}
