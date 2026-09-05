'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Moon, Sun } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { setTheme } from '@/actions/settings';
import { cn } from '@/lib/utils/cn';

export function ThemeToggle({ current }: { current: 'light' | 'dark' }) {
  const [theme, setLocal] = useState(current);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { notify } = useToast();

  function choose(next: 'light' | 'dark') {
    if (next === theme) return;

    // Apply immediately so the switch feels like a switch, then persist.
    document.documentElement.classList.toggle('dark', next === 'dark');
    const previous = theme;
    setLocal(next);

    startTransition(async () => {
      const result = await setTheme(next);
      if (!result.ok) {
        document.documentElement.classList.toggle('dark', previous === 'dark');
        setLocal(previous);
        notify(result.error, 'error');
        return;
      }
      router.refresh();
    });
  }

  const options = [
    { value: 'light' as const, label: '라이트', icon: Sun },
    { value: 'dark' as const, label: '다크', icon: Moon },
  ];

  return (
    <div role="radiogroup" aria-label="테마" className="flex gap-2">
      {options.map((option) => {
        const Icon = option.icon;
        const selected = theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={pending}
            onClick={() => choose(option.value)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm transition',
              selected ? 'border-ink bg-ink text-canvas' : 'border-line text-subtle hover:text-ink',
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
