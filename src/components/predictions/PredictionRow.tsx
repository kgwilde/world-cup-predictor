import Avatar from '@/components/leaderboard/Avatar';
import ScoreChip from './ScoreChip';
import StackedAvatars from './StackedAvatars';
import type { PredictionGroup } from '@/lib/predictions';
import type { Fixture, Player } from '@/lib/types';

interface Props {
  group: PredictionGroup;
  fixture: Fixture;
  players: Player[];
}

function getPlayerName(players: Player[], playerId: string) {
  return players.find((p) => p.id === playerId)?.name ?? 'Unknown';
}

function formatPlayerNames(players: Player[], playerIds: string[]) {
  const names = playerIds.map((id) => getPlayerName(players, id));

  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;

  const allButLast = names.slice(0, -1).join(', ');
  return `${allButLast} & ${names[names.length - 1]}`;
}

export default function PredictionRow({ group, fixture, players }: Props) {
  const isGrouped = group.playerIds.length > 1;

  return (
    <div
      className={`flex items-center justify-between gap-3 border-b border-white/10 py-3 last:border-0 ${
        isGrouped ? 'bg-wc-teal/5' : ''
      }`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {isGrouped ? (
          <StackedAvatars playerIds={group.playerIds} />
        ) : (
          <Avatar name={getPlayerName(players, group.playerIds[0])} size={30} />
        )}

        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="text-sm font-medium leading-snug text-white/90">
            {formatPlayerNames(players, group.playerIds)}
          </div>
          {isGrouped && (
            <div className="text-[10px] font-semibold uppercase tracking-wider text-wc-teal">
              Aligned
            </div>
          )}
        </div>
      </div>

      <ScoreChip
        homeGoals={group.homeGoals}
        awayGoals={group.awayGoals}
        resultType={group.resultType}
        homeAccentColor={fixture.homeTeam.accentColor}
        awayAccentColor={fixture.awayTeam.accentColor}
      />
    </div>
  );
}
