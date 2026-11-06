export type ThemePreference = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'fm-tracker-theme';

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function resolveTheme(preference: ThemePreference, systemDark: boolean): 'light' | 'dark' {
  return preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;
}

// Runs before the first paint; keep this self-contained for inline execution.
export const themeInitializationScript = `
(() => {
  let preference = 'system';
  try {
    const stored = localStorage.getItem('fm-tracker-theme');
    if (stored === 'light' || stored === 'dark' || stored === 'system') preference = stored;
  } catch (error) {
    console.error('Unable to read theme preference:', error);
  }
  const theme = preference === 'system'
    ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : preference;
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.themePreference = preference;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0a0f1e' : '#e6e6fa');
})();
`;
