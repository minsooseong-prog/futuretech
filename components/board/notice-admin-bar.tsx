'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Pencil, Pin, PinOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { useToast } from '@/components/ui/toast';
import { deleteNotice, togglePinned } from '@/actions/notices';

export function NoticeAdminBar({
  noticeId,
  pinned,
  isAdmin,
}: {
  noticeId: string;
  pinned: boolean;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [pending, startTransition] = useTransition();

  function pin() {
    startTransition(async () => {
      const result = await togglePinned(noticeId);
      notify(result.ok ? (result.message ?? '변경했습니다.') : result.error, result.ok ? 'success' : 'error');
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="mt-8 flex items-center justify-end gap-2 border-t border-line pt-5">
      <Link
        href={`/notices/${noticeId}/edit`}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-[13px] text-subtle transition hover:text-ink"
      >
        <Pencil className="h-3.5 w-3.5" aria-hidden />
        수정
      </Link>
      {isAdmin && (
        <Button type="button" variant="secondary" size="sm" onClick={pin} loading={pending}>
          {pinned ? <PinOff className="h-3.5 w-3.5" aria-hidden /> : <Pin className="h-3.5 w-3.5" aria-hidden />}
          {pinned ? '고정 해제' : '위에 고정'}
        </Button>
      )}
      <ConfirmButton
        variant="ghost"
        size="sm"
        title="공지를 삭제할까요?"
        description="삭제하면 되돌릴 수 없습니다."
        action={() => deleteNotice(noticeId)}
        onDone={() => {
          router.push('/notices');
          router.refresh();
        }}
      >
        삭제
      </ConfirmButton>
    </div>
  );
}
