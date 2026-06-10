'use client';

import { Fragment, useMemo, useRef, useState, useEffect } from 'react';
import { Lock, X } from 'lucide-react';
import { fixtures } from '@/data/fixtures';
import { allPredictions, allTournamentPicks, allBonusPredictions } from '@/data/entries';
import type {
  BonusPredictions,
  Fixture,
  MatchResult,
  MultiChip,
  Player,
  Prediction,
  PublicProfile,
  TournamentPicks,
} from '@/lib/types';
import { getNow, PREDICTIONS_DEADLINE } from '@/lib/deadline';
import { getResultType } from '@/lib/predictions';
import { scoreMatch, calculateStandings } from '@/lib/scoring';
import { resolveAvatarSrc } from '@/lib/avatar';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useMultiChips } from '@/components/hooks/use_multi_chips';
import { FixtureCard } from '@/components/FixtureSlider';
import Avatar from '@/components/leaderboard/Avatar';
import PredictionRow from '@/components/predictions/PredictionRow';
import ScoreChip from '@/components/predictions/ScoreChip';
import SpecialsTab from '@/components/predictions/SpecialsTab';
import PlayerCardModal from '@/components/PlayerCardModal';

const GROUP_FIXTURE_IDS = new Set(fixtures.filter((f) => f.stage === 'group').map((f) => f.id));
const GROUP_CHIP_LIMIT = 10;

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
    <div className="flex items-center justify-between gap-3 border-b border-white/10 py-3 last:border-0">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar name={player.name} photoUrl={player.photoUrl} size={30} />
        <span className="text-sm font-medium leading-snug text-white/90">{player.name}</span>
      </div>
      <div className="rounded-lg border border-dashed border-white/20 px-3 py-1 text-sm font-semibold text-white/20 tabular-nums">
        ? – ?
      </div>
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
  onPlayerClick,
}: {
  fixture: Fixture;
  now: Date;
  players: Player[];
  allPredictions: Prediction[];
  allChips: MultiChip[];
  result?: MatchResult;
  onPlayerClick: (playerId: string) => void;
}) {
  const hasStarted = new Date(fixture.kickoff) <= now;

  const fixturePredictions = useMemo(
    () => allPredictions.filter((p) => p.fixtureId === fixture.id),
    [fixture.id, allPredictions]
  );

  const chipSet = useMemo(
    () => new Set(allChips.filter((c) => c.fixtureId === fixture.id).map((c) => c.playerId)),
    [allChips, fixture.id]
  );

  const sortedPredictions = useMemo(() => {
    if (!result) {
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
      const ptsA = scoreMatch({ ...a, multiChip: hasChipA }, result).points;
      const ptsB = scoreMatch({ ...b, multiChip: hasChipB }, result).points;
      return ptsB - ptsA;
    });
  }, [fixturePredictions, result, players, chipSet]);

  const predictionGroups = useMemo(() => {
    if (result) return null;
    const groupMap = new Map<string, Prediction[]>();
    for (const pred of sortedPredictions) {
      const key = `${pred.homeGoals}-${pred.awayGoals}`;
      const existing = groupMap.get(key);
      if (existing) existing.push(pred);
      else groupMap.set(key, [pred]);
    }
    const outcomeOrder: Record<string, number> = { 'home-win': 0, draw: 1, 'away-win': 2 };
    const groups = [...groupMap.entries()]
      .map(([key, predictions]) => {
        const [h, a] = key.split('-').map(Number);
        const resultType = getResultType(h, a);
        return { key, predictions, resultType, outcomeOrder: outcomeOrder[resultType] };
      })
      .sort((a, b) => a.outcomeOrder - b.outcomeOrder);
    return groups.some((g) => g.predictions.length > 1) ? groups : null;
  }, [sortedPredictions, result]);

  const predictingIds = useMemo(() => new Set(fixturePredictions.map((p) => p.playerId)), [fixturePredictions]);
  const unpredictedPlayers = useMemo(
    () => players.filter((p) => !predictingIds.has(p.id)),
    [players, predictingIds]
  );

  return (
    <div className="overflow-hidden rounded-2xl bg-wc-ink">
      <div className="p-3">
        <FixtureCard fixture={fixture} now={now} isFullWidth result={result} />
      </div>
      <div className="border-t border-white/10">
        {predictionGroups ? (
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
              const drawClass = group.resultType === 'draw' ? 'bg-wc-gold/8 border-l-2 border-wc-gold/40' : '';
              return (
              <div key={group.key} className={`rounded-xl px-4 ${drawClass}`} style={groupStyle}>
                {group.predictions.length >= 2 && (
                  <p className="pt-2 text-[10px] font-semibold uppercase tracking-widest text-wc-green/70">
                    Aligned
                  </p>
                )}
                {group.predictions.map((prediction) => {
                  const hasChip = chipSet.has(prediction.playerId);
                  const showChip = hasChip && hasStarted;
                  return (
                    <PredictionRow
                      key={prediction.playerId}
                      prediction={prediction}
                      player={players.find((p) => p.id === prediction.playerId)}
                      fixture={fixture}
                      multiChipApplied={showChip}
                      onPlayerClick={onPlayerClick}
                    />
                  );
                })}
              </div>
              );
            })}
            {unpredictedPlayers.length > 0 && (
              <div className="bg-white/[0.03] rounded-xl px-4">
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
              const showChip = hasChip && hasStarted;
              const pts = result
                ? scoreMatch({ ...prediction, multiChip: showChip }, result).points
                : undefined;
              return (
                <PredictionRow
                  key={prediction.playerId}
                  prediction={prediction}
                  player={players.find((p) => p.id === prediction.playerId)}
                  fixture={fixture}
                  points={pts}
                  multiChipApplied={showChip}
                  onPlayerClick={onPlayerClick}
                />
              );
            })}
            {unpredictedPlayers.length > 0 && (
              <div className={sortedPredictions.length > 0 ? 'border-t border-white/20 mt-1 pt-1' : ''}>
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
    <div className="bg-wc-ink rounded-xl px-4 py-3.5">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-sm font-bold text-white">
          {remaining} of {total} chips remaining
        </span>
        <span className="text-xs text-white/60">{used} used</span>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-2 rounded-full transition-colors ${i < remaining ? 'bg-wc-gold' : 'bg-white/12'}`}
          />
        ))}
      </div>
      <p className="text-xs text-white/60 mt-3">
        A chip doubles points for that prediction. More chips unlock after the group stage.
      </p>
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
  const showChipBadge = hasChip && hasStarted;
  const resultType = prediction ? getResultType(prediction.homeGoals, prediction.awayGoals) : 'draw';
  const pts = result && prediction
    ? scoreMatch({ ...prediction, multiChip: showChipBadge }, result).points
    : undefined;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/8 last:border-0">
      {/* Teams */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-xs text-white/70 truncate">
          <span>{fixture.homeTeam.name}</span>
          <span className="text-white/45">vs</span>
          <span>{fixture.awayTeam.name}</span>
        </div>
        {!hasStarted && (
          <p className="text-[10px] text-white/45 mt-0.5 tabular-nums">
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
          multiChip={showChipBadge}
        />
      ) : (
        <span className="text-xs text-white/20 italic">No prediction</span>
      )}

      {/* Points (if result exists) */}
      {pts !== undefined && (
        <span className={`text-xs font-semibold tabular-nums shrink-0 ${pts >= 5 ? 'text-wc-gold' : pts >= 3 ? 'text-green-300' : 'text-white/30'}`}>
          {pts}pt
        </span>
      )}

      {/* Chip toggle */}
      {prediction && (
        hasStarted ? (
          hasChip ? (
            <span className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-wc-gold/60 bg-wc-gold/10 border border-wc-gold/20 rounded-full px-2 py-1">
              <Lock size={10} />
              Locked
            </span>
          ) : null
        ) : hasChip ? (
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 flex items-center gap-1 text-[11px] font-bold rounded-full px-2 py-1 border transition-colors text-wc-gold bg-wc-gold/15 border-wc-gold/40 active:bg-red-500/15 active:border-red-500/40 active:text-red-400"
          >
            Applied
            <X size={9} className="opacity-60" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onApply}
            disabled={chipsUsed >= GROUP_CHIP_LIMIT}
            className="shrink-0 text-[11px] font-semibold text-white/50 border border-white/15 rounded-full px-2.5 py-1 hover:text-white/80 hover:border-white/30 active:opacity-70 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
          >
            + Chip
          </button>
        )
      )}
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
    () => new Map(allPredictions.filter((p) => p.playerId === viewerId).map((p) => [p.fixtureId, p])),
    [allPredictions, viewerId]
  );

  const myChipIds = useMemo(
    () => new Set(allChips.filter((c) => c.playerId === viewerId && GROUP_FIXTURE_IDS.has(c.fixtureId)).map((c) => c.fixtureId)),
    [allChips, viewerId]
  );

  const resultMap = useMemo(() => new Map(results.map((r) => [r.fixtureId, r])), [results]);

  const groupFixtures = useMemo(
    () => fixtures.filter((f) => f.stage === 'group').sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()),
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

      {fixturesByDate.map(([dateKey, dayFixtures]) => (
        <div key={dateKey} className="bg-wc-ink rounded-2xl overflow-hidden">
          <div className="px-4 py-2 bg-white/[0.03] border-b border-white/8">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/55">
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
  const viewerId = useAuthStore((s) => s.user?.uid ?? null);
  const storeResults = useAuthStore((s) => s.results);
  const resultMap = useMemo(() => new Map(storeResults.map((r) => [r.fixtureId, r])), [storeResults]);

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

  const visiblePredictions = allPredictions;
  const visibleTournamentPicks = allTournamentPicks;
  const visibleBonusPredictions = allBonusPredictions;

  const standings = useMemo(
    () => calculateStandings(players, visiblePredictions, storeResults),
    [players, visiblePredictions, storeResults]
  );

  const fixturesForDay = useMemo(
    () => fixtures.filter((f) => getFixtureDateKey(f.kickoff) === selectedDate),
    [selectedDate]
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
    () => visibleTournamentPicks.find((t) => t.playerId === selectedPlayerId) ?? null,
    [visibleTournamentPicks, selectedPlayerId]
  );

  const selectedBonusPredictions = useMemo(
    () => visibleBonusPredictions.find((b) => b.playerId === selectedPlayerId) ?? null,
    [visibleBonusPredictions, selectedPlayerId]
  );

  const activeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (activeButtonRef.current) {
      activeButtonRef.current.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedDate]);

  return (
    <>
      <main className="min-h-screen bg-wc-black px-4 py-6 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Predictions</h1>
            <p className="mt-2 max-w-lg text-sm text-white/55">
              Browse match predictions, specials, and manage your chips.
            </p>
          </div>

          {/* Tab strip */}
          <div className="flex w-full border-b border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('matches')}
              className={`flex-1 text-center pb-3 pt-1 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                activeTab === 'matches'
                  ? 'text-white border-wc-gold'
                  : 'text-white/40 border-transparent hover:text-white/70'
              }`}
            >
              Matches
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('specials')}
              className={`flex-1 text-center pb-3 pt-1 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                activeTab === 'specials'
                  ? 'text-white border-wc-gold'
                  : 'text-white/40 border-transparent hover:text-white/70'
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
                    ? 'text-white border-wc-gold'
                    : 'text-white/40 border-transparent hover:text-white/70'
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
                        <span className={`text-[10px] font-bold tracking-widest text-white/25 px-1 ${i > 0 ? 'ml-1' : ''}`}>
                          {month}
                        </span>
                      )}
                      <button
                        ref={isActive ? activeButtonRef : null}
                        type="button"
                        onClick={() => setSelectedDate(dateKey)}
                        className={`flex flex-col items-center w-13 rounded-xl py-3 transition-colors ${
                          isActive
                            ? 'bg-wc-gold text-wc-black'
                            : 'text-white/45 hover:text-white/80 hover:bg-white/5'
                        }`}
                      >
                        <span className={`text-[10px] font-bold tracking-wider leading-none ${isActive ? 'text-wc-black/60' : 'text-white/30'}`}>
                          {weekday}
                        </span>
                        <span className="text-base font-bold leading-tight mt-1">{day}</span>
                      </button>
                    </div>
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
                    allPredictions={visiblePredictions}
                    allChips={allChips}
                    result={resultMap.get(fixture.id)}
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
