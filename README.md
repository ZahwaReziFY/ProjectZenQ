# ZenQ - With ZenQ, We Care

Aplikasi web layanan kesehatan publik: konsultasi dokter (chat, video call, telepon),
home visit, layanan darurat berbasis lokasi, scan obat, edukasi kesehatan, dan E-Commerce
kesehatan. Tampilan mengikuti **mockup desktop ZenQ**.
AI cuma **pendamping konsultasi awal**, bukan pengganti tenaga medis.

```
zenq/
├── backend/     # Express + PostgreSQL - lihat backend/README.md
└── frontend/    # Vite + React (+ CSS mockup, Leaflet, tesseract.js) - lihat frontend/README.md
```

## Cara jalanin

Butuh **Node.js 18+** dan **PostgreSQL**.

**1. Database (cukup sekali)**
Isi `DATABASE_URL` di `backend/.env` (password postgres kamu), lalu:
```bash
cd backend
npm install
npm run seed
```
`npm run seed` otomatis bikin database `zenq` (kalau belum ada), semua tabel, dan data demo.
Jalan di Windows/Mac/Linux, gak perlu psql. **Semua data lama terhapus** - jalanin lagi kapan aja buat reset data ke awal.

**2. Backend (terminal 1)**
```bash
cd backend
cp .env.example .env      # Windows CMD: copy .env.example .env
#  -> edit DATABASE_URL: ganti PASSWORD_KAMU dengan password postgres
npm install
npm run dev               # http://localhost:3000
```

**3. Frontend (terminal 2)**
```bash
cd frontend
cp .env.example .env
npm install
npm run dev               # http://localhost:5173
```

Akun demo (password semua: `password123`):

| Role | Email | Masuk ke |
|---|---|---|
| Pasien | `pasien@zenq.id` (Basna Yanti) | Beranda |
| Dokter | `dokter@zenq.id` (dr. Basna Yanti), `nadia@zenq.id`, dst. | Dashboard dokter |
| Admin | `admin@zenq.id` | Panel admin |

## Layar mockup -> fitur

| Layar | Status |
|---|---|
| Welcome, Login / Daftar | ✅ (tombol Google/Apple masih TODO) |
| Beranda, Rekomendasi Dokter, Profil Dokter | ✅ data dari database |
| Chat Dokter | ✅ chat beneran (polling) · Video call & telepon: UI ✅, koneksi WebRTC TODO |
| Home Visit | ✅ booking -> bayar -> dokter update status |
| Scan Obat | ✅ kamera/galeri -> OCR (tesseract.js) -> data obat + status halal (demo) |
| Konten Edukasi | ✅ artikel dari DB + berita kesehatan (api-berita-indonesia) |
| E-Commerce, Keranjang | ✅ |
| Pembayaran VA / QRIS | ✅ simulasi (sesuai out-of-scope pembayaran riil) |
| Riwayat + Detail | ✅ tab Booking Dokter / Pembelian / Pengajuan + timeline status |
| Notifikasi | ✅ otomatis dari aktivitas |
| Profil | ✅ edit profil |
| Layanan Darurat | ✅ peta Leaflet + faskes terdekat OpenStreetMap + kontak ambulans |
| Tambahan dari rancangan | Chatbot AI triase ("🤖 Tanya AI"), dashboard dokter, panel admin |

## API pihak ketiga
Detail di `backend/README.md`. Ringkasnya:
- **Obat BPOM**: API Indonesia (butuh `BPOM_API_KEY`) atau import CSV Satu Data BPOM.
  **Status halal gak tersedia di API manapun**, jadi diisi manual dari info.halal.go.id.
- **Berita**: api-berita-indonesia `/suara/health`.
- **Peta & faskes**: Leaflet + OpenStreetMap (gratis, tanpa API key).

Semua opsional. Kalo API mati atau gak diisi, aplikasi pakai data demo lokal.

## Pembagian kerja (sesuai struktur tim)
| Peran | Folder utama |
|---|---|
| Backend & Database (1) | `backend/config`, `database/`, `auth.*`, `user.*`, `order*` |
| Backend & Database (2) | `consultation.*`, `homeVisit.*`, `emergency.*`, `product.*` |
| UI/UX Designer | `frontend/src/styles/mockup.css` (warna, font, komponen) |
| Frontend Developer | `frontend/src/pages`, `components`, `routes` |
| AI/Integration Developer | `backend/services/*`, `frontend/src/utils/ocr.js`, WebRTC |
| QA & Documentation | README tiap folder, cek data obat & status halal, laporan testing |

## Alur Git
`main` (demo stabil) ← `develop` (gabungan sprint) ← `feature/<modul>` (lewat PR).
