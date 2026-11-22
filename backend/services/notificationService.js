const { query } = require('../config/db');

/**
 * Helper bikin notifikasi. Dipanggil dari controller/service lain
 * biar logic insert notifikasi gak diulang-ulang.
 * `db` opsional: kirim client transaksi kalo dipanggil di dalam BEGIN/COMMIT.
 */
async function notify(userId, { title, body = '', type = 'system', referenceId = null, senderDoctorId = null }, db = { query }) {
  await db.query(
    `INSERT INTO notifications (user_id, title, body, type, reference_id, sender_doctor_id)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId, title, body, type, referenceId, senderDoctorId]
  );
}

module.exports = { notify };
