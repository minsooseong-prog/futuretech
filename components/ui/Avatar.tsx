import { cn } from '@/lib/utils/cn';

type Props = { src?: string | null; name: string; size?: number; className?: string };

export function Avatar({ src, name, size = 40, className }: Props) {
  const style = { width: size, height: size };
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={`${name} 프로필 사진`}
        width={size}
        height={size}
        loading="lazy"
        className={cn('shrink-0 rounded-full border border-line bg-subtle object-cover', className)}
        style={style}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full border border-line bg-subtle font-semibold text-muted',
        className,
      )}
      style={{ ...style, fontSize: Math.max(11, size * 0.38) }}
    >
      {name.slice(0, 1)}
    </span>
  );
}
