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
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }

  const initials = name.split(' ')[0].slice(0, 2).toUpperCase();

  return (
    <div
      className={`${colorForName(name)} rounded-full flex items-center justify-center text-wc-white font-display font-bold shrink-0`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  );
}
