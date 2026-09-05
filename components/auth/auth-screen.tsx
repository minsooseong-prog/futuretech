import { AuthPanel, type AuthTab } from './auth-panel';
import { Wordmark } from './wordmark';

/**
 * Landing layout: the form sits left on a quiet field of white, the wordmark
 * fills the right. On mobile the wordmark moves above the form so the marker
 * stroke is still the first thing you see.
 */
export function AuthScreen({ initialTab }: { initialTab: AuthTab }) {
  return (
    <main className="grid min-h-dvh grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <div className="order-2 flex items-center justify-center px-6 py-12 sm:px-12 lg:order-1 lg:px-20">
        <AuthPanel initialTab={initialTab} />
      </div>

      <div className="order-1 flex items-center justify-center border-line px-6 pt-16 lg:order-2 lg:border-l lg:px-16 lg:pt-0">
        <div className="w-full max-w-xl">
          <Wordmark className="block text-[clamp(3.5rem,11vw,8.5rem)]" />
          <p
            className="mt-6 max-w-xs animate-rise text-sm leading-relaxed text-subtle opacity-0"
            style={{ animationDelay: '900ms', animationFillMode: 'forwards' }}
          >
            미래공학 학급 커뮤니티.
            <br />
            사진, 이야기, 일정을 한곳에 모읍니다.
          </p>
        </div>
      </div>
    </main>
  );
}
