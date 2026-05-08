import Avatar from '@/components/leaderboard/Avatar';
import type { Player } from '@/lib/types';

interface Props {
  playerIds: string[];
  players: Player[];
  size?: number;
}

export default function StackedAvatars({ playerIds, players, size = 28 }: Props) {
  return (
    <div className="flex items-center">
      {playerIds.map((playerId, index) => {
        const player = players.find((p) => p.id === playerId);
        return (
          <div
            key={playerId}
            className="rounded-full ring-2 ring-wc-black"
            style={{ marginLeft: index === 0 ? 0 : -8 }}
          >
            <Avatar name={player?.name ?? 'Unknown'} photoUrl={player?.photoUrl} size={size} />
          </div>
        );
      })}
    </div>
  );
}
