'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { getFlagByCode } from '@/lib/flags';
import type { Fixture, FixtureStage, MatchResult, Team } from '@/lib/types';

import { fixtures } from '@/data/fixtures';
import { getNow } from '@/lib/deadline';
import { useAuthStore } from '@/app/stores/useAuthStore';

const STAGE_LABELS: Record<FixtureStage, string> = {
  group: 'Group Stage',
  round_of_32: 'Round of 32',
  round_of_16: 'Round of 16',
  quarter_final: 'Quarter-final',
  semi_final: 'Semi-final',
  third_place: 'Third-place',
  final: 'Final',
};

const MATCH_DURATION_MINUTES = 90;
const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;
const MILLISECONDS_PER_MINUTE = 1000 * 60;
const COUNTDOWN_TICK_INTERVAL_MS = 30 * 1000;

function TeamFlag({ team }: { team: Team }) {
  if (team.code === 'TBD')
    return <div className="h-6 w-9 rounded-[2px] bg-black/10 ring-1 ring-black/20 dark:bg-white/10 dark:ring-white/20" aria-hidden />;
  const Flag = getFlagByCode(team.code);
  if (!Flag) return <div className="h-6 w-9 rounded-[2px] bg-black/10 ring-1 ring-black/20 dark:bg-white/10 dark:ring-white/20" aria-hidden />;
  // Flag is a stable reference from a static module-scope map — not created during render
  // eslint-disable-next-line react-hooks/static-components
  return <Flag title={team.name} className="h-6 w-9 rounded-[2px] object-cover ring-1 ring-black/20 shadow-md dark:ring-white/20" />;
}

function getDaysUntil(kickoff: Date, now: Date) {
  const kickoffDay = new Date(kickoff);
  kickoffDay.setHours(0, 0, 0, 0);
  const todayDay = new Date(now);
  todayDay.setHours(0, 0, 0, 0);
  return Math.round((kickoffDay.getTime() - todayDay.getTime()) / MILLISECONDS_PER_DAY);
}

function formatKickoffDay(kickoff: Date, now: Date) {
  const daysUntil = getDaysUntil(kickoff, now);

  if (daysUntil === -1) {
    return 'Yesterday';
  }
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
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCountdown(kickoff: Date, now: Date): string | null {
  const diffMs = kickoff.getTime() - now.getTime();
  if (diffMs <= 0 || diffMs > 24 * 60 * 60 * 1000) return null;
  const totalMins = Math.floor(diffMs / (1000 * 60));
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hrs === 0) return `in ${mins}m`;
  if (mins === 0) return `in ${hrs}h`;
  return `in ${hrs}h ${mins}m`;
}



export function isFixtureLive(kickoff: Date, now: Date, result?: MatchResult) {
  // If the API has told us the status, trust it — matches can run beyond 90 minutes.
  if (result?.status === 'live') return true;
  if (result?.status === 'final') return false;
  // No result yet: use the kickoff window as a best-guess until the first sync.
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
      <style>{`
        @keyframes live-ping {
          0% { transform: scale(1); opacity: 0.75; }
          75%, 100% { transform: scale(2.25); opacity: 0; }
        }
        .animate-live-ping {
          animation: live-ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
      <div className="flex items-center gap-1.5 bg-black/30 rounded-full px-2 py-0.5 backdrop-blur-sm">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-live-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-400" />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-white">Live</span>
      </div>
    </div>
  );
}

interface TeamHalfProps {
  team: Team;
  side: 'home' | 'away';
}

function TeamHalf({ team, side }: TeamHalfProps) {
  const isPlaceholder = team.code === 'TBD';
  const alignment = side === 'home' ? 'items-start' : 'items-end';

  return (
    <div className={`flex w-full flex-col gap-1 ${alignment}`}>
      <TeamFlag team={team} />
      <span
        className={`w-full truncate text-[13px] font-semibold leading-tight text-wc-black dark:text-white ${
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
  const isLive = isFixtureLive(kickoff, now, result);
  const dayLabel = formatKickoffDay(kickoff, now);
  const timeLabel = formatKickoffTime(kickoff);
  const stageLabel = getStageLabel(fixture);

  const countdownLabel = formatCountdown(kickoff, now);

  const homeGlow = `radial-gradient(circle at top left, ${fixture.homeTeam.accentColor} 0%, transparent 45%)`;
  const awayGlow = `radial-gradient(circle at top right, ${fixture.awayTeam.accentColor} 0%, transparent 45%)`;
  const cardBackground = `${homeGlow}, ${awayGlow}, var(--fixture-card-base)`;

  const accentBar = `linear-gradient(to right, ${fixture.homeTeam.accentColor} 0%, ${fixture.homeTeam.accentColor} 35%, ${fixture.awayTeam.accentColor} 65%, ${fixture.awayTeam.accentColor} 100%)`;

  return (
    <article className={`snap-start shrink-0 ${isFullWidth ? 'w-full' : 'w-[15rem] sm:w-[17rem]'}`}>
      <div
        className="relative h-[9.5rem] overflow-hidden rounded-xl ring-1 ring-black/10 dark:ring-white/10 shadow-lg"
        style={{ background: cardBackground }}
      >
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-1"
          style={{ background: accentBar }}
        />
        {/* Light mode: wash out dark team glows behind the header text */}
        <div
          aria-hidden
          className="absolute inset-0 dark:hidden pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.3) 40%, rgba(255,255,255,0) 75%)' }}
        />
        <div className="relative flex h-full flex-col px-4 py-2.5">
          <header className="flex h-9 items-start justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-wc-black/75 dark:text-white/75">
              {stageLabel}
            </span>
            {isLive ? (
              <LiveIndicator />
            ) : (
              <div className="flex flex-col items-end text-right">
                {countdownLabel ? (
                  <span className="text-[9px] font-medium text-wc-black/60 dark:text-white/60 tabular-nums">
                    {countdownLabel}
                  </span>
                ) : (
                  <span className="text-[10px] font-medium uppercase tracking-wider text-wc-black/60 dark:text-white/60">
                    {dayLabel}
                  </span>
                )}
                <span className="text-[13px] font-semibold text-wc-black dark:text-white tabular-nums">
                  {timeLabel}
                </span>
              </div>
            )}
          </header>

          <div className="flex flex-1 items-center gap-2">
            <div className="flex-1 min-w-0">
              <TeamHalf team={fixture.homeTeam} side="home" />
            </div>
            {result ? (
              <div className="flex flex-col items-center gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-bold text-xl text-wc-black dark:text-wc-white tabular-nums leading-none">
                    {result.homeGoals}
                  </span>
                  <span className="text-wc-black/30 dark:text-wc-white/30 text-sm">–</span>
                  <span className="font-display font-bold text-xl text-wc-black dark:text-wc-white tabular-nums leading-none">
                    {result.awayGoals}
                  </span>
                </div>
                {isLive && result.minute != null ? (
                  <span className="text-[9px] font-semibold tabular-nums text-red-400/80">
                    {result.minute}'
                  </span>
                ) : !isLive ? (
                  <span className="text-[9px] font-semibold uppercase tracking-widest text-wc-black/40 dark:text-wc-white/40">
                    FT
                  </span>
                ) : null}
              </div>
            ) : (
              <span className="text-[10px] font-bold uppercase tracking-widest text-wc-black/50 dark:text-white/50">
                vs
              </span>
            )}
            <div className="flex-1 min-w-0">
              <TeamHalf team={fixture.awayTeam} side="away" />
            </div>
          </div>

          <footer className="border-t border-black/15 dark:border-white/15 pt-1.5">
            <p className="text-[10px] leading-snug text-wc-black/65 dark:text-white/65 truncate">{fixture.venue}</p>
          </footer>
        </div>
      </div>
    </article>
  );
}

function useCurrentTime() {
  const [now, setNow] = useState(() => getNow());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(getNow());
    }, COUNTDOWN_TICK_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, []);

  return now;
}

export function FixtureSlider({ initialResults }: { initialResults?: MatchResult[] }) {
  const now = useCurrentTime();
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollDone = useRef(false);
  const storeResults = useAuthStore((s) => s.results);
  const resultsLoading = useAuthStore((s) => s.resultsLoading);

  // Use server-prefetched results while the client store is still fetching
  const activeResults = resultsLoading && initialResults ? initialResults : storeResults;
  const isLoading = resultsLoading && !initialResults;

  const resultsMap = useMemo(
    () => new Map(activeResults.map((r) => [r.fixtureId, r])),
    [activeResults],
  );

  const allFixtures = useMemo(
    () =>
      [...fixtures].sort(
        (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime(),
      ),
    [],
  );

  const [extraFuture, setExtraFuture] = useState(0);
  const viewMoreAnchorRef = useRef<number>(-1);

  // Render all past fixtures + the next 20 upcoming ones to keep initial mount fast.
  // allFixtures is sorted ascending so this is always a leading slice — indices are
  // identical between allFixtures and renderedFixtures, so scroll logic is unaffected.
  const renderedFixtures = useMemo(() => {
    const nowTime = getNow().getTime();
    const firstFutureIdx = allFixtures.findIndex(
      (f) => new Date(f.kickoff).getTime() > nowTime,
    );
    if (firstFutureIdx < 0) return allFixtures;
    return allFixtures.slice(0, firstFutureIdx + 20 + extraFuture);
  }, [allFixtures, extraFuture]);

  // After "View more" expands the list, scroll back to the card that was last before expansion
  useLayoutEffect(() => {
    const anchorIndex = viewMoreAnchorRef.current;
    if (anchorIndex < 0) return;
    viewMoreAnchorRef.current = -1;
    const container = scrollRef.current;
    if (!container) return;
    const card = container.children[anchorIndex] as HTMLElement | undefined;
    card?.scrollIntoView({ behavior: 'instant', inline: 'start', block: 'nearest' });
  }, [extraFuture]);

  useLayoutEffect(() => {
    if (scrollDone.current) return;
    const container = scrollRef.current;
    if (!container || !container.children.length) return;

    let targetIndex: number;
    if (isLoading) {
      // Fallback: no server data, approximate by time window
      const nowTime = Date.now();
      targetIndex = allFixtures.findIndex(
        (f) => new Date(f.kickoff).getTime() + 150 * MILLISECONDS_PER_MINUTE > nowTime,
      );
    } else if (resultsMap.size === 0) {
      // Results not loaded yet — skip scrolling, don't lock, let the effect re-run when they arrive
      return;
    } else {
      targetIndex = allFixtures.findIndex((f) => {
        const result = resultsMap.get(f.id);
        return !result || result.status === 'live';
      });
      scrollDone.current = true;
    }

    if (targetIndex < 0 || targetIndex >= container.children.length) {
      targetIndex = container.children.length - 1;
    }
    const card = container.children[targetIndex] as HTMLElement | undefined;
    card?.scrollIntoView({ behavior: 'instant', inline: 'start', block: 'nearest' });
  }, [allFixtures, resultsMap, isLoading]);

  return (
    <>
      <div className="relative mt-2">
        <div
          ref={scrollRef}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-3 pt-1
                     [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="region"
          aria-label="Fixtures"
        >
          {renderedFixtures.map((fixture) => (
            <FixtureCard
              key={fixture.id}
              fixture={fixture}
              now={now}
              result={resultsMap.get(fixture.id)}
            />
          ))}
          {renderedFixtures.length < allFixtures.length && (
            <div className="snap-start shrink-0 flex items-center pr-2">
              <button
                type="button"
                onClick={() => {
                  viewMoreAnchorRef.current = renderedFixtures.length - 1;
                  setExtraFuture((n) => n + 20);
                }}
                className="text-xs font-semibold text-wc-black/60 hover:text-wc-black active:text-wc-black dark:text-white/70 dark:hover:text-white dark:active:text-white transition-colors whitespace-nowrap px-2 py-1"
              >
                View more →
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
