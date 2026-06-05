'use client';

import { getIdToken } from 'firebase/auth';
import { Clock, Download, FileSpreadsheet, Pencil, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useAuthStore } from '@/app/stores/useAuthStore';
import { useMyStanding } from '@/components/hooks/use_my_standing';
import { resolveAvatarSrc } from '@/lib/avatar';
import { updateUserProfile } from '@/lib/firestore';

const CARD_COLOR = '#253ecf'; // wc-blue — matches the header

export function ProfileSettings() {
  const { user, profile, signOut, refreshProfile } = useAuthStore();
  const myStanding = useMyStanding();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const predictionsInputRef = useRef<HTMLInputElement>(null);
  const teamNameInputRef = useRef<HTMLInputElement>(null);

  const [avatarLoading, setAvatarLoading] = useState(false);
  const [predictionsLoading, setPredictionsLoading] = useState(false);
  const [predictionsDeleting, setPredictionsDeleting] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [predictionsError, setPredictionsError] = useState<string | null>(null);
  const [predictionsSuccess, setPredictionsSuccess] = useState(false);

  const [teamNameValue, setTeamNameValue] = useState(profile?.teamName ?? '');
  const [teamNameSaving, setTeamNameSaving] = useState(false);
  const [teamNameError, setTeamNameError] = useState<string | null>(null);
  const [isEditingTeamName, setIsEditingTeamName] = useState(false);

  useEffect(() => {
    setTeamNameValue(profile?.teamName ?? '');
  }, [profile?.teamName]);

  useEffect(() => {
    if (isEditingTeamName) {
      teamNameInputRef.current?.focus();
      teamNameInputRef.current?.select();
    }
  }, [isEditingTeamName]);

  if (!user || !profile) return null;

  const uid = user.uid;
  const displayName = (profile.displayName ?? user.email ?? 'You').split(' ')[0];
  const avatarSrc = resolveAvatarSrc(profile.avatarUrl, profile.avatarUpdatedAt);
  const accentColor = CARD_COLOR;
  const isApproved = profile.approved === true;
  const hasPredictions = !!profile.predictionFileUrl;

  async function getToken(): Promise<string> {
    return getIdToken(user!);
  }

  async function handleTeamNameSave() {
    const trimmed = teamNameValue.trim();
    if (!trimmed || trimmed === profile?.teamName) {
      setIsEditingTeamName(false);
      setTeamNameValue(profile?.teamName ?? '');
      return;
    }
    setTeamNameSaving(true);
    setTeamNameError(null);
    try {
      await updateUserProfile(uid, { teamName: trimmed });
      await refreshProfile();
      setIsEditingTeamName(false);
    } catch (err) {
      setTeamNameError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setTeamNameSaving(false);
    }
  }

  function handleTeamNameCancel() {
    setTeamNameValue(profile?.teamName ?? '');
    setTeamNameError(null);
    setIsEditingTeamName(false);
  }

  function handleTeamNameKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleTeamNameSave();
    if (e.key === 'Escape') handleTeamNameCancel();
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError(null);

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('File too large — maximum size is 5 MB.');
      if (avatarInputRef.current) avatarInputRef.current.value = '';
      return;
    }

    setAvatarLoading(true);
    try {
      const idToken = await getToken();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('idToken', idToken);
      const res = await fetch('/api/upload/avatar', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Upload failed');
      await updateUserProfile(uid, {
        avatarUrl: data.url,
        avatarUpdatedAt: new Date().toISOString(),
      });
      await refreshProfile();
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setAvatarLoading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  }

  async function handlePredictionsChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPredictionsError(null);
    setPredictionsSuccess(false);
    setPredictionsLoading(true);
    try {
      const idToken = await getToken();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('idToken', idToken);
      const res = await fetch('/api/upload/predictions', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Upload failed');
      const now = new Date().toISOString();
      await updateUserProfile(uid, {
        predictionFileUrl: data.url,
        predictionFileName: data.originalName ?? file.name,
        predictionUploadedAt: now,
      });
      await refreshProfile();
      setPredictionsSuccess(true);
    } catch (err) {
      setPredictionsError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setPredictionsLoading(false);
      if (predictionsInputRef.current) predictionsInputRef.current.value = '';
    }
  }

  async function handleDeletePredictions() {
    if (!profile?.predictionFileUrl) return;
    setPredictionsDeleting(true);
    setPredictionsError(null);
    setPredictionsSuccess(false);
    try {
      const idToken = await getToken();
      const res = await fetch('/api/upload/predictions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, blobUrl: profile.predictionFileUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Delete failed');
      await updateUserProfile(uid, {
        predictionFileUrl: null,
        predictionFileName: null,
        predictionUploadedAt: null,
      });
      await refreshProfile();
    } catch (err) {
      setPredictionsError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setPredictionsDeleting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-4">
      {/* ── FIFA-style player card ── */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: `linear-gradient(160deg, ${accentColor}50 0%, ${accentColor}22 35%, #020F2A 65%, #0a0a0a 100%)`,
          border: `1px solid ${accentColor}40`,
        }}
      >
        {/* Approval badge */}
        <div className="absolute top-4 right-4">
          <span
            className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium ${
              isApproved ? 'bg-wc-gold/20 text-wc-gold' : 'bg-wc-white/10 text-wc-white/40'
            }`}
          >
            {isApproved ? 'Approved' : 'Pending approval'}
          </span>
        </div>

        <div className="flex flex-col items-center pt-8 pb-6 px-5">
          {/* Avatar */}
          <div className="relative mb-4">
            <div
              className="relative rounded-full"
              style={{
                width: 100,
                height: 100,
                boxShadow: `0 0 0 3px ${accentColor}80, 0 0 0 6px ${accentColor}25`,
              }}
            >
              {/* Initials always rendered as the base layer */}
              <Initials name={displayName} size={100} />
              {/* Photo overlaid on top — hides itself on error, revealing initials */}
              {avatarSrc && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarSrc}
                  alt={displayName}
                  width={100}
                  height={100}
                  className="rounded-full object-cover absolute inset-0"
                  style={{ width: 100, height: 100 }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
            </div>
            {avatarLoading && (
              <div className="absolute inset-0 rounded-full bg-wc-black/70 flex items-center justify-center">
                <Spinner />
              </div>
            )}
          </div>

          {/* Display name */}
          <p className="font-display font-bold text-xl text-wc-white text-center leading-tight">
            {displayName}
          </p>
          {/* Team name — inline editable */}
          {isEditingTeamName ? (
            <div className="flex flex-col items-center gap-1 w-full max-w-xs mt-1">
              <div className="flex items-center gap-2 w-full">
                <input
                  ref={teamNameInputRef}
                  type="text"
                  value={teamNameValue}
                  onChange={(e) => setTeamNameValue(e.target.value)}
                  onKeyDown={handleTeamNameKeyDown}
                  placeholder="e.g. Galácticos FC"
                  maxLength={25}
                  disabled={teamNameSaving}
                  className="flex-1 bg-wc-black/50 text-wc-white text-sm text-center rounded-lg px-3 py-2 outline-none border border-wc-white/20 focus:border-wc-gold/50 placeholder:text-wc-white/20 disabled:opacity-50 transition-colors"
                />
                <button
                  onClick={handleTeamNameSave}
                  disabled={teamNameSaving || !teamNameValue.trim()}
                  className="text-xs font-semibold bg-wc-gold text-wc-black rounded-lg px-3 py-2 hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
                >
                  {teamNameSaving ? '…' : 'Save'}
                </button>
                <button
                  onClick={handleTeamNameCancel}
                  className="text-wc-bone/50 hover:text-wc-bone transition-colors shrink-0"
                >
                  <X size={16} />
                </button>
              </div>
              <span className={`text-[10px] self-start pl-1 tabular-nums ${teamNameValue.length >= 25 ? 'text-wc-red/70' : 'text-wc-white/25'}`}>
                {teamNameValue.length}/25
              </span>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingTeamName(true)}
              className="group relative mt-1"
            >
              <span className="font-display font-bold text-sm text-wc-bone/70 group-hover:text-wc-white border-b border-dashed border-wc-white/25 group-hover:border-wc-white/50 pb-0.5 transition-colors">
                {profile.teamName ?? 'Set your team name'}
              </span>
              <Pencil
                size={10}
                className="absolute -right-5 top-1/2 -translate-y-1/2 text-wc-bone/40 group-hover:text-wc-white/70 transition-colors"
              />
            </button>
          )}
          {teamNameError && <p className="text-red-400 text-xs mt-1">{teamNameError}</p>}

          {/* Change photo */}
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <button
            onClick={() => avatarInputRef.current?.click()}
            disabled={avatarLoading}
            className="mt-5 flex items-center gap-2 text-xs text-wc-bone/35 hover:text-wc-bone/60 border border-wc-white/8 hover:border-wc-white/15 rounded-full px-4 py-1.5 transition-colors disabled:opacity-50"
          >
            <Upload size={10} />
            {avatarLoading ? 'Uploading…' : 'Change photo'}
          </button>
          {avatarError && <p className="text-red-400 text-xs mt-2 text-center">{avatarError}</p>}
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Rank" value={myStanding ? `#${myStanding.rank}` : '—'} />
        <StatTile
          label="Points"
          value={myStanding !== null ? String(myStanding.totalPoints) : '—'}
        />
        <StatTile
          label="Predictions"
          value={hasPredictions ? 'Uploaded' : 'Not yet'}
          highlight={hasPredictions}
        />
      </div>

      {/* ── Predictions card ── */}
      <div className="bg-wc-ink rounded-2xl p-5">
        <p className="font-display font-bold text-sm text-wc-white mb-4">Predictions</p>

        <PredictionsTracker hasPredictions={hasPredictions} />

        <div className="flex flex-col gap-2 mt-5">
          <a
            href="/predictions-template.xlsx"
            download
            className="flex items-center justify-center gap-2 text-sm text-wc-bone border border-wc-white/10 rounded-lg px-4 py-2.5 hover:border-wc-white/30 hover:text-wc-white transition-colors"
          >
            <Download size={14} />
            Download template
          </a>

          {hasPredictions && (
            <div className="flex items-center gap-3 bg-wc-black/30 border border-wc-white/10 rounded-lg px-3 py-2.5">
              <FileSpreadsheet size={16} className="text-wc-gold shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-wc-white text-xs font-medium truncate">
                  {profile.predictionFileName ?? 'predictions file'}
                </p>
                {profile.predictionUploadedAt && (
                  <p className="text-wc-bone/40 text-xs mt-0.5">
                    Uploaded {formatDate(profile.predictionUploadedAt)}
                  </p>
                )}
              </div>
              <button
                onClick={handleDeletePredictions}
                disabled={predictionsDeleting}
                title="Delete prediction file"
                className="shrink-0 flex items-center justify-center w-7 h-7 rounded-md text-red-400/60 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40"
              >
                {predictionsDeleting ? <Spinner size={14} /> : <Trash2 size={14} />}
              </button>
            </div>
          )}

          <input
            ref={predictionsInputRef}
            type="file"
            accept=".xlsx,.csv"
            className="hidden"
            onChange={handlePredictionsChange}
          />
          <button
            onClick={() => predictionsInputRef.current?.click()}
            disabled={predictionsLoading || hasPredictions}
            className="flex items-center justify-center gap-2 text-sm font-semibold bg-wc-gold text-wc-black rounded-lg px-4 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Upload size={14} />
            {predictionsLoading ? 'Uploading…' : 'Upload predictions'}
          </button>
        </div>

        {predictionsError && <p className="text-red-400 text-xs mt-2">{predictionsError}</p>}
        {predictionsSuccess && (
          <p className="text-green-400 text-xs mt-2">Predictions uploaded successfully!</p>
        )}
      </div>

      {/* ── Sign out ── */}
      <button
        onClick={signOut}
        className="flex items-center justify-center gap-2 text-wc-bone text-sm border border-wc-ink rounded-lg py-3 hover:border-red-400 hover:text-red-400 transition-colors"
      >
        <X size={14} />
        Sign out
      </button>
    </div>
  );
}

// June 9 2026 00:00 Dublin time (IST = UTC+1 in summer)
const PREDICTIONS_DEADLINE = new Date('2026-06-09T00:00:00+01:00');

function getTimeLeft(deadline: Date) {
  const diff = deadline.getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  return { days, hours, minutes };
}

function PredictionsTracker({ hasPredictions }: { hasPredictions: boolean }) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(PREDICTIONS_DEADLINE));

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft(PREDICTIONS_DEADLINE)), 60_000);
    return () => clearInterval(id);
  }, []);

  const deadlinePassed = timeLeft === null;

  const steps = [
    {
      label: 'Download template',
      description: 'Get the Excel file with all 64 matches',
      done: hasPredictions,
    },
    {
      label: 'Upload your predictions',
      description: 'Fill in your scorelines and upload the file',
      done: hasPredictions,
    },
    {
      label: deadlinePassed ? 'Deadline passed' : 'Submit before 9 Jun 2026',
      description: deadlinePassed
        ? hasPredictions
          ? 'Predictions locked in'
          : 'No predictions submitted'
        : formatTimeLeft(timeLeft),
      done: hasPredictions,
      failed: deadlinePassed && !hasPredictions,
    },
  ];

  return (
    <div className="flex flex-col">
      {steps.map((step, i) => (
        <div key={i} className="flex gap-3">
          {/* Connector column */}
          <div className="flex flex-col items-center" style={{ width: 20 }}>
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold transition-colors"
              style={{
                background: step.done
                  ? 'rgba(239,191,4,0.2)'
                  : step.failed
                    ? 'rgba(248,113,113,0.1)'
                    : 'rgba(255,255,255,0.06)',
                border: step.done
                  ? '1.5px solid rgba(239,191,4,0.6)'
                  : step.failed
                    ? '1.5px solid rgba(248,113,113,0.3)'
                    : '1.5px solid rgba(255,255,255,0.12)',
                color: step.done ? '#efbf04' : step.failed ? '#f87171' : 'rgba(255,255,255,0.2)',
              }}
            >
              {step.done ? '✓' : step.failed ? '✕' : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div
                className="w-px flex-1 my-1"
                style={{
                  minHeight: 16,
                  background: step.done ? 'rgba(239,191,4,0.25)' : 'rgba(255,255,255,0.07)',
                }}
              />
            )}
          </div>

          {/* Text */}
          <div className="pb-4 min-w-0">
            <p
              className="text-sm font-medium leading-tight"
              style={{
                color: step.done
                  ? '#ffffff'
                  : step.failed
                    ? 'rgba(248,113,113,0.6)'
                    : 'rgba(255,255,255,0.35)',
              }}
            >
              {step.label}
            </p>
            <p
              className="text-xs mt-0.5 flex items-center gap-1"
              style={{
                color: step.done
                  ? 'rgba(244,241,234,0.4)'
                  : step.failed
                    ? 'rgba(248,113,113,0.4)'
                    : 'rgba(255,255,255,0.18)',
              }}
            >
              {i === 2 && !deadlinePassed && !hasPredictions && (
                <Clock size={10} className="shrink-0" />
              )}
              {step.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatTimeLeft(
  timeLeft: { days: number; hours: number; minutes: number } | null,
): string {
  if (!timeLeft) return 'Deadline has passed';
  const { days, hours, minutes } = timeLeft;
  const parts = [days > 0 && `${days}d`, (days > 0 || hours > 0) && `${hours}h`, `${minutes}m`].filter(
    Boolean,
  );
  return `${parts.join(' ')} remaining`;
}

function StatTile({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-wc-ink rounded-xl px-3 py-3.5 flex flex-col items-center gap-1">
      <p
        className="font-display font-bold text-lg leading-none tabular-nums"
        style={{ color: highlight ? '#efbf04' : '#ffffff' }}
      >
        {value}
      </p>
      <p className="text-wc-bone/40 text-xs">{label}</p>
    </div>
  );
}

function Initials({ name, size }: { name: string; size: number }) {
  const PALETTE = ['bg-wc-teal', 'bg-wc-blue', 'bg-wc-magenta', 'bg-wc-red', 'bg-wc-green'];
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
  const color = PALETTE[Math.abs(hash) % PALETTE.length];
  const words = name.trim().split(/\s+/).filter(Boolean);
  const initials =
    words.length >= 2
      ? (words[0][0] + words[1][0]).toUpperCase()
      : (words[0] ?? '?').slice(0, 2).toUpperCase();

  return (
    <div
      className={`${color} rounded-full flex items-center justify-center text-wc-white font-display font-bold`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  );
}

function Spinner({ size = 24 }: { size?: number }) {
  return (
    <div
      className="border-2 border-wc-white/30 border-t-wc-white rounded-full animate-spin"
      style={{ width: size, height: size }}
    />
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
