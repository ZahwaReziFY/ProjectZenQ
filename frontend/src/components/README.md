# components/

Komponen UI reusable. Semua pake class dari CSS mockup (`src/styles/mockup.css`)
biar tampilannya persis desain: `.card`, `.btn` (`.dark` `.ghost` `.sm` `.block`),
`.chip` (`.green` `.orange` `.red`), `.grid g2/g3/g4`, `.split`, `.row`, dll.

| Komponen | Fungsi |
|---|---|
| `Layout.jsx` | Navbar + isi halaman + tombol melayang "🤖 Tanya AI" (pasien) |
| `Navbar.jsx` | Menu per role (`MENUS`), keranjang, badge notifikasi, tombol 🚨 Darurat |
| `Logo.jsx` | Logo ZenQ (SVG dari mockup) |
| `Avatar.jsx` | Avatar inisial nama / foto |
| `DoctorCard.jsx` | Kartu dokter (Beranda, Rekomendasi Dokter) |
| `StatusChip.jsx` | Chip status pesanan (Diproses / Selesai / Dibatalkan) |
| `OrderSummary.jsx` | Ringkasan / rincian biaya pesanan |
| `Timeline.jsx` | Timeline status pesanan |
| `FacilityMap.jsx` | Peta Leaflet + OpenStreetMap (halaman Darurat) |
| `StateMessage.jsx` | Tampilan loading / error / kosong |
| `HealthBadge.jsx` | Status backend (mode development) |

Prinsip: komponen di sini **berbasis props**, gak fetch data sendiri
(kecuali Navbar yang ngambil jumlah notifikasi).
