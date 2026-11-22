-- ===================================================
-- SCHEMA DATABASE: ZenQ
-- Aplikasi Web Optimalisasi Layanan Kesehatan Publik
-- Jalankan: psql -d zenq -f database/schema.sql
-- (Aman dijalankan ulang: tabel lama di-drop dulu)
-- ===================================================

DROP TABLE IF EXISTS
  notifications, chatbot_logs, medicine_scans, consultation_messages, consultations,
  home_visits, order_items, orders, products, doctor_reviews, doctor_schedules, doctors,
  articles, medicines, health_facilities, emergency_contacts, users CASCADE;

-- 1. USERS (pasien, dokter, admin)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255),                 -- NULL kalo daftar via Google
    google_id VARCHAR(100) UNIQUE,
    role VARCHAR(20) NOT NULL DEFAULT 'patient'
        CHECK (role IN ('patient', 'doctor', 'admin')),
    phone VARCHAR(30),
    birth_date DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
    address TEXT,
    city VARCHAR(100),                     -- ditampilkan di beranda ("Bantul, DIY")
    health_conditions TEXT[] DEFAULT '{}',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. DOCTORS
CREATE TABLE doctors (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    specialization VARCHAR(100) NOT NULL,
    hospital VARCHAR(150),                 -- tempat praktik (📍 di kartu dokter)
    practice_hours VARCHAR(50),            -- contoh: "07.00 - 18.00"
    str_number VARCHAR(50),
    bio TEXT,
    experience_years INT DEFAULT 0,
    patients_count INT DEFAULT 0,
    consultation_fee INT NOT NULL DEFAULT 0,
    original_fee INT,                      -- harga coret (sebelum diskon)
    home_visit_fee INT NOT NULL DEFAULT 0,
    accepts_home_visit BOOLEAN DEFAULT TRUE,
    is_online BOOLEAN DEFAULT FALSE,
    rating NUMERIC(2,1) DEFAULT 0,
    rating_count INT DEFAULT 0,
    latitude NUMERIC(9,6),
    longitude NUMERIC(9,6),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE doctor_reviews (
    id SERIAL PRIMARY KEY,
    doctor_id INT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    patient_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. PRODUCTS (E-Commerce)
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,         -- Obat Pil, Buah-Buahan, Alat Kesehatan
    price INT NOT NULL,
    rating NUMERIC(2,1) DEFAULT 0,
    emoji VARCHAR(10) DEFAULT '💊',        -- placeholder gambar (sesuai mockup)
    image_url TEXT,
    description TEXT,
    stock INT DEFAULT 100,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. ORDERS - semua transaksi: konsultasi, home visit, belanja, pengajuan ambulans
--    Pembayaran DISIMULASIKAN (VA / QRIS), sesuai out-of-scope "pembayaran riil".
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,      -- contoh: ZQ-25061801
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind VARCHAR(20) NOT NULL CHECK (kind IN ('consultation', 'home_visit', 'shop', 'ambulance')),
    category VARCHAR(30) NOT NULL CHECK (category IN ('Booking Dokter', 'Pembelian', 'Pengajuan')),
    title VARCHAR(200) NOT NULL,
    icon VARCHAR(10),
    place TEXT,                            -- lokasi / tujuan
    status VARCHAR(20) NOT NULL DEFAULT 'awaiting_payment'
        CHECK (status IN ('awaiting_payment', 'processing', 'completed', 'cancelled')),
    total INT NOT NULL DEFAULT 0,
    payment_method VARCHAR(10) CHECK (payment_method IN ('bank', 'qris')),
    payment_bank VARCHAR(20),
    va_number VARCHAR(30),
    payment_expires_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    label VARCHAR(200) NOT NULL,           -- "Konsultasi dr. X (1 sesi)", "Biaya layanan"
    product_id INT REFERENCES products(id) ON DELETE SET NULL,
    quantity INT DEFAULT 1,
    amount INT NOT NULL                    -- subtotal baris (harga x qty)
);

-- 5. CONSULTATIONS (chat / video / telepon)
CREATE TABLE consultations (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE SET NULL,
    patient_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id INT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'ongoing', 'completed', 'cancelled')),
    complaint TEXT,
    doctor_notes TEXT,
    source VARCHAR(20) DEFAULT 'direct' CHECK (source IN ('direct', 'chatbot')),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE consultation_messages (
    id SERIAL PRIMARY KEY,
    consultation_id INT NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    sender_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) DEFAULT 'text' CHECK (type IN ('text', 'image', 'voice', 'system')),
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. HOME VISITS
CREATE TABLE home_visits (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE SET NULL,
    patient_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id INT REFERENCES doctors(id) ON DELETE SET NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    address TEXT NOT NULL,
    latitude NUMERIC(9,6),
    longitude NUMERIC(9,6),
    complaint TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'awaiting_payment'
        CHECK (status IN ('awaiting_payment', 'pending', 'accepted', 'on_the_way', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. HEALTH FACILITIES (fallback kalo OpenStreetMap gak bisa diakses)
CREATE TABLE health_facilities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('hospital', 'puskesmas', 'clinic')),
    address TEXT,
    phone VARCHAR(30),
    has_emergency BOOLEAN DEFAULT FALSE,
    latitude NUMERIC(9,6) NOT NULL,
    longitude NUMERIC(9,6) NOT NULL
);

CREATE TABLE emergency_contacts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('ambulance', 'police', 'fire', 'other')),
    region VARCHAR(100)
);

-- 8. MEDICINES (info obat + status halal untuk demo)
CREATE TABLE medicines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    generic_name VARCHAR(150),
    keywords TEXT[] DEFAULT '{}',          -- kata kunci tambahan buat cocokin hasil OCR
    bpom_number VARCHAR(50),               -- NIE (Nomor Izin Edar)
    bpom_status VARCHAR(30),               -- contoh: "Berlaku" (dari API BPOM kalo ada)
    category VARCHAR(100),
    dosage TEXT,
    side_effects TEXT,
    interactions TEXT,
    contraindications TEXT,
    -- Belum ada API publik status halal obat -> diisi MANUAL setelah dicek di info.halal.go.id
    halal_status VARCHAR(20) DEFAULT 'unknown'
        CHECK (halal_status IN ('certified', 'not_certified', 'unknown')),
    halal_cert_number VARCHAR(60),
    halal_source TEXT,                     -- catatan sumber verifikasi
    source VARCHAR(20) DEFAULT 'local' CHECK (source IN ('local', 'bpom_api')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE medicine_scans (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    extracted_text TEXT,
    medicine_id INT REFERENCES medicines(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. CHATBOT LOGS (triase AI)
CREATE TABLE chatbot_logs (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_message TEXT NOT NULL,
    bot_reply TEXT NOT NULL,
    triage_level VARCHAR(20) CHECK (triage_level IN ('self_care', 'consult', 'emergency')),
    suggested_specialization VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 10. ARTICLES (konten edukasi)
CREATE TABLE articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(220) UNIQUE NOT NULL,
    summary TEXT,
    content TEXT NOT NULL,
    category VARCHAR(100),
    emoji VARCHAR(10) DEFAULT '📚',
    is_featured BOOLEAN DEFAULT FALSE,     -- banner "Tahukah Kamu?"
    tags TEXT[] DEFAULT '{}',
    min_age INT DEFAULT 0,
    max_age INT DEFAULT 120,
    cover_url TEXT,
    author_id INT REFERENCES users(id) ON DELETE SET NULL,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 11. NOTIFICATIONS
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    body TEXT,
    type VARCHAR(30),                      -- consultation, home_visit, order, system
    sender_doctor_id INT REFERENCES doctors(id) ON DELETE SET NULL,
    reference_id INT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_user ON orders(user_id, created_at DESC);
CREATE INDEX idx_consultations_patient ON consultations(patient_id);
CREATE INDEX idx_consultations_doctor ON consultations(doctor_id);
CREATE INDEX idx_home_visits_patient ON home_visits(patient_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_medicines_name ON medicines(LOWER(name));

