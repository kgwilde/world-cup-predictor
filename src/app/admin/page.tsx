'use client';

import { getIdToken } from 'firebase/auth';
import { useEffect, useState } from 'react';

import { useAuthStore } from '@/app/stores/useAuthStore';
import { fixtures } from '@/data/fixtures';
import { getAllUsersAdmin, getResults } from '@/lib/firestore';
import type { FixtureStage, MatchResult, UserProfile } from '@/lib/types';

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

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'users' | 'results';

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

        <div className="flex border-b border-white/10">
          {(['users', 'results'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm font-semibold capitalize border-b-2 transition-colors ${
                tab === t
                  ? 'border-wc-blue text-wc-blue'
                  : 'border-transparent text-white/50 hover:text-white/70'
              }`}
            >
              {t === 'users' ? 'Users' : 'Results'}
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
          ) : (
            <ResultsTab
              key={resultsLoading ? 'loading' : 'loaded'}
              results={results}
              loading={resultsLoading}
              onResultsChange={setResults}
            />
          )}
        </div>
      </div>
    </div>
  );
}
