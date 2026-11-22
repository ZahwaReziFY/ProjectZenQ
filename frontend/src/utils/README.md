# utils/

Fungsi helper murni (bukan komponen, bukan hook).

- `api.js` - wrapper `fetch` ke backend. Pake `api.get/post/put/patch/delete`.
  Token JWT otomatis ditempel, error dilempar dengan pesan dari backend, dan
  kalo token expired (401) kirim event `zenq:unauthorized` supaya `AuthContext`
  logout otomatis. Upload file: kirim `FormData` sebagai body.
- `format.js` - `rp()` (format rupiah ala mockup), format tanggal, label
  status pesanan (`ORDER_STATUS`), inisial avatar, label grup notifikasi.
- `ocr.js` - baca teks dari foto kemasan obat pake `tesseract.js` (jalan di
  browser, di-load cuma pas dipake).

URL backend diambil dari `VITE_API_URL` di `.env`.
