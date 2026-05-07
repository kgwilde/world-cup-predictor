import Image from 'next/image';

import { players } from '@/data/players';

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

const initialCounts = players.reduce<Record<string, number>>((acc, { name }) => {
  const firstInitial = name[0].toUpperCase();
  acc[firstInitial] = (acc[firstInitial] || 0) + 1;
  return acc;
}, {});

function getInitials(name: string) {
  const firstName = name.split(' ')[0];
  const firstInitial = firstName[0].toUpperCase();

  if (initialCounts[firstInitial] > 1) {
    return firstName.slice(0, 2).replace(/^./, (c) => c.toUpperCase());
  }

  return firstInitial;
}

export default function Avatar({ name, photoUrl, size = 40 }: Props) {
  if (photoUrl) {
    return (
      <Image
        src={photoUrl}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  const initials = getInitials(name);

  return (
    <div
      className={`${colorForName(name)} rounded-full flex items-center justify-center text-wc-white font-display font-bold shrink-0`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  );
}
