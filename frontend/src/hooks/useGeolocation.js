import { useCallback, useState } from 'react';

/**
 * Ambil lokasi user dari browser (navigator.geolocation).
 * Dipake halaman Darurat & Home Visit. Browser cuma ngizinin
 * geolocation di https atau localhost.
 */
export function useGeolocation() {
  const [coords, setCoords] = useState(null);
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'ok' | 'error'
  const [error, setError] = useState('');

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('error');
      setError('Browser kamu tidak mendukung deteksi lokasi.');
      return;
    }
    setStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus('ok');
      },
      (err) => {
        setStatus('error');
        setError(
          err.code === err.PERMISSION_DENIED
            ? 'Izin lokasi ditolak. Aktifkan izin lokasi di browser.'
            : 'Gagal mendeteksi lokasi.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return { coords, setCoords, status, error, locate };
}
