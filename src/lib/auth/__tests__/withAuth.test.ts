import { describe, expect, it, vi } from 'vitest';
import { withAuth } from '../withAuth';
import { NextRequest } from 'next/server';

describe('withAuth', () => {
  it('returns 401 when authorization header is missing', async () => {
    const req = new NextRequest('http://localhost/api/test');
    const response = await withAuth(req, async () => new Response('ok'));

    expect(response.status).toBe(401);
  });

  it('returns 403 when admin is required and token is not admin', async () => {
    const req = new NextRequest('http://localhost/api/test', {
      headers: { authorization: 'Bearer test-token' },
    });

    const response = await withAuth(req, async () => new Response('ok'), {
      requireAdmin: true,
      verifyToken: async () => ({ uid: 'user-1', admin: false }),
    });

    expect(response.status).toBe(403);
  });

  it('calls the handler when the token is valid', async () => {
    const req = new NextRequest('http://localhost/api/test', {
      headers: { authorization: 'Bearer test-token' },
    });

    const handler = vi.fn(async () => new Response('ok'));
    const response = await withAuth(req, handler, {
      verifyToken: async () => ({ uid: 'user-1', admin: true }),
    });

    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalledWith('user-1');
  });
});
