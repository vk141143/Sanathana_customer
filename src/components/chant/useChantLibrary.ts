import { useEffect, useState } from 'react';
import type { ChantType } from '../../lib/chant';
import type { ChantLibraryResult } from '../../lib/chantCatalog';

/** Public catalogue state is independent of Firebase and private account requests. */
export function useChantLibrary(
  load: (search: string, category: string, page: number, mantraType?: ChantType | '', language?: string) => Promise<ChantLibraryResult>,
  search: string,
  category: string,
  page: number,
  revision: number,
  mantraType: ChantType | '' = '',
  language = '',
) {
  const [data, setData] = useState<ChantLibraryResult>({ chants: [], categories: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    const timer = setTimeout(() => {
      void load(search, category, page, mantraType, language)
        .then(result => { if (alive) setData(result); })
        .catch(cause => { if (alive) setError(cause instanceof Error ? cause.message : 'Unable to load published mantras. Please retry.'); })
        .finally(() => { if (alive) setLoading(false); });
    }, 200);
    return () => { alive = false; clearTimeout(timer); };
  }, [load, search, category, page, revision, mantraType, language]);
  return { ...data, loading, error };
}
