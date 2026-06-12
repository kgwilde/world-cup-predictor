const RAINBOW = 'linear-gradient(135deg, #f72585, #f8961e, #90be6d, #4cc9f0, #7209b7)';

const base =
  'inline-flex items-center justify-center min-w-[2.75rem] text-center text-xs font-bold tabular-nums rounded px-1.5 py-0.5 shrink-0 border';

export function PointsBadge({
  points,
  multiChipApplied,
}: {
  points: number;
  multiChipApplied?: boolean;
}) {
  const label = points === 1 ? '1 pt' : `${points} pts`;

  if (multiChipApplied && points > 0) {
    return (
      <span
        className="relative inline-flex shrink-0 rounded-md"
        style={{ padding: 1.5, background: RAINBOW }}
      >
        <span
          className={`${base} text-wc-bone bg-wc-ink border-transparent rounded-[5px]`}
        >
          {label}
        </span>
        <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-wc-gold text-[7px] font-bold leading-none text-wc-black">
          ×2
        </span>
      </span>
    );
  }

  if (points >= 4) {
    return (
      <span className={`${base} text-wc-bone bg-wc-green/40 border-wc-green`}>
        {label}
      </span>
    );
  }
  if (points >= 2) {
    return (
      <span className={`${base} text-wc-bone bg-wc-green/[0.18] border-wc-green/50`}>
        {label}
      </span>
    );
  }
  if (points === 1) {
    return (
      <span className={`${base} text-wc-bone bg-wc-gray/40 border-wc-bone/25`}>
        1 pt
      </span>
    );
  }
  return (
    <span className={`${base} text-white/30 bg-white/[0.07] border-white/[0.12]`}>
      0 pts
    </span>
  );
}
