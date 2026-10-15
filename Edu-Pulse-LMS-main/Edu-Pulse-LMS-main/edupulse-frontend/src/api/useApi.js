import { useCallback, useEffect, useState } from 'react';
import { api } from './client';

export function useApi(path, enabled = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(enabled && path));
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!enabled || !path) return;
    setLoading(true);
    setError('');
    try {
      setData(await api.get(path));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [path, enabled]);

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load };
}