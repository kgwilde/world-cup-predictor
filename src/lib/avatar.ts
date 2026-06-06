export const preloadedAvatarUrls = new Set<string>();

export function resolveAvatarSrc(url: string | null, updatedAt?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.includes('.blob.vercel-storage.com/')) {
    const params = new URLSearchParams({ url });
    if (updatedAt) params.set('t', updatedAt);
    return `/api/blob-proxy?${params}`;
  }
  return url;
}
