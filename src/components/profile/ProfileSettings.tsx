'use client';

import { getIdToken } from 'firebase/auth';
import { Download, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';

import { useAuthStore } from '@/app/stores/useAuthStore';
import { updateUserProfile } from '@/lib/firestore';

const TEMPLATE_URL = process.env.NEXT_PUBLIC_PREDICTIONS_TEMPLATE_URL ?? null;

function resolveAvatarSrc(url: string | null): string | null {
  if (!url) return null;
  // Blob-stored avatars need the server-side proxy; Google/external URLs are already public
  if (url.includes('.blob.vercel-storage.com/')) {
    return `/api/blob-proxy?url=${encodeURIComponent(url)}`;
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

  if (!user || !profile) return null;

  const uid = user.uid;
  const displayName = profile.displayName ?? user.email ?? 'You';
  const avatarSrc = resolveAvatarSrc(profile.avatarUrl);
  const predictionDownloadUrl = profile.predictionFileUrl
    ? `/api/blob-proxy?url=${encodeURIComponent(profile.predictionFileUrl)}&download`
    : null;

  async function getToken(): Promise<string> {
    return getIdToken(user!);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError(null);
    setAvatarLoading(true);

    try {
      const idToken = await getToken();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('idToken', idToken);

      const res = await fetch('/api/upload/avatar', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? 'Upload failed');

      await updateUserProfile(uid, { avatarUrl: data.url });
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

  return (
    <div className="max-w-sm mx-auto px-4 py-8 flex flex-col gap-6">
      {/* Avatar section */}
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

      {/* Predictions file section */}
      <div className="bg-wc-ink rounded-2xl p-6 flex flex-col gap-4">
        <div>
          <h2 className="font-display font-bold text-lg text-wc-white">Predictions file</h2>
          <p className="text-wc-bone text-xs mt-1">
            Download the template, fill in your predictions, then upload it before the tournament
            starts.
          </p>
        </div>

        {/* Template download */}
        {TEMPLATE_URL && (
          <a
            href={TEMPLATE_URL}
            download
            className="flex items-center justify-between bg-wc-black/40 rounded-lg px-3 py-2.5 hover:bg-wc-black/60 transition-colors group"
          >
            <div>
              <p className="text-wc-white text-sm font-medium">predictions-template.xlsx</p>
              <p className="text-wc-bone text-xs">Download and fill in your scores</p>
            </div>
            <Download size={16} className="text-wc-gold shrink-0 group-hover:text-wc-gold/80" />
          </a>
        )}

        {/* Uploaded file status */}
        {profile.predictionFileUrl ? (
          <div className="flex items-center justify-between bg-wc-black/40 rounded-lg px-3 py-2">
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
        ) : (
          <p className="text-wc-bone text-sm">No file uploaded yet.</p>
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
