import { cn } from '@/lib/utils/cn';

export function FormMessage({ error, message }: { error?: string; message?: string }) {
  if (!error && !message) return null;
  return (
    <p
      role={error ? 'alert' : 'status'}
      className={cn(
        'rounded-lg px-3 py-2 text-sm',
        error ? 'bg-danger/10 text-danger' : 'bg-subtle text-ink',
      )}
    >
      {error ?? message}
    </p>
  );
}
