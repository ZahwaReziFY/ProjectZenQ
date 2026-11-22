const sendResponse = require('../utils/response');
const { query } = require('../config/db');

async function getHealth(req, res) {
  let database = 'ok';
  try {
    await query('SELECT 1');
  } catch (err) {
    database = 'error';
  }

  return sendResponse(res, {
    message: 'Backend ZenQ jalan normal',
    data: {
      status: 'ok',
      database,
      timestamp: new Date().toISOString(),
    },
  });
}

module.exports = { getHealth };
