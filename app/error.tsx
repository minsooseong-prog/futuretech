'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-lg font-semibold">화면을 불러오지 못했습니다.</h1>
      <p className="max-w-sm text-sm text-subtle">
        잠시 후 다시 시도해 주세요. 문제가 계속되면 관리자에게 알려 주세요.
      </p>
      <button
        onClick={reset}
        className="mt-4 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-canvas transition hover:opacity-90"
      >
        다시 시도
      </button>
    </main>
  );
}
