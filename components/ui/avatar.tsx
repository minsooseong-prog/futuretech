import { cn } from '@/lib/utils/cn';
import { mediaUrl } from '@/lib/media';
import { initials } from '@/lib/utils/text';

const sizes = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-14 w-14 text-sm',
  xl: 'h-24 w-24 text-lg',
} as const;

export function Avatar({
  name,
  path,
  size = 'md',
  className,
}: {
  name: string;
  path?: string | null;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const url = mediaUrl(path);

  return (
    <span
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full border border-line bg-canvas font-medium text-subtle',
        sizes[size],
        className,
      )}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={`${name} 프로필 사진`}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden>{initials(name)}</span>
      )}
    </span>
  );
}
