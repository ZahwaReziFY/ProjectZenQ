const { query } = require('../config/db');
const { emitToConsultation } = require('../socket');
const sendResponse = require('../utils/response');
const { parseId } = require('../utils/validation');
const { notify } = require('../services/notificationService');
const { completeOrderOf } = require('../services/orderService');

/**
 * Konsultasi dibuat lewat POST /orders (kind: consultation) dan aktif setelah dibayar.
 * Chat disimpen di consultation_messages, frontend polling tiap beberapa detik.
 * Video call & telepon: UI sudah ada di frontend, koneksinya butuh WebRTC.
 * TODO (AI/Integration Developer): signaling server (misal socket.io) buat tukar offer/answer/ICE.
 */

const STATUSES = ['ongoing', 'completed', 'cancelled'];
const MESSAGE_TYPES = ['text', 'image'];
// Foto dari tombol Kamera dikirim sebagai data URL JPEG/PNG/WebP (sudah dikecilkan di browser, ~100-200 KB)
const IMAGE_PREFIX = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
const MAX_IMAGE_CHARS = 900 * 1024;

async function findAccessible(id, user) {
  const result = await query(
    `SELECT c.*, pu.name AS patient_name, du.name AS doctor_name, d.user_id AS doctor_user_id,
            d.specialization, d.hospital, d.is_online, d.consultation_fee, o.code AS order_code
     FROM consultations c
     JOIN users pu ON pu.id = c.patient_id
     JOIN doctors d ON d.id = c.doctor_id
     JOIN users du ON du.id = d.user_id
     LEFT JOIN orders o ON o.id = c.order_id
     WHERE c.id = $1`,
    [id]
  );
  const c = result.rows[0];
  if (!c) return null;
  const allowed = user.role === 'admin' || c.patient_id === user.id || c.doctor_user_id === user.id;
  return allowed ? c : false;
}

const denied = (res, c) =>
  sendResponse(res, {
    code: c === null ? 404 : 403,
    success: false,
    message: c === null ? 'Konsultasi tidak ditemukan.' : 'Tidak punya akses.',
  });

// GET /consultations
const getMine = async (req, res, next) => {
  try {
    const isDoctor = req.user.role === 'doctor';
    const result = await query(
      `SELECT c.*, pu.name AS patient_name, du.name AS doctor_name, d.specialization
       FROM consultations c
       JOIN users pu ON pu.id = c.patient_id
       JOIN doctors d ON d.id = c.doctor_id
       JOIN users du ON du.id = d.user_id
       WHERE ${isDoctor ? 'd.user_id' : 'c.patient_id'} = $1 AND c.status <> 'pending'
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    return sendResponse(res, { data: result.rows });
  } catch (err) {
    return next(err);
  }
};

// GET /consultations/:id
const getById = async (req, res, next) => {
  try {
    const c = await findAccessible(parseId(req.params.id), req.user);
    if (!c) return denied(res, c);
    return sendResponse(res, { data: c });
  } catch (err) {
    return next(err);
  }
};

// PATCH /consultations/:id/status { status, doctor_notes }
const updateStatus = async (req, res, next) => {
  try {
    const { status, doctor_notes: notes } = req.body || {};
    if (!STATUSES.includes(status)) {
      return sendResponse(res, { code: 400, success: false, message: 'Status tidak valid.' });
    }

    const c = await findAccessible(parseId(req.params.id), req.user);
    if (!c) return denied(res, c);
    if (c.status === 'pending') {
      return sendResponse(res, { code: 400, success: false, message: 'Konsultasi belum dibayar.' });
    }

    const result = await query(
      `UPDATE consultations SET
         status = $1::varchar,
         doctor_notes = COALESCE($2, doctor_notes),
         ended_at = CASE WHEN $1::varchar IN ('completed', 'cancelled') THEN CURRENT_TIMESTAMP ELSE ended_at END
       WHERE id = $3 RETURNING *`,
      [status, notes || null, c.id]
    );

    if (status === 'completed') await completeOrderOf('consultations', c.id);

    const target = req.user.id === c.patient_id ? c.doctor_user_id : c.patient_id;
    await notify(target, {
      title: 'Status konsultasi berubah',
      body: `Konsultasi dengan ${req.user.name} sekarang: ${status}.`,
      type: 'consultation',
      referenceId: c.id,
    });

    return sendResponse(res, { message: 'Status diperbarui.', data: result.rows[0] });
  } catch (err) {
    return next(err);
  }
};

// GET /consultations/:id/messages?after_id=
const getMessages = async (req, res, next) => {
  try {
    const c = await findAccessible(parseId(req.params.id), req.user);
    if (!c) return denied(res, c);

    const afterId = parseId(req.query.after_id) || 0;
    const result = await query(
      `SELECT m.*, u.name AS sender_name FROM consultation_messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.consultation_id = $1 AND m.id > $2 ORDER BY m.id`,
      [c.id, afterId]
    );
    return sendResponse(res, { data: result.rows });
  } catch (err) {
    return next(err);
  }
};

// POST /consultations/:id/messages { message, type }
// type 'text'  -> message = teks (maks 2000 karakter)
// type 'image' -> message = data URL foto dari tombol Kamera
// Pengirim SELALU diambil dari token login (req.user), bukan dari isi request.
const sendMessage = async (req, res, next) => {
  try {
    const type = MESSAGE_TYPES.includes(req.body?.type) ? req.body.type : 'text';
    const raw = String(req.body?.message || '').trim();
    if (!raw) return sendResponse(res, { code: 400, success: false, message: 'Pesan kosong.' });
    if (type === 'image' && (raw.length > MAX_IMAGE_CHARS || !IMAGE_PREFIX.test(raw))) {
      return sendResponse(res, { code: 400, success: false, message: 'Foto tidak valid atau terlalu besar.' });
    }
    const message = type === 'image' ? raw : raw.slice(0, 2000);

    const c = await findAccessible(parseId(req.params.id), req.user);
    if (!c) return denied(res, c);
    if (c.status !== 'ongoing') {
      return sendResponse(res, {
        code: 400,
        success: false,
        message: c.status === 'pending' ? 'Selesaikan pembayaran untuk mulai konsultasi.' : 'Konsultasi sudah selesai.',
      });
    }

    const result = await query(
      'INSERT INTO consultation_messages (consultation_id, sender_id, type, message) VALUES ($1, $2, $3, $4) RETURNING *',
      [c.id, req.user.id, type, message]
    );
    emitToConsultation(c.id, 'chat:message', result.rows[0]); // langsung muncul di layar lawan bicara
    return sendResponse(res, { code: 201, data: result.rows[0] });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getMine, getById, updateStatus, getMessages, sendMessage };
