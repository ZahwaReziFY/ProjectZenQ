const bcrypt = require('bcryptjs');

/**
 * HASHING PASSWORD (bcrypt).
 *
 * Password TIDAK PERNAH disimpan apa adanya. Yang disimpan di kolom users.password adalah hash
 * bcrypt, contoh: $2a$12$Qm9v...  ->  $2a = algoritma bcrypt, $12 = cost (2^12 putaran), sisanya salt + hash.
 *  - Satu arah: hash tidak bisa dikembalikan jadi password asli.
 *  - Ada salt acak: dua user dengan password sama, hash-nya tetap beda.
 *  - Sengaja lambat (cost 12 ≈ ratusan milidetik): menebak jutaan password jadi tidak praktis.
 * Saat login, password yang diketik di-hash ulang dengan salt yang sama lalu dibandingkan (bcrypt.compare).
 */
const COST = 12;

// Hash palsu dengan cost sama, dipakai kalau email tidak terdaftar supaya waktu responsnya tetap sama
// (penyerang tidak bisa menebak email mana yang terdaftar dari lamanya respons).
const DUMMY_HASH = bcrypt.hashSync('zenq-dummy-password', COST);

const hashPassword = (plain) => bcrypt.hash(plain, COST);

async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash || DUMMY_HASH).then((ok) => ok && Boolean(hash));
}

// Hash lama (cost lebih kecil, mis. dari seed cost 10) -> di-upgrade otomatis saat user berhasil login
const needsRehash = (hash) => {
  try {
    return bcrypt.getRounds(hash) < COST;
  } catch {
    return false;
  }
};

module.exports = { hashPassword, verifyPassword, needsRehash, COST };
