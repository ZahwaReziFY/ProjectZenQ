const jwt = require('jsonwebtoken');
const config = require('../config/env');
const sendResponse = require('../utils/response');

const ROLES = ['patient', 'doctor', 'admin'];

/**
 * Cek token JWT di header Authorization: Bearer <token>.
 * Kalo valid, data user ditaruh di req.user.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization || '';

  if (!authHeader.startsWith('Bearer ')) {
    return sendResponse(res, {
      code: 401,
      success: false,
      message: 'Akses ditolak. Token autentikasi tidak ditemukan.',
    });
  }

  try {
    const decoded = jwt.verify(authHeader.slice(7).trim(), config.jwtSecret, {
      algorithms: ['HS256'],
    });

    if (!Number.isSafeInteger(Number(decoded.id)) || !ROLES.includes(decoded.role)) {
      return sendResponse(res, { code: 401, success: false, message: 'Sesi login tidak valid.' });
    }

    req.user = {
      id: Number(decoded.id),
      name: decoded.name,
      email: decoded.email,
      role: decoded.role,
    };
    return next();
  } catch (err) {
    return sendResponse(res, {
      code: 401,
      success: false,
      message: 'Sesi login telah berakhir atau token tidak valid.',
    });
  }
};

/**
 * Batasi akses berdasarkan role. Contoh: authorize('admin') atau
 * authorize(['doctor', 'admin']).
 */
const authorize = (roles = []) => {
  const allowed = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    if (!req.user) {
      return sendResponse(res, { code: 401, success: false, message: 'Silakan login terlebih dahulu.' });
    }
    if (allowed.length && !allowed.includes(req.user.role)) {
      return sendResponse(res, {
        code: 403,
        success: false,
        message: 'Hak akses tidak mencukupi untuk melakukan aksi ini.',
      });
    }
    return next();
  };
};

module.exports = { authenticate, authorize, ROLES };
