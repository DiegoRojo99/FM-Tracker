export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

type TokenProvider = { getIdToken: (forceRefresh?: boolean) => Promise<string> };

export function createApiClient(baseUrl: string, user: TokenProvider, fetcher: typeof fetch = fetch) {
  return async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      let response: Response | undefined;
      for (let attempt = 0; attempt < 2; attempt++) {
        const token = await user.getIdToken(attempt === 1);
        const headers = new Headers(options.headers);
        headers.set('Authorization', `Bearer ${token}`);
        if (options.body) headers.set('Content-Type', 'application/json');
        response = await fetcher(`${baseUrl}${path}`, {
          ...options,
          headers,
          signal: controller.signal,
        });
        if (response.status !== 401) break;
      }

      if (!response) throw new Error('No response from FM Tracker.');
      if (!response.ok) {
        const body = await response.text();
        // Only this endpoint uses 404 to represent an empty collection.
        if (path === '/api/saves' && response.status === 404 && body === 'No saves found') {
          return [] as T;
        }
        if (response.status === 401) {
          throw new ApiError('Your session has expired. Sign out and sign in again.', 401);
        }
        let message = body;
        if (body.startsWith('{')) {
          const parsed: { error?: string } = JSON.parse(body);
          message = parsed.error || body;
        }
        throw new ApiError(
          message && !message.startsWith('<') ? message : `Request failed (${response.status}). Please try again.`,
          response.status,
        );
      }
      return await response.json() as T;
    } catch (error) {
      if (controller.signal.aborted) {
        throw new Error('The server took too long to respond. Check your connection and try again.');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
