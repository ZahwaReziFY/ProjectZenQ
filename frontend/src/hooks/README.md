# hooks/

Custom hook buat misahin logic (ambil data, akses API browser) dari tampilan.

- `useFetch(path)` - GET data dari backend. Balikin `{ data, loading, error, refetch, setData }`.
  Kirim `null` kalo belum mau fetch.
- `useGeolocation()` - lokasi user dari browser. Balikin `{ coords, status, error, locate }`.
  Dipake halaman Darurat.
- `useCamera()` - kamera browser (getUserMedia) buat Scan Obat.
  Balikin `{ videoRef, active, error, open, close, snap }`.
- `useHealthCheck()` - cek status backend lewat `/health`.

Ide hook berikutnya: `useWebRTC` (video call/telepon beneran) dan
`useNotifications` (polling jumlah notifikasi belum dibaca).
