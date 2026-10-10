import Link from 'next/link';

export function Wordmark() {
  return (
    <Link href="/home" className="group inline-flex items-baseline gap-1 rounded-md" aria-label="Future Tech 홈">
      <span className="text-[1.05rem] font-semibold tracking-[-0.03em]">Future</span>
      <span className="font-hand text-[1.6rem] font-bold leading-none transition-transform group-hover:-rotate-3">Tech</span>
    </Link>
  );
}
