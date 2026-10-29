import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChantMe } from '../../lib/chant';

/** Shared transport owns the request; each mounted view owns its response lifecycle. */
export function useChantHistory(
  uid: string | null,
  page: number,
  revision: number,
  load: (path: string) => Promise<ChantMe>,
  currentUid: () => string | null | undefined,
  enabled = true,
) {
  const [me, setMe] = useState<ChantMe | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(enabled);
  const generation = useRef(0);
  const mounted = useRef(false);
  const clear = useCallback(() => { generation.current++; setMe(null); }, []);
  const refresh = useCallback(async () => {
    const request = ++generation.current;
    const current = () => mounted.current && request === generation.current && currentUid() === uid;
    setError(''); setLoading(true);
    if (!uid) {
      setMe(null); setError('Sign in to view your chant history.'); setLoading(false);
      return null;
    }
    try {
      const result = await load(`/me?page=${page}`);
      if (current()) setMe(result);
      return result;
    } catch (cause) {
      if (current()) { setMe(null); setError(cause instanceof Error ? cause.message : 'Unable to load chant history.'); }
      throw cause;
    } finally { if (current()) setLoading(false); }
  }, [uid, page, load, currentUid]);
  useEffect(() => {
    mounted.current = true;
    setMe(null);
    setError('');
    setLoading(enabled);
    if (enabled) void refresh().catch(() => { /* refresh exposes the error in this view. */ });
    return () => { mounted.current = false; generation.current++; };
  }, [refresh, revision, enabled]);
  return { me, error, loading, refresh, clear };
}
