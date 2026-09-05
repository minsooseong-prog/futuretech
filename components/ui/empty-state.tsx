import { cn } from '@/lib/utils/cn';

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-line px-6 py-16 text-center',
        className,
      )}
    >
      <p className="text-[15px] font-medium text-ink">{title}</p>
      {description && <p className="max-w-sm text-sm text-subtle">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
