import { describe, expect, it } from 'vitest';
import { apiError, badRequest, forbidden, notFound, ok, success, unauthorized } from '../response';

describe('api response helpers', () => {
  it('returns a success payload for ok', async () => {
    const response = ok({ hello: 'world' });
    const payload = await response.json();

    expect(payload).toEqual({ hello: 'world' });
    expect(response.status).toBe(200);
  });

  it('wraps payloads in success envelope', async () => {
    const response = success({ id: 1 });
    const payload = await response.json();

    expect(payload).toEqual({ success: true, data: { id: 1 } });
  });

  it('returns the right error statuses', async () => {
    const bad = badRequest('bad input');
    const unauth = unauthorized('missing token');
    const forbid = forbidden('no access');
    const missing = notFound('item missing');
    const error = apiError('server issue', 503);

    expect((await bad.json()).error).toBe('bad input');
    expect(bad.status).toBe(400);
    expect((await unauth.json()).error).toBe('missing token');
    expect(unauth.status).toBe(401);
    expect((await forbid.json()).error).toBe('no access');
    expect(forbid.status).toBe(403);
    expect((await missing.json()).error).toBe('item missing');
    expect(missing.status).toBe(404);
    expect((await error.json()).error).toBe('server issue');
    expect(error.status).toBe(503);
  });
});
