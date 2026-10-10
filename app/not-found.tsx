import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-[70dvh] flex-col items-center justify-center px-6 text-center">
      <p className="font-hand text-6xl">404</p>
      <h1 className="mt-4 text-lg font-semibold">페이지를 찾을 수 없습니다</h1>
      <p className="mt-2 text-sm text-muted">삭제되었거나 주소가 잘못되었을 수 있습니다.</p>
      <Link href="/home" className="btn-primary mt-6">
        홈으로 가기
      </Link>
    </main>
  );
}
