# routes/

- `index.jsx` - semua `<Route>`. Welcome (`/`) & Auth (`/auth`) tampil full screen,
  sisanya dibungkus `<Layout />`.
- `ProtectedRoute.jsx` - belum login dilempar ke `/auth` (abis login balik ke halaman tadi),
  role gak cocok dilempar ke `/home`.

| Path | Halaman | Akses |
|---|---|---|
| `/` | Welcome | Publik (udah login -> otomatis ke beranda) |
| `/auth`, `/auth?mode=daftar` | Login / Daftar | Publik |
| `/home` | Beranda | Publik |
| `/doctors`, `/doctors/:id` | Dokter, Profil Dokter | Publik |
| `/education` | Edukasi (berita kesehatan dari API) | Publik |
| `/shop`, `/cart` | E-Commerce, Keranjang | Publik (checkout wajib login) |
| `/emergency` | Darurat | Publik (sengaja tanpa login) |
| `/profile`, `/notifications`, `/consultations/:id` | Profil, Notifikasi, Chat | Login |
| `/home-visit`, `/scan`, `/chatbot` | Home Visit, Scan Obat, Tanya AI | Pasien |
| `/checkout/:id`, `/history`, `/orders/:id` | Pembayaran, Riwayat | Pasien |
| `/doctor` | Dashboard dokter | Dokter |
| `/admin`, `/admin/*` | Panel admin | Admin |
