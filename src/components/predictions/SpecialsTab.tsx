'use client';

import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Avatar from '@/components/leaderboard/Avatar';
import { getTeamByCode } from '@/data/fixtures';
import type { BonusPredictions, GroupCode, Player, TournamentPicks } from '@/lib/types';

const GROUP_CODES: GroupCode[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

function useLocalStorageToggle(key: string, defaultValue = false): [boolean, () => void] {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    const stored = localStorage.getItem(key);
    if (stored !== null) setValue(stored === 'true');
  }, [key]);

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

function TeamChip({ code }: { code: string }) {
  return (
    <span className="inline-block text-[11px] font-medium text-white/90 bg-white/8 rounded px-1.5 py-0.5 whitespace-nowrap">
      {teamName(code)}
    </span>
  );
}

function CardHeader({
  title,
  isOpen,
  onToggle,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between px-4 py-3.5 border-b border-white/10 text-left"
    >
      <span className="text-sm font-bold text-white">{title}</span>
      <ChevronDown
        size={16}
        className={`text-white/40 transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`}
      />
    </button>
  );
}

function CollapsibleSection({ label, children }: { label: string; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-white/[0.03] border-b border-white/5 text-left"
      >
        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/55">
          {label}
        </span>
        <ChevronDown
          size={14}
          className={`text-white/30 transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`}
        />
      </button>
      {isOpen && children}
    </div>
  );
}

function PlayerRow({ player, children }: { player: Player; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/8 last:border-0">
      <Avatar name={player.name} photoUrl={player.photoUrl} size={24} />
      <span className="text-xs text-white/70 w-16 shrink-0 pt-0.5">{player.name}</span>
      <div className="flex flex-wrap gap-1.5 flex-1">{children}</div>
    </div>
  );
}

function KnockoutCard({
  players,
  tournamentPicks,
}: {
  players: Player[];
  tournamentPicks: TournamentPicks[];
}) {
  const stages: Array<{ label: string; getTeams: (p: TournamentPicks) => string | string[] }> = [
    { label: 'Best 3rd Place (8 teams)', getTeams: (p) => p.bestThirdPlace },
    { label: 'Round of 16', getTeams: (p) => p.roundOf16 },
    { label: 'Quarter-finals', getTeams: (p) => p.quarterFinalists },
    { label: 'Semi-finals', getTeams: (p) => p.semiFinalists },
    { label: 'Finalists', getTeams: (p) => p.finalists },
    { label: 'Winner', getTeams: (p) => p.winner },
  ];

  const [isOpen, toggle] = useLocalStorageToggle('specials_knockout_open');

  return (
    <div className="overflow-hidden rounded-2xl bg-wc-ink">
      <CardHeader title="Knockout Bracket" isOpen={isOpen} onToggle={toggle} />
      {isOpen &&
        stages.map(({ label, getTeams }) => (
          <CollapsibleSection key={label} label={label}>
            <div className="px-4">
              {players.map((player) => {
                const picks = tournamentPicks.find((t) => t.playerId === player.id);
                const teams = picks ? getTeams(picks) : null;
                return (
                  <PlayerRow key={player.id} player={player}>
                    {teams == null ? (
                      <span className="text-xs text-white/40 italic pt-0.5">No picks</span>
                    ) : typeof teams === 'string' ? (
                      <TeamChip code={teams} />
                    ) : (
                      teams.map((code, i) => <TeamChip key={`${code}-${i}`} code={code} />)
                    )}
                  </PlayerRow>
                );
              })}
            </div>
          </CollapsibleSection>
        ))}
    </div>
  );
}

function GroupStageCard({
  players,
  tournamentPicks,
}: {
  players: Player[];
  tournamentPicks: TournamentPicks[];
}) {
  const [isOpen, toggle] = useLocalStorageToggle('specials_group_stage_open');

  return (
    <div className="overflow-hidden rounded-2xl bg-wc-ink">
      <CardHeader title="Group Stage Picks" isOpen={isOpen} onToggle={toggle} />

      {isOpen &&
        GROUP_CODES.map((group) => (
          <CollapsibleSection key={group} label={`Group ${group}`}>
            <div className="px-4">
              {players.map((player) => {
                const picks = tournamentPicks.find((t) => t.playerId === player.id);
                const gp = picks?.groups[group];
                return (
                  <PlayerRow key={player.id} player={player}>
                    {gp ? (
                      <>
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-white/50">
                            1st
                          </span>
                          <TeamChip code={gp.winner} />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-white/50">
                            2nd
                          </span>
                          <TeamChip code={gp.runnerUp} />
                        </div>
                      </>
                    ) : (
                      <span className="text-xs text-white/40 italic pt-0.5">No picks</span>
                    )}
                  </PlayerRow>
                );
              })}
            </div>
          </CollapsibleSection>
        ))}
    </div>
  );
}

function BonusCard({
  players,
  bonusPredictions,
}: {
  players: Player[];
  bonusPredictions: BonusPredictions[];
}) {
  const rows: Array<{ label: string; getValue: (b: BonusPredictions) => string }> = [
    { label: 'Top Goalscorer', getValue: (b) => b.topScorer },
    { label: 'Group Stage Highest Scorers', getValue: (b) => teamName(b.highestScoringTeam) },
    { label: 'Best Group Stage Defence', getValue: (b) => teamName(b.bestDefence) },
    { label: 'Yellow Cards', getValue: (b) => String(b.totalYellowCards) },
    { label: 'Red Cards', getValue: (b) => String(b.totalRedCards) },
    { label: 'Penalty Shootouts', getValue: (b) => String(b.penaltyShootouts) },
  ];

  const [isOpen, toggle] = useLocalStorageToggle('specials_bonus_open');

  return (
    <div className="overflow-hidden rounded-2xl bg-wc-ink">
      <CardHeader title="Bonus Predictions" isOpen={isOpen} onToggle={toggle} />
      {isOpen &&
        rows.map(({ label, getValue }) => (
          <CollapsibleSection key={label} label={label}>
            <div className="px-4">
              {players.map((player) => {
                const bonus = bonusPredictions.find((b) => b.playerId === player.id);
                return (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 py-2.5 border-b border-white/8 last:border-0"
                  >
                    <Avatar name={player.name} photoUrl={player.photoUrl} size={24} />
                    <span className="text-xs text-white/70 flex-1">{player.name}</span>
                    {bonus ? (
                      <span className="text-sm font-medium text-white">{getValue(bonus)}</span>
                    ) : (
                      <span className="text-xs text-white/40">—</span>
                    )}
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>
        ))}
    </div>
  );
}

interface Props {
  players: Player[];
  tournamentPicks: TournamentPicks[];
  bonusPredictions: BonusPredictions[];
  canViewPredictions?: boolean;
}

export default function SpecialsTab({ players, tournamentPicks, bonusPredictions }: Props) {
  if (players.length === 0) {
    return <p className="text-center text-white/30 text-sm py-16">No data yet.</p>;
  }

  return (
    <div className="space-y-4">
      <GroupStageCard players={players} tournamentPicks={tournamentPicks} />
      <KnockoutCard players={players} tournamentPicks={tournamentPicks} />
      <BonusCard players={players} bonusPredictions={bonusPredictions} />
    </div>
  );
}
