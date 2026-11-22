/**
 * Cek API key Gemini (dipakai chatbot + scan obat) dengan SATU perintah:
 *
 *   npm run cek-ai
 *
 * Yang dicek:
 *   1. AI_API_KEY sudah diisi dan formatnya wajar
 *   2. Key diterima Google (bukan salah / dihapus / belum aktif)
 *   3. Model di AI_MODEL ada; kalau tidak, ditampilkan model yang bisa dipakai
 *   4. Model benar-benar bisa menjawab
 * Key TIDAK pernah ditampilkan utuh di layar.
 */
const config = require('../config/env');
const { FALLBACK_MODELS } = require('../services/geminiOcrService');

const ok = (m) => console.log(`  ✔ ${m}`);
const bad = (m) => console.log(`  ✖ ${m}`);
const info = (m) => console.log(`    ${m}`);

async function main() {
  console.log('\nCek Gemini AI untuk ZenQ\n');
  const key = config.aiApiKey;

  // 1. Key ada?
  if (!key) {
    bad('AI_API_KEY masih kosong di backend/.env');
    info('Buat key gratis di https://aistudio.google.com/apikey lalu tempel di AI_API_KEY=');
    return;
  }
  const masked = `${key.slice(0, 4)}…${key.slice(-4)} (${key.length} karakter)`;
  ok(`AI_API_KEY terisi: ${masked}`);
  if (!key.startsWith('AIza')) {
    info('Catatan: key Gemini dari Google AI Studio biasanya diawali "AIza".');
    info('Kalau key ini dari layanan lain (OpenAI, dll), ZenQ tidak bisa memakainya.');
  }

  // 2. Key diterima Google? Sekalian ambil daftar model
  let models = [];
  try {
    const res = await fetch(`${config.aiApiUrl}/models?pageSize=200`, {
      headers: { 'x-goog-api-key': key },
      signal: AbortSignal.timeout(15000),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      bad(`Key DITOLAK Google (HTTP ${res.status}): ${json?.error?.message || 'tanpa pesan'}`);
      info('Solusi: buat key baru di https://aistudio.google.com/apikey, ganti AI_API_KEY, lalu restart backend.');
      return;
    }
    models = (json.models || [])
      .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map((m) => m.name.replace(/^models\//, ''));
    ok(`Key diterima Google (${models.length} model tersedia)`);
  } catch (err) {
    bad(`Tidak bisa menghubungi Google: ${err.message}`);
    info('Cek koneksi internet / firewall kampus, lalu coba lagi.');
    return;
  }

  // 3. Model ada?
  const candidates = [config.aiModel, ...FALLBACK_MODELS];
  const usable = candidates.filter((m) => models.includes(m));
  if (models.includes(config.aiModel)) {
    ok(`Model AI_MODEL="${config.aiModel}" tersedia`);
  } else {
    bad(`Model AI_MODEL="${config.aiModel}" TIDAK tersedia untuk key ini`);
    if (usable.length) info(`Ganti ke salah satu ini: ${usable.join(', ')}`);
    else info(`Model flash yang tersedia: ${models.filter((m) => m.includes('flash')).slice(0, 8).join(', ')}`);
  }

  // 4. Coba minta jawaban
  const testModel = usable[0] || config.aiModel;
  try {
    const res = await fetch(`${config.aiApiUrl}/models/${encodeURIComponent(testModel)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Balas dengan satu kata: OK' }] }] }),
      signal: AbortSignal.timeout(20000),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      bad(`Model ${testModel} gagal menjawab (HTTP ${res.status}): ${json?.error?.message || ''}`);
      if (res.status === 429) info('Kuota gratis habis / terlalu sering. Tunggu beberapa menit atau buat key di project lain.');
      return;
    }
    const reply = (json.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
    ok(`Model ${testModel} menjawab: "${reply.slice(0, 40)}"`);
    console.log('\n🎉 Gemini siap dipakai untuk chatbot dan scan obat. Restart backend kalau tadi mengubah .env.\n');
  } catch (err) {
    bad(`Gagal menguji model: ${err.message}`);
  }
}

main();
