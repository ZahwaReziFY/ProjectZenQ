const { query } = require('../config/db');
const sendResponse = require('../utils/response');
const { parseId } = require('../utils/validation');

// GET /notifications
const getMine = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT n.*, du.name AS sender_name
       FROM notifications n
       LEFT JOIN doctors d ON d.id = n.sender_doctor_id
       LEFT JOIN users du ON du.id = d.user_id
       WHERE n.user_id = $1 ORDER BY n.created_at DESC LIMIT 50`,
      [req.user.id]
    );
    const unread = result.rows.filter((n) => !n.is_read).length;
    return sendResponse(res, { data: { items: result.rows, unread } });
  } catch (err) {
    return next(err);
  }
};

// PATCH /notifications/:id/read
const markRead = async (req, res, next) => {
  try {
    await query('UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2', [
      parseId(req.params.id),
      req.user.id,
    ]);
    return sendResponse(res, { message: 'Notifikasi ditandai sudah dibaca.' });
  } catch (err) {
    return next(err);
  }
};

// PATCH /notifications/read-all
const markAllRead = async (req, res, next) => {
  try {
    await query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1', [req.user.id]);
    return sendResponse(res, { message: 'Semua notifikasi ditandai sudah dibaca.' });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getMine, markRead, markAllRead };
