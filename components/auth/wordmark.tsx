import { cn } from '@/lib/utils/cn';

/**
 * "Future Tech" drawn as if with a marker. The reveal is a clip-path wipe left
 * to right, which reads as the stroke being laid down rather than a fade-in.
 */
export function Wordmark({
  className,
  animate = true,
}: {
  className?: string;
  animate?: boolean;
}) {
  return (
    <span
      className={cn(
        'font-hand leading-[0.85] tracking-tight text-ink',
        animate && 'animate-ink-reveal',
        className,
      )}
      style={animate ? { animationDelay: '120ms' } : undefined}
    >
      Future Tech
    </span>
  );
}
