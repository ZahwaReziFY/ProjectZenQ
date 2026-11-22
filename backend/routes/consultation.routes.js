const router = require('express').Router();
const {
  getMine,
  getById,
  updateStatus,
  getMessages,
  sendMessage,
} = require('../controllers/consultation.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Konsultasi baru dibuat lewat POST /orders (kind: consultation)
router.use(authenticate);

router.get('/', getMine);
router.get('/:id', getById);
router.patch('/:id/status', updateStatus);
router.get('/:id/messages', getMessages);
router.post('/:id/messages', sendMessage);

module.exports = router;
