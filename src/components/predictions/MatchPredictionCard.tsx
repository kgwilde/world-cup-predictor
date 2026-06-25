'use client';

import { Fragment, useMemo, useState } from 'react';
import type { Fixture, MatchResult, MultiChip, Player, Prediction } from '@/lib/types';
import { getResultType } from '@/lib/predictions';
import { scoreMatch } from '@/lib/scoring';
import { FixtureCard, isFixtureLive } from '@/components/FixtureSlider';
import Avatar from '@/components/leaderboard/Avatar';
import PredictionRow from '@/components/predictions/PredictionRow';
import ScoreChip from '@/components/predictions/ScoreChip';
import { PointsBadge } from '@/components/PointsBadge';

function getRingClass(rank: number | undefined): string {
  if (rank === 1) return 'ring-2 ring-[#FFD000] ring-offset-2 ring-offset-wc-ink';
  if (rank === 2) return 'ring-2 ring-[#E2E8F0]/90 ring-offset-2 ring-offset-wc-ink';
  return 'ring-2 ring-white/15 ring-offset-2 ring-offset-wc-ink';
}

function PlaceholderRow({ player }: { player: Player }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-black/10 dark:border-white/10 py-3 last:border-0">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar name={player.name} photoUrl={player.photoUrl} size={30} />
        <span className="text-sm font-medium leading-snug text-wc-black/90 dark:text-white/90">{player.name}</span>
      </div>
      <div className="rounded-lg border border-dashed border-black/20 dark:border-white/20 px-3 py-1 text-sm font-semibold text-wc-black/20 dark:text-white/20 tabular-nums">
        ? – ?
      </div>
    </div>
  );
}

const AVATAR_SIZE = 26;
const AVATAR_OFFSET = 16;

function AvatarStack({ players }: { players: Player[] }) {
  const containerWidth = AVATAR_SIZE + (players.length - 1) * AVATAR_OFFSET;

  return (
    <div className="relative shrink-0" style={{ width: containerWidth, height: AVATAR_SIZE }}>
      {players.map((player, i) => (
        <div key={player.id} className="absolute" style={{ left: i * AVATAR_OFFSET, zIndex: i }}>
          <div className="rounded-full ring-2 ring-white dark:ring-wc-ink">
            <Avatar name={player.name} photoUrl={player.photoUrl} size={AVATAR_SIZE} />
          </div>
        </div>
      ))}
    </div>
  );
}

function AvatarGroupModal({
  players,
  rankMap,
  onSelect,
  onClose,
}: {
  players: Player[];
  rankMap: Map<string, number>;
  onSelect: (playerId: string) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center"
      style={{ animation: 'modal-fade-in 0.2s ease both' }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />
      <div
        className="relative flex flex-col items-center gap-5 rounded-2xl bg-white dark:bg-wc-ink border border-black/10 dark:border-white/10 px-8 py-7 shadow-2xl mx-6"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[11px] font-semibold uppercase tracking-widest text-wc-black/35 dark:text-white/35">
          Select a player
        </p>
        <div className="flex flex-wrap justify-center gap-5">
          {players.map((player, i) => (
            <button
              key={player.id}
              type="button"
              onClick={() => {
                onSelect(player.id);
                onClose();
              }}
              className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
              style={{
                animation: 'avatar-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both',
                animationDelay: `${i * 55}ms`,
              }}
            >
              <div className={`rounded-full ${getRingClass(rankMap.get(player.id))}`}>
                <Avatar name={player.name} photoUrl={player.photoUrl} size={60} />
              </div>
              <span className="text-xs font-medium text-wc-black/80 dark:text-white/80 text-center max-w-[64px] leading-tight">
                {player.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function GroupedPredictionRow({
  predictions,
  players,
  fixture,
  chipped,
  rankMap,
  onPlayerClick,
}: {
  predictions: Prediction[];
  players: Player[];
  fixture: Fixture;
  chipped: boolean;
  rankMap: Map<string, number>;
  onPlayerClick: (playerId: string) => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const groupPlayers = predictions
    .map((p) => players.find((pl) => pl.id === p.playerId))
    .filter((p): p is Player => !!p);
  const first = predictions[0];
  const resultType = getResultType(first.homeGoals, first.awayGoals);
  const names = groupPlayers.map((p) => p.name).join(' · ');

  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-black/10 dark:border-white/10 py-3 last:border-0">
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex min-w-0 flex-1 flex-col gap-1.5 text-left active:opacity-70 transition-opacity"
        >
          <AvatarStack players={groupPlayers} />
          <span className="text-xs text-wc-black/50 dark:text-white/50 truncate leading-none">{names}</span>
        </button>
        <ScoreChip
          homeGoals={first.homeGoals}
          awayGoals={first.awayGoals}
          resultType={resultType}
          homeAccentColor={fixture.homeTeam.accentColor}
          awayAccentColor={fixture.awayTeam.accentColor}
          multiChip={chipped}
        />
      </div>
      {showModal && (
        <AvatarGroupModal
          players={groupPlayers}
          rankMap={rankMap}
          onSelect={onPlayerClick}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

function GroupedPointsRow({
  predictions,
  players,
  fixture,
  pts,
  allChipped,
  rankMap,
  live,
  onPlayerClick,
}: {
  predictions: Prediction[];
  players: Player[];
  fixture: Fixture;
  pts: number;
  allChipped: boolean;
  rankMap: Map<string, number>;
  live?: boolean;
  onPlayerClick: (playerId: string) => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const groupPlayers = predictions
    .map((p) => players.find((pl) => pl.id === p.playerId))
    .filter((p): p is Player => !!p);
  const names = groupPlayers.map((p) => p.name).join(' · ');
  const first = predictions[0];
  const resultType = getResultType(first.homeGoals, first.awayGoals);
  return (
    <>
    <div className="flex items-center justify-between gap-3 border-b border-black/10 dark:border-white/10 py-3 last:border-0">
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="flex min-w-0 flex-1 flex-col gap-1.5 text-left active:opacity-70 transition-opacity"
      >
        <AvatarStack players={groupPlayers} />
        <span className="text-xs text-wc-black/50 dark:text-white/50 truncate leading-none">{names}</span>
      </button>
      <div className="flex items-center gap-2 shrink-0">
        <ScoreChip
          homeGoals={first.homeGoals}
          awayGoals={first.awayGoals}
          resultType={resultType}
          homeAccentColor={fixture.homeTeam.accentColor}
          awayAccentColor={fixture.awayTeam.accentColor}
        />
        <PointsBadge points={pts} multiChipApplied={allChipped} live={live} />
      </div>
    </div>
    {showModal && (
      <AvatarGroupModal
        players={groupPlayers}
        rankMap={rankMap}
        onSelect={onPlayerClick}
        onClose={() => setShowModal(false)}
      />
    )}
    </>
  );
}

const SKELETON_NAME_WIDTHS = ['w-24', 'w-32', 'w-20', 'w-28', 'w-16'];

function SkeletonPredictionRow({ index }: { index: number }) {
  return (
    <div
      className="flex items-center justify-between gap-3 border-b border-black/10 dark:border-white/10 py-3 last:border-0 animate-pulse"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="w-[30px] h-[30px] rounded-full bg-black/10 dark:bg-white/10 shrink-0" />
        <div className={`h-4 rounded bg-black/10 dark:bg-white/10 ${SKELETON_NAME_WIDTHS[index % SKELETON_NAME_WIDTHS.length]}`} />
      </div>
      <div className="w-14 h-8 rounded-lg bg-black/10 dark:bg-white/10 shrink-0" />
    </div>
  );
}

export function MatchPredictionCard({
  fixture,
  now,
  players,
  allPredictions,
  allChips,
  result,
  rankMap,
  viewerId,
  isLoading,
  isLatest,
  onPlayerClick,
}: {
  fixture: Fixture;
  now: Date;
  players: Player[];
  allPredictions: Prediction[];
  allChips: MultiChip[];
  result?: MatchResult;
  rankMap: Map<string, number>;
  viewerId: string | null;
  isLoading: boolean;
  isLatest: boolean;
  onPlayerClick: (playerId: string) => void;
}) {
  const hasStarted = new Date(fixture.kickoff) <= now;
  const isFinal = result?.status === 'final';
  const isLive = result?.status === 'live' || result?.status === 'half_time';

  const fixturePredictions = useMemo(
    () => allPredictions.filter((p) => p.fixtureId === fixture.id),
    [fixture.id, allPredictions]
  );

  const chipSet = useMemo(
    () => new Set(allChips.filter((c) => c.fixtureId === fixture.id).map((c) => c.playerId)),
    [allChips, fixture.id]
  );

  const sortedPredictions = useMemo(() => {
    if (!isFinal && !isLive) {
      return [...fixturePredictions].sort((a, b) => {
        const homeDiff = b.homeGoals - a.homeGoals;
        if (homeDiff !== 0) return homeDiff;
        const awayDiff = b.awayGoals - a.awayGoals;
        if (awayDiff !== 0) return awayDiff;
        const pa = players.find((p) => p.id === a.playerId);
        const pb = players.find((p) => p.id === b.playerId);
        return (pa?.name ?? '').localeCompare(pb?.name ?? '');
      });
    }
    return [...fixturePredictions].sort((a, b) => {
      const hasChipA = chipSet.has(a.playerId);
      const hasChipB = chipSet.has(b.playerId);
      const ptsA = scoreMatch({ ...a, multiChip: hasChipA }, result!).points;
      const ptsB = scoreMatch({ ...b, multiChip: hasChipB }, result!).points;
      return ptsB - ptsA;
    });
  }, [fixturePredictions, isFinal, isLive, result, players, chipSet]);

  const pointGroups = useMemo(() => {
    if (!isFinal && !isLive) return null;
    type Group = { key: string; pts: number; allChipped: boolean; predictions: Prediction[] };
    const groupMap = new Map<string, Group>();
    for (const pred of sortedPredictions) {
      const hasChipP = chipSet.has(pred.playerId);
      const pts = scoreMatch({ ...pred, multiChip: hasChipP }, result).points;
      const key = `${pred.homeGoals}-${pred.awayGoals}-${hasChipP}`;
      const existing = groupMap.get(key);
      if (existing) {
        existing.predictions.push(pred);
        existing.allChipped = existing.allChipped && hasChipP;
      } else {
        groupMap.set(key, { key, pts, allChipped: hasChipP, predictions: [pred] });
      }
    }
    const groups = [...groupMap.values()].sort((a, b) => b.pts - a.pts);
    return groups.some((g) => g.predictions.length > 1) ? groups : null;
  }, [isFinal, isLive, result, sortedPredictions, chipSet]);

  const predictionGroups = useMemo(() => {
    if (isFinal || isLive) return null;
    const groupMap = new Map<
      string,
      { h: number; a: number; chipped: boolean; predictions: Prediction[] }
    >();
    for (const pred of sortedPredictions) {
      const chipped = chipSet.has(pred.playerId);
      const key = hasStarted
        ? `${pred.homeGoals}-${pred.awayGoals}-${chipped}`
        : `${pred.homeGoals}-${pred.awayGoals}`;
      const existing = groupMap.get(key);
      if (existing) existing.predictions.push(pred);
      else
        groupMap.set(key, { h: pred.homeGoals, a: pred.awayGoals, chipped, predictions: [pred] });
    }
    const outcomeOrder: Record<string, number> = { 'home-win': 0, draw: 1, 'away-win': 2 };
    const groups = [...groupMap.values()]
      .map(({ h, a, chipped, predictions }) => {
        const resultType = getResultType(h, a);
        const key = `${h}-${a}-${chipped}`;
        return { key, predictions, resultType, chipped, outcomeOrder: outcomeOrder[resultType] };
      })
      .sort((a, b) => a.outcomeOrder - b.outcomeOrder || (a.chipped ? 1 : -1));
    return groups.some((g) => g.predictions.length > 1) ? groups : null;
  }, [sortedPredictions, chipSet, hasStarted, isFinal, isLive]);

  const predictingIds = useMemo(
    () => new Set(fixturePredictions.map((p) => p.playerId)),
    [fixturePredictions]
  );
  const unpredictedPlayers = useMemo(
    () => players.filter((p) => !predictingIds.has(p.id)),
    [players, predictingIds]
  );

  const latestBanner = isLatest && (
    <div className="flex items-center gap-1.5 border-b border-wc-gold/30 dark:border-wc-gold/20 bg-wc-gold/20 dark:bg-wc-gold/10 px-4 py-1.5">
      <span className="h-1.5 w-1.5 rounded-full bg-wc-gold" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-wc-gold-deep dark:text-wc-gold">Latest</span>
    </div>
  );

  if (isLoading) {
    return (
      <div className={`overflow-hidden rounded-2xl bg-white dark:bg-wc-ink ${isLatest ? 'ring-1 ring-wc-gold/70 dark:ring-wc-gold/50' : ''}`}>
        {latestBanner}
        <div className="p-3">
          <FixtureCard fixture={fixture} now={now} isFullWidth result={result} />
        </div>
        <div className="border-t border-black/10 dark:border-white/10 px-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonPredictionRow key={i} index={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-2xl bg-white dark:bg-wc-ink ${isLatest ? 'ring-1 ring-wc-gold/70 dark:ring-wc-gold/50' : ''}`}>
      {latestBanner}
      <div className="p-3">
        <FixtureCard fixture={fixture} now={now} isFullWidth result={result} />
      </div>
      <div className="border-t border-black/10 dark:border-white/10">
        {pointGroups ? (
          <div className="px-4">
            {pointGroups.map(({ key, pts, allChipped, predictions: groupPreds }) =>
              groupPreds.length >= 2 ? (
                <GroupedPointsRow
                  key={key}
                  predictions={groupPreds}
                  players={players}
                  fixture={fixture}
                  pts={pts}
                  allChipped={allChipped}
                  rankMap={rankMap}
                  live={isLive}
                  onPlayerClick={onPlayerClick}
                />
              ) : (
                <Fragment key={`${key}-solo`}>
                  {groupPreds.map((prediction) => {
                    const hasChip = chipSet.has(prediction.playerId);
                    return (
                      <PredictionRow
                        key={prediction.playerId}
                        prediction={prediction}
                        player={players.find((p) => p.id === prediction.playerId)}
                        fixture={fixture}
                        points={pts}
                        multiChipApplied={hasChip}
                        live={isLive}
                        onPlayerClick={onPlayerClick}
                      />
                    );
                  })}
                </Fragment>
              )
            )}
            {unpredictedPlayers.length > 0 && (
              <div
                className={sortedPredictions.length > 0 ? 'border-t border-black/20 dark:border-white/20 mt-1 pt-1' : ''}
              >
                {unpredictedPlayers.map((player) => (
                  <PlaceholderRow key={player.id} player={player} />
                ))}
              </div>
            )}
          </div>
        ) : predictionGroups ? (
          <div className="px-3 pt-2 pb-3 flex flex-col gap-1.5">
            {predictionGroups.map((group) => {
              const accentColor =
                group.resultType === 'home-win'
                  ? fixture.homeTeam.accentColor
                  : group.resultType === 'away-win'
                    ? fixture.awayTeam.accentColor
                    : null;
              const groupStyle = accentColor
                ? { borderLeft: `2px solid ${accentColor}66`, background: `${accentColor}14` }
                : undefined;
              const drawClass =
                group.resultType === 'draw' ? 'bg-black/[0.04] dark:bg-white/[0.04] border-l-2 border-black/20 dark:border-white/20' : '';
              return (
                <div key={group.key} className={`rounded-xl px-4 ${drawClass}`} style={groupStyle}>
                  {group.predictions.length >= 2 ? (
                    <GroupedPredictionRow
                      predictions={group.predictions}
                      players={players}
                      fixture={fixture}
                      chipped={group.chipped && hasStarted}
                      rankMap={rankMap}
                      onPlayerClick={onPlayerClick}
                    />
                  ) : (
                    group.predictions.map((prediction) => {
                      const hasChip = chipSet.has(prediction.playerId);
                      return (
                        <PredictionRow
                          key={prediction.playerId}
                          prediction={prediction}
                          player={players.find((p) => p.id === prediction.playerId)}
                          fixture={fixture}
                          multiChipApplied={hasChip && (hasStarted || prediction.playerId === viewerId)}
                          onPlayerClick={onPlayerClick}
                        />
                      );
                    })
                  )}
                </div>
              );
            })}
            {unpredictedPlayers.length > 0 && (
              <div className="bg-black/[0.03] dark:bg-white/[0.03] rounded-xl px-4">
                {unpredictedPlayers.map((player) => (
                  <PlaceholderRow key={player.id} player={player} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="px-4">
            {sortedPredictions.map((prediction) => {
              const hasChip = chipSet.has(prediction.playerId);
              const pts = (isFinal || isLive)
                ? scoreMatch({ ...prediction, multiChip: hasChip }, result!).points
                : undefined;
              return (
                <PredictionRow
                  key={prediction.playerId}
                  prediction={prediction}
                  player={players.find((p) => p.id === prediction.playerId)}
                  fixture={fixture}
                  points={pts}
                  multiChipApplied={hasChip && (hasStarted || prediction.playerId === viewerId)}
                  live={isLive}
                  onPlayerClick={onPlayerClick}
                />
              );
            })}
            {unpredictedPlayers.length > 0 && (
              <div
                className={sortedPredictions.length > 0 ? 'border-t border-black/20 dark:border-white/20 mt-1 pt-1' : ''}
              >
                {unpredictedPlayers.map((player) => (
                  <PlaceholderRow key={player.id} player={player} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
