export class ChantRequestError extends Error {
  constructor(message: string, public readonly status: number, public readonly code: string, public readonly requestId: string | null = null) {
    super(message);
  }
}

/** Per-client coalescing also covers Strict Mode's effect replay. No response cache. */
export function createChantTransport(
  baseUrl: string,
  getToken: () => Promise<string | null | undefined>,
  requestFetch: typeof fetch = fetch,
) {
  const pending = new Map<string, Promise<unknown>>();
  return async function request<T>(path: string, body?: unknown, method = body === undefined ? 'GET' : 'POST'): Promise<T> {
    const token = await getToken();
    if (!token) throw new ChantRequestError('Please sign in to save your chanting practice.', 401, 'AUTH_REQUIRED');
    const requestPath = method === 'GET' && path === '/me' ? '/me?page=0' : path;
    const key = `${token}:${requestPath}`;
    const shared = method === 'GET' ? pending.get(key) : undefined;
    if (shared) return shared as Promise<T>;
    const operation = (async () => {
      let response: Response;
      try { response = await requestFetch(`${baseUrl}/api/chant${requestPath}`, {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      }); } catch { throw new ChantRequestError('Unable to reach Chant. Check your connection and retry.', 0, 'NETWORK_ERROR'); }
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message = result && typeof result === 'object' && 'error' in result && typeof result.error === 'string'
          ? result.error : `Chant request failed (${response.status}). Please retry.`;
        const code = result && typeof result === 'object' && 'code' in result && typeof result.code === 'string' ? result.code : 'HTTP_ERROR';
        const privateUnavailable = code === 'CHANT_NOT_CONFIGURED' || code === 'AUTH_NOT_CONFIGURED';
        throw new ChantRequestError(privateUnavailable
          ? 'Saved practice, history and favourites are unavailable because the secure account service is not configured. You can still browse mantras, translations and audio.'
          : message, response.status, code, response.headers.get('X-Request-ID'));
      }
      if (result === null) throw new Error('The Chant service returned an invalid response. Please retry.');
      return result as T;
    })();
    if (method !== 'GET') return operation;
    pending.set(key, operation);
    try { return await operation; }
    finally { if (pending.get(key) === operation) pending.delete(key); }
  };
}
