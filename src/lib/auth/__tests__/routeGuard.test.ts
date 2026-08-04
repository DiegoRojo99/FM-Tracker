import { describe, expect, it, vi } from 'vitest';
import { getRouteAccess } from '../routeProtection';

describe('route access policy', () => {
  it('treats admin routes as admin-only', () => {
    expect(getRouteAccess('/admin')).toBe('admin');
    expect(getRouteAccess('/admin/stats')).toBe('admin');
  });

  it('treats authenticated pages as user-only', () => {
    expect(getRouteAccess('/saves')).toBe('user');
    expect(getRouteAccess('/friends')).toBe('user');
  });

  it('keeps auth pages and the home page public', () => {
    expect(getRouteAccess('/login')).toBe('public');
    expect(getRouteAccess('/')).toBe('public');
  });
});
