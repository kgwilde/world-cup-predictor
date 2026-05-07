import type { MatchResultType } from '@/lib/predictions';

interface Props {
  homeGoals: number;
  awayGoals: number;
  resultType: MatchResultType;
  homeAccentColor: string;
  awayAccentColor: string;
}

const DRAW_CLASS = 'border-white/20 bg-white/10 text-white/80';

export default function ScoreChip({
  homeGoals,
  awayGoals,
  resultType,
  homeAccentColor,
  awayAccentColor,
}: Props) {
  if (resultType === 'draw') {
    return (
      <div className={`rounded-lg border px-3 py-1 text-sm font-semibold ${DRAW_CLASS}`}>
        {homeGoals} - {awayGoals}
      </div>
    );
  }

  const accentColor = resultType === 'home-win' ? homeAccentColor : awayAccentColor;

  return (
    <div
      className="rounded-lg border px-3 py-1 text-sm font-semibold text-white"
      style={{
        backgroundColor: `${accentColor}50`,
        borderColor: `${accentColor}55`,
      }}
    >
      {homeGoals} - {awayGoals}
    </div>
  );
}
