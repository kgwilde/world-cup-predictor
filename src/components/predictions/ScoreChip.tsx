import type { MatchResultType } from '@/lib/predictions';

const RAINBOW = 'linear-gradient(135deg, #f72585, #f8961e, #90be6d, #4cc9f0, #7209b7)';
const DRAW_CLASS = 'border-black/20 dark:border-white/20 bg-black/10 dark:bg-white/10 text-wc-black/80 dark:text-white/80';

interface Props {
  homeGoals: number;
  awayGoals: number;
  resultType: MatchResultType;
  homeAccentColor: string;
  awayAccentColor: string;
  multiChip?: boolean;
}

export default function ScoreChip({
  homeGoals,
  awayGoals,
  resultType,
  homeAccentColor,
  awayAccentColor,
  multiChip,
}: Props) {
  const label = `${homeGoals} – ${awayGoals}`;

  if (multiChip) {
    return (
      <span
        className="relative inline-flex shrink-0 rounded-lg"
        style={{ padding: 1.5, background: RAINBOW }}
      >
        <span className="bg-white dark:bg-wc-ink rounded-[6px] px-3 py-1 text-sm font-semibold text-wc-black dark:text-white tabular-nums">
          {label}
        </span>
        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-wc-gold text-[8px] font-bold leading-none text-wc-black">
          ×2
        </span>
      </span>
    );
  }

  if (resultType === 'draw') {
    return (
      <div className={`rounded-lg border px-3 py-1 text-sm font-semibold tabular-nums ${DRAW_CLASS}`}>
        {label}
      </div>
    );
  }

  const accentColor = resultType === 'home-win' ? homeAccentColor : awayAccentColor;

  return (
    <div
      className="rounded-lg border px-3 py-1 text-sm font-semibold text-wc-black dark:text-white tabular-nums"
      style={{
        backgroundColor: `${accentColor}50`,
        borderColor: `${accentColor}55`,
      }}
    >
      {label}
    </div>
  );
}
