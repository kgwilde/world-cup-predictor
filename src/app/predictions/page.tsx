'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Lock, X } from 'lucide-react';
import { fixtures } from '@/data/fixtures';
import { allPredictions as staticPredictions, allTournamentPicks, allBonusPredictions } from '@/data/entries';
import type {
  Fixture,
  FixtureStage,
  MatchResult,
  MultiChip,
  Player,
  Prediction,
  PublicProfile,
  Team,
} from '@/lib/types';
import { getNow, PREDICTIONS_DEADLINE } from '@/lib/deadline';
import { getResultType } from '@/lib/predictions';
import { scoreMatch, calculateStandings } from '@/lib/scoring';
import { resolveAvatarSrc } from '@/lib/avatar';
import { getFlagByCode } from '@/lib/flags';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useMultiChips } from '@/components/hooks/use_multi_chips';
import { isFixtureLive } from '@/components/FixtureSlider';
import ScoreChip from '@/components/predictions/ScoreChip';
import { PointsBadge } from '@/components/PointsBadge';
import SpecialsTab from '@/components/predictions/SpecialsTab';
import PlayerCardModal from '@/components/PlayerCardModal';
import { MatchPredictionCard } from '@/components/predictions/MatchPredictionCard';

const GROUP_FIXTURE_IDS = new Set(fixtures.filter((f) => f.stage === 'group').map((f) => f.id));
const KNOCKOUT_FIXTURE_IDS = new Set(fixtures.filter((f) => f.stage !== 'group').map((f) => f.id));
const GROUP_CHIP_LIMIT = 10;
const KNOCKOUT_CHIP_LIMIT = 5;
// 03:00 Irish time (UTC+1 in summer) — also when the group stage ends
const KNOCKOUT_UNLOCK = new Date('2026-06-26T00:00:00Z');
const KNOCKOUT_TEAL = '#2DD4BF';

const STAGE_LABELS: Record<string, string> = {
  round_of_32: 'Round of 32',
  round_of_16: 'Round of 16',
  quarter_final: 'Quarter-finals',
  semi_final: 'Semi-finals',
  third_place: 'Third Place',
  final: 'Final',
};

function userToPlayer(profile: PublicProfile): Player {
  return {
    id: profile.uid,
    name: (profile.displayName ?? 'Unknown').split(' ')[0],
    teamName: profile.teamName ?? undefined,
    photoUrl: resolveAvatarSrc(profile.avatarUrl, profile.avatarUpdatedAt),
  };
}

function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat('en-IE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
}

function formatDateTile(dateKey: string): { weekday: string; day: string; month: string } {
  const d = new Date(dateKey);
  return {
    weekday: new Intl.DateTimeFormat('en-IE', { weekday: 'short' }).format(d).toUpperCase(),
    day: String(d.getDate()),
    month: new Intl.DateTimeFormat('en-IE', { month: 'short' }).format(d).toUpperCase(),
  };
}

function getFixtureDateKey(kickoffUtc: string) {
  const d = new Date(kickoffUtc);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildAvailableDates(allFixtures: Fixture[]) {
  return [...new Set(allFixtures.map((f) => getFixtureDateKey(f.kickoff)))].sort();
}

function getDefaultSelectedDate(dateKeys: string[], today: Date) {
  const todayKey = getFixtureDateKey(today.toISOString());
  if (dateKeys.includes(todayKey)) return todayKey;
  const pastDates = dateKeys.filter((k) => k < todayKey);
  return pastDates.length > 0 ? pastDates[pastDates.length - 1] : dateKeys[0];
}

function getSnapDateKey(dateKeys: string[], now: Date): string | null {
  if (dateKeys.length === 0) return null;
  const todayKey = getFixtureDateKey(now.toISOString());
  if (dateKeys.includes(todayKey)) return todayKey;
  const futureDates = dateKeys.filter((k) => k > todayKey);
  if (futureDates.length > 0) return futureDates[0];
  return dateKeys[dateKeys.length - 1];
}

// ─── My Predictions tab ────────────────────────────────────────────────────────

const KNOCKOUT_STAGE_ORDER: FixtureStage[] = [
  'round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final',
];

function CompactChipBar({
  groupUsed,
  knockoutUsed,
  isKnockoutLocked,
}: {
  groupUsed: number;
  knockoutUsed: number;
  isKnockoutLocked: boolean;
}) {
  const groupRemaining = GROUP_CHIP_LIMIT - groupUsed;
  const knockoutRemaining = KNOCKOUT_CHIP_LIMIT - knockoutUsed;

  return (
    <div className="bg-white dark:bg-wc-ink rounded-xl px-4 py-2.5 space-y-2">
      {/* Group chips */}
      <div className="flex items-center gap-2">
        <span className="w-12 shrink-0 text-[10px] font-bold uppercase tracking-wider text-wc-black/40 dark:text-white/40">
          Group
        </span>
        <div className="flex gap-[3px] shrink-0">
          {Array.from({ length: GROUP_CHIP_LIMIT }).map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${i < groupRemaining ? 'bg-wc-gold' : 'bg-black/10 dark:bg-white/10'}`}
            />
          ))}
        </div>
        <span className="ml-1 text-[11px] font-semibold text-wc-black/45 dark:text-white/45">
          {groupRemaining} left
        </span>
      </div>

      {/* Knockout chips */}
      <div className={`flex items-center gap-2 transition-opacity ${isKnockoutLocked ? 'opacity-40' : ''}`}>
        <span
          className="w-12 shrink-0 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
          style={{ color: isKnockoutLocked ? undefined : KNOCKOUT_TEAL }}
        >
          {isKnockoutLocked && <Lock size={8} />}
          KO
        </span>
        <div className="flex gap-[3px] shrink-0">
          {Array.from({ length: KNOCKOUT_CHIP_LIMIT }).map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${i < knockoutRemaining ? '' : 'bg-black/10 dark:bg-white/10'}`}
              style={i < knockoutRemaining ? { backgroundColor: KNOCKOUT_TEAL } : undefined}
            />
          ))}
        </div>
        <span className="ml-1 text-[11px] font-semibold text-wc-black/45 dark:text-white/45">
          {isKnockoutLocked ? 'Locked' : `${knockoutRemaining} left`}
        </span>
      </div>
    </div>
  );
}

function ChipFixtureRow({
  fixture,
  prediction,
  hasChip,
  chipsUsed,
  chipLimit,
  hasStarted,
  result,
  onApply,
  onRemove,
}: {
  fixture: Fixture;
  prediction: Prediction | undefined;
  hasChip: boolean;
  chipsUsed: number;
  chipLimit: number;
  hasStarted: boolean;
  result?: MatchResult;
  onApply: () => void;
  onRemove: () => void;
}) {
  const resultType = prediction
    ? getResultType(prediction.homeGoals, prediction.awayGoals)
    : 'draw';
  const pts =
    result && prediction
      ? scoreMatch({ ...prediction, multiChip: hasChip }, result).points
      : undefined;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-black/8 dark:border-white/8 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-xs text-wc-black/70 dark:text-white/70 truncate">
          <span>{fixture.homeTeam.name}</span>
          <span className="text-wc-black/45 dark:text-white/45">vs</span>
          <span>{fixture.awayTeam.name}</span>
        </div>
        {!hasStarted && (
          <p className="text-[10px] text-wc-black/45 dark:text-white/45 mt-0.5 tabular-nums">
            {new Intl.DateTimeFormat('en-IE', { hour: '2-digit', minute: '2-digit' }).format(
              new Date(fixture.kickoff)
            )}
          </p>
        )}
      </div>

      {prediction ? (
        <ScoreChip
          homeGoals={prediction.homeGoals}
          awayGoals={prediction.awayGoals}
          resultType={resultType}
          homeAccentColor={fixture.homeTeam.accentColor}
          awayAccentColor={fixture.awayTeam.accentColor}
          multiChip={false}
        />
      ) : (
        <span className="text-xs text-wc-black/20 dark:text-white/20 italic">No prediction</span>
      )}

      {pts !== undefined && <PointsBadge points={pts} multiChipApplied={hasChip && hasStarted} />}

      {prediction &&
        (hasStarted ? (
          hasChip ? (
            <span className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-wc-black/35 dark:text-white/35 bg-black/[0.07] dark:bg-white/[0.07] border border-black/12 dark:border-white/12 rounded-full px-2 py-1">
              <Lock size={10} />
              Locked
            </span>
          ) : null
        ) : hasChip ? (
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 flex items-center gap-1 text-[11px] font-bold rounded-full px-2 py-1 border transition-colors active:bg-red-500/15 active:border-red-500/40 active:text-red-400 text-wc-gold bg-wc-gold/20 border-wc-gold/60"
          >
            ✓ Applied
            <X size={9} className="opacity-70" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onApply}
            disabled={chipsUsed >= chipLimit}
            className="shrink-0 text-[11px] font-semibold border rounded-full px-2.5 py-1 active:opacity-70 transition-colors disabled:opacity-25 disabled:cursor-not-allowed text-wc-gold/60 border-wc-gold/25 hover:text-wc-gold hover:border-wc-gold/60"
          >
            + Chip
          </button>
        ))}
    </div>
  );
}

// ─── Knockout prediction card ─────────────────────────────────────────────────

function MiniFlag({ team }: { team: Team }) {
  if (team.code === 'TBD') {
    return <div className="h-4 w-6 rounded-sm bg-black/10 dark:bg-white/10 shrink-0" />;
  }
  const Flag = getFlagByCode(team.code);
  if (!Flag) return <div className="h-4 w-6 rounded-sm bg-black/10 dark:bg-white/10 shrink-0" />;
  // Flag is a stable reference from a static module-scope map — not created during render
  // eslint-disable-next-line react-hooks/static-components
  return <Flag title={team.name} className="h-4 w-6 rounded-sm object-cover shrink-0 ring-1 ring-black/15 dark:ring-white/15" />;
}

function ScoreInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center shrink-0">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={disabled || value <= 0}
        className="w-9 h-9 flex items-center justify-center rounded-l-lg bg-black/8 dark:bg-white/8 text-wc-black dark:text-white text-base font-bold disabled:opacity-25 active:scale-95 transition-transform select-none"
      >
        −
      </button>
      <div className="w-9 h-9 flex items-center justify-center bg-black/[0.05] dark:bg-white/[0.05] text-wc-black dark:text-white text-base font-bold tabular-nums">
        {value}
      </div>
      <button
        type="button"
        onClick={() => onChange(Math.min(20, value + 1))}
        disabled={disabled}
        className="w-9 h-9 flex items-center justify-center rounded-r-lg bg-black/8 dark:bg-white/8 text-wc-black dark:text-white text-base font-bold disabled:opacity-25 active:scale-95 transition-transform select-none"
      >
        +
      </button>
    </div>
  );
}

function TeamRow({
  team,
  value,
  savedValue,
  onChange,
  isEditable,
  hasSavedPrediction,
  disabled,
}: {
  team: Team;
  value: number;
  savedValue: number | undefined;
  onChange: (v: number) => void;
  isEditable: boolean;
  hasSavedPrediction: boolean;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <MiniFlag team={team} />
        <span className="text-sm font-medium text-wc-black dark:text-white leading-tight">
          {team.name}
        </span>
      </div>
      {isEditable ? (
        <ScoreInput value={value} onChange={onChange} disabled={disabled} />
      ) : hasSavedPrediction ? (
        <span className="text-2xl font-bold tabular-nums text-wc-black dark:text-white">
          {savedValue ?? 0}
        </span>
      ) : (
        <span className="text-lg text-wc-black/20 dark:text-white/20">–</span>
      )}
    </div>
  );
}

function KnockoutPredictionCard({
  fixture,
  savedPrediction,
  hasChip,
  chipsUsed,
  chipLimit,
  hasStarted,
  result,
  isChipLocked,
  onApply,
  onRemove,
  onSave,
}: {
  fixture: Fixture;
  savedPrediction: { homeGoals: number; awayGoals: number } | undefined;
  hasChip: boolean;
  chipsUsed: number;
  chipLimit: number;
  hasStarted: boolean;
  result?: MatchResult;
  isChipLocked: boolean;
  onApply: () => void;
  onRemove: () => void;
  onSave: (homeGoals: number, awayGoals: number) => Promise<void>;
}) {
  // When untouched, display values come from savedPrediction (live prop).
  // Once the user touches an input, we store locally until Save.
  const [localHome, setLocalHome] = useState<number | undefined>(undefined);
  const [localAway, setLocalAway] = useState<number | undefined>(undefined);
  const [touched, setTouched] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const onSaveRef = useRef(onSave);
  useEffect(() => { onSaveRef.current = onSave; }, [onSave]);
  const onApplyRef = useRef(onApply);
  useEffect(() => { onApplyRef.current = onApply; }, [onApply]);

  const displayHome = touched ? (localHome ?? 0) : (savedPrediction?.homeGoals ?? 0);
  const displayAway = touched ? (localAway ?? 0) : (savedPrediction?.awayGoals ?? 0);

  const isDirty =
    touched &&
    (savedPrediction === undefined ||
      displayHome !== savedPrediction.homeGoals ||
      displayAway !== savedPrediction.awayGoals);

  const handleChangeHome = (v: number) => {
    setLocalHome(v);
    setTouched(true);
  };

  const handleChangeAway = (v: number) => {
    setLocalAway(v);
    setTouched(true);
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      await onSaveRef.current(displayHome, displayAway);
      setTouched(false);
      setLocalHome(undefined);
      setLocalAway(undefined);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus((s) => (s === 'saved' ? 'idle' : s)), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus((s) => (s === 'error' ? 'idle' : s)), 3000);
    }
  };

  // If no prediction exists yet, silently save the current display values (defaults 0-0) before applying.
  const handleChipApply = async () => {
    if (savedPrediction === undefined) {
      try {
        await onSaveRef.current(displayHome, displayAway);
        setTouched(false);
        setLocalHome(undefined);
        setLocalAway(undefined);
      } catch {
        return;
      }
    }
    onApplyRef.current();
  };

  const isEditable = !hasStarted;
  const isSaving = saveStatus === 'saving';

  const pts =
    result && savedPrediction
      ? scoreMatch(
          { playerId: '', fixtureId: fixture.id, ...savedPrediction, multiChip: hasChip },
          result,
        ).points
      : undefined;

  const kickoffLabel = new Intl.DateTimeFormat('en-IE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Dublin',
  }).format(new Date(fixture.kickoff));

  return (
    <div className="bg-white dark:bg-wc-ink rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-black/8 dark:border-white/8">
        <span
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: KNOCKOUT_TEAL }}
        >
          {STAGE_LABELS[fixture.stage]}
        </span>
        <div className="flex items-center gap-2">
          {hasStarted && (
            <span className="flex items-center gap-1 text-[10px] text-wc-black/40 dark:text-white/40">
              <Lock size={9} />
              Locked
            </span>
          )}
          <span className="text-[11px] text-wc-black/40 dark:text-white/40 tabular-nums">
            {kickoffLabel}
          </span>
        </div>
      </div>

      {/* Teams + inputs */}
      <div className="px-4 pt-3.5 pb-3 space-y-3">
        <TeamRow
          team={fixture.homeTeam}
          value={displayHome}
          savedValue={savedPrediction?.homeGoals}
          onChange={handleChangeHome}
          isEditable={isEditable}
          hasSavedPrediction={savedPrediction !== undefined}
          disabled={isSaving}
        />
        <TeamRow
          team={fixture.awayTeam}
          value={displayAway}
          savedValue={savedPrediction?.awayGoals}
          onChange={handleChangeAway}
          isEditable={isEditable}
          hasSavedPrediction={savedPrediction !== undefined}
          disabled={isSaving}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-t border-black/8 dark:border-white/8 min-h-[44px]">
        {/* Left: save button / status / points */}
        <div className="flex items-center gap-2 min-w-0">
          {isEditable ? (
            <button
              type="button"
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              className="text-[12px] font-semibold text-white bg-wc-blue rounded-lg px-3 py-1.5 transition-opacity shrink-0 disabled:opacity-30"
            >
              {isSaving ? 'Saving…' : saveStatus === 'saved' ? '✓ Saved' : 'Save'}
            </button>
          ) : (
            <>
              {saveStatus === 'idle' && hasStarted && !savedPrediction && (
                <span className="text-[11px] text-wc-black/25 dark:text-white/25 italic">No prediction</span>
              )}
              {pts !== undefined && (
                <PointsBadge points={pts} multiChipApplied={hasChip} />
              )}
            </>
          )}
          {saveStatus === 'error' && (
            <button
              type="button"
              onClick={handleSave}
              className="text-[11px] text-red-500 dark:text-red-400 underline shrink-0"
            >
              Save failed — retry
            </button>
          )}
        </div>

        {/* Right: chip button */}
        {hasStarted ? (
          hasChip ? (
            <span className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-wc-black/35 dark:text-white/35 bg-black/[0.07] dark:bg-white/[0.07] border border-black/12 dark:border-white/12 rounded-full px-2.5 py-1">
              <Lock size={10} />
              Chip locked
            </span>
          ) : null
        ) : hasChip ? (
          <button
            type="button"
            onClick={onRemove}
            style={{
              color: KNOCKOUT_TEAL,
              backgroundColor: `${KNOCKOUT_TEAL}22`,
              borderColor: `${KNOCKOUT_TEAL}99`,
            }}
            className="shrink-0 flex items-center gap-1 text-[11px] font-bold rounded-full px-2.5 py-1 border transition-colors active:bg-red-500/15 active:border-red-500/40 active:text-red-400"
          >
            ✓ Chip
            <X size={9} className="opacity-70" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleChipApply}
            disabled={isChipLocked || chipsUsed >= chipLimit}
            style={{ color: `${KNOCKOUT_TEAL}90`, borderColor: `${KNOCKOUT_TEAL}44` }}
            className="shrink-0 text-[11px] font-semibold border rounded-full px-2.5 py-1 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
          >
            + Chip
          </button>
        )}
      </div>
    </div>
  );
}

function MyPredictionsTab({
  viewerId,
  firestoreUsers,
  allChips,
  results,
  now,
  isKnockoutLocked,
  onSavePrediction,
  onApply,
  onRemove,
}: {
  viewerId: string;
  firestoreUsers: PublicProfile[];
  allChips: MultiChip[];
  results: MatchResult[];
  now: Date;
  isKnockoutLocked: boolean;
  onSavePrediction: (fixtureId: string, homeGoals: number, awayGoals: number) => Promise<void>;
  onApply: (fixtureId: string) => void;
  onRemove: (fixtureId: string) => void;
}) {
  const myProfile = useMemo(
    () => firestoreUsers.find((u) => u.uid === viewerId),
    [firestoreUsers, viewerId],
  );

  const myKnockoutPredictions = useMemo(
    () => myProfile?.knockoutPredictions ?? {},
    [myProfile],
  );

  const myStaticPredictions = useMemo(
    () =>
      new Map(
        staticPredictions.filter((p) => p.playerId === viewerId).map((p) => [p.fixtureId, p]),
      ),
    [viewerId],
  );

  const myGroupChipIds = useMemo(
    () =>
      new Set(
        allChips
          .filter((c) => c.playerId === viewerId && GROUP_FIXTURE_IDS.has(c.fixtureId))
          .map((c) => c.fixtureId),
      ),
    [allChips, viewerId],
  );

  const myKnockoutChipIds = useMemo(
    () =>
      new Set(
        allChips
          .filter((c) => c.playerId === viewerId && KNOCKOUT_FIXTURE_IDS.has(c.fixtureId))
          .map((c) => c.fixtureId),
      ),
    [allChips, viewerId],
  );

  const resultMap = useMemo(() => new Map(results.map((r) => [r.fixtureId, r])), [results]);

  const groupFixturesByDate = useMemo(() => {
    const map = new Map<string, Fixture[]>();
    for (const fixture of fixtures.filter((f) => f.stage === 'group')) {
      const key = getFixtureDateKey(fixture.kickoff);
      const existing = map.get(key) ?? [];
      existing.push(fixture);
      map.set(key, existing);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, []);

  const knockoutByStage = useMemo(
    () =>
      KNOCKOUT_STAGE_ORDER.map((stage) => ({
        stage,
        stageFixtures: fixtures
          .filter((f) => f.stage === stage)
          .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()),
      })).filter(({ stageFixtures }) => stageFixtures.length > 0),
    [],
  );

  const [groupExpanded, setGroupExpanded] = useState(
    () => Date.now() < KNOCKOUT_UNLOCK.getTime(),
  );

  const dateKeys = useMemo(() => groupFixturesByDate.map(([key]) => key), [groupFixturesByDate]);
  const snapDateKey = useMemo(() => getSnapDateKey(dateKeys, now), [dateKeys, now]);
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (!snapDateKey || !groupExpanded) return;
    const el = sectionRefs.current.get(snapDateKey);
    if (!el) return;
    const headerHeight = document.querySelector('header')?.getBoundingClientRect().height ?? 0;
    const tabBarHeight = document.querySelector('[data-tab-bar]')?.getBoundingClientRect().height ?? 0;
    const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - tabBarHeight - 8;
    window.scrollTo({ top, behavior: 'smooth' });
  }, [snapDateKey, groupExpanded]);

  return (
    <div className="space-y-4">
      {/* Group Stage — collapsible, chip management only */}
      <div className="bg-white dark:bg-wc-ink rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => setGroupExpanded((e) => !e)}
          className="w-full flex items-center justify-between px-4 py-3.5 border-b border-black/8 dark:border-white/8 text-left"
        >
          <span className="text-sm font-bold text-wc-black dark:text-white">Group Stage</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-wc-black/45 dark:text-white/45">
              {myGroupChipIds.size}/{GROUP_CHIP_LIMIT} chips used
            </span>
            <ChevronDown
              size={16}
              className={`text-wc-black/40 dark:text-white/40 transition-transform duration-200 ${groupExpanded ? 'rotate-0' : '-rotate-90'}`}
            />
          </div>
        </button>

        {groupExpanded &&
          groupFixturesByDate.map(([dateKey, dayFixtures]) => (
            <div
              key={dateKey}
              ref={(el) => {
                if (el) sectionRefs.current.set(dateKey, el);
                else sectionRefs.current.delete(dateKey);
              }}
            >
              <div className="px-4 py-2 bg-black/[0.03] dark:bg-white/[0.03] border-b border-black/8 dark:border-white/8">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-wc-black/55 dark:text-white/55">
                  {formatDateLabel(new Date(dateKey))}
                </span>
              </div>
              <div className="px-4">
                {dayFixtures.map((fixture) => (
                  <ChipFixtureRow
                    key={fixture.id}
                    fixture={fixture}
                    prediction={myStaticPredictions.get(fixture.id)}
                    hasChip={myGroupChipIds.has(fixture.id)}
                    chipsUsed={myGroupChipIds.size}
                    chipLimit={GROUP_CHIP_LIMIT}
                    hasStarted={new Date(fixture.kickoff) <= now}
                    result={resultMap.get(fixture.id)}
                    onApply={() => onApply(fixture.id)}
                    onRemove={() => onRemove(fixture.id)}
                  />
                ))}
              </div>
            </div>
          ))}
      </div>

      {/* Knockout stages — prediction entry */}
      {knockoutByStage.map(({ stage, stageFixtures }) => (
        <div key={stage} className="space-y-3">
          {stageFixtures.map((fixture) => (
            <KnockoutPredictionCard
              key={fixture.id}
              fixture={fixture}
              savedPrediction={myKnockoutPredictions[fixture.id]}
              hasChip={myKnockoutChipIds.has(fixture.id)}
              chipsUsed={myKnockoutChipIds.size}
              chipLimit={KNOCKOUT_CHIP_LIMIT}
              hasStarted={new Date(fixture.kickoff) <= now}
              result={resultMap.get(fixture.id)}
              isChipLocked={isKnockoutLocked}
              onApply={() => onApply(fixture.id)}
              onRemove={() => onRemove(fixture.id)}
              onSave={(h, a) => onSavePrediction(fixture.id, h, a)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'matches' | 'specials' | 'my-predictions';

export default function PredictionsPage() {
  const now = useMemo(() => getNow(), []);
  const availableDates = useMemo(() => buildAvailableDates(fixtures), []);
  const firestoreUsers = useAuthStore((s) => s.allUsers);
  const usersLoading = useAuthStore((s) => s.usersLoading);
  const viewerId = useAuthStore((s) => s.user?.uid ?? null);
  const storeResults = useAuthStore((s) => s.results);
  const resultsLoading = useAuthStore((s) => s.resultsLoading);
  const isLoading = usersLoading || resultsLoading;
  const resultMap = useMemo(
    () => new Map(storeResults.map((r) => [r.fixtureId, r])),
    [storeResults]
  );

  const [activeTab, setActiveTab] = useState<Tab>('matches');
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    getDefaultSelectedDate(availableDates, now)
  );
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const { chips: allChips, apply: applyChip, remove: removeChip } = useMultiChips();
  const storeSaveKnockoutPrediction = useAuthStore((s) => s.saveKnockoutPrediction);

  const [isKnockoutLocked] = useState(() => Date.now() < KNOCKOUT_UNLOCK.getTime());

  const groupChipsUsed = useMemo(
    () =>
      !viewerId
        ? 0
        : allChips.filter((c) => c.playerId === viewerId && GROUP_FIXTURE_IDS.has(c.fixtureId)).length,
    [allChips, viewerId]
  );
  const knockoutChipsUsed = useMemo(
    () =>
      !viewerId
        ? 0
        : allChips.filter((c) => c.playerId === viewerId && KNOCKOUT_FIXTURE_IDS.has(c.fixtureId)).length,
    [allChips, viewerId]
  );
  const myChipsRemaining =
    GROUP_CHIP_LIMIT - groupChipsUsed + KNOCKOUT_CHIP_LIMIT - knockoutChipsUsed;

  const deadlinePassed = useMemo(() => getNow() >= PREDICTIONS_DEADLINE, []);
  const players = useMemo<Player[]>(
    () =>
      firestoreUsers
        .filter((u) => u.approved && !!u.teamName)
        .filter((u) => !deadlinePassed || !!u.predictionFileUrl)
        .map(userToPlayer)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [firestoreUsers, deadlinePassed]
  );

  const visiblePredictions = useMemo<Prediction[]>(() => {
    const staticWithChips = staticPredictions.map((p) => ({
      ...p,
      multiChip: allChips.some((c) => c.playerId === p.playerId && c.fixtureId === p.fixtureId),
    }));

    const knockoutPreds: Prediction[] = [];
    for (const user of firestoreUsers) {
      const kp = user.knockoutPredictions;
      if (!kp) continue;
      for (const [fixtureId, { homeGoals, awayGoals }] of Object.entries(kp)) {
        const fixture = fixtures.find((f) => f.id === fixtureId);
        if (!fixture) continue;
        const hasStarted = new Date(fixture.kickoff) <= now;
        // Hide other players' predictions until the match starts
        if (!hasStarted && user.uid !== viewerId) continue;
        knockoutPreds.push({
          playerId: user.uid,
          fixtureId,
          homeGoals,
          awayGoals,
          multiChip: allChips.some((c) => c.playerId === user.uid && c.fixtureId === fixtureId),
        });
      }
    }

    return [...staticWithChips, ...knockoutPreds];
  }, [allChips, firestoreUsers, viewerId, now]);
  const visibleTournamentPicks = allTournamentPicks;
  const visibleBonusPredictions = allBonusPredictions;

  const finalResults = useMemo(
    () => storeResults.filter((r) => r.status !== 'live' && r.status !== 'half_time'),
    [storeResults]
  );

  const standings = useMemo(
    () => calculateStandings(players, visiblePredictions, finalResults),
    [players, visiblePredictions, finalResults]
  );

  const rankMap = useMemo(
    () => new Map(standings.map((s) => [s.player.id, s.rank])),
    [standings]
  );

  const fixturesForDay = useMemo(
    () => fixtures.filter((f) => getFixtureDateKey(f.kickoff) === selectedDate),
    [selectedDate]
  );

  const orderedFixturesForDay = useMemo(() => {
    const started: Fixture[] = [];
    const upcoming: Fixture[] = [];
    for (const f of fixturesForDay) {
      if (new Date(f.kickoff).getTime() <= now.getTime()) {
        started.push(f);
      } else {
        upcoming.push(f);
      }
    }
    started.sort((a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime());
    upcoming.sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime());
    return { started, upcoming };
  }, [fixturesForDay, now]);

  const latestFixtureIds = useMemo(() => {
    const { started } = orderedFixturesForDay;
    if (started.length === 0) return new Set<string>();
    const liveFixtures = started.filter((f) =>
      isFixtureLive(new Date(f.kickoff), now, resultMap.get(f.id))
    );
    if (liveFixtures.length > 0) {
      return new Set(liveFixtures.map((f) => f.id));
    }
    const mostRecentKickoff = new Date(started[0].kickoff).getTime();
    return new Set(
      started
        .filter((f) => new Date(f.kickoff).getTime() === mostRecentKickoff)
        .map((f) => f.id)
    );
  }, [orderedFixturesForDay, now, resultMap]);

  const selectedPlayer = useMemo(
    () => players.find((p) => p.id === selectedPlayerId) ?? null,
    [players, selectedPlayerId]
  );

  const selectedStanding = useMemo(
    () => standings.find((s) => s.player.id === selectedPlayerId) ?? null,
    [standings, selectedPlayerId]
  );

  const selectedTournamentPicks = useMemo(
    () => visibleTournamentPicks.find((t) => t.playerId === selectedPlayerId) ?? null,
    [visibleTournamentPicks, selectedPlayerId]
  );

  const selectedBonusPredictions = useMemo(
    () => visibleBonusPredictions.find((b) => b.playerId === selectedPlayerId) ?? null,
    [visibleBonusPredictions, selectedPlayerId]
  );

  const activeButtonRef = useRef<HTMLButtonElement | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const header = document.querySelector('header');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (header) setHeaderHeight(header.getBoundingClientRect().height);
  }, []);

  useEffect(() => {
    if (activeTab === 'matches' || activeTab === 'specials' || activeTab === 'my-predictions') {
      window.scrollTo(0, 0);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'matches') return;
    if (activeButtonRef.current) {
      activeButtonRef.current.scrollIntoView({
        inline: 'center',
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [selectedDate, activeTab]);

  return (
    <>
      <main className="min-h-screen bg-wc-bone dark:bg-wc-black text-wc-black dark:text-white">
        {/* Sticky header: title + tab strip */}
        <div
          data-tab-bar
          className="sticky z-10 bg-wc-bone dark:bg-wc-black px-4 pt-6 sm:px-6 lg:px-8"
          style={{ top: headerHeight }}
        >
          <div className="mx-auto max-w-3xl">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Predictions</h1>
            <p className="mt-2 max-w-lg text-sm text-wc-black/55 dark:text-white/55">
              Browse match predictions, specials, and manage your knockout predictions.
            </p>
          </div>
          <div className="mx-auto max-w-3xl mt-6 flex w-full border-b border-black/10 dark:border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('matches')}
              className={`flex-1 text-center pb-3 pt-1 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                activeTab === 'matches'
                  ? 'text-wc-black dark:text-white border-wc-blue'
                  : 'text-wc-black/40 dark:text-white/40 border-transparent hover:text-wc-black/70 dark:hover:text-white/70'
              }`}
            >
              Matches
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('specials')}
              className={`flex-1 text-center pb-3 pt-1 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                activeTab === 'specials'
                  ? 'text-wc-black dark:text-white border-wc-blue'
                  : 'text-wc-black/40 dark:text-white/40 border-transparent hover:text-wc-black/70 dark:hover:text-white/70'
              }`}
            >
              Specials
            </button>
            {viewerId && (
              <button
                type="button"
                onClick={() => setActiveTab('my-predictions')}
                className={`flex-1 text-center pb-3 pt-1 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                  activeTab === 'my-predictions'
                    ? 'text-wc-black dark:text-white border-wc-blue'
                    : 'text-wc-black/40 dark:text-white/40 border-transparent hover:text-wc-black/70 dark:hover:text-white/70'
                }`}
              >
                <span className="inline-flex items-center justify-center gap-1.5">
                  My Predictions
                  {myChipsRemaining > 0 && (
                    <span className="w-2 h-2 rounded-full bg-wc-gold shrink-0" />
                  )}
                </span>
              </button>
            )}
          </div>

          {/* Compact chip bar — sticky inside tab bar when My Predictions is active */}
          {activeTab === 'my-predictions' && viewerId && (
            <div className="mx-auto max-w-3xl pt-3 pb-1">
              <CompactChipBar
                groupUsed={groupChipsUsed}
                knockoutUsed={knockoutChipsUsed}
                isKnockoutLocked={isKnockoutLocked}
              />
            </div>
          )}
        </div>

        {/* Tab content */}
        <div className="px-4 pt-6 pb-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            {activeTab === 'specials' && (
              <SpecialsTab
                players={players}
                tournamentPicks={visibleTournamentPicks}
                bonusPredictions={visibleBonusPredictions}
              />
            )}

            {activeTab === 'matches' && (
              <div className="space-y-4">
                {/* Date strip */}
                <div className="no-scrollbar flex items-center gap-1 overflow-x-auto pb-2">
                  {availableDates.map((dateKey, i) => {
                    const isActive = dateKey === selectedDate;
                    const { weekday, day, month } = formatDateTile(dateKey);
                    const prevMonth = i > 0 ? formatDateTile(availableDates[i - 1]).month : null;
                    const isMonthBoundary = i === 0 || month !== prevMonth;
                    return (
                      <div key={dateKey} className="flex items-center shrink-0 gap-1">
                        {isMonthBoundary && (
                          <span
                            className={`text-[10px] font-bold tracking-widest text-wc-black/25 dark:text-white/25 px-1 ${i > 0 ? 'ml-1' : ''}`}
                          >
                            {month}
                          </span>
                        )}
                        <button
                          ref={isActive ? activeButtonRef : null}
                          type="button"
                          onClick={() => setSelectedDate(dateKey)}
                          className={`flex flex-col items-center w-13 rounded-xl py-3 transition-colors ${
                            isActive
                              ? 'bg-wc-blue text-wc-white'
                              : 'text-wc-black/45 dark:text-white/45 hover:text-wc-black/80 dark:hover:text-white/80 hover:bg-black/5 dark:hover:bg-white/5'
                          }`}
                        >
                          <span
                            className={`text-[10px] font-bold tracking-wider leading-none ${isActive ? 'text-wc-white/60' : 'text-wc-black/30 dark:text-white/30'}`}
                          >
                            {weekday}
                          </span>
                          <span className="text-base font-bold leading-tight mt-1">{day}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-4">
                  {orderedFixturesForDay.started.map((fixture) => (
                    <MatchPredictionCard
                      key={fixture.id}
                      fixture={fixture}
                      now={now}
                      players={players}
                      allPredictions={visiblePredictions}
                      allChips={allChips}
                      result={resultMap.get(fixture.id)}
                      rankMap={rankMap}
                      viewerId={viewerId}
                      isLoading={isLoading}
                      isLatest={latestFixtureIds.has(fixture.id)}
                      onPlayerClick={setSelectedPlayerId}
                    />
                  ))}
                  {orderedFixturesForDay.started.length > 0 && orderedFixturesForDay.upcoming.length > 0 && (
                    <div className="flex items-center gap-3">
                      <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-wc-black/30 dark:text-white/30">
                        Upcoming
                      </span>
                      <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
                    </div>
                  )}
                  {orderedFixturesForDay.upcoming.map((fixture) => (
                    <MatchPredictionCard
                      key={fixture.id}
                      fixture={fixture}
                      now={now}
                      players={players}
                      allPredictions={visiblePredictions}
                      allChips={allChips}
                      result={resultMap.get(fixture.id)}
                      rankMap={rankMap}
                      viewerId={viewerId}
                      isLoading={isLoading}
                      isLatest={false}
                      onPlayerClick={setSelectedPlayerId}
                    />
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'my-predictions' && viewerId && (
              <MyPredictionsTab
                viewerId={viewerId}
                firestoreUsers={firestoreUsers}
                allChips={allChips}
                results={storeResults}
                now={now}
                isKnockoutLocked={isKnockoutLocked}
                onSavePrediction={(fixtureId, h, a) =>
                  storeSaveKnockoutPrediction(viewerId, fixtureId, h, a)
                }
                onApply={(fixtureId) => applyChip(viewerId, fixtureId)}
                onRemove={(fixtureId) => removeChip(viewerId, fixtureId)}
              />
            )}
          </div>
        </div>
      </main>

      {selectedPlayer && (
        <PlayerCardModal
          player={selectedPlayer}
          standing={selectedStanding}
          predictions={visiblePredictions}
          multiChips={allChips}
          fixtures={fixtures}
          results={storeResults}
          now={now}
          isViewer={selectedPlayer.id === viewerId}
          tournamentPicks={selectedTournamentPicks}
          bonusPredictions={selectedBonusPredictions}
          onClose={() => setSelectedPlayerId(null)}
        />
      )}
    </>
  );
}
