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
        bg: token('color-bg'),
        surface: token('color-surface'),
        border: { DEFAULT: token('color-border'), strong: token('color-border-strong') },
        text: { DEFAULT: token('color-text'), muted: token('color-text-muted'), inverse: token('color-text-inverse') },
        success: { 50: token('color-success-50'), 700: token('color-success-700') },
        warning: { 50: token('color-warning-50'), 700: token('color-warning-700') },
        danger: { 50: token('color-danger-50'), 700: token('color-danger-700') },
        info: { 50: token('color-info-50'), 700: token('color-info-700') },
        ai: { 50: token('color-ai-50'), 700: token('color-ai-700') },
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
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
      boxShadow: { sm: token('shadow-sm'), lg: token('shadow-lg') },
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
