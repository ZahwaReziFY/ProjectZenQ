-- ===================================================
-- SEED DATA DEMO: ZenQ (diambil dari mockup)
-- Data dokter & pasien FIKTIF. Password semua akun: password123
-- Jalankan setelah schema.sql: psql -d zenq -f database/seed.sql
-- ===================================================

-- USERS  (id 1 admin, 2-7 dokter, 8 pasien)
INSERT INTO users (name, email, password, role, phone, birth_date, gender, address, city, health_conditions) VALUES
('Admin ZenQ',          'admin@zenq.id',  '$2a$10$HJGiuT89G7Kbh.WN8JsnW.G0kl3vIdSjRuCXbxGK7pqEV2srA7kq.', 'admin',  '081200000001', NULL, NULL, NULL, NULL, '{}'),
('dr. Basna Yanti',     'dokter@zenq.id', '$2a$10$HJGiuT89G7Kbh.WN8JsnW.G0kl3vIdSjRuCXbxGK7pqEV2srA7kq.', 'doctor', '081200000002', NULL, 'female', NULL, NULL, '{}'),
('dr. Nadia Kusuma',    'nadia@zenq.id',  '$2a$10$HJGiuT89G7Kbh.WN8JsnW.G0kl3vIdSjRuCXbxGK7pqEV2srA7kq.', 'doctor', '081200000003', NULL, 'female', NULL, NULL, '{}'),
('dr. Rafi Pratama',    'rafi@zenq.id',   '$2a$10$HJGiuT89G7Kbh.WN8JsnW.G0kl3vIdSjRuCXbxGK7pqEV2srA7kq.', 'doctor', '081200000004', NULL, 'male',   NULL, NULL, '{}'),
('dr. Siti Aminah',     'siti@zenq.id',   '$2a$10$HJGiuT89G7Kbh.WN8JsnW.G0kl3vIdSjRuCXbxGK7pqEV2srA7kq.', 'doctor', '081200000005', NULL, 'female', NULL, NULL, '{}'),
('dr. Ahmad Fauzi',     'ahmad@zenq.id',  '$2a$10$HJGiuT89G7Kbh.WN8JsnW.G0kl3vIdSjRuCXbxGK7pqEV2srA7kq.', 'doctor', '081200000006', NULL, 'male',   NULL, NULL, '{}'),
('dr. Laras Wulandari', 'laras@zenq.id',  '$2a$10$HJGiuT89G7Kbh.WN8JsnW.G0kl3vIdSjRuCXbxGK7pqEV2srA7kq.', 'doctor', '081200000007', NULL, 'female', NULL, NULL, '{}'),
('Basna Yanti',         'pasien@zenq.id', '$2a$10$HJGiuT89G7Kbh.WN8JsnW.G0kl3vIdSjRuCXbxGK7pqEV2srA7kq.', 'patient','081200000008', '1998-05-17', 'female', 'Jl. Contoh No. 1, Bantul', 'Bantul, Daerah Istimewa Yogyakarta', '{}');

-- DOCTORS (sesuai mockup). Koordinat = perkiraan sekitar DIY, khusus demo.
INSERT INTO doctors (user_id, specialization, hospital, practice_hours, str_number, experience_years, patients_count,
                     consultation_fee, original_fee, home_visit_fee, accepts_home_visit, is_online, rating, rating_count, latitude, longitude, bio) VALUES
(2, 'Spesialis Jantung',        'PKU Gamping',                    '07.00 - 18.00', 'STR-DEMO-001', 7, 160, 50000, 75000, 50000, TRUE,  TRUE,  4.5, 160, -7.7990, 110.3240, NULL),
(3, 'Dokter Umum',              'RSKIA Fajar',                    '08.00 - 20.00', 'STR-DEMO-002', 5, 210, 35000, 50000, 35000, TRUE,  TRUE,  4.8, 210, -7.8200, 110.3600, NULL),
(4, 'Spesialis Anak',           'RSKIA Kahyangan',                '09.00 - 16.00', 'STR-DEMO-003', 9, 340, 60000, 80000, 60000, TRUE,  FALSE, 4.7, 340, -7.8100, 110.3800, NULL),
(5, 'Spesialis Penyakit Dalam', 'RS PKU Muhammadiyah Yogyakarta', '07.00 - 15.00', 'STR-DEMO-004', 11, 420, 55000, 70000, 55000, TRUE, TRUE, 4.6, 420, -7.8000, 110.3620, NULL),
(6, 'Dokter Umum',              'Puskesmas Kasihan',              '13.00 - 21.00', 'STR-DEMO-005', 4, 120, 25000, 40000, 25000, TRUE,  TRUE,  4.3, 120, -7.8250, 110.3300, NULL),
(7, 'Spesialis Kulit',          'RS PKU Gamping',                 '10.00 - 17.00', 'STR-DEMO-006', 8, 275, 65000, 90000, 65000, TRUE,  FALSE, 4.9, 275, -7.7990, 110.3240, NULL);

-- Bio default ala mockup
UPDATE doctors SET bio =
  'Saya adalah seorang dokter ' || LOWER(REPLACE(specialization, 'Dokter ', '')) || ' yang berdedikasi tinggi untuk menyediakan layanan kesehatan '
  || 'komprehensif dan terpersonalisasi bagi setiap pasien. Dengan mengombinasikan keahlian klinis berbasis bukti '
  || '(evidence-based medicine), saya berkomitmen memberikan penanganan yang akurat, mulai dari upaya pencegahan dini '
  || 'hingga tindakan intervensi yang kompleks.';

-- PRODUCTS (E-Commerce, sesuai mockup)
INSERT INTO products (name, category, price, rating, emoji, description) VALUES
('Vitamin D 1000 IU',  'Obat Pil',       50000,  4.5, '💊', 'Suplemen vitamin D.'),
('Vitamin C Orange',   'Obat Pil',       70000,  4.5, '🍊', 'Suplemen vitamin C rasa jeruk.'),
('Paket Buah Segar',   'Buah-Buahan',    85000,  4.7, '🍎', 'Paket buah segar pilihan.'),
('Vitamin D3 Plus',    'Obat Pil',       120000, 4.5, '💊', 'Suplemen vitamin D3.'),
('Kiwi Premium',       'Buah-Buahan',    45000,  4.4, '🥝', 'Kiwi premium.'),
('Termometer Digital', 'Alat Kesehatan', 60000,  4.6, '🌡️', 'Termometer digital.');

-- HEALTH FACILITIES (fallback kalo OpenStreetMap gagal). Koordinat PERKIRAAN, cek ulang sebelum demo.
INSERT INTO health_facilities (name, type, address, phone, has_emergency, latitude, longitude) VALUES
('RS PKU Muhammadiyah Gamping',    'hospital',  'Gamping, Sleman',  '(0274) 6499704', TRUE,  -7.7990, 110.3240),
('RSKIA Fajar',                    'hospital',  'Yogyakarta',       NULL,             FALSE, -7.8200, 110.3600),
('RSKIA Kahyangan',                'hospital',  'Yogyakarta',       NULL,             FALSE, -7.8100, 110.3800),
('RS PKU Muhammadiyah Yogyakarta', 'hospital',  'Kota Yogyakarta',  NULL,             TRUE,  -7.8000, 110.3620),
('Puskesmas Kasihan',              'puskesmas', 'Kasihan, Bantul',  NULL,             FALSE, -7.8250, 110.3300);

-- EMERGENCY CONTACTS (dari mockup + nomor darurat nasional)
INSERT INTO emergency_contacts (name, phone, type, region) VALUES
('Layanan Kegawatdaruratan Kesehatan', '119',            'ambulance', 'Nasional'),
('RS PKU Gamping',                     '(0274) 6499704', 'ambulance', 'Sleman'),
('MediCare Ambulans',                  '0812-2032-2984', 'ambulance', 'DIY');

-- MEDICINES - obat yang sering dikonsumsi, buat DEMO scan obat.
-- PENTING: info di bawah ringkasan umum, WAJIB dicek QA ke label/brosur resmi.
-- halal_status: belum ada API publik, jadi diisi manual. Nilai 'certified' di sini = DATA DEMO,
-- ganti dengan hasil cek nyata di https://info.halal.go.id/cari/ (nomor sertifikat + nama produsen).
INSERT INTO medicines (name, generic_name, keywords, bpom_number, category, dosage, side_effects, interactions, contraindications, halal_status, halal_cert_number, halal_source) VALUES
('Paracetamol 500 mg', 'Paracetamol', '{paracetamol,parasetamol,acetaminophen}', 'DEMO-NIE-001', 'Pereda nyeri & penurun demam',
 'Dewasa: 1 tablet, 3–4× sehari (ikuti label kemasan)', 'Mual, ruam kulit (jarang)', 'Hindari bersama alkohol dan obat lain yang mengandung paracetamol', 'Gangguan fungsi hati berat',
 'certified', 'DEMO-HALAL-001', 'DATA DEMO - verifikasi di info.halal.go.id'),
('Ibuprofen 400 mg', 'Ibuprofen', '{ibuprofen,ibuprofenum}', 'DEMO-NIE-002', 'Antiinflamasi nonsteroid (OAINS)',
 'Ikuti label kemasan, diminum sesudah makan', 'Nyeri lambung, mual', 'Hati-hati bersama obat pengencer darah dan OAINS lain', 'Riwayat tukak lambung, gangguan ginjal',
 'unknown', NULL, 'Belum diverifikasi'),
('Antasida Tablet Kunyah', 'Aluminium hidroksida + Magnesium hidroksida', '{antasida,antacid,magnesium,aluminium}', 'DEMO-NIE-003', 'Obat maag',
 'Dikunyah, ikuti label kemasan', 'Sembelit atau diare', 'Beri jeda 2 jam dengan obat lain', 'Gangguan ginjal berat',
 'certified', 'DEMO-HALAL-003', 'DATA DEMO - verifikasi di info.halal.go.id'),
('CTM 4 mg', 'Chlorpheniramine maleate', '{ctm,chlorpheniramine,klorfeniramin}', 'DEMO-NIE-004', 'Antihistamin (alergi)',
 'Ikuti label kemasan', 'Mengantuk, mulut kering', 'Menambah efek kantuk bila bersama obat penenang atau alkohol', 'Jangan dipakai saat berkendara',
 'unknown', NULL, 'Belum diverifikasi'),
('Cetirizine 10 mg', 'Cetirizine', '{cetirizine,setirizin}', 'DEMO-NIE-005', 'Antihistamin (alergi)',
 'Ikuti label kemasan', 'Mengantuk ringan, sakit kepala', 'Hati-hati bersama alkohol', 'Gangguan ginjal berat',
 'unknown', NULL, 'Belum diverifikasi'),
('Amoxicillin 500 mg', 'Amoxicillin', '{amoxicillin,amoksisilin,amoxicilin}', 'DEMO-NIE-006', 'Antibiotik (obat keras, wajib resep)',
 'Sesuai resep dokter, habiskan sesuai durasi', 'Diare, mual, ruam', 'Konsultasikan obat lain yang sedang diminum ke dokter/apoteker', 'Alergi penisilin',
 'unknown', NULL, 'Belum diverifikasi'),
('Oralit', 'Garam rehidrasi oral', '{oralit,oral,rehidrasi}', 'DEMO-NIE-007', 'Pengganti cairan tubuh (diare)',
 'Larutkan sesuai petunjuk kemasan', 'Jarang', '-', 'Gagal ginjal',
 'certified', 'DEMO-HALAL-007', 'DATA DEMO - verifikasi di info.halal.go.id'),
('Vitamin C 500 mg', 'Asam askorbat', '{vitamin,askorbat,ascorbic}', 'DEMO-NIE-008', 'Suplemen',
 'Ikuti label kemasan', 'Gangguan lambung bila dosis tinggi', '-', 'Riwayat batu ginjal (konsultasikan)',
 'certified', 'DEMO-HALAL-008', 'DATA DEMO - verifikasi di info.halal.go.id');

-- ARTICLES (konten edukasi, sesuai mockup)
INSERT INTO articles (title, slug, summary, content, category, emoji, is_featured, tags, author_id) VALUES
('Satu sendok madu sebelum tidur?', 'satu-sendok-madu-sebelum-tidur',
 'Satu sendok madu sebelum tidur dipercaya membantu kualitas tidur. Namun, kebutuhan tiap orang berbeda, jadi konsultasikan dengan dokter bila punya kondisi khusus.',
 'Konten artikel demo. Ganti dengan konten yang sudah ditinjau tenaga kesehatan.', 'Tahukah Kamu?', '🍯', TRUE, '{tidur}', 1),
('Rahasia otak tetap fokus seharian', 'rahasia-otak-tetap-fokus',
 'Hidrasi dan jeda singkat membantu konsentrasi. Pasang pengingat minum air setiap jam.',
 'Konten artikel demo. Ganti dengan konten yang sudah ditinjau tenaga kesehatan.', 'Gaya Hidup', '🧠', FALSE, '{fokus}', 1),
('Lupakan ponsel untuk tidur lebih nyenyak', 'lupakan-ponsel-tidur-nyenyak',
 'Cahaya biru dari gawai menekan hormon melatonin. Matikan 30–60 menit sebelum tidur.',
 'Konten artikel demo. Ganti dengan konten yang sudah ditinjau tenaga kesehatan.', 'Tidur', '📵', FALSE, '{tidur}', 1),
('Jangan takut matahari pagi', 'jangan-takut-matahari-pagi',
 'Berjemur 10–15 menit sebelum jam 9 pagi membantu tubuh memproduksi vitamin D.',
 'Konten artikel demo. Ganti dengan konten yang sudah ditinjau tenaga kesehatan.', 'Gaya Hidup', '☀️', FALSE, '{vitamin}', 1),
('Kapan terakhir cek gula darah?', 'kapan-terakhir-cek-gula-darah',
 'Banyak penyakit kronis dapat dideteksi lebih awal lewat pemeriksaan rutin.',
 'Konten artikel demo. Ganti dengan konten yang sudah ditinjau tenaga kesehatan.', 'Penyakit Kronis', '🩸', FALSE, '{diabetes}', 1);

-- NOTIFICATIONS (pasien id 8)
INSERT INTO notifications (user_id, title, body, type, sender_doctor_id, created_at) VALUES
(8, 'ZenQ: Pemberitahuan', 'Halo, kita berada di sini untuk membantu. Jangan lupa lengkapi profil kesehatanmu agar rekomendasi lebih tepat.', 'system', NULL, NOW() - INTERVAL '3 days');
