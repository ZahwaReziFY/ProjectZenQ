# Frontend ZenQ

Vite + React + React Router. Tampilan ngikutin **mockup desktop ZenQ**:
CSS mockup dipake langsung sebagai design system (`src/styles/mockup.css`),
jadi class-nya sama persis (`.card`, `.btn`, `.chip`, `.grid g3`, `.split`, dll).
Tailwind tetap ada buat utility kecil (reset bawaannya dimatiin biar gak bentrok).

## Library tambahan
- `leaflet` - peta OpenStreetMap di halaman Darurat (gratis, tanpa API key)
- `tesseract.js` - OCR kemasan obat di browser (di-load cuma pas scan)
- `qrcode` - gambar QR di pembayaran QRIS (simulasi)

## Struktur
```
frontend/src/
├── main.jsx, App.jsx       # entry + provider (Auth, Cart) + router
├── index.css               # import leaflet.css + mockup.css + app.css + tailwind
├── styles/
│   ├── mockup.css          # CSS dari mockup (warna di :root, dukung dark mode)
│   └── app.css             # tambahan (peta, tombol Tanya AI, tabel admin)
├── components/             # Navbar, Layout, DoctorCard, Timeline, FacilityMap, dll
├── context/                # AuthContext, CartContext
├── hooks/                  # useFetch, useCamera, useGeolocation, useHealthCheck
├── pages/                  # 1 file per layar mockup (+ admin/)
├── routes/                 # daftar route + ProtectedRoute
└── utils/                  # api.js, format.js, ocr.js
```

## Cara jalanin
```bash
cp .env.example .env
npm install
npm run dev
```
Buka `http://localhost:5173`. Backend harus jalan juga (`VITE_API_URL`, default `http://localhost:3000`).

Kamera (scan obat) dan lokasi (darurat) cuma jalan di `localhost` atau `https`.
OCR pertama kali butuh internet (download data bahasa tesseract).

## Build
```bash
npm run build   # hasil di dist/, siap deploy ke Vercel/Netlify
```
