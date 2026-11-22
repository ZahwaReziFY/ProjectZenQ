const { query } = require('../config/db');
const sendResponse = require('../utils/response');
const { triage } = require('../services/aiChatbotService');

// POST /chatbot/message { message }
const sendMessage = async (req, res, next) => {
  try {
    const message = (req.body?.message || '').trim();
    if (!message) return sendResponse(res, { code: 400, success: false, message: 'Pesan kosong.' });
    if (message.length > 1000) {
      return sendResponse(res, { code: 400, success: false, message: 'Pesan maksimal 1000 karakter.' });
    }

    const history = await query(
      'SELECT user_message, bot_reply FROM chatbot_logs WHERE user_id = $1 ORDER BY id DESC LIMIT 5',
      [req.user.id]
    );

    const lang = String(req.headers['accept-language'] || '').toLowerCase().startsWith('en') ? 'en' : 'id';
    const result = await triage(message, history.rows.reverse(), lang);

    await query(
      `INSERT INTO chatbot_logs (user_id, user_message, bot_reply, triage_level, suggested_specialization)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, message, result.reply, result.triageLevel, result.suggestedSpecialization]
    );

    return sendResponse(res, {
      data: {
        reply: result.reply,
        triage_level: result.triageLevel,
        suggested_specialization: result.suggestedSpecialization,
        disclaimer: 'ZenQ AI hanya pendamping awal, bukan diagnosis medis.',
      },
    });
  } catch (err) {
    return next(err);
  }
};

// GET /chatbot/history
const getHistory = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM chatbot_logs WHERE user_id = $1 ORDER BY id DESC LIMIT 50',
      [req.user.id]
    );
    return sendResponse(res, { data: result.rows.reverse() });
  } catch (err) {
    return next(err);
  }
};

module.exports = { sendMessage, getHistory };
