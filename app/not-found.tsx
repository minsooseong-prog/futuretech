import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="font-hand text-6xl">404</p>
      <h1 className="text-lg font-semibold">찾는 페이지가 없습니다.</h1>
      <p className="text-sm text-subtle">주소가 바뀌었거나 글이 삭제되었을 수 있습니다.</p>
      <Link
        href="/home"
        className="mt-4 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-canvas transition hover:opacity-90"
      >
        홈으로 가기
      </Link>
    </main>
  );
}
