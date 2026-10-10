import Link from 'next/link';
import { BOARD_CATEGORIES } from '@/lib/validation/schemas';
import { cn } from '@/lib/utils/cn';

export function CategoryFilter({ active }: { active?: string }) {
  const options = [{ value: '', label: '전체' }, ...BOARD_CATEGORIES.map((c) => ({ value: c, label: c }))];

  return (
    <div className="mb-4 flex flex-wrap gap-1.5">
      {options.map((option) => {
        const selected = (active ?? '') === option.value;
        return (
          <Link
            key={option.label}
            href={option.value ? `/board?category=${encodeURIComponent(option.value)}` : '/board'}
            aria-current={selected ? 'true' : undefined}
            className={cn(
              'rounded-full border px-3 py-1.5 text-[13px] transition',
              selected
                ? 'border-ink bg-ink text-canvas'
                : 'border-line text-subtle hover:border-ink hover:text-ink',
            )}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
