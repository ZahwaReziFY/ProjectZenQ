const router = require('express').Router();
const { getPayment, confirmByToken } = require('../controllers/payment.controller');

// Halaman bayar hasil scan QR (publik, aksesnya dijamin token bertanda tangan)
router.get('/:token', getPayment);
router.post('/:token/confirm', confirmByToken);

module.exports = router;
