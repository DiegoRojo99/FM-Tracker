import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { AppNavigator } from './navigation';

const state = vi.hoisted(() => ({
  user: null as { uid: string } | null,
  loading: false,
  error: null as string | null,
  retry: vi.fn(),
}));

vi.mock('./auth/AuthProvider', () => ({ useAuth: () => state, logout: vi.fn() }));
vi.mock('react-native', () => ({ ActivityIndicator: 'progress', Text: 'span', View: 'div' }));
vi.mock('./components/ui', () => ({ Button: ({ title }: { title: string }) => <button>{title}</button>, Icon: () => null }));
vi.mock('./theme', () => ({ colors: {}, styles: {} }));
vi.mock('./screens/LoginScreen', () => ({ LoginScreen: () => <div>Login required</div> }));
vi.mock('./screens/SavesScreen', () => ({ SavesScreen: () => null }));
vi.mock('./screens/CreateSaveScreen', () => ({ CreateSaveScreen: () => null }));
vi.mock('./screens/SaveDetailsScreen', () => ({ SaveDetailsScreen: () => null }));
vi.mock('./screens/SaveEntryScreen', () => ({ SaveEntryScreen: () => null }));
vi.mock('./screens/ChallengesScreen', () => ({ ChallengesScreen: () => null }));
vi.mock('./screens/AchievementsScreen', () => ({ AchievementsScreen: () => null }));
vi.mock('./screens/TrophiesScreen', () => ({ TrophiesScreen: () => null }));
vi.mock('./screens/ProfileScreen', () => ({ ProfileScreen: () => null }));
vi.mock('@react-navigation/native', () => ({
  DarkTheme: { colors: {} },
  NavigationContainer: ({ children }: { children: React.ReactNode }) => <div data-protected="true">{children}</div>,
}));
vi.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({ Navigator: 'div', Screen: 'div' }),
}));
vi.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }: { children: React.ReactNode }) => <nav>{children}</nav>,
    Screen: ({ name }: { name: string }) => <span>{name}</span>,
  }),
}));

describe('authentication gate', () => {
  it('does not mount any protected navigation while restoring a session', () => {
    Object.assign(state, { loading: true, user: null, error: null });
    const html = renderToStaticMarkup(<AppNavigator />);
    expect(html).toContain('Loading your career');
    expect(html).not.toContain('data-protected');
  });

  it('requires login before showing tabs', () => {
    Object.assign(state, { loading: false, user: null, error: null });
    const html = renderToStaticMarkup(<AppNavigator />);
    expect(html).toContain('Login required');
    expect(html).not.toContain('data-protected');
  });

  it('keeps tabs inaccessible if account setup fails', () => {
    Object.assign(state, { loading: false, user: null, error: 'Server unavailable' });
    const html = renderToStaticMarkup(<AppNavigator />);
    expect(html).toContain('Server unavailable');
    expect(html).not.toContain('data-protected');
  });

  it('mounts all five tabs for an authenticated account and removes them on logout', () => {
    Object.assign(state, { loading: false, user: { uid: 'manager-1' }, error: null });
    const html = renderToStaticMarkup(<AppNavigator />);
    for (const tab of ['Saves', 'Challenges', 'Achievements', 'Trophies', 'Profile']) {
      expect(html).toContain(`>${tab}<`);
    }
    state.user = null;
    const signedOut = renderToStaticMarkup(<AppNavigator />);
    expect(signedOut).toContain('Login required');
    expect(signedOut).not.toContain('data-protected');
  });
});
