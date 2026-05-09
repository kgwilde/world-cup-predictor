'use client';

import { getIdToken } from 'firebase/auth';
import { Download, Upload, X } from 'lucide-react';
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
  const predictionDownloadUrl = profile.predictionFileUrl
    ? `/api/blob-proxy?url=${encodeURIComponent(profile.predictionFileUrl)}&download`
    : null;

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
          {hasPredictions && <StatusChip done={true} doneLabel="Uploaded" pendingLabel="" />}
        </div>
        <p className="text-wc-bone/60 text-xs mb-4">
          Download the template, fill in your scores, then upload before the tournament starts.
        </p>

        <div className="flex flex-col gap-2">
          <button
            disabled
            className="flex items-center justify-center gap-2 text-sm text-wc-white/30 border border-wc-white/10 rounded-lg px-4 py-2.5 cursor-not-allowed"
          >
            <Download size={14} />
            Download template
            <span className="text-xs text-wc-white/20 ml-1">(coming soon)</span>
          </button>

          <input
            ref={predictionsInputRef}
            type="file"
            accept=".xlsx,.csv"
            className="hidden"
            onChange={handlePredictionsChange}
          />
          <button
            onClick={() => predictionsInputRef.current?.click()}
            disabled={predictionsLoading}
            className="flex items-center justify-center gap-2 text-sm font-semibold bg-wc-gold text-wc-black rounded-lg px-4 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Upload size={14} />
            {predictionsLoading
              ? 'Uploading…'
              : profile.predictionFileUrl
                ? 'Replace file'
                : 'Upload predictions'}
          </button>

          {profile.predictionFileUrl && profile.predictionUploadedAt && (
            <div className="flex items-center justify-between pt-1">
              <p className="text-wc-bone/40 text-xs">
                Uploaded {formatDate(profile.predictionUploadedAt)}
              </p>
              {predictionDownloadUrl && (
                <a href={predictionDownloadUrl} className="text-wc-gold text-xs">
                  Download
                </a>
              )}
            </div>
          )}
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

function Spinner() {
  return (
    <div className="w-6 h-6 border-2 border-wc-white/30 border-t-wc-white rounded-full animate-spin" />
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
