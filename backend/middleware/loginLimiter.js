/**
 * Batas percobaan login: maksimal 5 kali GAGAL per (email + IP) dalam 15 menit.
 * Mencegah brute force (menebak password berulang-ulang). Berhasil login -> hitungan direset.
 * Disimpan di memori server (cukup untuk 1 server; kalau server lebih dari 1, pindahkan ke Redis).
 */
const MAX_FAILS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const attempts = new Map(); // key -> { count, first }

const keyOf = (req) => `${(req.body?.email || '').trim().toLowerCase()}|${req.ip}`;

function checkLoginLimit(req) {
  const rec = attempts.get(keyOf(req));
  if (!rec) return null;
  if (Date.now() - rec.first > WINDOW_MS) {
    attempts.delete(keyOf(req));
    return null;
  }
  if (rec.count >= MAX_FAILS) {
    const minutes = Math.ceil((WINDOW_MS - (Date.now() - rec.first)) / 60000);
    return `Terlalu banyak percobaan login gagal. Coba lagi dalam ${minutes} menit.`;
  }
  return null;
}

function recordLoginFail(req) {
  const key = keyOf(req);
  const rec = attempts.get(key);
  if (!rec || Date.now() - rec.first > WINDOW_MS) attempts.set(key, { count: 1, first: Date.now() });
  else rec.count += 1;
  const left = MAX_FAILS - attempts.get(key).count;
  return left;
}

const resetLoginFails = (req) => attempts.delete(keyOf(req));

// Bersihkan data lama tiap 30 menit
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of attempts) if (now - v.first > WINDOW_MS) attempts.delete(k);
}, 30 * 60 * 1000).unref();

module.exports = { checkLoginLimit, recordLoginFail, resetLoginFails, MAX_FAILS };
