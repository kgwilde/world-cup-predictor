'use client';

import { useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import Avatar from './Avatar';
import type { PlayerStanding } from '@/lib/types';

interface Props {
  standing: PlayerStanding;
  isViewer: boolean;
  matchDelta?: { points: number; rankChange: number; multiChipApplied: boolean } | null;
  winnerPick?: string;
  onClick?: () => void;
}

const RANK_CONFIG: Record<
  number,
  { rankClass: string; ringClass: string; rowClass: string; shadowClass: string }
> = {
  1: {
    rankClass: 'text-[#FFD000]',
    ringClass: 'ring-2 ring-[#FFD000] ring-offset-2 ring-offset-[#070a10]',
    rowClass: 'bg-gradient-to-r from-[#FFD000]/[0.20] to-[#131a26] border border-[#FFD000]/80',
    shadowClass: 'shadow-[0_8px_22px_-12px_rgba(255,208,0,0.42)]',
  },
  2: {
    rankClass: 'text-[#E2E8F0]',
    ringClass: 'ring-2 ring-[#E2E8F0]/90 ring-offset-2 ring-offset-[#070a10]',
    rowClass: 'bg-gradient-to-r from-[#E2E8F0]/[0.13] to-[#131a26] border border-[#E2E8F0]/65',
    shadowClass: 'shadow-[0_8px_22px_-12px_rgba(226,232,240,0.32)]',
  },
};

const RAINBOW = 'linear-gradient(135deg, #f72585, #f8961e, #90be6d, #4cc9f0, #7209b7)';

const DEFAULT_RANK_CONFIG = {
  rankClass: 'text-slate-400',
  ringClass: 'ring-2 ring-white/15 ring-offset-2 ring-offset-[#070a10]',
  rowClass: 'bg-gradient-to-r from-[#10151f] to-[#131a26] border border-white/[0.07]',
  shadowClass: '',
};

function RankChangeChip({ rankChange }: { rankChange: number }) {
  if (rankChange > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums text-emerald-400">
        <span>▲</span>
        <span>{rankChange}</span>
      </span>
    );
  }
  if (rankChange < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums text-red-400">
        <span>▼</span>
        <span>{Math.abs(rankChange)}</span>
      </span>
    );
  }
  return <span className="text-[11px] font-bold text-slate-600">–</span>;
}

function RoundChangeChip({
  points,
  multiChipApplied,
}: {
  points: number;
  multiChipApplied?: boolean;
}) {
  if (points > 0) {
    if (multiChipApplied) {
      return (
        <span
          className="relative inline-flex shrink-0 rounded-md"
          style={{ padding: 1.5, background: RAINBOW }}
        >
          <span className="inline-flex items-center text-[11px] font-bold tabular-nums rounded-[5px] px-1.5 py-0.5 text-[#54d08a] bg-wc-ink">
            +{points}
          </span>
          <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-wc-gold text-[7px] font-bold leading-none text-wc-black">
            ×2
          </span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center text-[11px] font-bold tabular-nums rounded-md px-1.5 py-0.5 text-[#54d08a] bg-emerald-500/[0.18]">
        +{points}
      </span>
    );
  }
  return (
    <span className="text-[11px] font-bold tabular-nums rounded-md px-1.5 py-0.5 text-slate-400 bg-white/[0.06]">
      +0
    </span>
  );
}

export default function LeaderboardRow({
  standing,
  isViewer,
  matchDelta,
  winnerPick,
  onClick,
}: Props) {
  const { rank } = standing;
  const cfg = RANK_CONFIG[rank] ?? DEFAULT_RANK_CONFIG;
  const displayName = standing.player.teamName ?? standing.player.name;
  const ownerName = standing.player.teamName ? standing.player.name : null;

  const touchStartY = useRef(0);
  const didScroll = useRef(false);

  return (
    <button
      type="button"
      aria-label={`${displayName}, rank ${rank}, ${standing.totalPoints} points`}
      onClick={() => {
        if (!didScroll.current) onClick?.();
      }}
      onTouchStart={(e) => {
        touchStartY.current = e.touches[0].clientY;
        didScroll.current = false;
      }}
      onTouchMove={(e) => {
        if (Math.abs(e.touches[0].clientY - touchStartY.current) > 8) {
          didScroll.current = true;
        }
      }}
      className={`w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 min-h-[44px] text-left cursor-pointer transition-all hover:-translate-y-px hover:border-white/20 active:scale-[0.99] active:opacity-80 ${cfg.rowClass} ${cfg.shadowClass}`}
    >
      {/* Rank */}
      <span
        className={`w-[18px] text-center text-base font-bold tabular-nums shrink-0 ${cfg.rankClass}`}
      >
        {rank}
      </span>

      {/* Avatar */}
      <Avatar
        name={standing.player.name}
        photoUrl={standing.player.photoUrl}
        size={42}
        ringClass={cfg.ringClass}
        flagCode={winnerPick}
      />

      {/* Name block */}
      <div className="flex-1 min-w-0 flex flex-col gap-[3px]">
        <span className="font-display text-[15.5px] font-bold text-white whitespace-nowrap">
          {displayName}
        </span>
        {(ownerName || isViewer) && (
          <div className="flex items-center">
            {ownerName && (
              <span className="font-body text-[12.5px] text-slate-400">{ownerName}</span>
            )}
            {isViewer && (
              <span className="text-[9px] font-bold tracking-wide text-[#1a1407] bg-[#e6b94e] rounded px-1.5 py-0.5 ml-1.5 shrink-0">
                YOU
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 translate-x-2">
        {/* Stat cluster */}
        <div className="shrink-0 flex flex-col items-end gap-1">
          <div className="h-5 flex items-center justify-end gap-1.5">
            {matchDelta && <RankChangeChip rankChange={matchDelta.rankChange} />}
            {matchDelta && (
              <RoundChangeChip
                points={matchDelta.points}
                multiChipApplied={matchDelta.multiChipApplied}
              />
            )}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-display text-[22px] font-bold tabular-nums tracking-tight text-white">
              {standing.totalPoints}
            </span>
            <span className="font-body text-[10px] font-bold tracking-wide text-slate-500">
              PTS
            </span>
          </div>
        </div>

        {/* Chevron */}
        <ChevronRight className="h-4 w-4 text-slate-500 shrink-0" />
      </div>
    </button>
  );
}
