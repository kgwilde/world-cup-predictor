'use client';

import { useState } from 'react';

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
}

export default function Avatar({ name, photoUrl, size = 40 }: Props) {
  const [loaded, setLoaded] = useState(false);
  const initials = name.split(' ')[0].slice(0, 2).toUpperCase();

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
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
          onLoad={() => setLoaded(true)}
          className={`rounded-full object-cover absolute inset-0 transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ width: size, height: size }}
        />
      )}
    </div>
  );
}
