const { query } = require('../config/db');
const sendResponse = require('../utils/response');
const { PUBLIC_FIELDS } = require('./auth.controller');
const { isImageDataUrl } = require('../utils/image');
const { hashPassword, verifyPassword } = require('../utils/password');
const { validatePassword } = require('../utils/validation');

// PUT /users/me - update profil sendiri
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, birth_date: birthDate, gender, address, city, health_conditions: conditions } = req.body || {};

    const result = await query(
      `UPDATE users SET
         name = COALESCE($1, name),
         phone = COALESCE($2, phone),
         birth_date = COALESCE($3, birth_date),
         gender = COALESCE($4, gender),
         address = COALESCE($5, address),
         city = COALESCE($6, city),
         health_conditions = COALESCE($7, health_conditions),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING ${PUBLIC_FIELDS}`,
      [
        name?.trim() || null,
        phone || null,
        birthDate || null,
        ['male', 'female'].includes(gender) ? gender : null,
        address || null,
        city || null,
        Array.isArray(conditions) ? conditions : null,
        req.user.id,
      ]
    );

    return sendResponse(res, { message: 'Profil berhasil diperbarui.', data: result.rows[0] });
  } catch (err) {
    return next(err);
  }
};

// PUT /users/me/avatar { avatar: dataURL | null } - ganti / hapus foto profil
// Foto sudah dipotong persegi & dikecilkan (maks 400px) di browser, jadi ukurannya kecil.
const updateAvatar = async (req, res, next) => {
  try {
    const { avatar } = req.body || {};
    if (avatar !== null && !isImageDataUrl(avatar, 400)) {
      return sendResponse(res, { code: 400, success: false, message: 'Foto tidak valid atau terlalu besar (maks 400 KB).' });
    }
    const result = await query(
      `UPDATE users SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING ${PUBLIC_FIELDS}`,
      [avatar, req.user.id]
    );
    return sendResponse(res, { message: avatar ? 'Foto profil diperbarui.' : 'Foto profil dihapus.', data: result.rows[0] });
  } catch (err) {
    return next(err);
  }
};

// PUT /users/me/password { current_password, new_password }
// Wajib memasukkan password lama dulu, supaya orang lain yang sempat memegang HP/laptop
// yang sedang login tidak bisa mengganti password.
const changePassword = async (req, res, next) => {
  try {
    const { current_password: current, new_password: next_ } = req.body || {};
    if (!current) return sendResponse(res, { code: 400, success: false, message: 'Masukkan password lama.' });
    const err = validatePassword(next_);
    if (err) return sendResponse(res, { code: 400, success: false, message: err });
    if (current === next_) return sendResponse(res, { code: 400, success: false, message: 'Password baru harus berbeda dari password lama.' });

    const found = await query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    if (!(await verifyPassword(current, found.rows[0]?.password))) {
      return sendResponse(res, { code: 400, success: false, message: 'Password lama salah.' });
    }
    await query('UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [await hashPassword(next_), req.user.id]);
    return sendResponse(res, { message: 'Password berhasil diganti.' });
  } catch (e) {
    return next(e);
  }
};

module.exports = { updateProfile, updateAvatar, changePassword };
