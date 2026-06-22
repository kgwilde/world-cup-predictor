'use client';

import { Fragment, useMemo, useRef, useState, useEffect } from 'react';
import { Clock, Lock, X } from 'lucide-react';
import { fixtures } from '@/data/fixtures';
import { allPredictions, allTournamentPicks, allBonusPredictions } from '@/data/entries';
import type {
  Fixture,
  MatchResult,
  MultiChip,
  Player,
  Prediction,
  PublicProfile,
} from '@/lib/types';
import { getNow, PREDICTIONS_DEADLINE } from '@/lib/deadline';
import { getResultType } from '@/lib/predictions';
import { scoreMatch, calculateStandings } from '@/lib/scoring';
import { resolveAvatarSrc } from '@/lib/avatar';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useMultiChips } from '@/components/hooks/use_multi_chips';
import { FixtureCard, isFixtureLive } from '@/components/FixtureSlider';
import Avatar from '@/components/leaderboard/Avatar';
import PredictionRow from '@/components/predictions/PredictionRow';
import ScoreChip from '@/components/predictions/ScoreChip';
import { PointsBadge } from '@/components/PointsBadge';
import SpecialsTab from '@/components/predictions/SpecialsTab';
import PlayerCardModal from '@/components/PlayerCardModal';

const GROUP_FIXTURE_IDS = new Set(fixtures.filter((f) => f.stage === 'group').map((f) => f.id));
const GROUP_CHIP_LIMIT = 10;
// 03:00 Irish time (UTC+1 in summer)
const KNOCKOUT_UNLOCK = new Date('2026-06-28T02:00:00Z');

function getRingClass(rank: number | undefined): string {
  if (rank === 1) return 'ring-2 ring-[#FFD000] ring-offset-2 ring-offset-wc-ink';
  if (rank === 2) return 'ring-2 ring-[#E2E8F0]/90 ring-offset-2 ring-offset-wc-ink';
  return 'ring-2 ring-white/15 ring-offset-2 ring-offset-wc-ink';
}

function userToPlayer(profile: PublicProfile): Player {
  return {
    id: profile.uid,
    name: (profile.displayName ?? 'Unknown').split(' ')[0],
    teamName: profile.teamName ?? undefined,
    photoUrl: resolveAvatarSrc(profile.avatarUrl, profile.avatarUpdatedAt),
  };
}

function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat('en-IE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
}

function formatDateTile(dateKey: string): { weekday: string; day: string; month: string } {
  const d = new Date(dateKey);
  return {
    weekday: new Intl.DateTimeFormat('en-IE', { weekday: 'short' }).format(d).toUpperCase(),
    day: String(d.getDate()),
    month: new Intl.DateTimeFormat('en-IE', { month: 'short' }).format(d).toUpperCase(),
  };
}

function getFixtureDateKey(kickoffUtc: string) {
  const d = new Date(kickoffUtc);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildAvailableDates(allFixtures: Fixture[]) {
  return [...new Set(allFixtures.map((f) => getFixtureDateKey(f.kickoff)))].sort();
}

function getDefaultSelectedDate(dateKeys: string[], today: Date) {
  const todayKey = getFixtureDateKey(today.toISOString());
  if (dateKeys.includes(todayKey)) return todayKey;
  const pastDates = dateKeys.filter((k) => k < todayKey);
  return pastDates.length > 0 ? pastDates[pastDates.length - 1] : dateKeys[0];
}

// ─── All Predictions tab ─────────────────────────────────────────────────────

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

function MatchPredictionCard({
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
  const isLive = result?.status === 'live';

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

// ─── My Chips tab ─────────────────────────────────────────────────────────────

function ChipCounter({ used }: { used: number }) {
  const total = GROUP_CHIP_LIMIT;
  const remaining = total - used;
  return (
    <div className="bg-white dark:bg-wc-ink rounded-xl px-4 py-3.5">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-sm font-bold text-wc-black dark:text-white">
          {remaining} of {total} chips remaining
        </span>
        <span className="text-xs text-wc-black/60 dark:text-white/60">{used} used</span>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-2 rounded-full transition-colors ${i < remaining ? 'bg-wc-gold' : 'bg-black/12 dark:bg-white/12'}`}
          />
        ))}
      </div>
      <p className="text-xs text-wc-black/60 dark:text-white/60 mt-3">A chip doubles points for that prediction.</p>
      <div className="flex items-center gap-2 mt-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
        <Clock size={11} className="text-amber-400/80 shrink-0" />
        <p className="text-[11px] text-amber-700 dark:text-amber-300/80">
          These chips can only be used on group stage fixtures
        </p>
      </div>
    </div>
  );
}

function ChipFixtureRow({
  fixture,
  prediction,
  hasChip,
  chipsUsed,
  hasStarted,
  result,
  onApply,
  onRemove,
}: {
  fixture: Fixture;
  prediction: Prediction | undefined;
  hasChip: boolean;
  chipsUsed: number;
  hasStarted: boolean;
  result?: MatchResult;
  onApply: () => void;
  onRemove: () => void;
}) {
  const resultType = prediction
    ? getResultType(prediction.homeGoals, prediction.awayGoals)
    : 'draw';
  const pts =
    result && prediction
      ? scoreMatch({ ...prediction, multiChip: hasChip }, result).points
      : undefined;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-black/8 dark:border-white/8 last:border-0">
      {/* Teams */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-xs text-wc-black/70 dark:text-white/70 truncate">
          <span>{fixture.homeTeam.name}</span>
          <span className="text-wc-black/45 dark:text-white/45">vs</span>
          <span>{fixture.awayTeam.name}</span>
        </div>
        {!hasStarted && (
          <p className="text-[10px] text-wc-black/45 dark:text-white/45 mt-0.5 tabular-nums">
            {new Intl.DateTimeFormat('en-IE', { hour: '2-digit', minute: '2-digit' }).format(
              new Date(fixture.kickoff)
            )}
          </p>
        )}
      </div>

      {/* Score chip */}
      {prediction ? (
        <ScoreChip
          homeGoals={prediction.homeGoals}
          awayGoals={prediction.awayGoals}
          resultType={resultType}
          homeAccentColor={fixture.homeTeam.accentColor}
          awayAccentColor={fixture.awayTeam.accentColor}
          multiChip={false}
        />
      ) : (
        <span className="text-xs text-wc-black/20 dark:text-white/20 italic">No prediction</span>
      )}

      {/* Points (if result exists) */}
      {pts !== undefined && <PointsBadge points={pts} multiChipApplied={hasChip && hasStarted} />}

      {/* Chip toggle */}
      {prediction &&
        (hasStarted ? (
          hasChip ? (
            <span className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-wc-black/35 dark:text-white/35 bg-black/[0.07] dark:bg-white/[0.07] border border-black/12 dark:border-white/12 rounded-full px-2 py-1">
              <Lock size={10} />
              Locked
            </span>
          ) : null
        ) : hasChip ? (
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 flex items-center gap-1 text-[11px] font-bold rounded-full px-2 py-1 border transition-colors text-wc-gold bg-wc-gold/20 border-wc-gold/60 active:bg-red-500/15 active:border-red-500/40 active:text-red-400"
          >
            ✓ Applied
            <X size={9} className="opacity-70" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onApply}
            disabled={chipsUsed >= GROUP_CHIP_LIMIT}
            className="shrink-0 text-[11px] font-semibold text-wc-gold/60 border border-wc-gold/25 rounded-full px-2.5 py-1 hover:text-wc-gold hover:border-wc-gold/60 active:opacity-70 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
          >
            + Chip
          </button>
        ))}
    </div>
  );
}

const KNOCKOUT_CHIP_LIMIT = 5;
const KNOCKOUT_TEAL = '#2DD4BF';

function KnockoutChipCounter({ used }: { used: number }) {
  const [isLocked, setIsLocked] = useState(true);

  useEffect(() => {
    setIsLocked(Date.now() < KNOCKOUT_UNLOCK.getTime());
  }, []);

  const remaining = KNOCKOUT_CHIP_LIMIT - used;

  return (
    <div className={`bg-white dark:bg-wc-ink rounded-xl px-4 py-3.5 transition-opacity ${isLocked ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-sm font-bold text-wc-black dark:text-white flex items-center gap-1.5">
          {isLocked && <Lock size={13} className="text-wc-black/60 dark:text-white/60" />}
          {remaining} of {KNOCKOUT_CHIP_LIMIT} knockout chips remaining
        </span>
        <span className="text-xs text-wc-black/60 dark:text-white/60">{used} used</span>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: KNOCKOUT_CHIP_LIMIT }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-2 rounded-full transition-colors"
            style={{ backgroundColor: i < remaining ? KNOCKOUT_TEAL : 'rgba(0,0,0,0.12)' }}
          />
        ))}
      </div>
      <p className="text-xs text-wc-black/60 dark:text-white/60 mt-3">
        {isLocked
          ? 'Unlocks when the group stage ends'
          : 'A chip doubles points for that prediction.'}
      </p>
    </div>
  );
}

function MyChipsTab({
  viewerId,
  allPredictions,
  allChips,
  results,
  now,
  onApply,
  onRemove,
}: {
  viewerId: string;
  allPredictions: Prediction[];
  allChips: MultiChip[];
  results: MatchResult[];
  now: Date;
  onApply: (fixtureId: string) => void;
  onRemove: (fixtureId: string) => void;
}) {
  const myPredictions = useMemo(
    () =>
      new Map(allPredictions.filter((p) => p.playerId === viewerId).map((p) => [p.fixtureId, p])),
    [allPredictions, viewerId]
  );

  const myChipIds = useMemo(
    () =>
      new Set(
        allChips
          .filter((c) => c.playerId === viewerId && GROUP_FIXTURE_IDS.has(c.fixtureId))
          .map((c) => c.fixtureId)
      ),
    [allChips, viewerId]
  );

  const resultMap = useMemo(() => new Map(results.map((r) => [r.fixtureId, r])), [results]);

  const groupFixtures = useMemo(
    () =>
      fixtures
        .filter((f) => f.stage === 'group')
        .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()),
    []
  );

  const fixturesByDate = useMemo(() => {
    const map = new Map<string, Fixture[]>();
    for (const fixture of groupFixtures) {
      const key = getFixtureDateKey(fixture.kickoff);
      const existing = map.get(key) ?? [];
      existing.push(fixture);
      map.set(key, existing);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [groupFixtures]);

  return (
    <div className="space-y-4">
      <ChipCounter used={myChipIds.size} />
      <KnockoutChipCounter used={0} />

      {fixturesByDate.map(([dateKey, dayFixtures]) => (
        <div key={dateKey} className="bg-white dark:bg-wc-ink rounded-2xl overflow-hidden">
          <div className="px-4 py-2 bg-black/[0.03] dark:bg-white/[0.03] border-b border-black/8 dark:border-white/8">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-wc-black/55 dark:text-white/55">
              {formatDateLabel(new Date(dateKey))}
            </span>
          </div>
          <div className="px-4">
            {dayFixtures.map((fixture) => (
              <ChipFixtureRow
                key={fixture.id}
                fixture={fixture}
                prediction={myPredictions.get(fixture.id)}
                hasChip={myChipIds.has(fixture.id)}
                chipsUsed={myChipIds.size}
                hasStarted={new Date(fixture.kickoff) <= now}
                result={resultMap.get(fixture.id)}
                onApply={() => onApply(fixture.id)}
                onRemove={() => onRemove(fixture.id)}
              />
            ))}
          </div>
        </div>
      ))}

    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'matches' | 'specials' | 'my-chips';

export default function PredictionsPage() {
  const now = useMemo(() => getNow(), []);
  const availableDates = useMemo(() => buildAvailableDates(fixtures), []);
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

  const [activeTab, setActiveTab] = useState<Tab>('matches');
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    getDefaultSelectedDate(availableDates, now)
  );
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const { chips: allChips, apply: applyChip, remove: removeChip } = useMultiChips();

  const myChipsRemaining = useMemo(() => {
    if (!viewerId) return 0;
    const used = allChips.filter(
      (c) => c.playerId === viewerId && GROUP_FIXTURE_IDS.has(c.fixtureId)
    ).length;
    return GROUP_CHIP_LIMIT - used;
  }, [allChips, viewerId]);

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
  const visibleTournamentPicks = allTournamentPicks;
  const visibleBonusPredictions = allBonusPredictions;

  const finalResults = useMemo(
    () => storeResults.filter((r) => r.status !== 'live'),
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

  const fixturesForDay = useMemo(
    () => fixtures.filter((f) => getFixtureDateKey(f.kickoff) === selectedDate),
    [selectedDate]
  );

  const orderedFixturesForDay = useMemo(() => {
    const started: Fixture[] = [];
    const upcoming: Fixture[] = [];
    for (const f of fixturesForDay) {
      if (new Date(f.kickoff).getTime() <= now.getTime()) {
        started.push(f);
      } else {
        upcoming.push(f);
      }
    }
    started.sort((a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime());
    upcoming.sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime());
    return { started, upcoming };
  }, [fixturesForDay, now]);

  const latestFixtureIds = useMemo(() => {
    const { started } = orderedFixturesForDay;
    if (started.length === 0) return new Set<string>();
    const liveFixtures = started.filter((f) =>
      isFixtureLive(new Date(f.kickoff), now, resultMap.get(f.id))
    );
    if (liveFixtures.length > 0) {
      return new Set(liveFixtures.map((f) => f.id));
    }
    const mostRecentKickoff = new Date(started[0].kickoff).getTime();
    return new Set(
      started
        .filter((f) => new Date(f.kickoff).getTime() === mostRecentKickoff)
        .map((f) => f.id)
    );
  }, [orderedFixturesForDay, now, resultMap]);

  const selectedPlayer = useMemo(
    () => players.find((p) => p.id === selectedPlayerId) ?? null,
    [players, selectedPlayerId]
  );

  const selectedStanding = useMemo(
    () => standings.find((s) => s.player.id === selectedPlayerId) ?? null,
    [standings, selectedPlayerId]
  );

  const selectedTournamentPicks = useMemo(
    () => visibleTournamentPicks.find((t) => t.playerId === selectedPlayerId) ?? null,
    [visibleTournamentPicks, selectedPlayerId]
  );

  const selectedBonusPredictions = useMemo(
    () => visibleBonusPredictions.find((b) => b.playerId === selectedPlayerId) ?? null,
    [visibleBonusPredictions, selectedPlayerId]
  );

  const activeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (activeTab !== 'matches') return;
    if (activeButtonRef.current) {
      activeButtonRef.current.scrollIntoView({
        inline: 'center',
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [selectedDate, activeTab]);

  return (
    <>
      <main className="min-h-screen bg-wc-bone dark:bg-wc-black px-4 py-6 text-wc-black dark:text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Predictions</h1>
            <p className="mt-2 max-w-lg text-sm text-wc-black/55 dark:text-white/55">
              Browse match predictions, specials, and manage your chips.
            </p>
          </div>

          {/* Tab strip */}
          <div className="flex w-full border-b border-black/10 dark:border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('matches')}
              className={`flex-1 text-center pb-3 pt-1 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                activeTab === 'matches'
                  ? 'text-wc-black dark:text-white border-wc-blue'
                  : 'text-wc-black/40 dark:text-white/40 border-transparent hover:text-wc-black/70 dark:hover:text-white/70'
              }`}
            >
              Matches
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('specials')}
              className={`flex-1 text-center pb-3 pt-1 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                activeTab === 'specials'
                  ? 'text-wc-black dark:text-white border-wc-blue'
                  : 'text-wc-black/40 dark:text-white/40 border-transparent hover:text-wc-black/70 dark:hover:text-white/70'
              }`}
            >
              Specials
            </button>
            {viewerId && (
              <button
                type="button"
                onClick={() => setActiveTab('my-chips')}
                className={`flex-1 text-center pb-3 pt-1 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                  activeTab === 'my-chips'
                    ? 'text-wc-black dark:text-white border-wc-blue'
                    : 'text-wc-black/40 dark:text-white/40 border-transparent hover:text-wc-black/70 dark:hover:text-white/70'
                }`}
              >
                <span className="inline-flex items-center justify-center gap-1.5">
                  My Chips
                  {myChipsRemaining > 0 && (
                    <span className="w-2 h-2 rounded-full bg-wc-gold shrink-0" />
                  )}
                </span>
              </button>
            )}
          </div>

          {activeTab === 'specials' && (
            <SpecialsTab
              players={players}
              tournamentPicks={visibleTournamentPicks}
              bonusPredictions={visibleBonusPredictions}
            />
          )}

          {activeTab === 'matches' && (
            <div className="space-y-4">
              {/* Date strip */}
              <div className="no-scrollbar flex items-center gap-1 overflow-x-auto pb-2">
                {availableDates.map((dateKey, i) => {
                  const isActive = dateKey === selectedDate;
                  const { weekday, day, month } = formatDateTile(dateKey);
                  const prevMonth = i > 0 ? formatDateTile(availableDates[i - 1]).month : null;
                  const isMonthBoundary = i === 0 || month !== prevMonth;
                  return (
                    <div key={dateKey} className="flex items-center shrink-0 gap-1">
                      {isMonthBoundary && (
                        <span
                          className={`text-[10px] font-bold tracking-widest text-wc-black/25 dark:text-white/25 px-1 ${i > 0 ? 'ml-1' : ''}`}
                        >
                          {month}
                        </span>
                      )}
                      <button
                        ref={isActive ? activeButtonRef : null}
                        type="button"
                        onClick={() => setSelectedDate(dateKey)}
                        className={`flex flex-col items-center w-13 rounded-xl py-3 transition-colors ${
                          isActive
                            ? 'bg-wc-blue text-wc-white'
                            : 'text-wc-black/45 dark:text-white/45 hover:text-wc-black/80 dark:hover:text-white/80 hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                      >
                        <span
                          className={`text-[10px] font-bold tracking-wider leading-none ${isActive ? 'text-wc-white/60' : 'text-wc-black/30 dark:text-white/30'}`}
                        >
                          {weekday}
                        </span>
                        <span className="text-base font-bold leading-tight mt-1">{day}</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-4">
                {orderedFixturesForDay.started.map((fixture) => (
                  <MatchPredictionCard
                    key={fixture.id}
                    fixture={fixture}
                    now={now}
                    players={players}
                    allPredictions={visiblePredictions}
                    allChips={allChips}
                    result={resultMap.get(fixture.id)}
                    rankMap={rankMap}
                    viewerId={viewerId}
                    isLoading={isLoading}
                    isLatest={latestFixtureIds.has(fixture.id)}
                    onPlayerClick={setSelectedPlayerId}
                  />
                ))}
                {orderedFixturesForDay.started.length > 0 && orderedFixturesForDay.upcoming.length > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-wc-black/30 dark:text-white/30">
                      Upcoming
                    </span>
                    <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
                  </div>
                )}
                {orderedFixturesForDay.upcoming.map((fixture) => (
                  <MatchPredictionCard
                    key={fixture.id}
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
                ))}
              </div>
            </div>
          )}

          {activeTab === 'my-chips' && viewerId && (
            <MyChipsTab
              viewerId={viewerId}
              allPredictions={allPredictions}
              allChips={allChips}
              results={storeResults}
              now={now}
              onApply={(fixtureId) => applyChip(viewerId, fixtureId)}
              onRemove={(fixtureId) => removeChip(viewerId, fixtureId)}
            />
          )}
        </div>
      </main>

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
