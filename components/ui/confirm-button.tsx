'use client';

import { useState, useTransition } from 'react';
import { Button, type ButtonProps } from './button';
import { Dialog } from './dialog';
import { useToast } from './toast';
import type { ActionResult } from '@/lib/utils/errors';

/**
 * Wraps any destructive server action in a confirmation step, so a single
 * mis-click can never delete someone's photos.
 */
export function ConfirmButton({
  action,
  title,
  description,
  confirmLabel = '삭제',
  children,
  onDone,
  ...buttonProps
}: {
  action: () => Promise<ActionResult<unknown>>;
  title: string;
  description: string;
  confirmLabel?: string;
  children: React.ReactNode;
  onDone?: () => void;
} & Omit<ButtonProps, 'onClick'>) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const { notify } = useToast();

  function run() {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        notify(result.message ?? '삭제했습니다.');
        setOpen(false);
        onDone?.();
      } else {
        notify(result.error, 'error');
      }
    });
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} {...buttonProps}>
        {children}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title={title} description={description}>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
            취소
          </Button>
          <Button variant="danger" onClick={run} loading={pending}>
            {confirmLabel}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
