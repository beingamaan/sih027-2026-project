import { useState, useEffect, useCallback } from 'react';

export function useApi<T>(apiFunc: () => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFunc();
      setData(result);
    } catch (err: any) {
      console.error('API call failed:', err);
      setError(err?.response?.data?.error?.message || err?.message || 'Unable to connect to service. Ensure FastAPI backend is running on port 8000.');
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, loading, error, refetch: execute };
}
