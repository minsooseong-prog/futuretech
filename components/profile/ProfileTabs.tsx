'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';

type Tab = { id: string; label: string; count: number; content: React.ReactNode };

export function ProfileTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  return (
    <div>
      <div role="tablist" aria-label="프로필 내용" className="mb-5 flex gap-6 border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`ptab-${t.id}`}
            aria-selected={active === t.id}
            aria-controls={`ppanel-${t.id}`}
            onClick={() => setActive(t.id)}
            className={cn(
              '-mb-px border-b-2 pb-3 text-sm font-medium transition-colors',
              active === t.id ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink',
            )}
          >
            {t.label} <span className="ml-0.5 tabular-nums text-muted">{t.count}</span>
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" id={`ppanel-${t.id}`} aria-labelledby={`ptab-${t.id}`} hidden={active !== t.id}>
          {t.content}
        </div>
      ))}
    </div>
  );
}
