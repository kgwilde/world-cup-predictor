'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Avatar from '@/components/leaderboard/Avatar';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { getTeamByCode } from '@/data/fixtures';
import type {
  BonusPredictions,
  GroupCode,
  Player,
  SpecialEvent,
  SpecialEventType,
  SpecialOutcomes,
  TournamentPicks,
} from '@/lib/types';

const GROUP_CODES: GroupCode[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

function useLocalStorageToggle(key: string, defaultValue = false): [boolean, () => void] {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return defaultValue;
    const stored = localStorage.getItem(key);
    return stored !== null ? stored === 'true' : defaultValue;
  });
  const toggle = () =>
    setValue((v) => {
      const next = !v;
      localStorage.setItem(key, String(next));
      return next;
    });
  return [value, toggle];
}

function teamName(code: string): string {
  return getTeamByCode(code)?.name ?? code;
}

// ─── Shared display primitives ────────────────────────────────────────────────

type ChipStatus = 'correct' | 'wrong' | 'default';

function TeamChip({ code, status = 'default' }: { code: string; status?: ChipStatus }) {
  if (status === 'correct') {
    return (
      <span className="inline-block text-[11px] font-medium rounded px-1.5 py-0.5 whitespace-nowrap bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
        {teamName(code)}
      </span>
    );
  }
  if (status === 'wrong') {
    return (
      <span className="inline-block text-[11px] font-medium rounded px-1.5 py-0.5 whitespace-nowrap bg-black/5 dark:bg-white/5 text-wc-black/30 dark:text-white/30 line-through">
        {teamName(code)}
      </span>
    );
  }
  return (
    <span className="inline-block text-[11px] font-medium rounded px-1.5 py-0.5 whitespace-nowrap bg-black/8 dark:bg-white/8 text-wc-black/75 dark:text-white/75">
      {teamName(code)}
    </span>
  );
}

function PtsBadge({ pts }: { pts: number }) {
  if (pts > 0)
    return (
      <span className="text-[11px] font-bold tabular-nums shrink-0 text-emerald-700 dark:text-emerald-400">
        +{pts}
      </span>
    );
  if (pts < 0)
    return (
      <span className="text-[11px] font-bold tabular-nums shrink-0 text-red-600 dark:text-red-400">
        {pts}
      </span>
    );
  return (
    <span className="text-[11px] font-bold tabular-nums shrink-0 text-wc-black/25 dark:text-white/25">
      +0
    </span>
  );
}

function ScoredPill() {
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 shrink-0">
      Scored
    </span>
  );
}

function ActualLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] text-wc-black/40 dark:text-white/40 shrink-0">{children}</span>
  );
}

// ─── Card shell ───────────────────────────────────────────────────────────────

function CardHeader({
  title,
  isOpen,
  onToggle,
  scored,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  scored?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between px-4 py-3.5 border-b border-black/8 dark:border-white/8 text-left"
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-wc-black dark:text-white">{title}</span>
        {scored && <ScoredPill />}
      </div>
      <ChevronDown
        size={16}
        className={`text-wc-black/40 dark:text-white/40 transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`}
      />
    </button>
  );
}

function CollapsibleSection({
  label,
  sublabel,
  children,
}: {
  label: string;
  sublabel?: string;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-black/[0.03] dark:bg-white/[0.03] border-b border-black/8 dark:border-white/8 text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-wc-black/35 dark:text-white/35 shrink-0">
            {label}
          </span>
          {sublabel && <ActualLabel>{sublabel}</ActualLabel>}
        </div>
        <ChevronDown
          size={14}
          className={`text-wc-black/30 dark:text-white/30 transition-transform duration-200 shrink-0 ml-2 ${isOpen ? 'rotate-0' : '-rotate-90'}`}
        />
      </button>
      {isOpen && children}
    </div>
  );
}

function PlayerRow({ player, children }: { player: Player; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-black/8 dark:border-white/8 last:border-0">
      <Avatar name={player.name} photoUrl={player.photoUrl} size={24} />
      <span className="text-xs text-wc-black/80 dark:text-white/80 w-16 shrink-0 pt-0.5 truncate">
        {player.name}
      </span>
      <div className="flex flex-wrap gap-1.5 flex-1 items-center">{children}</div>
    </div>
  );
}

// ─── Group Stage Card ─────────────────────────────────────────────────────────

function GroupStageCard({
  players,
  tournamentPicks,
  event,
  outcomes,
}: {
  players: Player[];
  tournamentPicks: TournamentPicks[];
  event: SpecialEvent | undefined;
  outcomes: SpecialOutcomes | null;
}) {
  const [isOpen, toggle] = useLocalStorageToggle('specials_group_stage_open');
  const scored = !!event;

  return (
    <div className="overflow-hidden rounded-2xl bg-white dark:bg-wc-ink">
      <CardHeader title="Group Stage Picks" isOpen={isOpen} onToggle={toggle} scored={scored} />

      {isOpen &&
        GROUP_CODES.map((group) => {
          const actualWinner = outcomes?.groupResults?.[group]?.winner;
          const actualRunnerUp = outcomes?.groupResults?.[group]?.runnerUp;
          const sublabel =
            scored && actualWinner
              ? `${teamName(actualWinner)} / ${teamName(actualRunnerUp ?? '—')}`
              : undefined;

          return (
            <CollapsibleSection key={group} label={`Group ${group}`} sublabel={sublabel}>
              <div className="px-4">
                {players.map((player) => {
                  const picks = tournamentPicks.find((t) => t.playerId === player.id);
                  const gp = picks?.groups[group];
                  if (!gp) {
                    return (
                      <PlayerRow key={player.id} player={player}>
                        <span className="text-xs text-wc-black/30 dark:text-white/30 italic pt-0.5">
                          No picks
                        </span>
                      </PlayerRow>
                    );
                  }

                  const winnerCorrect = scored && actualWinner ? gp.winner === actualWinner : undefined;
                  const runnerUpCorrect = scored && actualRunnerUp ? gp.runnerUp === actualRunnerUp : undefined;
                  const groupPts =
                    winnerCorrect !== undefined && runnerUpCorrect !== undefined
                      ? (winnerCorrect ? 2 : 0) + (runnerUpCorrect ? 2 : 0)
                      : undefined;

                  return (
                    <PlayerRow key={player.id} player={player}>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-wc-black/35 dark:text-white/35">
                          1st
                        </span>
                        <TeamChip
                          code={gp.winner}
                          status={
                            winnerCorrect === true
                              ? 'correct'
                              : winnerCorrect === false
                              ? 'wrong'
                              : 'default'
                          }
                        />
                        {scored && <PtsBadge pts={winnerCorrect ? 2 : 0} />}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-wc-black/35 dark:text-white/35">
                          2nd
                        </span>
                        <TeamChip
                          code={gp.runnerUp}
                          status={
                            runnerUpCorrect === true
                              ? 'correct'
                              : runnerUpCorrect === false
                              ? 'wrong'
                              : 'default'
                          }
                        />
                        {scored && <PtsBadge pts={runnerUpCorrect ? 2 : 0} />}
                      </div>
                      {groupPts !== undefined && (
                        <span className="ml-auto text-[11px] font-bold text-wc-black/40 dark:text-white/40">
                          ={groupPts}
                        </span>
                      )}
                    </PlayerRow>
                  );
                })}
              </div>
            </CollapsibleSection>
          );
        })}
    </div>
  );
}

// ─── Knockout Card ────────────────────────────────────────────────────────────

function KnockoutCard({
  players,
  tournamentPicks,
  eventMap,
  outcomes,
}: {
  players: Player[];
  tournamentPicks: TournamentPicks[];
  eventMap: Map<SpecialEventType, SpecialEvent>;
  outcomes: SpecialOutcomes | null;
}) {
  const stages: Array<{
    label: string;
    eventType: SpecialEventType;
    getTeams: (p: TournamentPicks) => string | string[];
    actualTeams: string[] | undefined;
  }> = [
    {
      label: 'Best 3rd Place (8 teams)',
      eventType: 'best_third_place',
      getTeams: (p) => p.bestThirdPlace,
      actualTeams: outcomes?.bestThirdPlace,
    },
    {
      label: 'Round of 16',
      eventType: 'round_of_16_picks',
      getTeams: (p) => p.roundOf16,
      actualTeams: outcomes?.roundOf16,
    },
    {
      label: 'Quarter-finals',
      eventType: 'quarter_final_picks',
      getTeams: (p) => p.quarterFinalists,
      actualTeams: outcomes?.quarterFinalists,
    },
    {
      label: 'Semi-finals',
      eventType: 'semi_final_picks',
      getTeams: (p) => p.semiFinalists,
      actualTeams: outcomes?.semiFinalists,
    },
    {
      label: 'Finalists',
      eventType: 'finalist_picks',
      getTeams: (p) => p.finalists,
      actualTeams: outcomes?.finalists,
    },
    {
      label: 'Winner',
      eventType: 'winner_pick',
      getTeams: (p) => p.winner,
      actualTeams: outcomes?.winner ? [outcomes.winner] : undefined,
    },
  ];

  const [isOpen, toggle] = useLocalStorageToggle('specials_knockout_open');
  const anyScored = stages.some(({ eventType }) => eventMap.has(eventType));

  return (
    <div className="overflow-hidden rounded-2xl bg-white dark:bg-wc-ink">
      <CardHeader title="Knockout Bracket" isOpen={isOpen} onToggle={toggle} scored={anyScored} />
      {isOpen &&
        stages.map(({ label, eventType, getTeams, actualTeams }) => {
          const event = eventMap.get(eventType);
          const scored = !!event;
          const actualSet = new Set(actualTeams ?? []);
          const sublabel =
            scored && actualTeams?.length
              ? actualTeams.map(teamName).join(', ')
              : undefined;

          return (
            <CollapsibleSection key={label} label={label} sublabel={sublabel}>
              <div className="px-4">
                {players.map((player) => {
                  const picks = tournamentPicks.find((t) => t.playerId === player.id);
                  const teams = picks ? getTeams(picks) : null;
                  const totalPts = scored ? (event.playerPoints[player.id] ?? 0) : undefined;

                  return (
                    <PlayerRow key={player.id} player={player}>
                      {teams == null ? (
                        <span className="text-xs text-wc-black/30 dark:text-white/30 italic pt-0.5">
                          No picks
                        </span>
                      ) : typeof teams === 'string' ? (
                        <>
                          <TeamChip
                            code={teams}
                            status={
                              scored
                                ? actualSet.has(teams)
                                  ? 'correct'
                                  : 'wrong'
                                : 'default'
                            }
                          />
                          {totalPts !== undefined && <PtsBadge pts={totalPts} />}
                        </>
                      ) : (
                        <>
                          {teams.map((code, i) => (
                            <TeamChip
                              key={`${code}-${i}`}
                              code={code}
                              status={
                                scored
                                  ? actualSet.has(code)
                                    ? 'correct'
                                    : 'wrong'
                                  : 'default'
                              }
                            />
                          ))}
                          {totalPts !== undefined && (
                            <span className="ml-auto">
                              <PtsBadge pts={totalPts} />
                            </span>
                          )}
                        </>
                      )}
                    </PlayerRow>
                  );
                })}
              </div>
            </CollapsibleSection>
          );
        })}
    </div>
  );
}

// ─── Bonus Card ───────────────────────────────────────────────────────────────

function BonusCard({
  players,
  bonusPredictions,
  eventMap,
  outcomes,
}: {
  players: Player[];
  bonusPredictions: BonusPredictions[];
  eventMap: Map<SpecialEventType, SpecialEvent>;
  outcomes: SpecialOutcomes | null;
}) {
  const rows: Array<{
    label: string;
    eventType: SpecialEventType;
    getValue: (b: BonusPredictions) => string;
    actualLabel?: string;
    sortDesc?: boolean;
  }> = [
    {
      label: 'Top Goalscorer',
      eventType: 'top_goalscorer',
      getValue: (b) => b.topScorer,
      actualLabel: outcomes?.actualTopScorer ?? undefined,
    },
    {
      label: 'Group Stage Highest Scorers',
      eventType: 'group_stage_highest_scorers',
      getValue: (b) => teamName(b.highestScoringTeam),
      actualLabel: outcomes?.highestScoringTeam
        ? `${teamName(outcomes.highestScoringTeam)} (${outcomes.highestScoringTeamGoals ?? '?'} goals)`
        : undefined,
    },
    {
      label: 'Best Group Stage Defence',
      eventType: 'best_group_stage_defence',
      getValue: (b) => teamName(b.bestDefence),
      actualLabel: outcomes?.bestDefenceTeam
        ? `${teamName(outcomes.bestDefenceTeam)} (${outcomes.bestDefenceGoalsConceded ?? '?'} conceded)`
        : undefined,
    },
    {
      label: 'Yellow Cards',
      eventType: 'yellow_cards',
      getValue: (b) => String(b.totalYellowCards),
      actualLabel: outcomes?.totalYellowCards !== undefined ? String(outcomes.totalYellowCards) : undefined,
      sortDesc: true,
    },
    {
      label: 'Red Cards',
      eventType: 'red_cards',
      getValue: (b) => String(b.totalRedCards),
      actualLabel: outcomes?.totalRedCards !== undefined ? String(outcomes.totalRedCards) : undefined,
      sortDesc: true,
    },
    {
      label: 'Penalty Shootouts',
      eventType: 'penalty_shootouts',
      getValue: (b) => String(b.penaltyShootouts),
      actualLabel: outcomes?.penaltyShootouts !== undefined ? String(outcomes.penaltyShootouts) : undefined,
      sortDesc: true,
    },
  ];

  const [isOpen, toggle] = useLocalStorageToggle('specials_bonus_open');
  const anyScored = rows.some(({ eventType }) => eventMap.has(eventType));

  return (
    <div className="overflow-hidden rounded-2xl bg-white dark:bg-wc-ink">
      <CardHeader title="Bonus Predictions" isOpen={isOpen} onToggle={toggle} scored={anyScored} />
      {isOpen &&
        rows.map(({ label, eventType, getValue, actualLabel, sortDesc }) => {
          const event = eventMap.get(eventType);
          const scored = !!event;
          const sublabel = scored && actualLabel ? `Actual: ${actualLabel}` : undefined;

          return (
            <CollapsibleSection key={label} label={label} sublabel={sublabel}>
              <div className="px-4">
                {(sortDesc
                  ? [...players].sort((a, b) => {
                      const bVal = bonusPredictions.find((x) => x.playerId === b.id);
                      const aVal = bonusPredictions.find((x) => x.playerId === a.id);
                      return (
                        Number(bVal ? getValue(bVal) : 0) - Number(aVal ? getValue(aVal) : 0)
                      );
                    })
                  : players
                ).map((player) => {
                  const bonus = bonusPredictions.find((b) => b.playerId === player.id);
                  const totalPts = scored ? (event.playerPoints[player.id] ?? 0) : undefined;

                  return (
                    <div
                      key={player.id}
                      className="flex items-center gap-3 py-3 border-b border-black/8 dark:border-white/8 last:border-0"
                    >
                      <Avatar name={player.name} photoUrl={player.photoUrl} size={24} />
                      <span className="text-xs text-wc-black/80 dark:text-white/80 flex-1">
                        {player.name}
                      </span>
                      {bonus ? (
                        <span className="text-sm font-medium text-wc-black/90 dark:text-white/90">
                          {getValue(bonus)}
                        </span>
                      ) : (
                        <span className="text-xs text-wc-black/30 dark:text-white/30">—</span>
                      )}
                      {totalPts !== undefined && (
                        <PtsBadge pts={totalPts} />
                      )}
                    </div>
                  );
                })}
              </div>
            </CollapsibleSection>
          );
        })}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface Props {
  players: Player[];
  tournamentPicks: TournamentPicks[];
  bonusPredictions: BonusPredictions[];
  canViewPredictions?: boolean;
}

export default function SpecialsTab({ players, tournamentPicks, bonusPredictions }: Props) {
  const specialEvents = useAuthStore((s) => s.specialEvents);
  const specialOutcomes = useAuthStore((s) => s.specialOutcomes);

  const eventMap = new Map(specialEvents.map((e) => [e.id, e]));

  if (players.length === 0) {
    return (
      <p className="text-center text-wc-black/30 dark:text-white/30 text-sm py-16">No data yet.</p>
    );
  }

  return (
    <div className="space-y-4">
      <GroupStageCard
        players={players}
        tournamentPicks={tournamentPicks}
        event={eventMap.get('group_stage_picks')}
        outcomes={specialOutcomes}
      />
      <KnockoutCard
        players={players}
        tournamentPicks={tournamentPicks}
        eventMap={eventMap}
        outcomes={specialOutcomes}
      />
      <BonusCard
        players={players}
        bonusPredictions={bonusPredictions}
        eventMap={eventMap}
        outcomes={specialOutcomes}
      />
    </div>
  );
}
