'use client';

import { useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import type { ActionState } from '@/lib/actions/types';
import { cn } from '@/lib/utils/cn';

type Props = {
  action: () => Promise<ActionState>;
  label: React.ReactNode;
  title: string;
  description?: string;
  confirmLabel?: string;
  className?: string;
  ariaLabel?: string;
};

/** 삭제처럼 되돌릴 수 없는 작업 전에 확인 대화상자를 띄웁니다. */
export function ConfirmAction({ action, label, title, description, confirmLabel = '삭제', className, ariaLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  return (
    <>
      <button type="button" className={cn('btn-ghost btn-sm', className)} onClick={() => setOpen(true)} aria-label={ariaLabel}>
        {label}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={title} description={description}>
        {error && <p role="alert" className="mb-4 text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
            취소
          </button>
          <button
            type="button"
            className="btn-danger"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const res = await action();
                if (res?.error) setError(res.error);
                else setOpen(false);
              })
            }
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {confirmLabel}
          </button>
        </div>
      </Modal>
    </>
  );
}
