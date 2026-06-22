const RAINBOW = 'linear-gradient(135deg, #f72585, #f8961e, #90be6d, #4cc9f0, #7209b7)';

const base =
  'inline-flex items-center justify-center gap-1.5 w-16 text-xs font-bold tabular-nums rounded px-1.5 py-0.5 shrink-0 border';

function LiveDot() {
  return (
    <span className="relative flex h-1.5 w-1.5 shrink-0">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
    </span>
  );
}

export function PointsBadge({
  points,
  multiChipApplied,
  live,
}: {
  points: number;
  multiChipApplied?: boolean;
  live?: boolean;
}) {
  const label = points === 1 ? '1 pt' : `${points} pts`;

  if (multiChipApplied) {
    return (
      <span
        className="relative inline-flex shrink-0 rounded-md"
        style={{ padding: 1.5, background: RAINBOW }}
      >
        <span className={`${base} text-wc-black dark:text-wc-bone bg-gray-100 dark:bg-wc-ink border-transparent rounded-[5px]`}>
          {live && <LiveDot />}
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
      <span className={`${base} text-wc-black dark:text-wc-bone bg-wc-green/20 dark:bg-wc-green/40 border-wc-green`}>
        {live && <LiveDot />}
        {label}
      </span>
    );
  }
  if (points >= 2) {
    return (
      <span className={`${base} text-wc-black dark:text-wc-bone bg-wc-green/10 dark:bg-wc-green/[0.18] border-wc-green/50`}>
        {live && <LiveDot />}
        {label}
      </span>
    );
  }
  if (points === 1) {
    return (
      <span className={`${base} text-wc-black/60 dark:text-wc-bone bg-black/5 dark:bg-wc-gray/40 border-black/20 dark:border-wc-bone/25`}>
        {live && <LiveDot />}
        1 pt
      </span>
    );
  }
  return (
    <span className={`${base} text-wc-black/30 dark:text-white/30 bg-black/[0.05] dark:bg-white/[0.07] border-black/[0.10] dark:border-white/[0.12]`}>
      {live && <LiveDot />}
      0 pts
    </span>
  );
}
