import Avatar from '@/components/leaderboard/Avatar';
import ScoreChip from './ScoreChip';
import { PointsBadge } from '@/components/PointsBadge';
import { getResultType } from '@/lib/predictions';
import type { Fixture, Prediction, Player } from '@/lib/types';

interface Props {
  prediction: Prediction;
  player: Player | undefined;
  fixture: Fixture;
  points?: number;
  multiChipApplied?: boolean;
  live?: boolean;
  onPlayerClick?: (playerId: string) => void;
}

export default function PredictionRow({
  prediction,
  player,
  fixture,
  points,
  multiChipApplied,
  live,
  onPlayerClick,
}: Props) {
  const name = player?.name ?? 'Unknown';
  const resultType = getResultType(prediction.homeGoals, prediction.awayGoals);

  return (
    <div className="flex items-center justify-between gap-3 border-b border-black/10 dark:border-white/10 py-3 last:border-0">
      <button
        type="button"
        onClick={() => onPlayerClick?.(prediction.playerId)}
        className="flex min-w-0 flex-1 items-center gap-3 cursor-pointer active:opacity-70 transition-opacity text-left"
      >
        <Avatar name={name} photoUrl={player?.photoUrl} size={30} />
        <span className="text-sm font-medium leading-snug text-wc-black/90 dark:text-white/90 hover:text-wc-black dark:hover:text-white transition-colors truncate">
          {name}
        </span>
      </button>

      <div className="flex items-center gap-2 shrink-0">
        <span className="relative inline-flex shrink-0">
          <ScoreChip
            homeGoals={prediction.homeGoals}
            awayGoals={prediction.awayGoals}
            resultType={resultType}
            homeAccentColor={fixture.homeTeam.accentColor}
            awayAccentColor={fixture.awayTeam.accentColor}
          />
          {multiChipApplied && points === undefined && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-wc-gold text-[8px] font-bold leading-none text-wc-black">
              ×2
            </span>
          )}
        </span>
        {points !== undefined && (
          <PointsBadge points={points} multiChipApplied={multiChipApplied} live={live} />
        )}
      </div>
    </div>
  );
}
