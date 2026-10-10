import type { Config } from 'tailwindcss';

const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: token('canvas'),
        ink: token('ink'),
        muted: token('muted'),
        line: token('line'),
        card: token('card'),
        subtle: token('subtle'),
        accent: token('accent'),
        accentfg: token('accent-fg'),
        danger: token('danger'),
      },
      fontFamily: {
        sans: ['"Pretendard Variable"', 'Pretendard', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        hand: ['var(--font-hand)', 'cursive'],
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        reveal: {
          from: { clipPath: 'inset(0 100% 0 0)' },
          to: { clipPath: 'inset(0 0 0 0)' },
        },
        draw: {
          from: { strokeDashoffset: '600' },
          to: { strokeDashoffset: '0' },
        },
        drift: {
          '0%, 100%': { transform: 'rotate(-3deg) translateY(0)' },
          '50%': { transform: 'rotate(-2.4deg) translateY(-4px)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.6s ease-out both',
        reveal: 'reveal 1.4s cubic-bezier(0.65, 0, 0.35, 1) 0.2s both',
        draw: 'draw 1.1s ease-out 1.4s both',
        drift: 'drift 7s ease-in-out 2s infinite',
      },
    },
  },
  plugins: [],
};

export default config;
