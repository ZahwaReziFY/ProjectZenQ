import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '../utils/api';

/**
 * Cek backend hidup atau enggak lewat /health.
 * Dipake HealthBadge di footer biar tim gampang ngecek pas development.
 */
export function useHealthCheck() {
  const [status, setStatus] = useState('checking'); // 'checking' | 'ok' | 'error'
  const [data, setData] = useState(null);

  const checkHealth = useCallback(async () => {
    setStatus('checking');
    try {
      const result = await apiGet('/health');
      setData(result.data);
      setStatus('ok');
    } catch (err) {
      setData(null);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return { status, data, checkHealth };
}
