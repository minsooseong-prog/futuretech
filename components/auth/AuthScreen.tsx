'use client';

import { useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { cn } from '@/lib/utils/cn';

type Tab = 'login' | 'register';

export function AuthScreen({ initialTab, notice }: { initialTab: Tab; notice?: string }) {
  const [tab, setTab] = useState<Tab>(initialTab);

  const switchTo = (next: Tab) => {
    setTab(next);
    window.history.replaceState(null, '', next === 'login' ? '/login' : '/register');
  };

  return (
    <main className="relative grid min-h-dvh grid-cols-1 overflow-hidden bg-canvas md:grid-cols-[minmax(22rem,30rem)_1fr]">
      {/* 오른쪽: 손글씨 워드마크 (모바일에서는 위쪽) */}
      <section
        aria-label="Future Tech"
        className="order-1 flex flex-col justify-end px-8 pb-6 pt-14 md:order-2 md:justify-center md:px-16 md:py-0"
      >
        <div className="relative w-fit animate-drift md:ml-auto md:mr-[6vw]">
          <h1
            className="animate-reveal select-none font-hand font-bold leading-[0.82] tracking-[-0.01em] text-ink"
            style={{ fontSize: 'clamp(4.5rem, 13vw, 12rem)' }}
          >
            Future
            <br />
            <span className="ml-[0.6em]">Tech</span>
          </h1>
          <svg
            viewBox="0 0 420 40"
            className="absolute -bottom-2 left-[18%] w-[78%] text-ink md:-bottom-4"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M4 26 C 90 14, 190 30, 290 18 S 400 16, 416 22"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray="600"
              className="animate-draw"
            />
          </svg>
        </div>
        <p className="mt-8 animate-fade-in text-sm text-muted [animation-delay:1.6s] md:ml-auto md:mr-[6vw]">
          미래공학 클래스 커뮤니티
        </p>
      </section>

      {/* 왼쪽: 로그인 / 회원가입 카드 */}
      <section className="order-2 flex items-start justify-center px-6 pb-16 pt-6 md:order-1 md:items-center md:border-r md:border-line md:px-12 md:py-16">
        <div className="w-full max-w-sm animate-fade-in">
          <div role="tablist" aria-label="로그인 또는 회원가입" className="mb-8 flex gap-6 border-b border-line">
            {(
              [
                ['login', '로그인'],
                ['register', '회원가입'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                id={`tab-${value}`}
                aria-selected={tab === value}
                aria-controls={`panel-${value}`}
                onClick={() => switchTo(value)}
                className={cn(
                  '-mb-px border-b-2 pb-3 text-[0.95rem] font-medium transition-colors',
                  tab === value ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {notice && (
            <p role="status" className="mb-6 rounded-lg bg-subtle px-3 py-2 text-sm">
              {notice}
            </p>
          )}

          <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} key={tab} className="animate-fade-in">
            {tab === 'login' ? <LoginForm /> : <RegisterForm />}
          </div>
        </div>
      </section>
    </main>
  );
}
