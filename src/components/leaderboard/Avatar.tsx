'use client';

import { useState } from 'react';

import { preloadedAvatarUrls } from '@/lib/avatar';
import { getFlagByCode } from '@/lib/flags';

const PALETTE = ['bg-wc-teal', 'bg-wc-blue', 'bg-wc-magenta', 'bg-wc-red', 'bg-wc-green'];

function colorForName(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}


interface Props {
  name: string;
  photoUrl?: string;
  size?: number;
  ringClass?: string;
  flagCode?: string;
}

export default function Avatar({ name, photoUrl, size = 40, ringClass, flagCode }: Props) {
  const [loaded, setLoaded] = useState(() => !!photoUrl && preloadedAvatarUrls.has(photoUrl));
  const words = name.trim().split(/\s+/).filter(Boolean);
  const initials =
    words.length >= 2
      ? (words[0][0] + words[1][0]).toUpperCase()
      : (words[0] ?? '?').slice(0, 2).toUpperCase();

  return (
    <div
      className={`relative shrink-0 rounded-full ${ringClass ?? ''}`}
      style={{ width: size, height: size }}
    >
      <div
        className={`${colorForName(name)} rounded-full flex items-center justify-center text-wc-white font-display font-bold absolute inset-0`}
        style={{ fontSize: size * 0.36 }}
      >
        {initials}
      </div>
      {photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt={name}
          width={size}
          height={size}
          onLoad={() => {
            preloadedAvatarUrls.add(photoUrl);
            setLoaded(true);
          }}
          className={`rounded-full object-cover absolute inset-0 transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ width: size, height: size }}
        />
      )}
      {flagCode && (() => {
        const Flag = getFlagByCode(flagCode);
        if (!Flag) return null;
        const w = Math.round(size * 0.36);
        const h = Math.round(w * (2 / 3));
        return (
          <div
            className="absolute rounded-[2px] ring-1 ring-white/20 overflow-hidden"
            style={{ width: w, height: h, bottom: -1, right: -1 }}
          >
            <Flag className="w-full h-full" />
          </div>
        );
      })()}
    </div>
  );
}
