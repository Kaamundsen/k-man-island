'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export default function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className="w-full flex items-center justify-between px-4 py-3 bg-muted rounded-xl hover:bg-muted/80 transition-colors"
    >
      <div className="flex items-center gap-3">
        {isDark ? (
          <Moon className="w-5 h-5 text-muted-foreground" />
        ) : (
          <Sun className="w-5 h-5 text-amber-500" />
        )}
        <span className="text-sm font-medium text-foreground">
          {isDark ? 'Dark modus' : 'Lys modus'}
        </span>
      </div>
      <div
        className={`relative w-11 h-6 rounded-full transition-colors ${
          isDark ? 'bg-brand-emerald' : 'bg-gray-300'
        }`}
      >
        <div
          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform ${
            isDark ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </div>
    </button>
  );
}
