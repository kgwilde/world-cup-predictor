import Avatar from '@/components/leaderboard/Avatar';
import ScoreChip from './ScoreChip';
import { getResultType } from '@/lib/predictions';
import type { Fixture, Prediction, Player } from '@/lib/types';

interface Props {
  prediction: Prediction;
  player: Player | undefined;
  fixture: Fixture;
  points?: number;
  multiChipApplied?: boolean;
  onPlayerClick?: (playerId: string) => void;
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

export default function PredictionRow({
  prediction,
  player,
  fixture,
  points,
  multiChipApplied,
  onPlayerClick,
}: Props) {
  const name = player?.name ?? 'Unknown';
  const resultType = getResultType(prediction.homeGoals, prediction.awayGoals);

  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/10 py-3 last:border-0">
      <button
        type="button"
        onClick={() => onPlayerClick?.(prediction.playerId)}
        className="flex min-w-0 flex-1 items-center gap-3 cursor-pointer active:opacity-70 transition-opacity text-left"
      >
        <Avatar name={name} photoUrl={player?.photoUrl} size={30} />
        <span className="text-sm font-medium leading-snug text-white/90 hover:text-white transition-colors truncate">
          {name}
        </span>
      </button>

      <div className="flex items-center gap-2 shrink-0">
        <ScoreChip
          homeGoals={prediction.homeGoals}
          awayGoals={prediction.awayGoals}
          resultType={resultType}
          homeAccentColor={fixture.homeTeam.accentColor}
          awayAccentColor={fixture.awayTeam.accentColor}
          multiChip={multiChipApplied}
        />
        {points !== undefined && <PointsBadge points={points} />}
      </div>
    </div>
  );
}
