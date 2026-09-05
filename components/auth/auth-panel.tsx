'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from './login-form';
import { RegisterForm } from './register-form';
import { cn } from '@/lib/utils/cn';

export type AuthTab = 'login' | 'register';

export function AuthPanel({ initialTab = 'login' }: { initialTab?: AuthTab }) {
  const [tab, setTab] = useState<AuthTab>(initialTab);
  const router = useRouter();

  function select(next: AuthTab) {
    setTab(next);
    // Keep the address bar honest without a full navigation.
    window.history.replaceState(null, '', next === 'login' ? '/login' : '/register');
    router.prefetch(next === 'login' ? '/register' : '/login');
  }

  return (
    <div className="w-full max-w-sm">
      <div
        role="tablist"
        aria-label="로그인 또는 회원가입"
        className="mb-8 inline-flex gap-6 border-b border-line"
      >
        {(
          [
            ['login', '로그인'],
            ['register', '회원가입'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            role="tab"
            type="button"
            id={`tab-${value}`}
            aria-selected={tab === value}
            aria-controls={`panel-${value}`}
            onClick={() => select(value)}
            className={cn(
              '-mb-px border-b-2 pb-2.5 text-[15px] transition-colors',
              tab === value
                ? 'border-ink font-semibold text-ink'
                : 'border-transparent text-faint hover:text-subtle',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} key={tab}>
        {tab === 'login' ? (
          <LoginForm onSwitch={() => select('register')} />
        ) : (
          <RegisterForm onSwitch={() => select('login')} />
        )}
      </div>
    </div>
  );
}
