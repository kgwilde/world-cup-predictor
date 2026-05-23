'use client';

import { getIdToken } from 'firebase/auth';
import { Clock, Download, FileSpreadsheet, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useAuthStore } from '@/app/stores/useAuthStore';
import { resolveAvatarSrc } from '@/lib/avatar';
import { updateUserProfile } from '@/lib/firestore';

export function ProfileSettings() {
  const { user, profile, signOut, refreshProfile } = useAuthStore();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const predictionsInputRef = useRef<HTMLInputElement>(null);

  const [avatarLoading, setAvatarLoading] = useState(false);
  const [predictionsLoading, setPredictionsLoading] = useState(false);
  const [predictionsDeleting, setPredictionsDeleting] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [predictionsError, setPredictionsError] = useState<string | null>(null);
  const [predictionsSuccess, setPredictionsSuccess] = useState(false);

  const [teamNameValue, setTeamNameValue] = useState(profile?.teamName ?? '');
  const [teamNameSaving, setTeamNameSaving] = useState(false);
  const [teamNameError, setTeamNameError] = useState<string | null>(null);
  const [teamNameSuccess, setTeamNameSuccess] = useState(false);

  useEffect(() => {
    setTeamNameValue(profile?.teamName ?? '');
  }, [profile?.teamName]);

  if (!user || !profile) return null;

  const uid = user.uid;
  const displayName = profile.displayName ?? user.email ?? 'You';
  const avatarSrc = resolveAvatarSrc(profile.avatarUrl, profile.avatarUpdatedAt);
  async function getToken(): Promise<string> {
    return getIdToken(user!);
  }

  async function handleTeamNameSave() {
    const trimmed = teamNameValue.trim();
    if (!trimmed) return;
    setTeamNameSaving(true);
    setTeamNameError(null);
    setTeamNameSuccess(false);
    try {
      await updateUserProfile(uid, { teamName: trimmed });
      await refreshProfile();
      setTeamNameSuccess(true);
    } catch (err) {
      setTeamNameError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setTeamNameSaving(false);
    }
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

  const isApproved = profile.approved === true;
  const hasPredictions = !!profile.predictionFileUrl;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-4">
      {/* Profile card */}
      <div className="bg-wc-ink rounded-2xl p-5">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            {avatarSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarSrc}
                alt={displayName}
                width={72}
                height={72}
                className="rounded-full object-cover ring-2 ring-wc-gold"
                style={{ width: 72, height: 72 }}
              />
            ) : (
              <Initials name={displayName} size={72} />
            )}
            {avatarLoading && (
              <div className="absolute inset-0 rounded-full bg-wc-black/70 flex items-center justify-center">
                <Spinner />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-wc-white truncate">{displayName}</p>
            <p className="text-wc-bone text-xs truncate mb-2">{user.email}</p>
            <StatusChip done={isApproved} doneLabel="Approved" pendingLabel="Pending approval" />
          </div>
        </div>

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
          className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-wc-bone border border-wc-white/10 rounded-lg px-4 py-2.5 hover:border-wc-white/30 hover:text-wc-white transition-colors disabled:opacity-50"
        >
          <Upload size={14} />
          {avatarLoading ? 'Uploading…' : 'Change photo'}
        </button>
        {avatarError && <p className="text-red-400 text-xs mt-2">{avatarError}</p>}
      </div>

      {/* Team name card */}
      <div className="bg-wc-ink rounded-2xl p-5">
        <p className="font-display font-bold text-sm text-wc-white mb-1">Team name</p>
        <p className="text-wc-bone/60 text-xs mb-3">Shown to everyone on the leaderboard.</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={teamNameValue}
            onChange={(e) => {
              setTeamNameValue(e.target.value);
              setTeamNameSuccess(false);
            }}
            placeholder="e.g. Galácticos FC"
            maxLength={40}
            disabled={teamNameSaving}
            className="flex-1 bg-wc-black/30 text-wc-white text-sm rounded-lg px-3 py-2.5 outline-none border border-wc-white/10 focus:border-wc-gold/50 placeholder:text-wc-white/20 disabled:opacity-50 transition-colors"
          />
          <button
            onClick={handleTeamNameSave}
            disabled={
              teamNameSaving || !teamNameValue.trim() || teamNameValue.trim() === profile.teamName
            }
            className="text-sm font-semibold bg-wc-gold text-wc-black rounded-lg px-4 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
          >
            {teamNameSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
        {teamNameError && <p className="text-red-400 text-xs mt-2">{teamNameError}</p>}
        {teamNameSuccess && <p className="text-green-400 text-xs mt-2">Saved!</p>}
      </div>

      {/* Predictions card */}
      <div className="bg-wc-ink rounded-2xl p-5">
        <div className="flex items-center justify-between mb-1">
          <p className="font-display font-bold text-sm text-wc-white">Predictions</p>
          <StatusChip
            done={hasPredictions}
            doneLabel="Uploaded"
            pendingLabel="Not uploaded"
          />
        </div>
        <p className="text-wc-bone/60 text-xs mb-3">
          Download the template, fill in your scores, then upload before the tournament starts.
        </p>

        <DeadlineCountdown />

        <div className="flex flex-col gap-2 mt-3">
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

      {/* Sign out */}
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

function StatusChip({
  done,
  doneLabel,
  pendingLabel,
}: {
  done: boolean;
  doneLabel: string;
  pendingLabel: string;
}) {
  return (
    <span
      className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
        done ? 'bg-wc-gold/20 text-wc-gold' : 'bg-wc-white/10 text-wc-white/40'
      }`}
    >
      {done ? doneLabel : pendingLabel}
    </span>
  );
}

function Initials({ name, size }: { name: string; size: number }) {
  const PALETTE = ['bg-wc-teal', 'bg-wc-blue', 'bg-wc-magenta', 'bg-wc-red', 'bg-wc-green'];
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
  const color = PALETTE[Math.abs(hash) % PALETTE.length];
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div
      className={`${color} rounded-full flex items-center justify-center text-wc-white font-display font-bold ring-2 ring-wc-gold`}
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

function DeadlineCountdown() {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(PREDICTIONS_DEADLINE));

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft(PREDICTIONS_DEADLINE)), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!timeLeft) {
    return (
      <div className="flex items-center gap-1.5 text-red-400 text-xs">
        <Clock size={12} />
        <span>Deadline has passed</span>
      </div>
    );
  }

  const { days, hours, minutes } = timeLeft;
  const isUrgent = days < 1;
  const isWarning = days < 7;

  const colorClass = isUrgent ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-wc-bone/50';

  const parts = [
    days > 0 && `${days}d`,
    (days > 0 || hours > 0) && `${hours}h`,
    `${minutes}m`,
  ].filter(Boolean);

  return (
    <div className={`flex items-center gap-1.5 text-xs ${colorClass}`}>
      <Clock size={12} className="shrink-0" />
      <span>
        {parts.join(' · ')} remaining — deadline{' '}
        {PREDICTIONS_DEADLINE.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} at{' '}
        {PREDICTIONS_DEADLINE.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
      </span>
    </div>
  );
}
