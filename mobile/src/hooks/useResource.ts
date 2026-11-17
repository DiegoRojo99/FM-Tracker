import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useApi } from '../auth/AuthProvider';
import type { ApiClient } from '../lib/api';

export function useResource<T>(load: (api: ApiClient) => Promise<T>) {
  const api = useApi();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const sequence = useRef(0);
  const refresh = useCallback(() => setRefreshKey(value => value + 1), []);

  useEffect(() => {
    return () => { sequence.current++; };
  }, []);

  useFocusEffect(useCallback(() => {
    const current = ++sequence.current;
    setLoading(true);
    setError(null);
    load(api)
      .then(result => { if (sequence.current === current) setData(result); })
      .catch((err: unknown) => {
        if (sequence.current === current) {
          setError(err instanceof Error ? err.message : 'Unable to load data. Please try again.');
        }
      })
      .finally(() => { if (sequence.current === current) setLoading(false); });
    return () => { sequence.current++; };
  }, [api, load, refreshKey]));

  return { data, loading, error, refresh };
}
