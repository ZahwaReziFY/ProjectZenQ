const config = require('../config/env');

/**
 * OCR kemasan obat pakai GEMINI (bisa "melihat" gambar).
 *
 * Pakai API key yang SAMA dengan chatbot (AI_API_KEY + AI_MODEL di .env).
 * Cek key-nya jalan atau tidak:  npm run cek-ai
 *
 * Alur:
 *   foto -> base64 -> POST ke Gemini generateContent (temperature 0 = jawaban konsisten)
 *   -> Gemini balas JSON (merek, zat aktif, nomor BPOM, logo halal, info umum obat)
 *   -> medicineScanService mencocokkan ke tabel medicines
 *
 * Supaya tidak gampang gagal:
 *   - kalau model di AI_MODEL tidak ada / sudah dihapus Google -> otomatis coba model cadangan
 *   - kalau server Gemini sibuk (429/500/503) -> coba sekali lagi
 * Kalau tetap gagal -> { ok: false, reason } lalu frontend pakai tesseract.js sebagai cadangan.
 */

// Urutan model cadangan (semua bisa membaca gambar). AI_MODEL dari .env selalu dicoba duluan.
const FALLBACK_MODELS = ['gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite'];

const PROMPT = `Kamu adalah apoteker yang membaca FOTO KEMASAN OBAT untuk aplikasi kesehatan ZenQ (Indonesia).

Langkah:
1. Baca semua tulisan yang terlihat. Foto bisa miring, terbalik, buram sebagian, atau tulisannya putih di atas warna.
2. Tentukan MEREK/NAMA PRODUK: biasanya tulisan paling besar di bagian depan (contoh "Panadol", "Bodrex", "Promag").
   Bedakan dengan nama produsen (contoh "Kalbe", "Sanbe", "Tempo Scan", "Konimex") dan slogan.
3. Tentukan ZAT AKTIF dari komposisi atau tulisan di bawah merek (contoh "Paracetamol 500 mg", "Kafein 65 mg").
   Tulis nama zat saja tanpa dosis, gunakan nama internasional (Paracetamol, Caffeine, Ibuprofen, ...).
4. NOMOR BPOM / NIE: kode seperti DBL1234567890A1, GKL..., DTL..., TR123456789, SD123456789, POM TR...
   Isi HANYA jika benar-benar terbaca di foto. Jangan mengarang nomor.
5. LOGO HALAL: true jika terlihat logo halal Indonesia (logo ungu "HALAL INDONESIA" atau logo MUI). Jangan menebak.
   Isi nomor sertifikat halal hanya jika tertulis di kemasan.
6. Jika produk sudah jelas, isi info umum dari pengetahuanmu sebagai apoteker (singkat, bahasa Indonesia, untuk orang awam).
   Untuk dosis, salin aturan pakai yang tertulis di kemasan bila terbaca; jika tidak terbaca tulis "Ikuti aturan pakai di kemasan".

Balas HANYA JSON dengan format:
{
  "is_medicine": boolean,
  "confidence": "high" | "medium" | "low",
  "product_name": string | null,
  "strength": string | null,
  "active_ingredients": [string],
  "dosage_form": string | null,
  "bpom_number": string | null,
  "halal_logo": boolean,
  "halal_cert_number": string | null,
  "manufacturer": string | null,
  "info": {
    "category": string | null,
    "usage": string | null,
    "dosage": string | null,
    "side_effects": string | null,
    "warnings": string | null
  },
  "text": string
}
"text" = semua tulisan penting yang terbaca, dipisah spasi. Bagian yang tidak terbaca isi null atau [].`;

const isEnabled = () => Boolean(config.aiApiKey);

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const m = text.match(/\{[\s\S]*\}/); // kalau Gemini nambahin teks di luar JSON
    if (!m) return null;
    try {
      return JSON.parse(m[0]);
    } catch {
      return null;
    }
  }
}

const str = (v, max = 400) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);

function clean(data) {
  const info = data.info && typeof data.info === 'object' ? data.info : {};
  return {
    is_medicine: data.is_medicine !== false,
    confidence: ['high', 'medium', 'low'].includes(data.confidence) ? data.confidence : 'medium',
    product_name: str(data.product_name, 120),
    strength: str(data.strength, 60),
    active_ingredients: Array.isArray(data.active_ingredients)
      ? data.active_ingredients.map((x) => str(String(x), 80)).filter(Boolean).slice(0, 8)
      : [],
    dosage_form: str(data.dosage_form, 60),
    bpom_number: str(data.bpom_number, 40),
    halal_logo: data.halal_logo === true,
    halal_cert_number: str(data.halal_cert_number, 60),
    manufacturer: str(data.manufacturer, 120),
    info: {
      category: str(info.category, 120),
      usage: str(info.usage),
      dosage: str(info.dosage),
      side_effects: str(info.side_effects),
      warnings: str(info.warnings),
    },
    text: String(data.text || '').slice(0, 2000),
  };
}

async function callModel(model, imageBuffer, mimeType) {
  const url = `${config.aiApiUrl}/models/${encodeURIComponent(model)}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.aiApiKey },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { mimeType, data: imageBuffer.toString('base64') } },
          { text: PROMPT },
        ],
      }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0 },
    }),
    signal: AbortSignal.timeout(30000),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, json };
}

/**
 * @param {Buffer} imageBuffer  isi file foto
 * @param {string} mimeType     'image/jpeg' | 'image/png' | 'image/webp'
 * @returns {Promise<{ok: true, data: object, model: string} | {ok: false, reason: string}>}
 */
async function readMedicinePhoto(imageBuffer, mimeType = 'image/jpeg') {
  if (!isEnabled()) return { ok: false, reason: 'AI_API_KEY belum diisi' };

  const models = [...new Set([config.aiModel, ...FALLBACK_MODELS].filter(Boolean))];
  let lastReason = 'Gemini tidak merespons';

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const { status, ok, json } = await callModel(model, imageBuffer, mimeType);

        if (ok) {
          const text = (json.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
          const data = text ? parseJson(text) : null;
          if (data) return { ok: true, data: clean(data), model };
          lastReason = 'Balasan Gemini tidak bisa dibaca';
          break; // coba model berikutnya
        }

        lastReason = `Gemini error ${status}: ${json?.error?.message || 'tanpa pesan'}`;
        console.warn(`[OCR] ${model}:`, lastReason);

        // Key salah / tidak punya izin -> model lain juga pasti gagal, langsung berhenti
        if (status === 401 || status === 403 || /API key/i.test(json?.error?.message || '')) {
          return { ok: false, reason: lastReason };
        }
        // Server sibuk -> tunggu sebentar lalu ulangi model yang sama
        if ([429, 500, 503].includes(status) && attempt === 0) {
          await new Promise((r) => setTimeout(r, 1200));
          continue;
        }
        break; // 404 model tidak ada, dll -> coba model berikutnya
      } catch (err) {
        lastReason = err.name === 'TimeoutError' ? 'Gemini terlalu lama merespons' : err.message;
        console.warn(`[OCR] ${model}:`, lastReason);
        break;
      }
    }
  }
  return { ok: false, reason: lastReason };
}

module.exports = { readMedicinePhoto, isEnabled, FALLBACK_MODELS, PROMPT };
