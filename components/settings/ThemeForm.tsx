'use client';

import { useState, useTransition } from 'react';
import { Moon, Sun } from 'lucide-react';
import { setTheme } from '@/lib/actions/settings';
import { cn } from '@/lib/utils/cn';

const OPTIONS = [
  { value: 'light', label: '라이트', icon: Sun },
  { value: 'dark', label: '다크', icon: Moon },
] as const;

export function ThemeForm({ current }: { current: 'light' | 'dark' }) {
  const [theme, setLocal] = useState(current);
  const [pending, start] = useTransition();

  function choose(next: 'light' | 'dark') {
    if (next === theme) return;
    setLocal(next);
    // 즉시 반영 후 서버에 저장 (다음 접속에도 유지)
    document.documentElement.classList.toggle('dark', next === 'dark');
    start(async () => {
      const res = await setTheme(next);
      if (res?.error) {
        setLocal(theme);
        document.documentElement.classList.toggle('dark', theme === 'dark');
      }
    });
  }

  return (
    <fieldset disabled={pending}>
      <legend className="sr-only">테마 선택</legend>
      <div className="grid max-w-md grid-cols-2 gap-3">
        {OPTIONS.map((o) => {
          const Icon = o.icon;
          const active = theme === o.value;
          return (
            <label
              key={o.value}
              className={cn(
                'flex cursor-pointer flex-col gap-3 rounded-xl border p-4 transition-colors',
                active ? 'border-ink' : 'border-line hover:border-ink/30',
              )}
            >
              <input type="radio" name="theme" value={o.value} checked={active} onChange={() => choose(o.value)} className="sr-only" />
              <span
                aria-hidden="true"
                className={cn(
                  'flex h-16 items-end gap-1.5 rounded-lg border p-2',
                  o.value === 'light' ? 'border-[#e8e8e6] bg-white' : 'border-[#2c2c30] bg-[#0e0e0f]',
                )}
              >
                <span className={cn('h-full w-1/4 rounded', o.value === 'light' ? 'bg-[#f6f6f4]' : 'bg-[#18181a]')} />
                <span className={cn('h-2/3 flex-1 rounded', o.value === 'light' ? 'bg-[#f6f6f4]' : 'bg-[#18181a]')} />
              </span>
              <span className="flex items-center gap-2 text-sm font-medium">
                <Icon className="h-4 w-4" aria-hidden="true" />
                {o.label}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
