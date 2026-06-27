'use client';

import { getIdToken } from 'firebase/auth';
import { useEffect, useState } from 'react';

import { useAuthStore } from '@/app/stores/useAuthStore';
import { fixtures } from '@/data/fixtures';
import { allBonusPredictions } from '@/data/entries';
import { getAllUsersAdmin, getResults, getSpecialOutcomes, getSpecialEvents } from '@/lib/firestore';
import type { FixtureStage, GroupCode, MatchResult, SpecialEvent, SpecialEventType, SpecialOutcomes, UserProfile } from '@/lib/types';

const GROUP_CODES: GroupCode[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

const PALETTE = ['bg-wc-teal', 'bg-wc-blue', 'bg-wc-magenta', 'bg-wc-red', 'bg-wc-green'];

function nameColor(name: string): string {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function InitialsAvatar({ name }: { name: string }) {
  const color = nameColor(name ?? '?');
  const words = (name ?? '?').trim().split(/\s+/).filter(Boolean);
  const initials =
    words.length >= 2
      ? (words[0][0] + words[1][0]).toUpperCase()
      : (words[0] ?? '?').slice(0, 2).toUpperCase();
  return (
    <div
      className={`${color} w-9 h-9 rounded-full flex items-center justify-center text-wc-white font-display font-bold text-sm shrink-0`}
    >
      {initials}
    </div>
  );
}

function TabSpinner() {
  return (
    <div className="w-4 h-4 border-2 border-white/20 border-t-wc-blue rounded-full animate-spin" />
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab({
  users,
  loading,
  onUsersChange,
}: {
  users: UserProfile[];
  loading: boolean;
  onUsersChange: (users: UserProfile[]) => void;
}) {
  const { user } = useAuthStore();
  const [approvingUids, setApprovingUids] = useState<Set<string>>(new Set());
  const [approveError, setApproveError] = useState<string | null>(null);

  async function handleApprove(targetUid: string) {
    if (!user) return;
    setApproveError(null);
    setApprovingUids((prev) => new Set(prev).add(targetUid));
    try {
      const idToken = await getIdToken(user);
      const res = await fetch('/api/admin/approve-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, targetUid }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      onUsersChange(users.map((u) => (u.uid === targetUid ? { ...u, approved: true } : u)));
    } catch (e) {
      setApproveError(e instanceof Error ? e.message : 'Failed to approve');
    } finally {
      setApprovingUids((prev) => {
        const next = new Set(prev);
        next.delete(targetUid);
        return next;
      });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-white/20 border-t-wc-blue rounded-full animate-spin" />
      </div>
    );
  }

  const pending = users.filter((u) => !u.approved);
  const approved = users.filter((u) => u.approved);

  function UserRow({ u, showApprove }: { u: UserProfile; showApprove: boolean }) {
    const name = (u.displayName ?? u.email ?? u.uid).split(' ')[0];
    const isApproving = approvingUids.has(u.uid);
    return (
      <div className="bg-wc-ink rounded-xl px-4 py-3 flex items-center gap-3">
        <InitialsAvatar name={name} />
        <div className="flex-1 min-w-0">
          <p className="text-wc-white text-sm font-semibold truncate">{name}</p>
          {u.email && <p className="text-wc-bone text-xs truncate">{u.email}</p>}
          {u.teamName && <p className="text-wc-blue text-xs truncate">{u.teamName}</p>}
        </div>
        {showApprove && (
          <button
            onClick={() => handleApprove(u.uid)}
            disabled={isApproving}
            className="bg-wc-blue text-wc-white text-xs font-semibold rounded-lg px-3 py-1.5 hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-1.5 shrink-0"
          >
            {isApproving ? <TabSpinner /> : 'Approve'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {approveError && (
        <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-4 py-3">{approveError}</p>
      )}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold text-wc-white/60 uppercase tracking-wider">
            Pending approval
          </h2>
          <span className="bg-wc-blue/20 text-wc-blue text-xs font-semibold rounded-full px-2 py-0.5">
            {pending.length}
          </span>
        </div>
        {pending.length === 0 ? (
          <p className="text-wc-bone/50 text-sm">No pending users.</p>
        ) : (
          <div className="space-y-2">
            {pending.map((u) => (
              <UserRow key={u.uid} u={u} showApprove={true} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold text-wc-white/60 uppercase tracking-wider">
            Players
          </h2>
          <span className="bg-white/10 text-wc-bone text-xs font-semibold rounded-full px-2 py-0.5">
            {approved.length}
          </span>
        </div>
        {approved.length === 0 ? (
          <p className="text-wc-bone/50 text-sm">No approved players yet.</p>
        ) : (
          <div className="space-y-2">
            {approved.map((u) => (
              <UserRow key={u.uid} u={u} showApprove={false} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Results Tab ──────────────────────────────────────────────────────────────

const STAGES: { key: FixtureStage; label: string }[] = [
  { key: 'group', label: 'Group Stage' },
  { key: 'round_of_32', label: 'R32' },
  { key: 'round_of_16', label: 'R16' },
  { key: 'quarter_final', label: 'QF' },
  { key: 'semi_final', label: 'SF' },
  { key: 'third_place', label: '3rd Place' },
  { key: 'final', label: 'Final' },
];

function ResultsTab({
  results,
  loading,
  onResultsChange,
}: {
  results: MatchResult[];
  loading: boolean;
  onResultsChange: (results: MatchResult[]) => void;
}) {
  const { user } = useAuthStore();
  const [stage, setStage] = useState<FixtureStage>('group');
  // Initialized from results on first mount (key prop in parent resets when results load)
  const [homeInputs, setHomeInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries(results.map((r) => [r.fixtureId, String(r.homeGoals)]))
  );
  const [awayInputs, setAwayInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries(results.map((r) => [r.fixtureId, String(r.awayGoals)]))
  );
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  async function handleSave(fixtureId: string) {
    if (!user) return;
    const homeRaw = homeInputs[fixtureId] ?? '';
    const awayRaw = awayInputs[fixtureId] ?? '';
    const homeGoals = parseInt(homeRaw, 10);
    const awayGoals = parseInt(awayRaw, 10);
    if (
      !Number.isInteger(homeGoals) ||
      homeGoals < 0 ||
      !Number.isInteger(awayGoals) ||
      awayGoals < 0
    ) {
      return;
    }
    setSavingIds((prev) => new Set(prev).add(fixtureId));
    try {
      const idToken = await getIdToken(user);
      const res = await fetch('/api/admin/set-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, fixtureId, homeGoals, awayGoals }),
      });
      if (!res.ok) throw new Error('Failed to save');
      onResultsChange([
        ...results.filter((r) => r.fixtureId !== fixtureId),
        { fixtureId, homeGoals, awayGoals },
      ]);
      setSavedIds((prev) => new Set(prev).add(fixtureId));
      setTimeout(() => {
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.delete(fixtureId);
          return next;
        });
      }, 2000);
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(fixtureId);
        return next;
      });
    }
  }

  const stageFixtures = fixtures
    .filter((f) => f.stage === stage)
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff));

  const resultMap = new Map(results.map((r) => [r.fixtureId, r]));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-white/20 border-t-wc-blue rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {STAGES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setStage(key)}
            className={`shrink-0 text-xs font-semibold rounded-full px-3 py-1.5 transition-colors ${
              stage === key
                ? 'bg-wc-blue text-wc-white'
                : 'bg-wc-ink text-white/60 hover:text-white/80'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {stageFixtures.map((f) => {
          const hasResult = resultMap.has(f.id);
          const isSaving = savingIds.has(f.id);
          const isSaved = savedIds.has(f.id);
          const kickoffDate = new Date(f.kickoff).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
          });

          return (
            <div key={f.id} className="bg-wc-ink rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-wc-bone/50 text-xs w-14 shrink-0">{kickoffDate}</span>

                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-wc-white text-sm font-semibold truncate flex-1 text-right">
                    {f.homeTeam.name}
                  </span>

                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      type="number"
                      min={0}
                      value={homeInputs[f.id] ?? ''}
                      onChange={(e) =>
                        setHomeInputs((prev) => ({ ...prev, [f.id]: e.target.value }))
                      }
                      className="w-12 text-center bg-wc-black border border-white/15 rounded-lg px-2 py-1.5 text-sm font-bold tabular-nums focus:border-wc-blue/60 outline-none"
                    />
                    <span className="text-wc-bone/40 text-sm font-bold">:</span>
                    <input
                      type="number"
                      min={0}
                      value={awayInputs[f.id] ?? ''}
                      onChange={(e) =>
                        setAwayInputs((prev) => ({ ...prev, [f.id]: e.target.value }))
                      }
                      className="w-12 text-center bg-wc-black border border-white/15 rounded-lg px-2 py-1.5 text-sm font-bold tabular-nums focus:border-wc-blue/60 outline-none"
                    />
                  </div>

                  <span className="text-wc-white text-sm font-semibold truncate flex-1">
                    {f.awayTeam.name}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {hasResult && (
                    <span className="w-2 h-2 rounded-full bg-wc-blue shrink-0" title="Result set" />
                  )}
                  <button
                    onClick={() => handleSave(f.id)}
                    disabled={isSaving}
                    className={`text-xs font-semibold rounded-lg px-3 py-1.5 transition-colors disabled:opacity-60 ${
                      isSaved
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-wc-blue text-wc-white hover:opacity-90'
                    }`}
                  >
                    {isSaving ? <TabSpinner /> : isSaved ? 'Saved ✓' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {stageFixtures.length === 0 && (
          <p className="text-wc-bone/50 text-sm">No fixtures for this stage.</p>
        )}
      </div>
    </div>
  );
}

// ─── Analytics Tab ────────────────────────────────────────────────────────────

interface LiveResult {
  fixtureId: string;
  homeGoals: number;
  awayGoals: number;
  status: 'live' | 'half_time';
  minute?: number;
  injuryTime?: number;
}

interface AnalyticsData {
  sync: { lastSyncedAt: string | null; liveResults: LiveResult[] };
}

const MATCH_DURATION_MS = 150 * 60 * 1000;

function formatElapsed(ms: number): string {
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function AnalyticsTab() {
  const { user } = useAuthStore();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!user) return;
    getIdToken(user)
      .then((idToken) =>
        fetch('/api/admin/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        }),
      )
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<AnalyticsData>;
      })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-white/20 border-t-wc-blue rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-4 py-3">{error ?? 'No data'}</p>
    );
  }

  const syncDate = data.sync.lastSyncedAt ? new Date(data.sync.lastSyncedAt) : null;
  const diffMs = syncDate ? now - syncDate.getTime() : null;
  const diffMins = diffMs !== null ? Math.floor(diffMs / 60_000) : null;
  const stalenessColor =
    diffMins === null
      ? 'text-wc-bone/40'
      : diffMins < 5
        ? 'text-green-400'
        : diffMins < 30
          ? 'text-yellow-400'
          : 'text-red-400';

  const fixtureMap = new Map(fixtures.map((f) => [f.id, f]));
  const liveMatches = data.sync.liveResults.map((r) => {
    const fixture = fixtureMap.get(r.fixtureId);
    const kickoff = fixture ? new Date(fixture.kickoff).getTime() : null;
    const isGenuinelyLive =
      kickoff !== null && Date.now() >= kickoff && Date.now() < kickoff + MATCH_DURATION_MS;
    return { ...r, fixture, isGenuinelyLive };
  });

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-sm font-semibold text-wc-white/60 uppercase tracking-wider mb-3">
          Sync Health
        </h2>

        <div className="bg-wc-ink rounded-xl px-4 py-4 mb-4">
          <p className="text-wc-bone/50 text-xs mb-1">Last Synced</p>
          <p className={`text-2xl font-bold tabular-nums ${stalenessColor}`}>
            {diffMs !== null ? formatElapsed(diffMs) : '—'}
          </p>
          {syncDate && (
            <p className="text-wc-bone/40 text-xs mt-1">
              {syncDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>

        <p className="text-wc-bone/50 text-xs font-semibold uppercase tracking-wider mb-2">
          Live in DB ({liveMatches.length})
        </p>
        {liveMatches.length === 0 ? (
          <p className="text-wc-bone/30 text-sm">No live matches in database.</p>
        ) : (
          <div className="space-y-2">
            {liveMatches.map(({ fixtureId, homeGoals, awayGoals, status, minute, injuryTime, fixture, isGenuinelyLive }) => (
              <div key={fixtureId} className="bg-wc-ink rounded-xl px-4 py-3 flex items-center gap-3">
                <span
                  className={`text-xs font-bold rounded-full px-2 py-0.5 shrink-0 ${
                    !isGenuinelyLive
                      ? 'bg-red-500/20 text-red-400'
                      : status === 'half_time'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-green-500/20 text-green-400'
                  }`}
                >
                  {!isGenuinelyLive ? 'STUCK' : status === 'half_time' ? 'HT' : 'LIVE'}
                </span>
                <p className="text-wc-white text-sm font-semibold flex-1 min-w-0 truncate">
                  {fixture ? (
                    <>
                      {fixture.homeTeam.name}{' '}
                      <span className="text-wc-bone/50">
                        {homeGoals} : {awayGoals}
                      </span>{' '}
                      {fixture.awayTeam.name}
                    </>
                  ) : (
                    <span className="text-wc-bone/50 font-mono">{fixtureId}</span>
                  )}
                </p>
                {minute != null && (
                  <span className="text-wc-bone/50 text-xs tabular-nums shrink-0">
                    {minute}
                    {injuryTime ? `+${injuryTime}` : ''}&apos;
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Specials Tab ─────────────────────────────────────────────────────────────

const UNIQUE_TOP_SCORERS = [...new Set(allBonusPredictions.map((b) => b.topScorer))].sort();

function AppliedBadge({ event }: { event: SpecialEvent | undefined }) {
  if (!event) return null;
  const d = new Date(event.appliedAt);
  return (
    <span className="text-xs text-green-400 bg-green-400/10 rounded-full px-2 py-0.5">
      Applied {d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}{' '}
      {d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
    </span>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-xs font-semibold text-wc-white/50 uppercase tracking-wider mb-3">{title}</h3>
  );
}

function SpecialsTab() {
  const { user } = useAuthStore();
  const [outcomes, setOutcomes] = useState<SpecialOutcomes>({});
  const [appliedEvents, setAppliedEvents] = useState<Partial<Record<SpecialEventType, SpecialEvent>>>({});
  const [applying, setApplying] = useState<Partial<Record<SpecialEventType, boolean>>>({});
  const [errors, setErrors] = useState<Partial<Record<SpecialEventType, string>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getSpecialOutcomes(), getSpecialEvents()])
      .then(([savedOutcomes, savedEvents]) => {
        if (savedOutcomes) setOutcomes(savedOutcomes);
        const eventsMap: Partial<Record<SpecialEventType, SpecialEvent>> = {};
        for (const event of savedEvents) eventsMap[event.id] = event;
        setAppliedEvents(eventsMap);
      })
      .finally(() => setLoading(false));
  }, []);

  async function applyEvent(eventType: SpecialEventType) {
    if (!user) return;
    setApplying((prev) => ({ ...prev, [eventType]: true }));
    setErrors((prev) => ({ ...prev, [eventType]: undefined }));
    try {
      const idToken = await getIdToken(user);
      const res = await fetch('/api/admin/apply-special', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, eventType, outcomes }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const { event } = await res.json();
      setAppliedEvents((prev) => ({ ...prev, [eventType]: event }));
    } catch (e) {
      setErrors((prev) => ({ ...prev, [eventType]: e instanceof Error ? e.message : 'Failed' }));
    } finally {
      setApplying((prev) => ({ ...prev, [eventType]: false }));
    }
  }

  function updateGroup(group: GroupCode, field: 'winner' | 'runnerUp', value: string) {
    setOutcomes((prev) => ({
      ...prev,
      groupResults: {
        ...prev.groupResults,
        [group]: { ...prev.groupResults?.[group], [field]: value.toUpperCase() },
      } as Record<GroupCode, { winner: string; runnerUp: string }>,
    }));
  }

  function updateTeamList(field: keyof SpecialOutcomes, raw: string) {
    const codes = raw.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
    setOutcomes((prev) => ({ ...prev, [field]: codes }));
  }

  function ApplyButton({ eventType, label }: { eventType: SpecialEventType; label: string }) {
    const isApplying = applying[eventType];
    const error = errors[eventType];
    const applied = appliedEvents[eventType];
    return (
      <div className="flex items-center gap-3 mt-3">
        <button
          onClick={() => applyEvent(eventType)}
          disabled={!!isApplying}
          className="text-xs font-semibold rounded-lg px-3 py-1.5 bg-wc-blue text-wc-white hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {isApplying ? 'Applying…' : label}
        </button>
        <AppliedBadge event={applied} />
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-white/20 border-t-wc-blue rounded-full animate-spin" />
      </div>
    );
  }

  const groupResultsStr = (group: GroupCode, field: 'winner' | 'runnerUp') =>
    outcomes.groupResults?.[group]?.[field] ?? '';

  return (
    <div className="space-y-8">
      {/* Group Stage Picks */}
      <section>
        <SectionHeader title="Group Stage Picks" />
        <div className="bg-wc-ink rounded-xl overflow-hidden mb-3">
          <div className="grid grid-cols-[auto_1fr_1fr] text-[11px] text-wc-bone/50 font-semibold uppercase tracking-wider px-4 py-2 border-b border-white/8">
            <span className="w-8">Grp</span>
            <span>Winner</span>
            <span>Runner-up</span>
          </div>
          {GROUP_CODES.map((group) => (
            <div key={group} className="grid grid-cols-[auto_1fr_1fr] items-center px-4 py-2 border-b border-white/8 last:border-0 gap-2">
              <span className="w-8 text-xs font-bold text-wc-bone/50">{group}</span>
              <input
                value={groupResultsStr(group, 'winner')}
                onChange={(e) => updateGroup(group, 'winner', e.target.value)}
                placeholder="e.g. ES"
                className="bg-wc-black border border-white/15 rounded-lg px-2 py-1 text-xs font-mono text-wc-white focus:border-wc-blue/60 outline-none w-full"
              />
              <input
                value={groupResultsStr(group, 'runnerUp')}
                onChange={(e) => updateGroup(group, 'runnerUp', e.target.value)}
                placeholder="e.g. FR"
                className="bg-wc-black border border-white/15 rounded-lg px-2 py-1 text-xs font-mono text-wc-white focus:border-wc-blue/60 outline-none w-full"
              />
            </div>
          ))}
        </div>
        <ApplyButton eventType="group_stage_picks" label="Apply Group Stage Picks" />
      </section>

      {/* Best 3rd Place */}
      <section>
        <SectionHeader title="Best 3rd Place Teams (8 teams)" />
        <input
          value={(outcomes.bestThirdPlace ?? []).join(', ')}
          onChange={(e) => updateTeamList('bestThirdPlace', e.target.value)}
          placeholder="e.g. KR, GHA, SCO, PAR, DZ, AU, JP, CV"
          className="w-full bg-wc-ink border border-white/15 rounded-xl px-4 py-3 text-sm font-mono text-wc-white focus:border-wc-blue/60 outline-none"
        />
        <ApplyButton eventType="best_third_place" label="Apply Best 3rd Place" />
      </section>

      {/* Knockout bracket */}
      <section>
        <SectionHeader title="Knockout Bracket" />
        <div className="space-y-3">
          {(
            [
              { field: 'roundOf16' as const, label: 'Round of 16 (16 teams)', eventType: 'round_of_16_picks' as SpecialEventType },
              { field: 'quarterFinalists' as const, label: 'Quarter-finalists (8 teams)', eventType: 'quarter_final_picks' as SpecialEventType },
              { field: 'semiFinalists' as const, label: 'Semi-finalists (4 teams)', eventType: 'semi_final_picks' as SpecialEventType },
              { field: 'finalists' as const, label: 'Finalists (2 teams)', eventType: 'finalist_picks' as SpecialEventType },
              { field: 'winner' as const, label: 'Winner (1 team)', eventType: 'winner_pick' as SpecialEventType },
            ] as const
          ).map(({ field, label, eventType }) => (
            <div key={field}>
              <p className="text-xs text-wc-bone/50 mb-1">{label}</p>
              <input
                value={field === 'winner'
                  ? (outcomes.winner ?? '')
                  : ((outcomes[field] ?? []) as string[]).join(', ')}
                onChange={(e) => {
                  if (field === 'winner') {
                    setOutcomes((prev) => ({ ...prev, winner: e.target.value.trim().toUpperCase() }));
                  } else {
                    updateTeamList(field, e.target.value);
                  }
                }}
                placeholder={field === 'winner' ? 'e.g. ES' : 'Comma-separated team codes'}
                className="w-full bg-wc-ink border border-white/15 rounded-xl px-4 py-2.5 text-sm font-mono text-wc-white focus:border-wc-blue/60 outline-none"
              />
              <ApplyButton eventType={eventType} label={`Apply ${label.split(' (')[0]}`} />
            </div>
          ))}
        </div>
      </section>

      {/* Group Stage Stats */}
      <section>
        <SectionHeader title="Group Stage Stats" />
        <div className="space-y-4">
          <div>
            <p className="text-xs text-wc-bone/50 mb-1">Highest Scoring Team (team code)</p>
            <div className="flex gap-2">
              <input
                value={outcomes.highestScoringTeam ?? ''}
                onChange={(e) => setOutcomes((prev) => ({ ...prev, highestScoringTeam: e.target.value.trim().toUpperCase() }))}
                placeholder="e.g. ES"
                className="bg-wc-ink border border-white/15 rounded-xl px-4 py-2.5 text-sm font-mono text-wc-white focus:border-wc-blue/60 outline-none w-24"
              />
              <input
                type="number"
                min={0}
                value={outcomes.highestScoringTeamGoals ?? ''}
                onChange={(e) => setOutcomes((prev) => ({ ...prev, highestScoringTeamGoals: parseInt(e.target.value) || 0 }))}
                placeholder="Goals"
                className="bg-wc-ink border border-white/15 rounded-xl px-4 py-2.5 text-sm tabular-nums text-wc-white focus:border-wc-blue/60 outline-none w-24"
              />
            </div>
            <ApplyButton eventType="group_stage_highest_scorers" label="Apply Group Stage Highest Scorers" />
          </div>

          <div>
            <p className="text-xs text-wc-bone/50 mb-1">Best Defence Team (team code + goals conceded)</p>
            <div className="flex gap-2">
              <input
                value={outcomes.bestDefenceTeam ?? ''}
                onChange={(e) => setOutcomes((prev) => ({ ...prev, bestDefenceTeam: e.target.value.trim().toUpperCase() }))}
                placeholder="e.g. GB_ENG"
                className="bg-wc-ink border border-white/15 rounded-xl px-4 py-2.5 text-sm font-mono text-wc-white focus:border-wc-blue/60 outline-none w-28"
              />
              <input
                type="number"
                min={0}
                value={outcomes.bestDefenceGoalsConceded ?? ''}
                onChange={(e) => setOutcomes((prev) => ({ ...prev, bestDefenceGoalsConceded: parseInt(e.target.value) || 0 }))}
                placeholder="Conceded"
                className="bg-wc-ink border border-white/15 rounded-xl px-4 py-2.5 text-sm tabular-nums text-wc-white focus:border-wc-blue/60 outline-none w-28"
              />
            </div>
            <ApplyButton eventType="best_group_stage_defence" label="Apply Best Group Stage Defence" />
          </div>
        </div>
      </section>

      {/* Bonus Stats */}
      <section>
        <SectionHeader title="Bonus Stats" />
        <div className="space-y-4">
          <div>
            <p className="text-xs text-wc-bone/50 mb-1">Total Yellow Cards</p>
            <input
              type="number"
              min={0}
              value={outcomes.totalYellowCards ?? ''}
              onChange={(e) => setOutcomes((prev) => ({ ...prev, totalYellowCards: parseInt(e.target.value) || 0 }))}
              className="bg-wc-ink border border-white/15 rounded-xl px-4 py-2.5 text-sm tabular-nums text-wc-white focus:border-wc-blue/60 outline-none w-32"
            />
            <ApplyButton eventType="yellow_cards" label="Apply Yellow Cards" />
          </div>

          <div>
            <p className="text-xs text-wc-bone/50 mb-1">Total Red Cards</p>
            <input
              type="number"
              min={0}
              value={outcomes.totalRedCards ?? ''}
              onChange={(e) => setOutcomes((prev) => ({ ...prev, totalRedCards: parseInt(e.target.value) || 0 }))}
              className="bg-wc-ink border border-white/15 rounded-xl px-4 py-2.5 text-sm tabular-nums text-wc-white focus:border-wc-blue/60 outline-none w-32"
            />
            <ApplyButton eventType="red_cards" label="Apply Red Cards" />
          </div>

          <div>
            <p className="text-xs text-wc-bone/50 mb-1">Number of Penalty Shootouts</p>
            <input
              type="number"
              min={0}
              value={outcomes.penaltyShootouts ?? ''}
              onChange={(e) => setOutcomes((prev) => ({ ...prev, penaltyShootouts: parseInt(e.target.value) || 0 }))}
              className="bg-wc-ink border border-white/15 rounded-xl px-4 py-2.5 text-sm tabular-nums text-wc-white focus:border-wc-blue/60 outline-none w-32"
            />
            <ApplyButton eventType="penalty_shootouts" label="Apply Penalty Shootouts" />
          </div>
        </div>
      </section>

      {/* Top Goalscorer */}
      <section>
        <SectionHeader title="Top Goalscorer" />
        <div className="space-y-3">
          <div>
            <p className="text-xs text-wc-bone/50 mb-1">Actual tournament top goalscorer</p>
            <input
              value={outcomes.actualTopScorer ?? ''}
              onChange={(e) => setOutcomes((prev) => ({ ...prev, actualTopScorer: e.target.value }))}
              placeholder="e.g. Harry Kane"
              className="w-full bg-wc-ink border border-white/15 rounded-xl px-4 py-2.5 text-sm text-wc-white focus:border-wc-blue/60 outline-none"
            />
          </div>
          <div>
            <p className="text-xs text-wc-bone/50 mb-2">Goals scored by each predicted player</p>
            <div className="bg-wc-ink rounded-xl overflow-hidden">
              {UNIQUE_TOP_SCORERS.map((name) => (
                <div key={name} className="flex items-center justify-between px-4 py-2.5 border-b border-white/8 last:border-0">
                  <span className="text-sm text-wc-white">{name}</span>
                  <input
                    type="number"
                    min={0}
                    value={outcomes.topScorerGoalsMap?.[name] ?? ''}
                    onChange={(e) =>
                      setOutcomes((prev) => ({
                        ...prev,
                        topScorerGoalsMap: {
                          ...prev.topScorerGoalsMap,
                          [name]: parseInt(e.target.value) || 0,
                        },
                      }))
                    }
                    placeholder="0"
                    className="bg-wc-black border border-white/15 rounded-lg px-2 py-1 text-sm tabular-nums text-wc-white focus:border-wc-blue/60 outline-none w-16 text-center"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        <ApplyButton eventType="top_goalscorer" label="Apply Top Goalscorer" />
      </section>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'users' | 'results' | 'analytics' | 'specials';

export default function AdminPage() {
  const { user, loading } = useAuthStore();
  const [tab, setTab] = useState<Tab>('users');
  const [adminUsers, setAdminUsers] = useState<UserProfile[]>([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(true);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [resultsLoading, setResultsLoading] = useState(true);

  const isAdmin = !loading && !!user && user.uid === process.env.NEXT_PUBLIC_ADMIN_UID;

  useEffect(() => {
    if (!isAdmin) return;
    getAllUsersAdmin()
      .then(setAdminUsers)
      .finally(() => setAdminUsersLoading(false));
    getResults()
      .then(setResults)
      .finally(() => setResultsLoading(false));
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-wc-black flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-white/20 border-t-wc-blue rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-wc-black flex flex-col items-center justify-center gap-3 px-4">
        <p className="text-wc-blue text-xs font-semibold uppercase tracking-widest">
          FIFA World Cup 2026
        </p>
        <h1 className="text-wc-white font-display font-bold text-2xl">Access denied</h1>
        <p className="text-wc-bone text-sm">You don&apos;t have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="bg-wc-black min-h-screen px-4 py-6 text-white">
      <div className="max-w-3xl mx-auto space-y-8">
        <header>
          <p className="text-wc-blue text-xs font-semibold uppercase tracking-widest mb-1">
            FIFA World Cup 2026
          </p>
          <h1 className="font-display font-bold text-3xl text-wc-white">Admin Dashboard</h1>
        </header>

        <div className="flex border-b border-white/10 overflow-x-auto">
          {(['users', 'results', 'specials', 'analytics'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`shrink-0 px-5 py-2.5 text-sm font-semibold capitalize border-b-2 transition-colors ${
                tab === t
                  ? 'border-wc-blue text-wc-blue'
                  : 'border-transparent text-white/50 hover:text-white/70'
              }`}
            >
              {t === 'users' ? 'Users' : t === 'results' ? 'Results' : t === 'specials' ? 'Specials' : 'Analytics'}
            </button>
          ))}
        </div>

        <div>
          {tab === 'users' ? (
            <UsersTab
              users={adminUsers}
              loading={adminUsersLoading}
              onUsersChange={setAdminUsers}
            />
          ) : tab === 'results' ? (
            <ResultsTab
              key={resultsLoading ? 'loading' : 'loaded'}
              results={results}
              loading={resultsLoading}
              onResultsChange={setResults}
            />
          ) : tab === 'specials' ? (
            <SpecialsTab />
          ) : (
            <AnalyticsTab />
          )}
        </div>
      </div>
    </div>
  );
}
