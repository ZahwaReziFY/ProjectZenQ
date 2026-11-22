import { useCallback, useEffect, useState } from 'react';
import api from '../utils/api';

/**
 * Hook GET data generik: const { data, loading, error, refetch } = useFetch('/doctors');
 * Kirim path null kalo belum mau fetch (misal nunggu input user / belum login).
 */
export function useFetch(path) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState('');

  const refetch = useCallback(async () => {
    if (!path) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.get(path);
      setData(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch, setData };
}
