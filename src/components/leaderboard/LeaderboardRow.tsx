'use client';

import { useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import Avatar from './Avatar';
import type { PlayerStanding } from '@/lib/types';

interface Props {
  standing: PlayerStanding;
  isViewer: boolean;
  matchDelta?: { points: number; rankChange: number; multiChipApplied: boolean } | null;
  onClick?: () => void;
}

const PODIUM_COLORS: Record<number, string> = {
  1: '#efbf04',
  2: '#C0C0C0',
  3: '#CD7F32',
};

function RankBadge({ rank }: { rank: number }) {
  const podiumColor = PODIUM_COLORS[rank];
  return (
    <span
      className={`font-display font-bold tabular-nums text-lg w-7 text-center ${!podiumColor ? 'text-wc-white/50' : ''}`}
      style={podiumColor ? { color: podiumColor } : undefined}
    >
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

const RANK_ROW: Record<number, string> = {
  1: 'bg-gradient-to-r from-wc-gold/20 via-wc-gold/8 to-transparent border border-wc-gold/40',
  2: 'bg-gradient-to-r from-wc-gold/12 via-wc-gold/5 to-transparent border border-wc-gold/25',
  3: 'bg-gradient-to-r from-wc-gold/7 via-wc-gold/3 to-transparent border border-wc-gold/15',
};

const RANK_AVATAR_RING: Record<number, string> = {
  1: 'ring-2 ring-wc-gold/80 ring-offset-2 ring-offset-wc-ink',
  2: 'ring-2 ring-[#C0C0C0]/70 ring-offset-2 ring-offset-wc-ink',
  3: 'ring-2 ring-[#CD7F32]/70 ring-offset-1 ring-offset-wc-ink',
};

export default function LeaderboardRow({ standing, isViewer, matchDelta, onClick }: Props) {
  const { rank } = standing;
  const rowBg = RANK_ROW[rank] ?? 'bg-wc-ink border border-wc-white/10';
  const avatarRing = RANK_AVATAR_RING[rank];

  const touchStartY = useRef(0);
  const didScroll = useRef(false);

  return (
    <button
      type="button"
      onClick={() => { if (!didScroll.current) onClick?.(); }}
      onTouchStart={(e) => {
        touchStartY.current = e.touches[0].clientY;
        didScroll.current = false;
      }}
      onTouchMove={(e) => {
        if (Math.abs(e.touches[0].clientY - touchStartY.current) > 8) {
          didScroll.current = true;
        }
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left cursor-pointer hover:brightness-110 active:scale-[0.99] active:opacity-80 ${rowBg}`}
    >
      <RankBadge rank={rank} />

      <Avatar
        name={standing.player.name}
        photoUrl={standing.player.photoUrl}
        size={40}
        ringClass={avatarRing}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-display text-wc-white font-bold text-lg leading-tight truncate">
            {standing.player.teamName ?? standing.player.name}
          </span>
          {isViewer && !standing.player.teamName && (
            <span className="text-[9px] font-body font-semibold text-wc-gold bg-wc-gold/10 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
              you
            </span>
          )}
        </div>
        {standing.player.teamName && (
          <div className="flex items-center gap-1.5">
            <p className="text-wc-white/40 text-xs font-body truncate">{standing.player.name}</p>
            {isViewer && (
              <span className="text-[9px] font-body font-semibold text-wc-gold bg-wc-gold/10 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                you
              </span>
            )}
          </div>
        )}
      </div>

      {matchDelta && (
        <div className="flex flex-col items-end gap-0.5">
          <PointsChip points={matchDelta.points} multiChipApplied={matchDelta.multiChipApplied} />
          <Delta rankChange={matchDelta.rankChange} />
        </div>
      )}

      <div className="text-right shrink-0">
        <div className="font-display font-bold text-2xl tabular-nums leading-tight text-wc-white/80">
          {standing.totalPoints}
        </div>
        <div className="text-wc-white/40 text-[10px] font-body uppercase tracking-wider">pts</div>
      </div>

      <ChevronRight size={14} className="text-white/25 shrink-0 -ml-1" />
    </button>
  );
}
