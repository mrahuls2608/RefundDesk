'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { applyTheme, currentTheme, type Theme } from '@/lib/theme';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setTheme(currentTheme()), []);
  const next: Theme = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      type="button"
      onClick={() => {
        applyTheme(next);
        setTheme(next);
      }}
      aria-label={`Switch to ${next} theme`}
      className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-md text-text-muted hover:bg-primary-50 hover:text-text"
    >
      {theme === 'dark' ? <Sun aria-hidden="true" className="h-5 w-5" /> : <Moon aria-hidden="true" className="h-5 w-5" />}
    </button>
  );
}
