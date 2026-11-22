const { hashPassword } = require('../utils/password');
const { pool, query } = require('../config/db');
const sendResponse = require('../utils/response');
const { parseId, validateEmail, validatePassword, validateRequired } = require('../utils/validation');
const { isImageDataUrl } = require('../utils/image');

const num = (v, fallback = null) => (v === undefined || v === null || v === '' ? fallback : Number(v));

// GET /admin/stats
const getStats = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'patient')::int AS patients,
        (SELECT COUNT(*) FROM doctors)::int AS doctors,
        (SELECT COUNT(*) FROM orders)::int AS orders,
        (SELECT COUNT(*) FROM orders WHERE status = 'processing')::int AS processing_orders,
        (SELECT COALESCE(SUM(total), 0) FROM orders WHERE paid_at IS NOT NULL)::int AS revenue,
        (SELECT COUNT(*) FROM articles WHERE is_published)::int AS articles`);
    return sendResponse(res, { data: result.rows[0] });
  } catch (err) {
    return next(err);
  }
};

// ---------- Kelola dokter ----------

// POST /admin/doctors - bikin akun user + profil dokter (transaksi)
const createDoctor = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const b = req.body || {};
    const error =
      validateRequired(b.name, 'Nama') ||
      validateEmail(b.email) ||
      validatePassword(b.password) ||
      validateRequired(b.specialization, 'Spesialisasi');
    if (error) return sendResponse(res, { code: 400, success: false, message: error });

    await client.query('BEGIN');
    const hash = await hashPassword(b.password);
    const user = await client.query(
      `INSERT INTO users (name, email, password, phone, role) VALUES ($1, $2, $3, $4, 'doctor') RETURNING id`,
      [b.name.trim(), b.email.trim().toLowerCase(), hash, b.phone || null]
    );
    const doctor = await client.query(
      `INSERT INTO doctors (user_id, specialization, hospital, practice_hours, bio, experience_years,
         consultation_fee, original_fee, home_visit_fee, accepts_home_visit)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        user.rows[0].id, b.specialization, b.hospital || null, b.practice_hours || null, b.bio || null,
        num(b.experience_years, 0), num(b.consultation_fee, 0), num(b.original_fee),
        num(b.home_visit_fee, num(b.consultation_fee, 0)), b.accepts_home_visit !== false,
      ]
    );
    await client.query('COMMIT');
    return sendResponse(res, { code: 201, message: 'Dokter ditambahkan.', data: doctor.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') return sendResponse(res, { code: 409, success: false, message: 'Email sudah terdaftar.' });
    return next(err);
  } finally {
    client.release();
  }
};

// PUT /admin/doctors/:id
// PUT /admin/doctors/:id - ubah data akun (nama, email, HP, password opsional) + data praktik
const updateDoctor = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const b = req.body || {};
    const id = parseId(req.params.id);
    if (b.email !== undefined) {
      const err = validateEmail(b.email);
      if (err) return sendResponse(res, { code: 400, success: false, message: err });
    }
    if (b.password) {
      const err = validatePassword(b.password);
      if (err) return sendResponse(res, { code: 400, success: false, message: err });
    }

    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE doctors SET
         specialization = COALESCE($1, specialization),
         hospital = COALESCE($2, hospital),
         practice_hours = COALESCE($3, practice_hours),
         consultation_fee = COALESCE($4, consultation_fee),
         original_fee = COALESCE($5, original_fee),
         home_visit_fee = COALESCE($6, home_visit_fee),
         accepts_home_visit = COALESCE($7, accepts_home_visit),
         experience_years = COALESCE($8, experience_years),
         bio = COALESCE($9, bio)
       WHERE id = $10 RETURNING *`,
      [
        b.specialization?.trim() || null, b.hospital?.trim() || null, b.practice_hours?.trim() || null,
        num(b.consultation_fee), num(b.original_fee), num(b.home_visit_fee),
        typeof b.accepts_home_visit === 'boolean' ? b.accepts_home_visit : null,
        num(b.experience_years), b.bio ?? null,
        id,
      ]
    );
    if (!result.rows.length) {
      await client.query('ROLLBACK');
      return sendResponse(res, { code: 404, success: false, message: 'Dokter tidak ditemukan.' });
    }
    const hash = b.password ? await hashPassword(b.password) : null;
    await client.query(
      `UPDATE users SET
         name = COALESCE($1, name), email = COALESCE($2, email), phone = COALESCE($3, phone),
         password = COALESCE($4, password), updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [b.name?.trim() || null, b.email?.trim().toLowerCase() || null, b.phone?.trim() || null, hash, result.rows[0].user_id]
    );
    await client.query('COMMIT');
    return sendResponse(res, { message: 'Data dokter diperbarui.', data: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') return sendResponse(res, { code: 409, success: false, message: 'Email sudah dipakai akun lain.' });
    return next(err);
  } finally {
    client.release();
  }
};

// DELETE /admin/doctors/:id
const deleteDoctor = async (req, res, next) => {
  try {
    const result = await query(
      'DELETE FROM users WHERE id = (SELECT user_id FROM doctors WHERE id = $1) RETURNING id',
      [parseId(req.params.id)]
    );
    if (!result.rows.length) return sendResponse(res, { code: 404, success: false, message: 'Dokter tidak ditemukan.' });
    return sendResponse(res, { message: 'Dokter dihapus.' });
  } catch (err) {
    return next(err);
  }
};

// ---------- Kelola konten edukasi (artikel) ----------
// Admin bisa bikin, ubah, sembunyikan, dan hapus artikel. Sampul artikel (cover_url) boleh
// berupa foto yang diunggah (data URL, sudah dikecilkan di browser) atau link gambar https.

const slugify = (text) =>
  text.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 200);

const cleanCover = (v) => {
  if (v === null || v === '') return '';
  if (typeof v !== 'string') return undefined;
  // foto unggahan (data URL), link https, atau gambar bawaan ZenQ (/edu/xxx.svg)
  if (isImageDataUrl(v, 900) || /^https:\/\/\S+$/.test(v) || /^\/edu\/[a-z0-9-]+\.(svg|png|jpe?g|webp)$/.test(v)) return v;
  return undefined; // format gak dikenal -> diabaikan
};

// GET /admin/articles (termasuk yang disembunyikan)
const getArticles = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM articles ORDER BY is_featured DESC, created_at DESC');
    return sendResponse(res, { data: result.rows });
  } catch (err) {
    return next(err);
  }
};

// POST /admin/articles
const createArticle = async (req, res, next) => {
  try {
    const b = req.body || {};
    const error = validateRequired(b.title, 'Judul') || validateRequired(b.content, 'Isi artikel');
    if (error) return sendResponse(res, { code: 400, success: false, message: error });

    if (b.is_featured) await query('UPDATE articles SET is_featured = FALSE'); // cuma 1 artikel unggulan
    const result = await query(
      `INSERT INTO articles (title, slug, summary, content, category, emoji, is_featured, tags, cover_url, author_id, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        b.title.trim(), `${slugify(b.title)}-${Date.now().toString(36)}`, b.summary?.trim() || null, b.content,
        b.category?.trim() || 'Umum', b.emoji || '📚', Boolean(b.is_featured),
        Array.isArray(b.tags) ? b.tags : [], cleanCover(b.cover_url) || null, req.user.id, b.is_published !== false,
      ]
    );
    return sendResponse(res, { code: 201, message: 'Artikel dibuat.', data: result.rows[0] });
  } catch (err) {
    return next(err);
  }
};

// PUT /admin/articles/:id
const updateArticle = async (req, res, next) => {
  try {
    const b = req.body || {};
    const id = parseId(req.params.id);
    if (b.is_featured === true) await query('UPDATE articles SET is_featured = FALSE WHERE id <> $1', [id]);
    const cover = cleanCover(b.cover_url); // undefined = gak diubah, '' = dihapus
    const result = await query(
      `UPDATE articles SET
         title = COALESCE($1, title), summary = COALESCE($2, summary), content = COALESCE($3, content),
         category = COALESCE($4, category), emoji = COALESCE($5, emoji),
         is_featured = COALESCE($6, is_featured), is_published = COALESCE($7, is_published),
         cover_url = CASE WHEN $8::text IS NULL THEN cover_url WHEN $8 = '' THEN NULL ELSE $8 END
       WHERE id = $9 RETURNING *`,
      [
        b.title?.trim() || null, b.summary?.trim() ?? null, b.content || null, b.category?.trim() || null, b.emoji || null,
        typeof b.is_featured === 'boolean' ? b.is_featured : null,
        typeof b.is_published === 'boolean' ? b.is_published : null,
        cover === undefined ? null : cover,
        id,
      ]
    );
    if (!result.rows.length) return sendResponse(res, { code: 404, success: false, message: 'Artikel tidak ditemukan.' });
    return sendResponse(res, { message: 'Artikel diperbarui.', data: result.rows[0] });
  } catch (err) {
    return next(err);
  }
};

// DELETE /admin/articles/:id
const deleteArticle = async (req, res, next) => {
  try {
    const result = await query('DELETE FROM articles WHERE id = $1 RETURNING id', [parseId(req.params.id)]);
    if (!result.rows.length) return sendResponse(res, { code: 404, success: false, message: 'Artikel tidak ditemukan.' });
    return sendResponse(res, { message: 'Artikel dihapus.' });
  } catch (err) {
    return next(err);
  }
};


// ---------- Kelola pesanan ----------

// GET /admin/orders?status=
const getOrders = async (req, res, next) => {
  try {
    const params = [];
    let where = '';
    if (req.query.status) {
      params.push(req.query.status);
      where = 'WHERE o.status = $1';
    }
    const result = await query(
      `SELECT o.*, u.name AS customer_name FROM orders o JOIN users u ON u.id = o.user_id
       ${where} ORDER BY o.created_at DESC LIMIT 200`,
      params
    );
    return sendResponse(res, { data: result.rows });
  } catch (err) {
    return next(err);
  }
};

// PATCH /admin/orders/:id/status { status: completed|cancelled }
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body || {};
    if (!['processing', 'completed', 'cancelled'].includes(status)) {
      return sendResponse(res, { code: 400, success: false, message: 'Status tidak valid.' });
    }
    const result = await query(
      `UPDATE orders SET status = $1::varchar,
         completed_at = CASE WHEN $1::varchar = 'completed' THEN NOW() ELSE completed_at END,
         cancelled_at = CASE WHEN $1::varchar = 'cancelled' THEN NOW() ELSE cancelled_at END
       WHERE id = $2 RETURNING *`,
      [status, parseId(req.params.id)]
    );
    if (!result.rows.length) return sendResponse(res, { code: 404, success: false, message: 'Pesanan tidak ditemukan.' });
    return sendResponse(res, { message: 'Status pesanan diperbarui.', data: result.rows[0] });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getStats,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  getOrders,
  updateOrderStatus,
};
