# Backend ZenQ

Express + PostgreSQL. Auth JWT dengan 3 role: `patient`, `doctor`, `admin`.

## Struktur
```
backend/
├── app.js                       # entry point: Express, CORS, daftar route
├── config/
│   ├── env.js                   # semua env variable
│   ├── db.js                    # pool PostgreSQL + query()
│   └── pricing.js               # biaya layanan, ongkir, transport, prefix VA bank
├── database/
│   ├── schema.sql               # struktur tabel (drop + create, aman dijalankan ulang)
│   └── seed.sql                 # data demo dari mockup (dokter, produk, obat, artikel)
├── middleware/                  # auth (JWT + role), upload (multer), error handler
├── routes/ + controllers/       # 1 pasang file per modul
├── services/
│   ├── orderService.js          # semua transaksi + pembayaran simulasi VA/QRIS
│   ├── bpomService.js           # API Indonesia - data obat BPOM (opsional)
│   ├── newsService.js           # berita kesehatan api-berita-indonesia (+cache)
│   ├── emergencyService.js      # faskes terdekat dari OpenStreetMap (+fallback DB)
│   ├── medicineScanService.js   # cocokkan teks kemasan -> data obat
│   ├── aiChatbotService.js      # triase AI rule-based (siap disambung ke LLM)
│   └── notificationService.js
├── scripts/importMedicinesCsv.js  # import obat dari CSV (misal dataset Satu Data BPOM)
└── utils/                       # response, validation, geo (Haversine)
```

## Cara jalanin
```bash
cp .env.example .env            # isi DATABASE_URL (password postgres kamu)
npm install
npm run seed                    # bikin database + tabel + data demo (data lama terhapus)
npm run dev
```

## API pihak ketiga

Semuanya **opsional**. Kalo gagal atau gak diisi, backend otomatis pake data lokal,
jadi demo tetap jalan.

| Fitur | Sumber | Env | Catatan |
|---|---|---|---|
| Data obat BPOM | [API Indonesia](https://apiindonesia.id/en/produk/bpom/) | `BPOM_API_KEY` | Bikin API key di dashboard-nya. Berbayar per request, tapi ada bonus kredit gratis. Field: `nie`, `product_name`, `status`. **Gak ada status halal.** |
| Data obat BPOM (alternatif) | [Satu Data BPOM](https://satudata.pom.go.id/datasets), dataset "APP - Master Produk Komoditi Obat" | - | Kalo bisa di-download CSV: `node scripts/importMedicinesCsv.js file.csv` |
| Berita kesehatan | [api-berita-indonesia](https://github.com/renomureza/api-berita-indonesia) `/suara/health` | `NEWS_API_URL` | Di-cache 30 menit. Format respons belum dites langsung, parser-nya dibikin toleran. |
| Faskes terdekat | OpenStreetMap (Overpass API) | `OVERPASS_URL` | Gratis, data RS/klinik nyata. Kosongin env-nya buat pake data demo. |
| Peta | Leaflet + OpenStreetMap | - | Di frontend, tanpa API key. |

### Status halal obat
Belum ada API publik yang ngasih status halal obat. Jadi kolom `medicines.halal_status`
(`certified` / `not_certified` / `unknown`) + `halal_cert_number` diisi **manual**:
1. Cek produk di https://info.halal.go.id/cari/ (BPJPH)
2. Isi nomor sertifikat + `halal_status = 'certified'` di `seed.sql` atau lewat CSV import

Nilai `certified` di `seed.sql` sekarang = **DATA DEMO** (ditandai `DEMO-HALAL-...`).
Ganti dengan hasil cek nyata sebelum dipresentasikan sebagai data asli.

## Endpoint utama

🌐 publik · 🔒 login · (role) dibatasi role

| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| GET | /health | 🌐 | Cek backend & database |
| POST | /auth/register, /auth/login | 🌐 | Daftar / login |
| GET | /auth/me · PUT /users/me | 🔒 | Profil |
| GET | /doctors?search=&sort=rating\|murah&online=true&home_visit=true | 🌐 | Daftar dokter |
| GET | /doctors/:id | 🌐 | Profil dokter + ulasan |
| POST | /orders | 🔒 patient | Buat pesanan: `kind` = `consultation` / `home_visit` / `shop` |
| GET | /orders?category=Booking Dokter\|Pembelian\|Pengajuan | 🔒 | Riwayat |
| GET | /orders/:id | 🔒 | Detail + rincian biaya |
| POST | /orders/:id/payment | 🔒 | Pilih metode `{ method: bank\|qris, bank }` -> nomor VA |
| POST | /orders/:id/confirm | 🔒 | "Saya Sudah Bayar" (simulasi) |
| POST | /orders/:id/cancel | 🔒 | Batalkan (yang belum dibayar) |
| GET | /consultations · /consultations/:id | 🔒 | Konsultasi (aktif setelah dibayar) |
| GET/POST | /consultations/:id/messages | 🔒 | Chat (polling `?after_id=`) |
| PATCH | /consultations/:id/status | 🔒 | Akhiri sesi -> order jadi Selesai |
| GET | /home-visits · PATCH /home-visits/:id/status | 🔒 (doctor) | Status kunjungan |
| GET | /products?category= · /products/categories | 🌐 | Katalog E-Commerce |
| GET | /emergency/nearby?lat=&lng= · /emergency/contacts | 🌐 | Faskes terdekat & kontak |
| POST | /emergency/ambulance-request | 🔒 | Pengajuan ambulans (simulasi, masuk Riwayat "Pengajuan") |
| GET | /medicines?search= · POST /medicines/scan | 🌐 / 🔒 | Info obat / scan |
| GET | /medicines/bpom?q= | 🌐 | Cek langsung ke API BPOM |
| GET | /articles · /articles/news · /articles/:slug | 🌐 | Edukasi + berita |
| POST | /chatbot/message | 🔒 | Triase AI |
| GET/PATCH | /notifications | 🔒 | Notifikasi |
| * | /admin/stats, /admin/doctors, /admin/articles, /admin/products, /admin/orders | 🔒 admin | Panel admin |

Format respons selalu `{ code, success, message, data }`.

## Alur pesanan
```
POST /orders ──> awaiting_payment ──(payment + confirm)──> processing ──(layanan selesai)──> completed
                        └──────────────── cancel ────────────────> cancelled
```
- Konsultasi: setelah bayar, sesi chat aktif. Dokter/pasien akhiri sesi -> Selesai.
- Home visit: setelah bayar, dokter Terima -> Berangkat -> Selesai.
- Belanja: setelah bayar Diproses, admin tandai Selesai.

## TODO buat tim
- **WebRTC** video call / telepon: tambah signaling server (misal `socket.io`).
- **Upload lampiran chat**: endpoint upload + simpan file.
- **Login Google**: `controllers/auth.controller.js` (`google-auth-library`).
- **LLM chatbot**: `services/aiChatbotService.js` -> `askLLM()`.
- **Status halal**: isi manual dari info.halal.go.id (lihat di atas).
