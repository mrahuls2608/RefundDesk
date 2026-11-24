import type { Config } from 'tailwindcss';

/** Every value maps to a design token in src/app/tokens.css (Design.md §3). No raw colours in components. */
const token = (name: string) => `var(--${name})`;

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        primary: { 50: token('color-primary-50'), 600: token('color-primary-600'), 700: token('color-primary-700') },
        accent: { DEFAULT: token('color-accent'), strong: token('color-accent-strong'), on: token('color-on-accent') },
        forest: {
          800: token('color-forest-800'),
          900: token('color-forest-900'),
          950: token('color-forest-950'),
          line: token('color-forest-line'),
          on: token('color-on-forest'),
          muted: token('color-on-forest-muted'),
          glass: token('color-forest-glass'),
        },
        bg: token('color-bg'),
        surface: token('color-surface'),
        border: { DEFAULT: token('color-border'), strong: token('color-border-strong') },
        text: { DEFAULT: token('color-text'), muted: token('color-text-muted'), inverse: token('color-text-inverse') },
        success: { 50: token('color-success-50'), 700: token('color-success-700') },
        warning: { 50: token('color-warning-50'), 700: token('color-warning-700') },
        danger: { 50: token('color-danger-50'), 700: token('color-danger-700') },
        info: { 50: token('color-info-50'), 700: token('color-info-700') },
        ai: { 50: token('color-ai-50'), 700: token('color-ai-700') },
        glass: token('color-glass'),
        overlay: token('color-overlay'),
      },
      transitionTimingFunction: {
        out: token('ease-out'),
        'in-out': token('ease-in-out'),
        drawer: token('ease-drawer'),
      },
      keyframes: {
        rise: {
          from: { opacity: '0', transform: 'translateY(40%)', filter: 'blur(8px)' },
          to: { opacity: '1', transform: 'translateY(0)', filter: 'blur(0)' },
        },
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        'fade-up': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        drift: { from: { transform: 'translateY(0) rotate(0deg)' }, to: { transform: 'translateY(-24px) rotate(6deg)' } },
        'ring-pulse': { from: { transform: 'scale(0.6)', opacity: '0.6' }, to: { transform: 'scale(1.5)', opacity: '0' } },
        dash: { to: { strokeDashoffset: '-56' } },
        glow: { '0%, 100%': { transform: 'scale(0.9)' }, '50%': { transform: 'scale(1.1)' } },
      },
      animation: {
        rise: 'rise 900ms var(--ease-drawer) both',
        marquee: 'marquee 40s linear infinite',
        'fade-up': 'fade-up 300ms var(--ease-out) both',
        float: 'float 6s var(--ease-in-out) infinite',
        drift: 'drift 18s var(--ease-in-out) infinite alternate',
        'ring-pulse': 'ring-pulse 3.6s var(--ease-out) infinite',
        dash: 'dash 2.4s linear infinite',
        glow: 'glow 4s var(--ease-in-out) infinite',
        'spin-slow': 'spin 60s linear infinite',
      },
      boxShadow: { sm: token('shadow-sm'), lg: token('shadow-lg'), glow: token('shadow-glow') },
      fontFamily: {
        sans: ['"Inter Variable"', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono Variable"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        display: ['2rem', { lineHeight: '2.5rem', fontWeight: '700' }],
        h1: ['1.5rem', { lineHeight: '2rem', fontWeight: '600' }],
        h2: ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        h3: ['1rem', { lineHeight: '1.5rem', fontWeight: '600' }],
        body: ['0.9375rem', { lineHeight: '1.5rem' }],
        small: ['0.8125rem', { lineHeight: '1.25rem' }],
        caption: ['0.75rem', { lineHeight: '1rem', fontWeight: '500' }],
      },
      borderRadius: { sm: token('radius-sm'), md: token('radius-md'), lg: token('radius-lg'), full: token('radius-full') },
      transitionDuration: { fast: '120ms', base: '200ms' },
      maxWidth: { content: '720px' },
      width: { sidebar: '240px' },
      minHeight: { touch: '44px' },
      minWidth: { touch: '44px' },
    },
  },
  plugins: [],
};

export default config;
