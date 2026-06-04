'use client';

import { useEffect, useMemo, useState } from 'react';
import * as Flags from 'country-flag-icons/react/3x2';
import type { Fixture, FixtureStage, MatchResult, Team } from '@/lib/types';

import { fixtures } from '@/data/fixtures';

const TEST_NOW_OVERRIDE: string | null = null;

const STAGE_LABELS: Record<FixtureStage, string> = {
  group: 'Group Stage',
  round_of_32: 'Round of 32',
  round_of_16: 'Round of 16',
  quarter_final: 'Quarter-final',
  semi_final: 'Semi-final',
  third_place: 'Third-place',
  final: 'Final',
};

const LATE_NIGHT_CUTOFF_HOURS = 5;
const MATCH_DURATION_MINUTES = 90;
const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;
const MILLISECONDS_PER_HOUR = 1000 * 60 * 60;
const MILLISECONDS_PER_MINUTE = 1000 * 60;
const COUNTDOWN_TICK_INTERVAL_MS = 30 * 1000;

function getFlagComponent(team: Team) {
  if (team.code === 'TBD') {
    return null;
  }
  return Flags[team.code as keyof typeof Flags] ?? null;
}

function getViewingDay(date: Date) {
  const adjusted = new Date(date);
  adjusted.setHours(adjusted.getHours() - LATE_NIGHT_CUTOFF_HOURS);
  adjusted.setHours(0, 0, 0, 0);
  return adjusted;
}

function getDaysUntilViewing(kickoff: Date, now: Date) {
  const kickoffViewingDay = getViewingDay(kickoff);
  const todayViewingDay = getViewingDay(now);
  return Math.round(
    (kickoffViewingDay.getTime() - todayViewingDay.getTime()) / MILLISECONDS_PER_DAY
  );
}

function formatKickoffDay(kickoff: Date, now: Date) {
  const daysUntil = getDaysUntilViewing(kickoff, now);

  if (daysUntil === 0) {
    return 'Today';
  }
  if (daysUntil === 1) {
    return 'Tomorrow';
  }

  if (daysUntil > 1 && daysUntil < 7) {
    return kickoff.toLocaleDateString('en-GB', { weekday: 'long' });
  }

  return kickoff.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function formatKickoffTime(kickoff: Date) {
  return kickoff.toLocaleTimeString('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatCountdownToKickoff(kickoff: Date, now: Date) {
  const millisecondsUntil = kickoff.getTime() - now.getTime();
  if (millisecondsUntil <= 0) {
    return null;
  }

  const hours = Math.floor(millisecondsUntil / MILLISECONDS_PER_HOUR);
  const minutes = Math.floor((millisecondsUntil % MILLISECONDS_PER_HOUR) / MILLISECONDS_PER_MINUTE);

  if (hours === 0) {
    const displayMinutes = Math.max(minutes, 1);
    return `in ${displayMinutes}m`;
  }

  return `in ${hours}h ${minutes}m`;
}

function isFixtureLive(kickoff: Date, now: Date) {
  const kickoffTime = kickoff.getTime();
  const nowTime = now.getTime();
  const matchEndTime = kickoffTime + MATCH_DURATION_MINUTES * MILLISECONDS_PER_MINUTE;
  return nowTime >= kickoffTime && nowTime < matchEndTime;
}

function getStageLabel(fixture: Fixture) {
  if (fixture.stage === 'group' && fixture.group) {
    return `Group ${fixture.group}`;
  }
  return STAGE_LABELS[fixture.stage];
}

function LiveIndicator() {
  return (
    <div className="flex flex-col items-end text-right">
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-live-ping rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-red-400">Live</span>
      </div>
    </div>
  );
}

interface TeamHalfProps {
  team: Team;
  side: 'home' | 'away';
}

function TeamHalf({ team, side }: TeamHalfProps) {
  const FlagComponent = getFlagComponent(team);
  const isPlaceholder = team.code === 'TBD';
  const alignment = side === 'home' ? 'items-start' : 'items-end';

  return (
    <div className={`flex w-full flex-col gap-1 ${alignment}`}>
      {FlagComponent ? (
        <FlagComponent
          title={team.name}
          className="h-6 w-9 rounded-[2px] object-cover ring-1 ring-white/20 shadow-md"
        />
      ) : (
        <div className="h-6 w-9 rounded-[2px] bg-white/10 ring-1 ring-white/20" aria-hidden />
      )}
      <span
        className={`w-full truncate text-[13px] font-semibold leading-tight text-white ${
          isPlaceholder ? 'text-[11px] font-medium opacity-90' : ''
        } ${side === 'away' ? 'text-right' : ''}`}
      >
        {team.name}
      </span>
    </div>
  );
}

interface FixtureCardProps {
  fixture: Fixture;
  now: Date;
  isFullWidth?: boolean;
  result?: MatchResult;
}

export function FixtureCard({ fixture, now, isFullWidth, result }: FixtureCardProps) {
  const kickoff = new Date(fixture.kickoff);
  const isLive = isFixtureLive(kickoff, now);
  const dayLabel = formatKickoffDay(kickoff, now);
  const timeLabel = formatKickoffTime(kickoff);
  const stageLabel = getStageLabel(fixture);

  const isToday = dayLabel === 'Today';
  const countdownLabel = isToday && !isLive ? formatCountdownToKickoff(kickoff, now) : null;

  const homeGlow = `radial-gradient(circle at top left, ${fixture.homeTeam.accentColor} 0%, transparent 45%)`;
  const awayGlow = `radial-gradient(circle at top right, ${fixture.awayTeam.accentColor} 0%, transparent 45%)`;
  const cardBackground = `${homeGlow}, ${awayGlow}, #0a0a0a`;

  const accentBar = `linear-gradient(to right, ${fixture.homeTeam.accentColor} 0%, ${fixture.homeTeam.accentColor} 35%, ${fixture.awayTeam.accentColor} 65%, ${fixture.awayTeam.accentColor} 100%)`;

  return (
    <article className={`snap-start shrink-0 ${isFullWidth ? 'w-full' : 'w-[15rem] sm:w-[17rem]'}`}>
      <div
        className="relative h-[9.5rem] overflow-hidden rounded-xl ring-1 ring-white/10 shadow-lg"
        style={{ background: cardBackground }}
      >
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-1"
          style={{ background: accentBar }}
        />
        <div className="relative flex h-full flex-col justify-between px-4 py-2.5">
          <header className="flex items-start justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/75">
              {stageLabel}
            </span>
            {isLive ? (
              <LiveIndicator />
            ) : (
              <div className="flex flex-col items-end text-right">
                <span className="text-[10px] font-medium uppercase tracking-wider text-white/60">
                  {dayLabel}
                </span>
                <span className="text-[13px] font-semibold text-white tabular-nums">
                  {timeLabel}
                </span>
                {countdownLabel ? (
                  <span className="text-[10px] font-medium text-white/55 tabular-nums">
                    {countdownLabel}
                  </span>
                ) : null}
              </div>
            )}
          </header>

          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <TeamHalf team={fixture.homeTeam} side="home" />
            </div>
            {result ? (
              <div className="flex flex-col items-center gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-bold text-xl text-wc-white tabular-nums leading-none">
                    {result.homeGoals}
                  </span>
                  <span className="text-wc-white/30 text-sm">–</span>
                  <span className="font-display font-bold text-xl text-wc-white tabular-nums leading-none">
                    {result.awayGoals}
                  </span>
                </div>
                <span className="text-[9px] font-semibold uppercase tracking-widest text-wc-white/40">
                  FT
                </span>
              </div>
            ) : (
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                vs
              </span>
            )}
            <div className="flex-1 min-w-0">
              <TeamHalf team={fixture.awayTeam} side="away" />
            </div>
          </div>

          <footer className="border-t border-white/15 pt-1.5">
            <p className="text-[10px] leading-snug text-white/65 truncate">
              {fixture.venue}
            </p>
          </footer>
        </div>
      </div>
    </article>
  );
}

function useCurrentTime() {
  const initialNow = useMemo(() => {
    if (TEST_NOW_OVERRIDE) {
      return new Date(TEST_NOW_OVERRIDE);
    }
    return new Date();
  }, []);

  const [now, setNow] = useState(initialNow);

  useEffect(() => {
    if (TEST_NOW_OVERRIDE) {
      return;
    }

    const intervalId = setInterval(() => {
      setNow(new Date());
    }, COUNTDOWN_TICK_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, []);

  return now;
}

export function FixtureSlider() {
  const now = useCurrentTime();

  const upcomingFixtures = useMemo(() => {
    const nowTime = now.getTime();
    const matchWindowMilliseconds = MATCH_DURATION_MINUTES * MILLISECONDS_PER_MINUTE;

    const futureFixtures = fixtures.filter((fixture) => {
      const kickoffTime = new Date(fixture.kickoff).getTime();
      const matchEndTime = kickoffTime + matchWindowMilliseconds;
      return matchEndTime > nowTime;
    });

    futureFixtures.sort((a, b) => {
      const timeA = new Date(a.kickoff).getTime();
      const timeB = new Date(b.kickoff).getTime();
      return timeA - timeB;
    });

    return futureFixtures;
  }, [now]);

  return (
    <>
      <style>{`
        @keyframes live-ping {
          0% { transform: scale(1); opacity: 0.75; }
          75%, 100% { transform: scale(2.25); opacity: 0; }
        }
        .animate-live-ping {
          animation: live-ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
      <div className="relative mt-2">
        <div
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-4 pt-1
                     [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="region"
          aria-label="Fixtures"
        >
          {upcomingFixtures.map((fixture) => (
            <FixtureCard key={fixture.id} fixture={fixture} now={now} />
          ))}
        </div>
      </div>
    </>
  );
}
