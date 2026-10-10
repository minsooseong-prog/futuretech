'use client';

import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type Props = {
  children: React.ReactNode;
  className?: string;
  pending?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
};

export function SubmitButton({ children, className, pending, disabled, variant = 'primary' }: Props) {
  const status = useFormStatus();
  const busy = pending ?? status.pending;
  return (
    <button
      type="submit"
      disabled={busy || disabled}
      aria-busy={busy}
      className={cn(variant === 'primary' ? 'btn-primary' : variant === 'danger' ? 'btn-danger' : 'btn-secondary', className)}
    >
      {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
