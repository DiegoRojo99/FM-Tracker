import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { GradientButton } from './GradientButton';
import { Button } from './ui';

vi.mock('react-native', () => ({
  StyleSheet: { create: <T,>(styles: T) => styles },
  Pressable: ({ children, disabled, accessibilityLabel, accessibilityState }: {
    children: ReactNode; disabled?: boolean; accessibilityLabel?: string; accessibilityState?: { busy?: boolean };
  }) => <button disabled={disabled} aria-label={accessibilityLabel} aria-busy={accessibilityState?.busy}>{children}</button>,
  ActivityIndicator: () => <span role="progressbar" />,
  Text: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  View: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Image: 'img', ScrollView: 'div', RefreshControl: 'div',
}));
vi.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children: ReactNode }) => <div data-gradient="true">{children}</div>,
}));
vi.mock('@expo/vector-icons/Ionicons', () => ({ default: () => <span>Action icon</span> }));
vi.mock('react-native-safe-area-context', () => ({ SafeAreaView: 'div' }));

describe('shared mobile gradient button', () => {
  it('keeps the label visible while replacing the icon and disabling interaction when busy', () => {
    const icon = <span>Action icon</span>;
    const idle = renderToStaticMarkup(<GradientButton title="Save season" icon={icon} onPress={vi.fn()} />);
    expect(idle).toContain('Action icon');
    expect(idle).not.toContain('role="progressbar"');
    const busy = renderToStaticMarkup(<GradientButton title="Save season" icon={icon} busy onPress={vi.fn()} />);
    expect(busy).toContain('Save season');
    expect(busy).toContain('disabled=""');
    expect(busy).toContain('aria-busy="true"');
    expect(busy).toContain('role="progressbar"');
    expect(busy).not.toContain('Action icon');
  });

  it('upgrades existing primary buttons without changing secondary or disabled behavior', () => {
    const primary = renderToStaticMarkup(<Button title="Create save" onPress={vi.fn()} icon="add-outline" disabled />);
    expect(primary).toContain('data-gradient="true"');
    expect(primary).toContain('disabled=""');
    expect(primary).toContain('Action icon');
    const secondary = renderToStaticMarkup(<Button title="Cancel" onPress={vi.fn()} secondary />);
    expect(secondary).not.toContain('data-gradient');
    expect(secondary).not.toContain('disabled=""');
  });
});
