const { hashPassword, verifyPassword, needsRehash } = require('../utils/password');
const { checkLoginLimit, recordLoginFail, resetLoginFails } = require('../middleware/loginLimiter');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const config = require('../config/env');
const sendResponse = require('../utils/response');
const { validateEmail, validatePassword, validateRequired } = require('../utils/validation');

const PUBLIC_FIELDS = 'id, name, email, role, phone, birth_date, gender, address, city, health_conditions, avatar_url, created_at';

function signToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn, algorithm: 'HS256' }
  );
}

// POST /auth/register - registrasi pasien baru
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body || {};
    const error =
      validateRequired(name, 'Nama') || validateEmail(email) || validatePassword(password);
    if (error) return sendResponse(res, { code: 400, success: false, message: error });

    const cleanEmail = email.trim().toLowerCase();
    const exists = await query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
    if (exists.rows.length) {
      return sendResponse(res, { code: 409, success: false, message: 'Email sudah terdaftar.' });
    }

    const hash = await hashPassword(password); // bcrypt, lihat utils/password.js
    const result = await query(
      `INSERT INTO users (name, email, password, phone, role)
       VALUES ($1, $2, $3, $4, 'patient')
       RETURNING ${PUBLIC_FIELDS}`,
      [name.trim(), cleanEmail, hash, phone || null]
    );

    const user = result.rows[0];
    return sendResponse(res, {
      code: 201,
      message: 'Registrasi berhasil!',
      data: { user, token: signToken(user) },
    });
  } catch (err) {
    return next(err);
  }
};

// POST /auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const error = validateEmail(email) || validatePassword(password, true);
    if (error) return sendResponse(res, { code: 400, success: false, message: error });

    const blocked = checkLoginLimit(req);
    if (blocked) return sendResponse(res, { code: 429, success: false, message: blocked });

    const result = await query(
      `SELECT ${PUBLIC_FIELDS}, password FROM users WHERE email = $1`,
      [email.trim().toLowerCase()]
    );
    const user = result.rows[0];

    // verifyPassword tetap menjalankan bcrypt walau email tidak ada (waktu respons sama)
    if (!(await verifyPassword(password, user?.password))) {
      const left = recordLoginFail(req);
      if (left <= 0) return sendResponse(res, { code: 429, success: false, message: checkLoginLimit(req) });
      const hint = left <= 2 ? ` Sisa ${left} percobaan sebelum diblokir 15 menit.` : '';
      return sendResponse(res, { code: 401, success: false, message: `Email atau password salah.${hint}` });
    }
    resetLoginFails(req);

    // Upgrade hash lama (cost lebih rendah) ke cost terbaru tanpa user sadar
    if (needsRehash(user.password)) {
      await query('UPDATE users SET password = $1 WHERE id = $2', [await hashPassword(password), user.id]);
    }

    delete user.password;
    return sendResponse(res, {
      message: 'Login berhasil!',
      data: { user, token: signToken(user) },
    });
  } catch (err) {
    return next(err);
  }
};

// GET /auth/me
const getMe = async (req, res, next) => {
  try {
    const result = await query(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id = $1`, [req.user.id]);
    if (!result.rows.length) {
      return sendResponse(res, { code: 404, success: false, message: 'Data pengguna tidak ditemukan.' });
    }
    return sendResponse(res, { data: result.rows[0] });
  } catch (err) {
    return next(err);
  }
};

module.exports = { register, login, getMe, PUBLIC_FIELDS };
