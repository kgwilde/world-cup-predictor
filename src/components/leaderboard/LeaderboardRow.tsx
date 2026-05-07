import Avatar from './Avatar';
import type { PlayerStanding } from '@/lib/types';

interface Props {
  standing: PlayerStanding;
  isViewer: boolean;
  matchDelta?: { points: number; rankChange: number } | null;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="font-display font-bold text-wc-gold tabular-nums text-lg w-7 text-center">
        🏆
      </span>
    );
  }
  return (
    <span className="font-display font-bold tabular-nums text-lg w-7 text-center text-wc-white/40">
      {rank}
    </span>
  );
}

function Delta({ rankChange }: { rankChange: number }) {
  if (rankChange === 0) {
    return <span className="text-wc-white/30 text-xs">—</span>;
  }
  if (rankChange > 0) {
    return <span className="text-wc-green text-xs font-bold">↑{rankChange}</span>;
  }
  return <span className="text-wc-red text-xs font-bold">↓{Math.abs(rankChange)}</span>;
}

function PointsChip({ points }: { points: number }) {
  if (points === 5) {
    return (
      <span className="bg-wc-gold text-wc-black text-xs font-bold px-2 py-0.5 rounded tabular-nums">
        +5
      </span>
    );
  }
  if (points >= 3) {
    return (
      <span className="bg-wc-green/20 text-wc-green text-xs font-bold px-2 py-0.5 rounded tabular-nums">
        +{points}
      </span>
    );
  }
  if (points >= 1) {
    return (
      <span className="bg-wc-white/10 text-wc-white text-xs font-bold px-2 py-0.5 rounded tabular-nums">
        +{points}
      </span>
    );
  }
  return (
    <span className="bg-wc-white/5 text-wc-white/30 text-xs font-bold px-2 py-0.5 rounded tabular-nums">
      +0
    </span>
  );
}

export default function LeaderboardRow({ standing, isViewer, matchDelta }: Props) {
  const isFirst = standing.rank === 1;

  return (
    <div
      className={[
        'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
        isFirst
          ? 'bg-gradient-to-r from-wc-gold/15 via-wc-gold/5 to-transparent border border-wc-gold/30'
          : 'bg-wc-ink border border-wc-white/10',
        isViewer ? 'ring-1 ring-wc-gold/40' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <RankBadge rank={standing.rank} />

      <Avatar name={standing.player.name} photoUrl={standing.player.photoUrl} size={40} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-display text-wc-white font-bold text-lg leading-tight truncate">
            {standing.player.name}
          </span>
          {isViewer && (
            <span className="text-[10px] font-body font-semibold text-wc-gold bg-wc-gold/10 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
              you
            </span>
          )}
        </div>
      </div>

      {matchDelta && (
        <div className="flex flex-col items-end gap-0.5">
          <PointsChip points={matchDelta.points} />
          <Delta rankChange={matchDelta.rankChange} />
        </div>
      )}

      <div className="text-right shrink-0">
        <div className="font-display text-wc-white font-bold text-2xl tabular-nums leading-tight">
          {standing.totalPoints}
        </div>
        <div className="text-wc-white/40 text-[10px] font-body uppercase tracking-wider">pts</div>
      </div>
    </div>
  );
}
