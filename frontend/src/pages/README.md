# pages/

1 file = 1 halaman, tampilannya ngikutin mockup desktop ZenQ.

| Halaman | Layar di mockup | Endpoint utama |
|---|---|---|
| `Welcome.jsx` | Welcome | - |
| `Auth.jsx` | Login / Daftar | `/auth/login`, `/auth/register` |
| `Home.jsx` | Beranda | `/doctors?home_visit=true` |
| `Doctors.jsx` | Rekomendasi Dokter | `/doctors?search=&sort=&online=` |
| `DoctorProfile.jsx` | Profil Dokter | `/doctors/:id`, `POST /orders` (konsultasi) |
| `Consultation.jsx` | Chat Dokter + Video Call + Telepon | `/consultations/:id`, `/messages` |
| `HomeVisit.jsx` | Home Visit | `POST /orders` (home_visit) |
| `MedicineScan.jsx` | Scan Obat | `POST /medicines/scan` (+ OCR tesseract.js) |
| `Education.jsx` | Edukasi = berita kesehatan otomatis (Suara.com + Tribunnews) | `/articles/news` |
| `Shop.jsx` | E-Commerce | `/products`, `/products/categories` |
| `Cart.jsx` | Keranjang | `POST /orders` (shop) |
| `Checkout.jsx` | Pembayaran (VA / QRIS, simulasi) | `/orders/:id/payment`, `/orders/:id/confirm` |
| `History.jsx`, `OrderDetail.jsx` | Riwayat + Detail | `/orders`, `/orders/:id` |
| `Notifications.jsx` | Notifikasi | `/notifications` |
| `Profile.jsx` | Profil | `PUT /users/me` |
| `Emergency.jsx` | Layanan Darurat (peta Leaflet) | `/emergency/nearby`, `/emergency/contacts` |
| `Chatbot.jsx` | (tambahan, dari rancangan proyek) | `POST /chatbot/message` |
| `DoctorDashboard.jsx` | (tambahan, sisi dokter) | `/consultations`, `/home-visits` |
| `admin/*` | (tambahan, panel admin) | `/admin/*` |
| `NotFound.jsx` | 404 | - |

Cari kata `TODO` di folder ini buat bagian yang belum selesai:
WebRTC (video call/telepon beneran), upload lampiran chat, login Google, input suara chatbot.
