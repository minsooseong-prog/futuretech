import { cn } from '@/lib/utils/cn';

export function Badge({
  children,
  className,
  tone = 'default',
}: {
  children: React.ReactNode;
  className?: string;
  tone?: 'default' | 'solid' | 'outline';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-4',
        tone === 'solid' && 'bg-ink text-canvas',
        tone === 'outline' && 'border border-line text-subtle',
        tone === 'default' && 'bg-line/60 text-subtle',
        className,
      )}
    >
      {children}
    </span>
  );
}
