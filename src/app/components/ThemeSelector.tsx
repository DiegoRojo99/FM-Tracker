'use client';

import { isThemePreference } from '@/lib/theme';
import { useTheme } from './ThemeProvider';

export default function ThemeSelector() {
  const { preference, setPreference, error } = useTheme();
  return (
    <div className="space-y-3">
      <label htmlFor="colour-theme" className="block text-sm font-semibold text-[var(--color-foreground)]">
        Colour theme
      </label>
      <select
        id="colour-theme"
        aria-describedby="colour-theme-description"
        className="fm-field"
        value={preference}
        onChange={(event) => {
          if (isThemePreference(event.target.value)) setPreference(event.target.value);
        }}
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
      <p id="colour-theme-description" className="text-sm text-[var(--color-text-muted)]">
        System follows your device appearance. Your choice is saved in this browser.
      </p>
      {error && (
        <p role="alert" className="rounded-md border border-[var(--color-danger-soft-border)] bg-[var(--color-dark)] p-3 text-sm text-[var(--color-danger-soft-text)]">
          {error}
        </p>
      )}
    </div>
  );
}
