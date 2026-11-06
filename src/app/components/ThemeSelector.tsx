'use client';

import { isThemePreference } from '@/lib/theme';
import { useTheme } from './ThemeProvider';

export default function ThemeSelector() {
  const { preference, setPreference, error } = useTheme();
  return (
    <div className="relative shrink-0">
      <select
        aria-label="Colour theme"
        className="fm-field w-auto text-xs"
        value={preference}
        onChange={(event) => {
          if (isThemePreference(event.target.value)) setPreference(event.target.value);
        }}
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
      {error && (
        <p role="alert" className="absolute right-0 top-full mt-2 w-56 rounded-md border border-[var(--color-danger-soft-border)] bg-[var(--color-dark)] p-3 text-xs text-[var(--color-danger-soft-text)]">
          {error}
        </p>
      )}
    </div>
  );
}
