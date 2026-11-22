const router = require('express').Router();
const { getPayToken } = require('../controllers/payment.controller');
const { create, list, getById, choosePayment, confirm, cancel } = require('../controllers/order.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', list);
router.post('/', authorize('patient'), create);
router.get('/:id', getById);
router.post('/:id/payment', choosePayment);
router.post('/:id/confirm', confirm);
router.get('/:id/pay-token', getPayToken); // token untuk QR pembayaran
router.post('/:id/cancel', cancel);

module.exports = router;
