import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';
import { isThemePreference, resolveTheme, themeInitializationScript } from './theme';

describe('theme preferences', () => {
  it.each(['light', 'dark', 'system'])('accepts %s', (value) => {
    expect(isThemePreference(value)).toBe(true);
  });

  it.each([null, undefined, '', 'invalid', {}, 1])('rejects invalid preference %s', (value) => {
    expect(isThemePreference(value)).toBe(false);
  });

  it.each([
    ['light', true, 'light'], ['light', false, 'light'],
    ['dark', true, 'dark'], ['dark', false, 'dark'],
    ['system', true, 'dark'], ['system', false, 'light'],
  ] as const)('resolves %s with system dark=%s to %s', (preference, systemDark, expected) => {
    expect(resolveTheme(preference, systemDark)).toBe(expected);
  });
});

describe('pre-paint theme initialization', () => {
  function initialize(stored: string | null, systemDark: boolean, storageError = false) {
    const dataset: Record<string, string> = {};
    const setAttribute = vi.fn();
    const logError = vi.fn();
    runInNewContext(themeInitializationScript, {
      localStorage: {
        getItem: () => {
          if (storageError) throw new Error('Storage blocked');
          return stored;
        },
      },
      matchMedia: () => ({ matches: systemDark }),
      document: {
        documentElement: { dataset },
        querySelector: () => ({ setAttribute }),
      },
      console: { error: logError },
    });
    return { dataset, setAttribute, logError };
  }

  it.each([
    [null, false, 'system', 'light'],
    [null, true, 'system', 'dark'],
    ['light', true, 'light', 'light'],
    ['dark', false, 'dark', 'dark'],
    ['system', true, 'system', 'dark'],
    ['invalid', false, 'system', 'light'],
  ])('initializes stored=%s system dark=%s before rendering', (stored, systemDark, preference, theme) => {
    const { dataset, setAttribute } = initialize(stored, systemDark);
    expect(dataset).toEqual({ theme, themePreference: preference });
    expect(setAttribute).toHaveBeenCalledWith('content', theme === 'dark' ? '#0a0f1e' : '#e6e6fa');
  });

  it('logs unavailable storage and still applies the system theme', () => {
    const { dataset, logError } = initialize(null, true, true);
    expect(dataset).toEqual({ theme: 'dark', themePreference: 'system' });
    expect(logError).toHaveBeenCalledOnce();
  });
});
