const config = require('../config/env');
const { query } = require('../config/db');

/**
 * Chatbot triase awal. AI di ZenQ cuma PENDAMPING, bukan pengganti dokter -
 * jadi output-nya selalu salah satu dari 3 level:
 *   - self_care  : keluhan ringan, kasih saran umum + konten edukasi
 *   - consult    : sarankan konsultasi ke dokter (spesialisasi disarankan)
 *   - emergency  : tanda bahaya, arahkan ke halaman Layanan Darurat
 *
 * Alur:
 *  1. Cek kata kunci darurat (red flag) dulu -> kalo ketemu, LANGSUNG darurat (AI gak dipanggil)
 *  2. Kalo AI_API_KEY diisi -> tanya Gemini (Google AI Studio)
 *  3. Kalo AI gagal / key kosong -> pakai aturan kata kunci (rule-based)
 */

const RED_FLAGS = [
  'sesak napas', 'sesak nafas', 'nyeri dada', 'pingsan', 'tidak sadar', 'kejang',
  'pendarahan hebat', 'perdarahan hebat', 'muntah darah', 'lumpuh', 'bicara pelo', 'bunuh diri',
];

// Nama spesialisasi disamakan dengan data dokter di seed.sql
const SPECIALIZATION_RULES = [
  { keywords: ['kulit', 'gatal', 'ruam', 'jerawat'], specialization: 'Spesialis Kulit' },
  { keywords: ['anak', 'bayi', 'balita'], specialization: 'Spesialis Anak' },
  { keywords: ['jantung', 'darah tinggi', 'hipertensi', 'berdebar'], specialization: 'Spesialis Jantung' },
  { keywords: ['diabetes', 'gula darah', 'lambung', 'maag', 'asam urat'], specialization: 'Spesialis Penyakit Dalam' },
];

const MILD_KEYWORDS = ['pilek', 'batuk ringan', 'pegal', 'capek', 'sakit kepala ringan'];
const GREETINGS = /^(halo|hai|hi|hello|pagi|siang|sore|malam|assalamualaikum|p)\b/i;
const LEVELS = ['self_care', 'consult', 'emergency'];

// Jawaban rule-based dalam 2 bahasa (mengikuti bahasa aplikasi pengguna)
const RULE_TEXT = {
  id: {
    emergency: 'Gejala yang kamu sebutkan bisa jadi tanda kondisi darurat. Segera ke IGD terdekat '
      + 'atau hubungi 119. Buka menu Layanan Darurat untuk melihat faskes terdekat.',
    greeting: 'Halo! Ceritakan keluhan yang kamu rasakan, misalnya gejalanya apa dan sudah berapa lama.',
    consult: (spec) => `Sebaiknya keluhan ini dikonsultasikan ke ${spec}. Kamu bisa mulai konsultasi dari menu Dokter.`,
    mild: 'Keluhan ini umumnya ringan. Istirahat cukup, minum air putih, dan pantau gejalanya. '
      + 'Kalau tidak membaik dalam 2-3 hari atau memburuk, konsultasikan ke dokter umum.',
    fallback: 'Terima kasih sudah bercerita. Untuk memastikan kondisimu, sebaiknya konsultasi dengan '
      + 'Dokter Umum. Bisa ceritakan sejak kapan gejalanya muncul?',
  },
  en: {
    emergency: 'The symptoms you describe may be a sign of an emergency. Go to the nearest emergency room '
      + 'or call 119 right away. Open the Emergency menu to see the nearest health facilities.',
    greeting: 'Hi! Tell me what you are feeling, for example your symptoms and how long you have had them.',
    consult: (spec) => `It is best to consult a ${spec} about this. You can start a consultation from the Doctors menu.`,
    mild: 'This complaint is usually mild. Get enough rest, drink water, and monitor your symptoms. '
      + 'If it does not improve in 2-3 days or gets worse, consult a general practitioner.',
    fallback: 'Thank you for sharing. To be sure about your condition, it is best to consult a '
      + 'General Practitioner. Could you tell me when the symptoms started?',
  },
};
const textFor = (lang) => RULE_TEXT[lang] || RULE_TEXT.id;

const emergencyReply = (lang = 'id') => ({
  triageLevel: 'emergency',
  suggestedSpecialization: 'IGD',
  reply: textFor(lang).emergency,
});

const hasRedFlag = (message) => RED_FLAGS.some((k) => message.toLowerCase().includes(k));

function ruleBasedTriage(message, lang = 'id') {
  const text = message.toLowerCase().trim();
  const tx = textFor(lang);

  if (hasRedFlag(text)) return emergencyReply(lang);

  if (GREETINGS.test(text) && text.split(/\s+/).length <= 3) {
    return {
      triageLevel: null,
      suggestedSpecialization: null,
      reply: tx.greeting,
    };
  }

  const match = SPECIALIZATION_RULES.find((r) => r.keywords.some((k) => text.includes(k)));
  if (match) {
    return {
      triageLevel: 'consult',
      suggestedSpecialization: match.specialization,
      reply: tx.consult(match.specialization),
    };
  }

  if (MILD_KEYWORDS.some((k) => text.includes(k))) {
    return {
      triageLevel: 'self_care',
      suggestedSpecialization: null,
      reply: tx.mild,
    };
  }

  return {
    triageLevel: 'consult',
    suggestedSpecialization: 'Dokter Umum',
    reply: tx.fallback,
  };
}

// ---------- Gemini ----------

async function getSpecializations() {
  try {
    const res = await query('SELECT DISTINCT specialization FROM doctors ORDER BY specialization');
    return res.rows.map((r) => r.specialization);
  } catch {
    return ['Dokter Umum'];
  }
}

function systemPrompt(specializations) {
  return `Kamu adalah "ZenQ AI", asisten triase kesehatan awal di aplikasi ZenQ (Indonesia).
Aturan:
- Jawab dalam Bahasa Indonesia yang ramah, singkat (maksimal 4 kalimat), dan mudah dipahami lansia.
- Kamu BUKAN dokter. Jangan memberi diagnosis pasti dan jangan menyebut dosis obat resep.
- Boleh menanyakan 1 pertanyaan lanjutan (durasi, tingkat keparahan, gejala lain) bila informasinya kurang.
- Tentukan triage_level:
  * "emergency" bila ada tanda bahaya (sesak napas, nyeri dada, pingsan, kejang, perdarahan hebat, stroke, pikiran bunuh diri, dll). Arahkan segera ke IGD / telepon 119.
  * "consult" bila sebaiknya diperiksa dokter.
  * "self_care" bila keluhan ringan yang bisa dirawat sendiri dulu (beri saran perawatan umum + kapan harus ke dokter).
  * null bila pengguna hanya menyapa atau belum menyebut keluhan.
- suggested_specialization WAJIB salah satu dari daftar ini (atau null): ${specializations.map((s) => `"${s}"`).join(', ')}.
- Tolak dengan sopan pertanyaan di luar topik kesehatan.
Balas HANYA dengan JSON: {"reply": string, "triage_level": "self_care"|"consult"|"emergency"|null, "suggested_specialization": string|null}`;
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const m = text.match(/\{[\s\S]*\}/); // kalo AI nambahin teks di luar JSON
    return m ? JSON.parse(m[0]) : null;
  }
}

async function askLLM(message, history, lang = 'id') {
  const specializations = await getSpecializations();

  // Riwayat chat sebelumnya biar AI ngerti konteks
  const contents = [];
  history.forEach((h) => {
    contents.push({ role: 'user', parts: [{ text: h.user_message }] });
    contents.push({ role: 'model', parts: [{ text: h.bot_reply }] });
  });
  contents.push({ role: 'user', parts: [{ text: message }] });

  const url = `${config.aiApiUrl}/models/${encodeURIComponent(config.aiModel)}:generateContent`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.aiApiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt(specializations) + (lang === 'en'
          ? '\n- PENTING: pengguna memakai aplikasi dalam bahasa Inggris. Tulis "reply" dalam bahasa Inggris. '
            + 'Nilai "specialization" tetap pakai nama persis dari daftar (bahasa Indonesia).'
          : '') }] },
        contents,
        generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 1024 },
      }),
      signal: AbortSignal.timeout(20000),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.warn(`Gemini error ${res.status}: ${json?.error?.message || 'tanpa pesan'}`);
      return null;
    }

    const text = (json.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
    const out = text ? parseJson(text) : null;
    if (!out?.reply) {
      console.warn('Gemini: respons kosong / bukan JSON, pakai rule-based.');
      return null;
    }

    return {
      reply: String(out.reply).slice(0, 1500),
      triageLevel: LEVELS.includes(out.triage_level) ? out.triage_level : null,
      suggestedSpecialization: specializations.includes(out.suggested_specialization) || out.suggested_specialization === 'IGD'
        ? out.suggested_specialization
        : null,
      source: 'gemini',
    };
  } catch (err) {
    console.warn('Gagal menghubungi Gemini:', err.message);
    return null;
  }
}

// lang: 'id' | 'en' (dari header Accept-Language yang dikirim frontend)
async function triage(message, history = [], lang = 'id') {
  // Red flag selalu menang, AI gak dipanggil dan gak bisa "menurunkan" level darurat.
  if (hasRedFlag(message)) return { ...emergencyReply(lang), source: 'rule' };

  if (config.aiApiKey && config.aiModel) {
    const llm = await askLLM(message, history, lang);
    if (llm) return llm;
  }
  return { ...ruleBasedTriage(message, lang), source: 'rule' };
}

module.exports = { triage, ruleBasedTriage, RED_FLAGS };