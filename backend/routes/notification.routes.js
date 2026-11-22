const router = require('express').Router();
const { getMine, markRead, markAllRead } = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', getMine);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markRead);

module.exports = router;
