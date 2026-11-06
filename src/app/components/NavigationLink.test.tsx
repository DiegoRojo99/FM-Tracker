import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import NavigationLink from './NavigationLink';
import Navbar from './NavBar';

const navigation = vi.hoisted(() => ({ pathname: '/saves' as string | null }));

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock('./AuthProvider', () => ({
  useAuth: () => ({ user: null }),
}));
vi.mock('../../lib/db/firebase', () => ({ auth: {} }));
vi.mock('firebase/auth', () => ({ signOut: vi.fn() }));

describe('active navigation', () => {
  it.each([
    ['/saves', '/saves', true],
    ['/saves/career-1', '/saves', true],
    ['/challenges/league-title', '/challenges', true],
    ['/admin/teams', '/admin', true],
    ['/profile/user-1', '/profile', true],
    ['/friends', '/friends', true],
    ['/add-save', '/add-save', true],
    ['/login', '/login', true],
    ['/saves-other', '/saves', false],
    ['/trophies', '/saves', false],
    ['/', '/saves', false],
    [null, '/saves', false],
  ])('matches %s against %s without false prefixes', (pathname, href, active) => {
    navigation.pathname = pathname;
    const html = renderToStaticMarkup(
      <NavigationLink href={href} className="mobile-menu-item" style={{ animationDelay: '40ms' }}>
        Destination
      </NavigationLink>
    );
    expect(html.includes('aria-current="page"')).toBe(active);
    expect(html).toContain('fm-nav-link mobile-menu-item');
    expect(html).toContain('animation-delay:40ms');
    expect(html).toContain(`href="${href}"`);
  });

  it.each(['/saves', '/saves/career-1', '/trophies', '/challenges/league-title', '/achievements', '/login'])(
    'marks exactly one desktop destination on %s',
    pathname => {
      navigation.pathname = pathname;
      const html = renderToStaticMarkup(<Navbar />);
      expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    }
  );
});
