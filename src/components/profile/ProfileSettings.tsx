'use client';

import { getIdToken } from 'firebase/auth';
import { CheckCircle2, Clock, Shield, Upload, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { useAuthStore } from '@/app/stores/useAuthStore';
import { updateUserProfile } from '@/lib/firestore';

function resolveAvatarSrc(url: string | null, updatedAt?: string | null): string | null {
  if (!url) return null;
  if (url.includes('.blob.vercel-storage.com/')) {
    const params = new URLSearchParams({ url });
    if (updatedAt) params.set('t', updatedAt);
    return `/api/blob-proxy?${params}`;
  }
  return url;
}

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
  const hasTeamName = !!profile.teamName;
  const hasPredictions = !!profile.predictionFileUrl;

  return (
    <div className="max-w-sm mx-auto px-4 py-8 flex flex-col gap-6">
      {/* Profile header */}
      <div className="bg-wc-ink rounded-2xl p-6 flex flex-col items-center gap-4">
        <div className="relative">
          {avatarSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarSrc}
              alt={displayName}
              width={96}
              height={96}
              className="rounded-full object-cover ring-2 ring-wc-gold"
              style={{ width: 96, height: 96 }}
            />
          ) : (
            <Initials name={displayName} size={96} />
          )}
          {avatarLoading && (
            <div className="absolute inset-0 rounded-full bg-wc-black/70 flex items-center justify-center">
              <Spinner />
            </div>
          )}
        </div>

        <div className="text-center">
          <p className="font-display font-bold text-xl text-wc-white">{displayName}</p>
          <p className="text-wc-bone text-sm">{user.email}</p>
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
          className="flex items-center gap-2 text-sm text-wc-gold border border-wc-gold/40 rounded-lg px-4 py-2 hover:bg-wc-gold/10 transition-colors disabled:opacity-50"
        >
          <Upload size={14} />
          {avatarLoading ? 'Uploading…' : 'Change photo'}
        </button>
        {avatarError && <p className="text-red-400 text-xs text-center">{avatarError}</p>}
      </div>

      {/* Setup checklist */}
      <div className="flex flex-col">
        {/* Step 1: Account approval */}
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <StepIcon done={isApproved} />
            <div className="w-px flex-1 bg-wc-white/10 my-1" />
          </div>
          <div className="pb-6 flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-display font-bold text-sm text-wc-white">Account approval</span>
              <StatusChip done={isApproved} doneLabel="Approved" pendingLabel="Pending" />
            </div>
            {isApproved ? (
              <p className="text-wc-bone text-xs">
                You&apos;re in — your account has been approved.
              </p>
            ) : (
              <p className="text-wc-bone text-xs">
                Your account is under review. Come back here to see when you&apos;ve been approved.
              </p>
            )}
          </div>
        </div>

        {/* Step 2: Team name */}
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <StepIcon done={hasTeamName} />
            <div className="w-px flex-1 bg-wc-white/10 my-1" />
          </div>
          <div className="pb-3 flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-display font-bold text-sm text-wc-white">Team name</span>
              <StatusChip done={hasTeamName} doneLabel="Saved" pendingLabel="Not set" />
            </div>
            <p className="text-wc-bone text-xs">
              Your team name is shown on the leaderboard to everyone else.
            </p>
          </div>
        </div>

        {/* Team name actions — full width */}
        <div className="flex flex-col gap-3 mb-6">
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
            className="bg-wc-ink text-wc-white text-sm rounded-lg px-3 py-2.5 outline-none border border-wc-white/10 focus:border-wc-gold/50 placeholder:text-wc-white/20 disabled:opacity-50 transition-colors"
          />
          <button
            onClick={handleTeamNameSave}
            disabled={
              teamNameSaving || !teamNameValue.trim() || teamNameValue.trim() === profile.teamName
            }
            className="flex items-center justify-center gap-2 text-sm font-semibold bg-wc-gold text-wc-black rounded-lg px-4 py-3 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {teamNameSaving ? 'Saving…' : profile.teamName ? 'Update team name' : 'Save team name'}
          </button>
          {teamNameError && <p className="text-red-400 text-xs">{teamNameError}</p>}
          {teamNameSuccess && <p className="text-green-400 text-xs">Team name saved!</p>}
        </div>

        {/* Step 3: Predictions */}
        <div className="flex gap-4">
          <div className="flex flex-col items-center pt-0.5">
            <StepIcon done={hasPredictions} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-display font-bold text-sm text-wc-white">Predictions</span>
              <StatusChip done={hasPredictions} doneLabel="Uploaded" pendingLabel="Not uploaded" />
            </div>
            <p className="text-wc-bone text-xs">
              Download the template, fill in your scores, then upload before the tournament starts.
            </p>
          </div>
        </div>

        {/* Predictions actions — full width */}
        <div className="flex flex-col gap-3 mt-3">
          <div className="bg-wc-ink rounded-lg px-3 py-2.5">
            <p className="text-wc-white/40 text-sm">Predictions template coming soon</p>
          </div>

          {profile.predictionFileUrl && (
            <div className="flex items-center justify-between bg-wc-ink rounded-lg px-3 py-2">
              <div>
                <p className="text-wc-white text-sm font-medium">Predictions uploaded</p>
                {profile.predictionUploadedAt && (
                  <p className="text-wc-bone text-xs">{formatDate(profile.predictionUploadedAt)}</p>
                )}
              </div>
              {predictionDownloadUrl && (
                <a href={predictionDownloadUrl} className="text-wc-gold text-xs underline">
                  Download
                </a>
              )}
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
            disabled={predictionsLoading}
            className="flex items-center justify-center gap-2 text-sm font-semibold bg-wc-gold text-wc-black rounded-lg px-4 py-3 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Upload size={14} />
            {predictionsLoading
              ? 'Uploading…'
              : profile.predictionFileUrl
                ? 'Replace file'
                : 'Upload predictions'}
          </button>

          {predictionsError && <p className="text-red-400 text-xs">{predictionsError}</p>}
          {predictionsSuccess && (
            <p className="text-green-400 text-xs">Predictions uploaded successfully!</p>
          )}
        </div>
      </div>

      {user.uid === process.env.NEXT_PUBLIC_ADMIN_UID && (
        <Link
          href="/admin"
          className="flex items-center justify-center gap-2 text-wc-gold text-sm border border-wc-gold/30 rounded-lg py-3 hover:bg-wc-gold/10 transition-colors"
        >
          <Shield size={14} />
          Admin dashboard
        </Link>
      )}

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

function StepIcon({ done }: { done: boolean }) {
  if (done) {
    return <CheckCircle2 className="w-6 h-6 text-wc-gold shrink-0" />;
  }
  return (
    <div className="w-6 h-6 rounded-full border-2 border-wc-white/20 flex items-center justify-center shrink-0">
      <Clock className="w-3 h-3 text-wc-white/30" />
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
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
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
