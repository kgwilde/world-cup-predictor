// components/world-cup-countdown.tsx
'use client';

import Link from 'next/link';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

import { fixtures } from '@/data/fixtures';
import { useThemeStore } from '@/app/stores/useThemeStore';


export function Header() {
  const { theme, toggle } = useThemeStore();

  return (
    <header
      className="border-b border-white/10 sticky top-0 z-10 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #1e33b5 0%, #253ecf 55%, #2c47d4 100%)' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.12) 45%, rgba(255,255,255,0.07) 55%, transparent 80%)',
        }}
      />
      <div className="relative max-w-3xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-90 transition-opacity"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt="Logo"
            width={60}
            height={60}
            className="select-none w-10 h-10 sm:w-8 sm:h-8 shrink-0"
          />

          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest leading-none">
              <span className="text-white/45">FIFA® World Cup </span>
              <span className="text-wc-gold">2026</span>
            </p>
            <h1 className="font-display font-bold text-lg sm:text-2xl tracking-tight leading-tight text-white mt-0.5">
              Match Predictor
            </h1>
            <p className="hidden sm:block text-white/35 text-[10px] font-body tracking-widest mt-1">
              11 June – 19 July 2026
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={toggle}
            role="switch"
            aria-checked={theme === 'light'}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="relative h-6 w-11 rounded-full bg-white/20 hover:bg-white/30 transition-colors shrink-0"
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 flex items-center justify-center ${
                theme === 'light' ? 'translate-x-[22px]' : 'translate-x-0.5'
              }`}
            >
              {theme === 'dark' ? (
                <Sun size={11} className="text-wc-blue-dark" />
              ) : (
                <Moon size={11} className="text-wc-blue-dark" />
              )}
            </span>
          </button>
          <WorldCupCountdown />
        </div>
      </div>
    </header>
  );
}


const KICKOFF_TIMESTAMP = Date.UTC(2026, 5, 11, 19, 0, 0);

type TimeRemaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function getTimeRemaining(targetTimestamp: number): TimeRemaining {
  const millisecondsRemaining = Math.max(0, targetTimestamp - Date.now());

  const ONE_SECOND_MS = 1000;
  const ONE_MINUTE_MS = 60 * ONE_SECOND_MS;
  const ONE_HOUR_MS = 60 * ONE_MINUTE_MS;
  const ONE_DAY_MS = 24 * ONE_HOUR_MS;

  const days = Math.floor(millisecondsRemaining / ONE_DAY_MS);
  const hours = Math.floor((millisecondsRemaining % ONE_DAY_MS) / ONE_HOUR_MS);
  const minutes = Math.floor((millisecondsRemaining % ONE_HOUR_MS) / ONE_MINUTE_MS);
  const seconds = Math.floor((millisecondsRemaining % ONE_MINUTE_MS) / ONE_SECOND_MS);

  return { days, hours, minutes, seconds };
}

function formatTwoDigits(value: number): string {
  return value.toString().padStart(2, '0');
}

type CountdownUnitProps = {
  value: number;
  label: string;
};

function CountdownUnit({ value, label }: CountdownUnitProps) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-display font-bold text-lg sm:text-2xl leading-none tabular-nums text-white">
        {formatTwoDigits(value)}
      </span>
      <span className="text-wc-bone text-[10px] sm:text-xs font-body tracking-wider mt-0.5 sm:mt-1">
        {label}
      </span>
    </div>
  );
}

export function WorldCupCountdown() {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(() => {
    if (typeof window === 'undefined') return null;
    return getTimeRemaining(KICKOFF_TIMESTAMP);
  });

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTimeRemaining(getTimeRemaining(KICKOFF_TIMESTAMP));
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  if (!timeRemaining) {
    return null;
  }

  const hasKickedOff =
    timeRemaining.days === 0 &&
    timeRemaining.hours === 0 &&
    timeRemaining.minutes === 0 &&
    timeRemaining.seconds === 0;

  if (hasKickedOff) {
    return <NextMatchCountdown />;
  }

  return (
    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
      <CountdownUnit value={timeRemaining.days} label="days" />
      <CountdownUnit value={timeRemaining.hours} label="hours" />
      <CountdownUnit value={timeRemaining.minutes} label="mins" />
      <CountdownUnit value={timeRemaining.seconds} label="secs" />
    </div>
  );
}

function getNextFixtureTimestamp(): number | null {
  const now = Date.now();
  const upcoming = fixtures
    .map((f) => new Date(f.kickoff).getTime())
    .filter((t) => t > now)
    .sort((a, b) => a - b);
  return upcoming[0] ?? null;
}

function NextMatchCountdown() {
  const [target, setTarget] = useState<number | null>(() => getNextFixtureTimestamp());
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);

  useEffect(() => {
    function tick() {
      const next = getNextFixtureTimestamp();
      setTarget(next);
      setTimeRemaining(next !== null ? getTimeRemaining(next) : null);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!target || !timeRemaining) return null;

  return (
    <div className="flex flex-col items-center shrink-0">
      <span className="text-wc-bone/50 text-[10px] sm:text-xs font-body tracking-wider uppercase mb-1">
        Next match
      </span>
      <div className="flex items-center gap-2 sm:gap-4">
        {timeRemaining.days > 0 && <CountdownUnit value={timeRemaining.days} label="days" />}
        <CountdownUnit value={timeRemaining.hours} label="hours" />
        <CountdownUnit value={timeRemaining.minutes} label="mins" />
        <CountdownUnit value={timeRemaining.seconds} label="secs" />
      </div>
    </div>
  );
}
