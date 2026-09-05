'use client';

import { Input } from '@/components/ui/input';
import { Lock } from 'lucide-react';

/**
 * Renders the shared-password field for notices and calendar events. The value
 * is submitted with the rest of the form and verified against a hash on the
 * server — there is no client-side check to bypass.
 */
export function PasswordGate({
  label,
  hint,
  error,
}: {
  label: string;
  hint: string;
  error?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-canvas p-4">
      <div className="mb-2.5 flex items-center gap-2 text-[13px] font-medium">
        <Lock className="h-3.5 w-3.5 text-subtle" aria-hidden />
        {label}
      </div>
      <Input
        name="password"
        type="password"
        autoComplete="off"
        required
        placeholder="비밀번호"
        hint={hint}
        error={error}
      />
    </div>
  );
}
