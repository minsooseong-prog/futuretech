import { AlertCircle } from 'lucide-react';

export function FormMessage({ error }: { error?: string | null }) {
  if (!error) return null;
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/5 px-3 py-2.5 text-[13px] text-danger"
    >
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>{error}</span>
    </p>
  );
}
