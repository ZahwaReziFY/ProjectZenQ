/**
 * Validator sederhana. Tiap fungsi balikin string pesan error,
 * atau null kalo valid.
 */
function validateRequired(value, label) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return `${label} wajib diisi.`;
  }
  return null;
}

function validateEmail(email) {
  if (!email || typeof email !== 'string') return 'Email wajib diisi.';
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim()) ? null : 'Format email tidak valid.';
}

function validatePassword(password, isLogin = false) {
  if (!password || typeof password !== 'string') return 'Password wajib diisi.';
  if (isLogin) return null;
  if (password.length < 8) return 'Password minimal 8 karakter.';
  if (password.length > 72) return 'Password maksimal 72 karakter.'; // batas bcrypt
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Password harus mengandung huruf dan angka.';
  return null;
}

function validateCoordinates(lat, lng) {
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || la < -90 || la > 90) return 'Latitude tidak valid.';
  if (!Number.isFinite(ln) || ln < -180 || ln > 180) return 'Longitude tidak valid.';
  return null;
}

function parseId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

module.exports = {
  validateRequired,
  validateEmail,
  validatePassword,
  validateCoordinates,
  parseId,
};
