// components/world-cup-countdown.tsx
'use client';

import Link from 'next/link';

import { useEffect, useState } from 'react';

export function Header() {
  return (
    <header className="bg-wc-blue border-b border-wc-white/10 sticky top-0 z-10">
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-90 transition-opacity"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt="Logo"
            width={40}
            height={40}
            className="select-none w-8 h-8 sm:w-10 sm:h-10 shrink-0"
          />

          <div className="min-w-0">
            <h1 className="font-display font-bold text-base sm:text-2xl tracking-tight leading-tight">
              World Cup 2026
            </h1>
            <h1 className="font-display font-bold text-base sm:text-2xl tracking-tight leading-tight">
              Match Predictor
            </h1>
            <p className="hidden sm:block text-wc-bone text-md font-body tracking-widest mt-1">
              11 June - 19 July 2026
            </p>
          </div>
        </Link>

        <WorldCupCountdown />
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
      <span className="font-display font-bold text-lg sm:text-2xl leading-none tabular-nums">
        {formatTwoDigits(value)}
      </span>
      <span className="text-wc-bone text-[10px] sm:text-xs font-body tracking-wider mt-0.5 sm:mt-1">
        {label}
      </span>
    </div>
  );
}

export function WorldCupCountdown() {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);

  useEffect(() => {
    setTimeRemaining(getTimeRemaining(KICKOFF_TIMESTAMP));

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
    return <div className="font-display font-bold text-lg">Kick-off!</div>;
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
