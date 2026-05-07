import Avatar from '@/components/leaderboard/Avatar';
import ScoreChip from './ScoreChip';
import StackedAvatars from './StackedAvatars';
import { players } from '@/data/players';
import type { PredictionGroup } from '@/lib/predictions';
import { Fixture } from '@/lib/types';

interface Props {
  group: PredictionGroup;
  fixture: Fixture;
}

function getPlayerName(playerId: string) {
  return players.find((player) => player.id === playerId)?.name ?? 'Unknown';
}

function formatPlayerNames(playerIds: string[]) {
  const names = playerIds.map(getPlayerName);

  if (names.length === 1) {
    return names[0];
  }

  if (names.length === 2) {
    return `${names[0]} & ${names[1]}`;
  }

  const allButLast = names.slice(0, -1).join(', ');
  const lastName = names[names.length - 1];
  return `${allButLast} & ${lastName}`;
}

export default function PredictionRow({ group, fixture }: Props) {
  const isGrouped = group.playerIds.length > 1;
  const containerClass = isGrouped
    ? 'border-wc-teal/25 bg-wc-teal/[0.07]'
    : 'border-white/10 bg-white/[0.03]';

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-2xl border px-3 py-3 ${containerClass}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {isGrouped ? (
          <StackedAvatars playerIds={group.playerIds} />
        ) : (
          <Avatar name={getPlayerName(group.playerIds[0])} size={30} />
        )}

        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="text-sm font-medium leading-snug text-white/90">
            {formatPlayerNames(group.playerIds)}
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
