const { query } = require('../config/db');
const sendResponse = require('../utils/response');
const { parseId } = require('../utils/validation');

const DOCTOR_SELECT = `
  SELECT d.*, u.name, u.email, u.phone, u.avatar_url
  FROM doctors d
  JOIN users u ON u.id = d.user_id`;

const SORTS = {
  rating: 'd.rating DESC',
  murah: 'd.consultation_fee ASC',
  default: 'd.is_online DESC, d.rating DESC',
};

// GET /doctors?search=&specialization=&sort=rating|murah&online=true&home_visit=true&limit=
const getAll = async (req, res, next) => {
  try {
    const { specialization, search, sort, online, home_visit: homeVisit, limit } = req.query;
    const conditions = [];
    const params = [];

    if (specialization) {
      params.push(specialization);
      conditions.push(`d.specialization = $${params.length}`);
    }
    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      conditions.push(`(LOWER(u.name) LIKE $${params.length} OR LOWER(d.specialization) LIKE $${params.length})`);
    }
    if (online === 'true') conditions.push('d.is_online = TRUE');
    if (homeVisit === 'true') conditions.push('d.accepts_home_visit = TRUE');

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const lim = Math.min(Number(limit) || 100, 100);
    const result = await query(
      `${DOCTOR_SELECT} ${where} ORDER BY ${SORTS[sort] || SORTS.default}, d.id LIMIT ${lim}`,
      params
    );
    return sendResponse(res, { data: result.rows });
  } catch (err) {
    return next(err);
  }
};

// GET /doctors/specializations
const getSpecializations = async (req, res, next) => {
  try {
    const result = await query('SELECT DISTINCT specialization FROM doctors ORDER BY specialization');
    return sendResponse(res, { data: result.rows.map((r) => r.specialization) });
  } catch (err) {
    return next(err);
  }
};

// GET /doctors/:id - profil + ulasan
const getById = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return sendResponse(res, { code: 400, success: false, message: 'ID dokter tidak valid.' });

    const doctor = await query(`${DOCTOR_SELECT} WHERE d.id = $1`, [id]);
    if (!doctor.rows.length) {
      return sendResponse(res, { code: 404, success: false, message: 'Dokter tidak ditemukan.' });
    }

    const reviews = await query(
      `SELECT r.id, r.rating, r.comment, r.created_at, u.name AS patient_name
       FROM doctor_reviews r JOIN users u ON u.id = r.patient_id
       WHERE r.doctor_id = $1 ORDER BY r.created_at DESC LIMIT 20`,
      [id]
    );

    return sendResponse(res, { data: { ...doctor.rows[0], reviews: reviews.rows } });
  } catch (err) {
    return next(err);
  }
};

// POST /doctors/:id/reviews
const addReview = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const rating = Number(req.body?.rating);
    if (!id || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return sendResponse(res, { code: 400, success: false, message: 'Rating harus 1-5.' });
    }

    await query(
      'INSERT INTO doctor_reviews (doctor_id, patient_id, rating, comment) VALUES ($1, $2, $3, $4)',
      [id, req.user.id, rating, req.body?.comment || null]
    );
    await query(
      `UPDATE doctors SET
         rating = (SELECT ROUND(AVG(rating)::numeric, 1) FROM doctor_reviews WHERE doctor_id = $1),
         rating_count = (SELECT COUNT(*) FROM doctor_reviews WHERE doctor_id = $1)
       WHERE id = $1`,
      [id]
    );
    return sendResponse(res, { code: 201, message: 'Ulasan berhasil dikirim.' });
  } catch (err) {
    return next(err);
  }
};

// GET /doctors/me - data dokter yang sedang login (dipakai dashboard dokter, termasuk status online)
const getMe = async (req, res, next) => {
  try {
    const result = await query(`${DOCTOR_SELECT} WHERE d.user_id = $1`, [req.user.id]);
    if (!result.rows.length) {
      return sendResponse(res, { code: 404, success: false, message: 'Profil dokter tidak ditemukan.' });
    }
    return sendResponse(res, { data: result.rows[0] });
  } catch (err) {
    return next(err);
  }
};

// PATCH /doctors/me/status { is_online }
// Online  = muncul sebagai "Online" dan bisa dipesan pasien
// Offline = tetap tampil di daftar, tapi tombol pesan dinonaktifkan & backend menolak pesanan baru
const setOnlineStatus = async (req, res, next) => {
  try {
    const result = await query(
      'UPDATE doctors SET is_online = $1 WHERE user_id = $2 RETURNING id, is_online',
      [Boolean(req.body?.is_online), req.user.id]
    );
    if (!result.rows.length) {
      return sendResponse(res, { code: 404, success: false, message: 'Profil dokter tidak ditemukan.' });
    }
    return sendResponse(res, {
      message: result.rows[0].is_online ? 'Anda sekarang online dan bisa dipesan pasien.' : 'Anda sekarang offline. Pasien tidak bisa memesan Anda.',
      data: result.rows[0],
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getAll, getSpecializations, getById, addReview, getMe, setOnlineStatus };
