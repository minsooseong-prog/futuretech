'use client';

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-[70dvh] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-lg font-semibold">페이지를 불러오지 못했습니다</h1>
      <p className="mt-2 text-sm text-muted">네트워크 상태를 확인한 뒤 다시 시도해주세요.</p>
      <button type="button" onClick={reset} className="btn-primary mt-6">
        다시 시도
      </button>
    </main>
  );
}
