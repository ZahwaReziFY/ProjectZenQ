import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Kamera browser (getUserMedia) buat Scan Obat.
 * const { videoRef, active, error, open, close, snap } = useCamera();
 *  - open()  : nyalain kamera belakang
 *  - snap()  : ambil foto -> balikin dataURL JPEG, kamera otomatis mati
 * Browser cuma ngizinin kamera di https atau localhost.
 */
export function useCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState('');

  const close = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setActive(false);
  }, []);

  const open = useCallback(async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setActive(true);
    } catch (err) {
      setError(
        'Kamera tidak dapat dibuka (izin ditolak atau perangkat tidak mendukung). ' +
          'Pakai tombol "Kamera Bawaan Perangkat" atau pilih dari galeri.'
      );
    }
  }, []);

  // Sambungin stream ke <video> setelah elemennya ke-render
  useEffect(() => {
    if (active && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [active]);

  const snap = useCallback(() => {
    const v = videoRef.current;
    if (!v) return null;
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth || 640;
    canvas.height = v.videoHeight || 480;
    canvas.getContext('2d').drawImage(v, 0, 0);
    const photo = canvas.toDataURL('image/jpeg', 0.85);
    close();
    return photo;
  }, [close]);

  useEffect(() => close, [close]); // matiin kamera pas pindah halaman

  return { videoRef, active, error, open, close, snap };
}
