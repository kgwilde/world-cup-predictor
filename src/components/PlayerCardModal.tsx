'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { ChevronDown, X } from 'lucide-react';
import Avatar from '@/components/leaderboard/Avatar';
import ScoreChip from '@/components/predictions/ScoreChip';
import { getTeamByCode } from '@/data/fixtures';
import { getResultType } from '@/lib/predictions';
import { scoreMatch } from '@/lib/scoring';
import type {
  BonusPredictions,
  Fixture,
  GroupCode,
  MatchResult,
  MultiChip,
  Player,
  PlayerStanding,
  Prediction,
  TournamentPicks,
} from '@/lib/types';

const GROUP_CODES: GroupCode[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

function teamName(code: string): string {
  return getTeamByCode(code)?.name ?? code;
}

function TeamChip({ code }: { code: string }) {
  return (
    <span className="inline-block text-[11px] font-medium text-white/75 bg-white/8 rounded px-1.5 py-0.5 whitespace-nowrap">
      {teamName(code)}
    </span>
  );
}

const RAINBOW = 'linear-gradient(135deg, #f72585, #f8961e, #90be6d, #4cc9f0, #7209b7)';

const RANK_CARD_CONFIG: Record<number, { ringStyle: CSSProperties; cardColor: string }> = {
  1: { ringStyle: { background: '#FFD000' }, cardColor: '#FFD000' },
  2: { ringStyle: { background: 'rgba(226,232,240,0.9)' }, cardColor: '#E2E8F0' },
};
const DEFAULT_RANK_CARD_CONFIG: { ringStyle: CSSProperties; cardColor: string } = {
  ringStyle: { background: 'rgba(255,255,255,0.15)' },
  cardColor: '#253ecf',
};

interface Props {
  player: Player;
  standing: PlayerStanding | null;
  predictions: Prediction[];
  multiChips: MultiChip[];
  fixtures: Fixture[];
  results: MatchResult[];
  now: Date;
  isViewer: boolean;
  tournamentPicks?: TournamentPicks | null;
  bonusPredictions?: BonusPredictions | null;
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
  const remaining = total - used;
  return (
    <div className="flex gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${i < remaining ? 'bg-wc-gold' : 'bg-white/15'}`}
        />
      ))}
    </div>
  );
}

function StatCell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className="font-display font-bold text-lg tabular-nums leading-none"
        style={{ color: color ?? '#ffffff' }}
      >
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
  tournamentPicks = null,
  bonusPredictions = null,
  onClose,
}: Props) {
  const [activeTab, setActiveTab] = useState<'matches' | 'specials'>('matches');
  const [showFullImage, setShowFullImage] = useState(false);

  const rankConfig =
    (standing?.rank != null && RANK_CARD_CONFIG[standing.rank]) || DEFAULT_RANK_CARD_CONFIG;
  const { cardColor } = rankConfig;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
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

  const chipsUsed = useMemo(
    () =>
      [...playerChips].filter((id) => {
        const f = fixtureMap.get(id);
        return f && new Date(f.kickoff) <= now;
      }).length,
    [playerChips, fixtureMap, now]
  );

  const grouped = useMemo(() => {
    const predictionsByDate = new Map<
      string,
      Array<{ prediction: Prediction; fixture: Fixture }>
    >();
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
        rows: rows.sort(
          (a, b) => new Date(a.fixture.kickoff).getTime() - new Date(b.fixture.kickoff).getTime()
        ),
      }));
  }, [playerPredictions, fixtureMap]);

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex flex-col"
        style={{ animation: 'modal-fade-in 0.3s ease both' }}
      >
        {/* Panel */}
        <div
          className="relative bg-wc-black flex flex-col overflow-hidden flex-1"
          onClick={(e) => e.stopPropagation()}
          style={{ animation: 'modal-slide-up 0.45s cubic-bezier(0.32, 0.72, 0, 1) both' }}
        >
          {/* Gradient header card */}
          <div
            className="relative shrink-0 overflow-hidden"
            style={{
              background: `radial-gradient(ellipse 85% 110% at 50% 0%, ${cardColor}38 0%, transparent 55%), linear-gradient(165deg, ${cardColor}25 0%, ${cardColor}0e 50%, #020F2A 72%, #020F2A 100%)`,
              borderBottom: `1px solid ${cardColor}38`,
            }}
          >
            {/* Diagonal shimmer streak */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `linear-gradient(115deg, transparent 25%, ${cardColor}0c 48%, transparent 68%)`,
              }}
            />

            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white/60 hover:text-white hover:bg-white/15 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex flex-col items-center pt-8 pb-5 px-4">
              <button
                type="button"
                onClick={() => player.photoUrl && setShowFullImage(true)}
                className={`rounded-full p-[3px] ${player.photoUrl ? 'active:scale-95 transition-transform' : ''}`}
                style={rankConfig.ringStyle}
              >
                <div className="rounded-full p-[2px] bg-wc-black">
                  <Avatar name={player.name} photoUrl={player.photoUrl} size={72} />
                </div>
              </button>
              <p className="font-display font-bold text-xl text-white text-center leading-tight mt-3">
                {player.teamName ?? player.name}
              </p>
              {player.teamName && <p className="text-white/40 text-xs mt-0.5">{player.name}</p>}
            </div>
          </div>

          {/* Stats strip */}
          <div className="shrink-0 grid grid-cols-3 items-center px-6 py-3 border-b border-white/10 bg-wc-black">
            <StatCell label="Rank" value={standing ? `#${standing.rank}` : '—'} color={'#ffffff'} />
            <StatCell label="Points" value={standing ? String(standing.totalPoints) : '—'} />
            <div className="flex flex-col items-center gap-1">
              <ChipPips used={chipsUsed} />
              <span className="text-white/40 text-[10px] uppercase tracking-wider">
                {10 - chipsUsed}/10 chips left
              </span>
            </div>
          </div>

          {/* Tab strip */}
          <div className="shrink-0 flex border-b border-white/10 bg-wc-black">
            {(['matches', 'specials'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex-1 text-center pb-3 pt-2.5 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px ${
                  activeTab === tab
                    ? 'text-white border-wc-blue'
                    : 'text-white/40 border-transparent hover:text-white/70'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Full-image lightbox */}
          {showFullImage && player.photoUrl && (
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90"
              onClick={() => setShowFullImage(false)}
              style={{ animation: 'modal-fade-in 0.2s ease both' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={player.photoUrl}
                alt={player.name}
                className="rounded-2xl object-contain"
                style={{ maxWidth: '90vw', maxHeight: '90vh' }}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFullImage(false);
                }}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {/* Scrollable content */}
          <div className="overflow-y-auto flex-1 pb-8">
            {activeTab === 'matches' &&
              (grouped.length === 0 ? (
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
                        const isFinal = result?.status === 'final';
                        const pts = isFinal
                          ? scoreMatch({ ...prediction, multiChip: showChip }, result!).points
                          : undefined;
                        const resultType = getResultType(
                          prediction.homeGoals,
                          prediction.awayGoals
                        );

                        return (
                          <div
                            key={fixture.id}
                            className="flex items-center justify-between gap-3 py-3 border-b border-white/8 last:border-0"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-white/90 truncate">
                                {fixture.homeTeam.name} vs {fixture.awayTeam.name}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="relative inline-flex shrink-0">
                                <ScoreChip
                                  homeGoals={prediction.homeGoals}
                                  awayGoals={prediction.awayGoals}
                                  resultType={resultType}
                                  homeAccentColor={fixture.homeTeam.accentColor}
                                  awayAccentColor={fixture.awayTeam.accentColor}
                                />
                                {showChip && !isFinal && (
                                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-wc-gold text-[8px] font-bold leading-none text-wc-black">
                                    ×2
                                  </span>
                                )}
                              </span>
                              {pts !== undefined && (
                                <ModalPointsBadge points={pts} multiChip={showChip} />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ))}

            {activeTab === 'specials' && (
              <PlayerSpecialsTab
                tournamentPicks={tournamentPicks}
                bonusPredictions={bonusPredictions}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function ModalCollapsibleSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="w-full flex items-center justify-between py-2"
      >
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/35">{label}</p>
        <ChevronDown
          size={14}
          className={`text-white/30 transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`}
        />
      </button>
      {isOpen && <div className="pb-1">{children}</div>}
    </div>
  );
}

function PlayerSpecialsTab({
  tournamentPicks,
  bonusPredictions,
}: {
  tournamentPicks: TournamentPicks | null;
  bonusPredictions: BonusPredictions | null;
}) {
  if (!tournamentPicks && !bonusPredictions) {
    return <p className="text-center text-white/30 text-sm py-10">No specials data yet</p>;
  }

  const knockoutStages: Array<{ label: string; teams: string[] }> = tournamentPicks
    ? [
        { label: 'Round of 16', teams: tournamentPicks.roundOf16 },
        { label: 'Quarter-finals', teams: tournamentPicks.quarterFinalists },
        { label: 'Semi-finals', teams: tournamentPicks.semiFinalists },
        { label: 'Finalists', teams: tournamentPicks.finalists },
      ]
    : [];

  const bonusRows: Array<{ label: string; value: string }> = bonusPredictions
    ? [
        { label: 'Top Goalscorer', value: bonusPredictions.topScorer },
        {
          label: 'Group Stage Highest Scorers',
          value: teamName(bonusPredictions.highestScoringTeam),
        },
        { label: 'Best Group Stage Defence', value: teamName(bonusPredictions.bestDefence) },
        { label: 'Yellow Cards', value: String(bonusPredictions.totalYellowCards) },
        { label: 'Red Cards', value: String(bonusPredictions.totalRedCards) },
        { label: 'Penalty Shootouts', value: String(bonusPredictions.penaltyShootouts) },
      ]
    : [];

  return (
    <div className="divide-y divide-white/8 px-4 py-2">
      {tournamentPicks && (
        <>
          <ModalCollapsibleSection label="Tournament Winner">
            <div className="flex flex-wrap gap-1.5 pb-3">
              <TeamChip code={tournamentPicks.winner} />
            </div>
          </ModalCollapsibleSection>

          <ModalCollapsibleSection label="Bracket Picks">
            <div className="rounded-xl bg-wc-ink overflow-hidden mb-3">
              {knockoutStages.map(({ label, teams }) => (
                <div
                  key={label}
                  className="flex items-start gap-3 px-4 py-3 border-b border-white/8 last:border-0"
                >
                  <span className="text-xs text-white/40 w-24 shrink-0 pt-0.5">{label}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {teams.map((code) => (
                      <TeamChip key={code} code={code} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ModalCollapsibleSection>

          <ModalCollapsibleSection label="Group Picks">
            <div className="rounded-xl bg-wc-ink overflow-hidden mb-3">
              {GROUP_CODES.map((group) => {
                const gp = tournamentPicks.groups[group];
                return (
                  <div
                    key={group}
                    className="flex items-center gap-3 px-4 py-2.5 border-b border-white/8 last:border-0"
                  >
                    <span className="text-xs font-bold text-white/30 w-6 shrink-0">{group}</span>
                    <span className="text-xs text-white/70 flex-1">{teamName(gp.winner)}</span>
                    <span className="text-xs text-white/40">{teamName(gp.runnerUp)}</span>
                  </div>
                );
              })}
            </div>
          </ModalCollapsibleSection>

          <ModalCollapsibleSection label="Best 3rd Place">
            <div className="flex flex-wrap gap-1.5 pb-3">
              {tournamentPicks.bestThirdPlace.map((code) => (
                <TeamChip key={code} code={code} />
              ))}
            </div>
          </ModalCollapsibleSection>
        </>
      )}

      {bonusPredictions && (
        <ModalCollapsibleSection label="Bonus Predictions">
          <div className="rounded-xl bg-wc-ink overflow-hidden mb-3">
            {bonusRows.map(({ label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between px-4 py-2.5 border-b border-white/8 last:border-0"
              >
                <span className="text-xs text-white/40">{label}</span>
                <span className="text-sm font-medium text-white/80">{value}</span>
              </div>
            ))}
          </div>
        </ModalCollapsibleSection>
      )}
    </div>
  );
}

function ModalPointsBadge({ points, multiChip }: { points: number; multiChip?: boolean }) {
  const textClass =
    points >= 5
      ? 'text-green-300'
      : points >= 3
        ? 'text-green-300'
        : points > 0
          ? 'text-white/35'
          : 'text-white/20';

  if (multiChip && points > 0) {
    return (
      <span
        className="relative inline-flex shrink-0 rounded-md"
        style={{ padding: 1.5, background: RAINBOW }}
      >
        <span
          className={`min-w-[2.5rem] text-center text-xs font-bold tabular-nums rounded-[4px] px-1.5 py-0.5 bg-wc-ink ${textClass}`}
        >
          {points} pts
        </span>
        <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-wc-gold text-[7px] font-bold leading-none text-wc-black">
          ×2
        </span>
      </span>
    );
  }

  if (points >= 5) {
    return (
      <span className="min-w-[2.5rem] text-center text-xs font-bold text-green-300 bg-green-500/20 rounded px-1.5 py-0.5 shrink-0 tabular-nums">
        {points} pts
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
