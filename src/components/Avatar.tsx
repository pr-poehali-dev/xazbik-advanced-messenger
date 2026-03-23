import { getInitials } from '@/lib/store';

const COLORS = [
  ['#3b9eff', '#2563eb'],
  ['#a855f7', '#7c3aed'],
  ['#14d9c5', '#0891b2'],
  ['#f97316', '#ea580c'],
  ['#ec4899', '#db2777'],
  ['#22c55e', '#16a34a'],
];

function getColor(name: string) {
  const idx = name.charCodeAt(0) % COLORS.length;
  return COLORS[idx];
}

interface AvatarProps {
  name: string;
  avatar?: string;
  size?: number;
  online?: boolean;
  className?: string;
  glow?: boolean;
}

export default function Avatar({ name, avatar, size = 44, online, className = '', glow }: AvatarProps) {
  const [c1, c2] = getColor(name);
  const fontSize = Math.round(size * 0.35);

  return (
    <div className={`relative flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
      <div
        className="w-full h-full rounded-full overflow-hidden flex items-center justify-center"
        style={{
          background: avatar ? undefined : `linear-gradient(135deg, ${c1}, ${c2})`,
          boxShadow: glow ? `0 0 0 2px ${c1}, 0 0 16px ${c1}55` : undefined,
        }}
      >
        {avatar ? (
          <img src={avatar} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="font-bold text-white" style={{ fontSize }}>{getInitials(name)}</span>
        )}
      </div>
      {online && (
        <span className="absolute bottom-0 right-0 online-dot" />
      )}
    </div>
  );
}
