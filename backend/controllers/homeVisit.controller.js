const { query } = require('../config/db');
const sendResponse = require('../utils/response');
const { parseId } = require('../utils/validation');
const { notify } = require('../services/notificationService');
const { completeOrderOf, withDetails } = require('../services/orderService');

/**
 * Home visit dibuat lewat POST /orders (kind: home_visit). Di sini: list pesanan,
 * detail pesanan (buat dokter), dan update status perjalanan dokter.
 *
 * Alur status (yang dilihat pasien di Riwayat -> Status Pesanan):
 *   pending     -> sudah dibayar, menunggu dokter
 *   accepted    -> "Dokter melihat pesanan Anda"
 *   on_the_way  -> "Dokter sedang dalam perjalanan"
 *   completed   -> "Pesanan selesai"
 */
const STATUSES = ['accepted', 'on_the_way', 'completed', 'cancelled'];
const STATUS_TEXT = {
  accepted: 'Dokter sudah melihat pesanan home visit kamu dan akan datang sesuai jadwal.',
  on_the_way: 'Dokter sedang dalam perjalanan ke lokasimu.',
  completed: 'Kunjungan selesai. Terima kasih sudah menggunakan ZenQ.',
  cancelled: 'Pesanan home visit dibatalkan.',
};

// GET /home-visits
const getMine = async (req, res, next) => {
  try {
    const isDoctor = req.user.role === 'doctor';
    const result = await query(
      `SELECT h.*, pu.name AS patient_name, du.name AS doctor_name, o.code AS order_code
       FROM home_visits h
       JOIN users pu ON pu.id = h.patient_id
       LEFT JOIN doctors d ON d.id = h.doctor_id
       LEFT JOIN users du ON du.id = d.user_id
       LEFT JOIN orders o ON o.id = h.order_id
       WHERE ${isDoctor ? 'd.user_id' : 'h.patient_id'} = $1 AND h.status <> 'awaiting_payment'
       ORDER BY h.scheduled_at DESC`,
      [req.user.id]
    );
    return sendResponse(res, { data: result.rows });
  } catch (err) {
    return next(err);
  }
};

// GET /home-visits/:id - detail kunjungan + pesanannya (dokter yang dituju / admin)
const getById = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const found = await query(
      `SELECT h.*, d.user_id AS doctor_user_id, du.name AS doctor_name,
              pu.name AS patient_name, pu.phone AS patient_phone, pu.avatar_url AS patient_avatar
       FROM home_visits h
       JOIN users pu ON pu.id = h.patient_id
       LEFT JOIN doctors d ON d.id = h.doctor_id
       LEFT JOIN users du ON du.id = d.user_id
       WHERE h.id = $1`,
      [id]
    );
    const visit = found.rows[0];
    if (!visit) return sendResponse(res, { code: 404, success: false, message: 'Pesanan tidak ditemukan.' });
    if (req.user.role !== 'admin' && visit.doctor_user_id !== req.user.id) {
      return sendResponse(res, { code: 403, success: false, message: 'Tidak punya akses ke pesanan ini.' });
    }
    const orderRow = visit.order_id ? (await query('SELECT * FROM orders WHERE id = $1', [visit.order_id])).rows[0] : null;
    const order = orderRow ? await withDetails(orderRow) : null;
    return sendResponse(res, { data: { ...visit, order } });
  } catch (err) {
    return next(err);
  }
};

// PATCH /home-visits/:id/status { status } - dokter/admin
const updateStatus = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const { status } = req.body || {};
    if (!id || !STATUSES.includes(status)) {
      return sendResponse(res, { code: 400, success: false, message: 'Status tidak valid.' });
    }

    const found = await query(
      `SELECT h.*, d.user_id AS doctor_user_id FROM home_visits h
       LEFT JOIN doctors d ON d.id = h.doctor_id WHERE h.id = $1`,
      [id]
    );
    const visit = found.rows[0];
    if (!visit) return sendResponse(res, { code: 404, success: false, message: 'Pesanan tidak ditemukan.' });
    if (req.user.role !== 'admin' && visit.doctor_user_id !== req.user.id) {
      return sendResponse(res, { code: 403, success: false, message: 'Tidak punya akses mengubah status ini.' });
    }
    if (visit.status === 'awaiting_payment') {
      return sendResponse(res, { code: 400, success: false, message: 'Pesanan belum dibayar.' });
    }

    const result = await query('UPDATE home_visits SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
    if (status === 'completed') await completeOrderOf('home_visits', id);
    if (status === 'cancelled' && visit.order_id) {
      await query(`UPDATE orders SET status = 'cancelled', cancelled_at = NOW() WHERE id = $1`, [visit.order_id]);
    }

    await notify(visit.patient_id, {
      title: 'Home Visit',
      body: STATUS_TEXT[status],
      type: 'home_visit',
      referenceId: visit.order_id,
      senderDoctorId: visit.doctor_id,
    });

    return sendResponse(res, { message: 'Status diperbarui.', data: result.rows[0] });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getMine, getById, updateStatus };
