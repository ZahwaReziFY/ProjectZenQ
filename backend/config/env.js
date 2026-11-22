require('dotenv').config();

/**
 * Semua env variable dibaca SEKALI di sini, bukan langsung process.env
 * tersebar di banyak file. Kalo nambah env baru, tambahin di sini terus
 * import config di file yang butuh.
 */
const config = {
  port: process.env.PORT || 3000,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/zenq',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_ganti_di_env',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',

  // AI chatbot - Gemini (opsional). Key dari https://aistudio.google.com/apikey
  // .trim() + buang tanda kutip: key yang ke-copy dengan spasi/kutip tetap terbaca benar
  aiApiKey: (process.env.AI_API_KEY || '').trim().replace(/^["']|["']$/g, ''),
  aiModel: (process.env.AI_MODEL || 'gemini-3.7-flash').trim(),
  aiApiUrl: process.env.AI_API_URL || 'https://generativelanguage.googleapis.com/v1beta',

  // Data obat BPOM via API Indonesia (opsional, kosong = cuma pake DB lokal)
  bpomApiUrl: process.env.BPOM_API_URL || 'https://use.apiindonesia.id/api/v1/bpom',
  bpomApiKey: process.env.BPOM_API_KEY || '',

  // Berita kesehatan
  newsApiBase: (process.env.NEWS_API_BASE || 'https://api-berita-indonesia.vercel.app').replace(/\/$/, ''),

  // Faskes terdekat dari OpenStreetMap (Overpass API). Kosongin buat pake DB lokal aja.
  overpassUrl: process.env.OVERPASS_URL ?? 'https://overpass-api.de/api/interpreter',

  maxUploadMb: Number(process.env.MAX_UPLOAD_MB) || 5,
};

module.exports = config;
