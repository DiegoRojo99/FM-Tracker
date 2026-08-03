import { describe, expect, it } from 'vitest';
import { getRouteAccess } from '../routeProtection';

describe('getRouteAccess', () => {
  it('marks admin routes as admin access', () => {
    expect(getRouteAccess('/admin')).toBe('admin');
    expect(getRouteAccess('/admin/stats')).toBe('admin');
  });

  it('marks user-facing routes as user access', () => {
    expect(getRouteAccess('/saves')).toBe('user');
    expect(getRouteAccess('/friends')).toBe('user');
  });

  it('marks public routes as public access', () => {
    expect(getRouteAccess('/login')).toBe('public');
    expect(getRouteAccess('/')).toBe('public');
  });
});
