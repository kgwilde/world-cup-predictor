import Avatar from '@/components/leaderboard/Avatar';
import { players } from '@/data/players';

interface Props {
  playerIds: string[];
  size?: number;
}

function getPlayerName(playerId: string) {
  return players.find((player) => player.id === playerId)?.name ?? 'Unknown';
}

export default function StackedAvatars({ playerIds, size = 28 }: Props) {
  return (
    <div className="flex items-center">
      {playerIds.map((playerId, index) => (
        <div
          key={playerId}
          className="rounded-full ring-2 ring-wc-black"
          style={{ marginLeft: index === 0 ? 0 : -8 }}
        >
          <Avatar name={getPlayerName(playerId)} size={size} />
        </div>
      ))}
    </div>
  );
}
