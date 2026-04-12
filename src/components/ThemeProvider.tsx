'use client';

import { useEffect } from 'react';

/**
 * ThemeProvider — applies saved theme class on mount.
 * Uses the same localStorage key as useTheme hook.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const stored = localStorage.getItem('k-man-theme');
    const root = document.documentElement;

    if (stored === 'dark') {
      root.classList.add('dark');
    } else if (stored === 'light') {
      root.classList.remove('dark');
    } else {
      // System preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      }
    }
  }, []);

  return <>{children}</>;
}
