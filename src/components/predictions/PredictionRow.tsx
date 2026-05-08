import Avatar from '@/components/leaderboard/Avatar';
import ScoreChip from './ScoreChip';
import StackedAvatars from './StackedAvatars';
import type { PredictionGroup } from '@/lib/predictions';
import type { Fixture, Player } from '@/lib/types';

interface Props {
  group: PredictionGroup;
  fixture: Fixture;
  players: Player[];
  points?: number;
}

function getPlayer(players: Player[], playerId: string) {
  return players.find((p) => p.id === playerId);
}

function getPlayerName(players: Player[], playerId: string) {
  return getPlayer(players, playerId)?.name ?? 'Unknown';
}

function formatPlayerNames(players: Player[], playerIds: string[]) {
  const names = playerIds.map((id) => getPlayerName(players, id));

  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;

  const allButLast = names.slice(0, -1).join(', ');
  return `${allButLast} & ${names[names.length - 1]}`;
}

function PointsBadge({ points }: { points: number }) {
  if (points === 5) {
    return (
      <span className="min-w-[2.75rem] text-center text-xs font-bold text-wc-black bg-wc-gold rounded px-1.5 py-0.5 shrink-0">
        5 pts
      </span>
    );
  }
  if (points >= 3) {
    return (
      <span className="min-w-[2.75rem] text-center text-xs font-bold text-green-300 bg-green-500/20 rounded px-1.5 py-0.5 shrink-0">
        {points} pts
      </span>
    );
  }
  if (points > 0) {
    return (
      <span className="min-w-[2.75rem] text-center text-xs font-medium text-white/35 bg-white/5 rounded px-1.5 py-0.5 shrink-0">
        {points} pt
      </span>
    );
  }
  return (
    <span className="min-w-[2.75rem] text-center text-xs font-medium text-white/20 shrink-0">
      0 pts
    </span>
  );
}

export default function PredictionRow({ group, fixture, players, points }: Props) {
  const isGrouped = group.playerIds.length > 1;

  const bgClass = points === undefined && isGrouped ? 'bg-wc-teal/5' : '';

  return (
    <div
      className={`flex items-center justify-between gap-3 border-b border-white/10 py-3 last:border-0 ${bgClass}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {isGrouped ? (
          <StackedAvatars playerIds={group.playerIds} players={players} />
        ) : (
          <Avatar
            name={getPlayerName(players, group.playerIds[0])}
            photoUrl={getPlayer(players, group.playerIds[0])?.photoUrl}
            size={30}
          />
        )}

        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="text-sm font-medium leading-snug text-white/90">
            {formatPlayerNames(players, group.playerIds)}
          </div>
          {isGrouped && points === undefined && (
            <div className="text-[10px] font-semibold uppercase tracking-wider text-wc-teal">
              Aligned
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <ScoreChip
          homeGoals={group.homeGoals}
          awayGoals={group.awayGoals}
          resultType={group.resultType}
          homeAccentColor={fixture.homeTeam.accentColor}
          awayAccentColor={fixture.awayTeam.accentColor}
        />
        {points !== undefined && <PointsBadge points={points} />}
      </div>
    </div>
  );
}
