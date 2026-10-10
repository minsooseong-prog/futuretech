'use client';

import { AlertCircle } from 'lucide-react';

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <AlertCircle className="h-7 w-7 text-muted" strokeWidth={1.5} aria-hidden="true" />
      <p className="mt-4 font-medium">내용을 불러오지 못했습니다</p>
      <p className="mt-1 text-sm text-muted">잠시 후 다시 시도해주세요. 문제가 계속되면 관리자에게 알려주세요.</p>
      <button type="button" onClick={reset} className="btn-primary mt-6">
        다시 시도
      </button>
    </div>
  );
}
