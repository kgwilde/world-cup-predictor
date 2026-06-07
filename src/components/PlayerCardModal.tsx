'use client';

import { useMemo } from 'react';
import { X } from 'lucide-react';
import Avatar from '@/components/leaderboard/Avatar';
import ScoreChip from '@/components/predictions/ScoreChip';
import { getResultType } from '@/lib/predictions';
import { scoreMatch } from '@/lib/scoring';
import type { Fixture, MatchResult, MultiChip, Player, PlayerStanding, Prediction } from '@/lib/types';

const CARD_COLOR = '#253ecf';
const PODIUM_COLORS: Record<number, string> = { 1: '#efbf04', 2: '#C0C0C0', 3: '#CD7F32' };

interface Props {
  player: Player;
  standing: PlayerStanding | null;
  predictions: Prediction[];
  multiChips: MultiChip[];
  fixtures: Fixture[];
  results: MatchResult[];
  now: Date;
  isViewer: boolean;
  onClose: () => void;
}

function getFixtureDateKey(kickoffUtc: string) {
  const d = new Date(kickoffUtc);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateLabel(dateKey: string) {
  return new Intl.DateTimeFormat('en-IE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(dateKey));
}

function ChipPips({ used, total = 10 }: { used: number; total?: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${i < used ? 'bg-wc-gold' : 'bg-white/15'}`}
        />
      ))}
    </div>
  );
}

function StatCell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="font-display font-bold text-lg tabular-nums leading-none" style={{ color: color ?? '#ffffff' }}>
        {value}
      </span>
      <span className="text-white/40 text-[10px] uppercase tracking-wider">{label}</span>
    </div>
  );
}

export default function PlayerCardModal({
  player,
  standing,
  predictions,
  multiChips,
  fixtures,
  results,
  now,
  isViewer,
  onClose,
}: Props) {
  const playerPredictions = useMemo(
    () => predictions.filter((p) => p.playerId === player.id),
    [predictions, player.id]
  );

  const playerChips = useMemo(
    () => new Set(multiChips.filter((c) => c.playerId === player.id).map((c) => c.fixtureId)),
    [multiChips, player.id]
  );

  const resultMap = useMemo(() => new Map(results.map((r) => [r.fixtureId, r])), [results]);
  const fixtureMap = useMemo(() => new Map(fixtures.map((f) => [f.id, f])), [fixtures]);

  const chipsUsed = playerChips.size;

  const grouped = useMemo(() => {
    const predictionsByDate = new Map<string, Array<{ prediction: Prediction; fixture: Fixture }>>();
    for (const prediction of playerPredictions) {
      const fixture = fixtureMap.get(prediction.fixtureId);
      if (!fixture) continue;
      const dateKey = getFixtureDateKey(fixture.kickoff);
      const existing = predictionsByDate.get(dateKey) ?? [];
      existing.push({ prediction, fixture });
      predictionsByDate.set(dateKey, existing);
    }
    return [...predictionsByDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateKey, rows]) => ({
        dateKey,
        rows: rows.sort((a, b) => new Date(a.fixture.kickoff).getTime() - new Date(b.fixture.kickoff).getTime()),
      }));
  }, [playerPredictions, fixtureMap]);

  const rankColor = standing ? (PODIUM_COLORS[standing.rank] ?? '#ffffff') : '#ffffff';

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Panel */}
      <div
        className="relative bg-wc-black flex flex-col overflow-hidden flex-1"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient header card */}
        <div
          className="relative shrink-0 overflow-hidden"
          style={{
            background: `linear-gradient(160deg, ${CARD_COLOR}50 0%, ${CARD_COLOR}22 35%, #020F2A 80%)`,
            borderBottom: `1px solid ${CARD_COLOR}30`,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 flex items-center justify-center w-7 h-7 rounded-full bg-white/10 text-white/60 hover:text-white hover:bg-white/15 transition-colors"
          >
            <X size={14} />
          </button>

          <div className="flex flex-col items-center pt-8 pb-5 px-4">
            <Avatar name={player.name} photoUrl={player.photoUrl} size={72} />
            <p className="font-display font-bold text-xl text-white text-center leading-tight mt-3">
              {player.teamName ?? player.name}
            </p>
            {player.teamName && (
              <p className="text-white/40 text-xs mt-0.5">{player.name}</p>
            )}
          </div>
        </div>

        {/* Stats strip */}
        <div className="shrink-0 grid grid-cols-3 px-6 py-3 border-b border-white/10 bg-wc-black">
          <StatCell
            label="Rank"
            value={standing ? `#${standing.rank}` : '—'}
            color={rankColor}
          />
          <StatCell
            label="Points"
            value={standing ? String(standing.totalPoints) : '—'}
          />
          <div className="flex flex-col items-center gap-1">
            <ChipPips used={chipsUsed} />
            <span className="text-white/40 text-[10px] uppercase tracking-wider">
              {chipsUsed}/10 chips
            </span>
          </div>
        </div>

        {/* Scrollable predictions list */}
        <div className="overflow-y-auto flex-1 pb-8">
          {grouped.length === 0 ? (
            <p className="text-center text-white/30 text-sm py-10">No predictions yet</p>
          ) : (
            grouped.map(({ dateKey, rows }) => (
              <div key={dateKey}>
                <div className="px-4 py-2 bg-white/[0.03] border-b border-white/5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-white/35">
                    {formatDateLabel(dateKey)}
                  </span>
                </div>
                <div className="px-4">
                  {rows.map(({ prediction, fixture }) => {
                    const hasStarted = new Date(fixture.kickoff) <= now;
                    const hasChip = playerChips.has(fixture.id);
                    const showChip = hasChip && (isViewer || hasStarted);
                    const result = resultMap.get(fixture.id);
                    const pts = result
                      ? scoreMatch({ ...prediction, multiChip: showChip }, result).points
                      : undefined;
                    const resultType = getResultType(prediction.homeGoals, prediction.awayGoals);

                    return (
                      <div
                        key={fixture.id}
                        className="flex items-center justify-between gap-3 py-3 border-b border-white/8 last:border-0"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white/40 truncate">
                            {fixture.homeTeam.name} vs {fixture.awayTeam.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <ScoreChip
                            homeGoals={prediction.homeGoals}
                            awayGoals={prediction.awayGoals}
                            resultType={resultType}
                            homeAccentColor={fixture.homeTeam.accentColor}
                            awayAccentColor={fixture.awayTeam.accentColor}
                            multiChip={showChip}
                          />
                          {pts !== undefined && (
                            <ModalPointsBadge points={pts} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ModalPointsBadge({ points }: { points: number }) {
  if (points >= 5) {
    return (
      <span className="min-w-[2.5rem] text-center text-xs font-bold text-wc-black bg-wc-gold rounded px-1.5 py-0.5 shrink-0 tabular-nums">
        {points}pt
      </span>
    );
  }
  if (points >= 3) {
    return (
      <span className="min-w-[2.5rem] text-center text-xs font-bold text-green-300 bg-green-500/20 rounded px-1.5 py-0.5 shrink-0 tabular-nums">
        {points}pt
      </span>
    );
  }
  if (points > 0) {
    return (
      <span className="min-w-[2.5rem] text-center text-xs text-white/35 bg-white/5 rounded px-1.5 py-0.5 shrink-0 tabular-nums">
        {points}pt
      </span>
    );
  }
  return (
    <span className="min-w-[2.5rem] text-center text-xs text-white/20 shrink-0 tabular-nums">
      0pt
    </span>
  );
}
