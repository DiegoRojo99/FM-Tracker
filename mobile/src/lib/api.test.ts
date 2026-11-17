import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, createApiClient } from './api';

afterEach(() => vi.useRealTimers());

describe('mobile API client', () => {
  it('authenticates requests and refreshes the Firebase token once on a 401', async () => {
    const user = { getIdToken: vi.fn().mockResolvedValueOnce('expired').mockResolvedValueOnce('fresh') };
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('Unauthorized', { status: 401 }))
      .mockResolvedValueOnce(Response.json([{ id: 'save-1' }]));
    const api = createApiClient('https://fm.example', user, fetcher);

    await expect(api('/api/saves')).resolves.toEqual([{ id: 'save-1' }]);
    expect(fetcher.mock.calls[0][0]).toBe('https://fm.example/api/saves');
    expect(new Headers(fetcher.mock.calls[0][1]?.headers).get('Authorization')).toBe('Bearer expired');
    expect(new Headers(fetcher.mock.calls[1][1]?.headers).get('Authorization')).toBe('Bearer fresh');
    expect(user.getIdToken.mock.calls).toEqual([[false], [true]]);
  });

  it('treats only the saves endpoint empty-collection response as empty', async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('No saves found', { status: 404 }))
      .mockResolvedValueOnce(Response.json({ error: 'Save not found' }, { status: 404 }))
      .mockResolvedValueOnce(new Response('Route not found', { status: 404 }));
    const api = createApiClient('https://fm.example', { getIdToken: async () => 'token' }, fetcher);

    await expect(api('/api/saves')).resolves.toEqual([]);
    await expect(api('/api/saves/deleted')).rejects.toThrow('Save not found');
    await expect(api('/api/saves')).rejects.toThrow('Route not found');
  });

  it('surfaces expired sessions instead of returning empty data or retrying indefinitely', async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => new Response('Unauthorized', { status: 401 }));
    const api = createApiClient('https://fm.example', { getIdToken: async () => 'token' }, fetcher);

    await expect(api('/api/achievements')).rejects.toMatchObject({ status: 401, message: expect.stringContaining('session has expired') });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('sends account registration as JSON with authentication', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ success: true }));
    const api = createApiClient('https://fm.example', { getIdToken: async () => 'token' }, fetcher);
    await api('/api/users', { method: 'POST', body: JSON.stringify({ uid: 'manager-1' }) });

    const options = fetcher.mock.calls[0][1];
    expect(options?.method).toBe('POST');
    expect(new Headers(options?.headers).get('Content-Type')).toBe('application/json');
    expect(JSON.parse(String(options?.body))).toEqual({ uid: 'manager-1' });
  });

  it('surfaces network errors and server failures', async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockRejectedValueOnce(new TypeError('Network request failed'))
      .mockResolvedValueOnce(Response.json({ error: 'Failed to fetch achievements' }, { status: 500 }));
    const api = createApiClient('https://fm.example', { getIdToken: async () => 'token' }, fetcher);
    await expect(api('/api/trophies')).rejects.toThrow('Network request failed');
    await expect(api('/api/achievements')).rejects.toBeInstanceOf(ApiError);
  });

  it('aborts stalled requests and gives an actionable error', async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn<typeof fetch>().mockImplementation((_url, options) => new Promise((_resolve, reject) => {
      options?.signal?.addEventListener('abort', () => reject(new Error('Aborted')));
    }));
    const api = createApiClient('https://fm.example', { getIdToken: async () => 'token' }, fetcher);
    const result = expect(api('/api/saves')).rejects.toThrow('took too long');
    await vi.advanceTimersByTimeAsync(20000);
    await result;
  });
});
