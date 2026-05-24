import Avatar from './Avatar';
import type { PlayerStanding } from '@/lib/types';

interface Props {
  standing: PlayerStanding;
  isViewer: boolean;
  matchDelta?: { points: number; rankChange: number; multiChipApplied: boolean } | null;
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

const RAINBOW = 'linear-gradient(135deg, #f72585, #f8961e, #90be6d, #4cc9f0, #7209b7)';

function PointsChip({ points, multiChipApplied }: { points: number; multiChipApplied?: boolean }) {
  const showMulti = multiChipApplied && points > 0;

  if (showMulti) {
    let textClass: string;
    if (points >= 5) textClass = 'text-wc-gold';
    else if (points >= 3) textClass = 'text-wc-green';
    else textClass = 'text-wc-white';

    return (
      <span
        className="relative inline-flex shrink-0 rounded"
        style={{ padding: 1.5, background: RAINBOW }}
      >
        <span className={`bg-wc-ink ${textClass} text-xs font-bold px-2 py-0.5 rounded-[3px] tabular-nums`}>
          +{points}
        </span>
        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-wc-gold text-[8px] font-bold leading-none text-wc-black">
          ×2
        </span>
      </span>
    );
  }

  if (points >= 5) {
    return (
      <span className="bg-wc-gold text-wc-black text-xs font-bold px-2 py-0.5 rounded tabular-nums">
        +{points}
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
            {standing.player.teamName ?? standing.player.name}
          </span>
          {isViewer && (
            <span className="text-[10px] font-body font-semibold text-wc-gold bg-wc-gold/10 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
              you
            </span>
          )}
        </div>
        {standing.player.teamName && (
          <p className="text-wc-white/40 text-xs font-body truncate">{standing.player.name}</p>
        )}
      </div>

      {matchDelta && (
        <div className="flex flex-col items-end gap-0.5">
          <PointsChip points={matchDelta.points} multiChipApplied={matchDelta.multiChipApplied} />
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
