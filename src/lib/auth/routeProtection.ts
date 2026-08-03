export type RouteAccessLevel = 'public' | 'user' | 'admin';

const PUBLIC_PREFIXES = ['/login', '/_next', '/favicon.ico', '/manifest.json'];
const USER_PREFIXES = ['/saves', '/add-save', '/challenges', '/friends', '/profile', '/achievements', '/trophies'];
const ADMIN_PREFIXES = ['/admin'];
const USER_API_PREFIXES = ['/api/saves', '/api/friends', '/api/challenges', '/api/trophies', '/api/achievements', '/api/users'];
const ADMIN_API_PREFIXES = ['/api/admin'];

export function getRouteAccess(pathname: string): RouteAccessLevel {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;

  if (PUBLIC_PREFIXES.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`))) {
    return 'public';
  }

  if (ADMIN_PREFIXES.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`))) {
    return 'admin';
  }

  if (ADMIN_API_PREFIXES.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`))) {
    return 'admin';
  }

  if (USER_PREFIXES.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`))) {
    return 'user';
  }

  if (USER_API_PREFIXES.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`))) {
    return 'user';
  }

  return 'public';
}
