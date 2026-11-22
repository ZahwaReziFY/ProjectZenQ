const sendResponse = require('../utils/response');

/**
 * Dipasang paling akhir di app.js. Controller cukup panggil next(err),
 * gak perlu nulis ulang format error di tiap try/catch.
 */
function notFound(req, res) {
  return sendResponse(res, {
    code: 404,
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan.`,
  });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (!err.status || err.status >= 500) console.error(err);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return sendResponse(res, { code: 400, success: false, message: 'Ukuran file terlalu besar.' });
  }

  return sendResponse(res, {
    code: err.status || 500,
    success: false,
    message: err.status ? err.message : 'Terjadi kesalahan pada server.',
  });
}

module.exports = { notFound, errorHandler };
