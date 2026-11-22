const router = require('express').Router();
const { getMine, getById, updateStatus } = require('../controllers/homeVisit.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Home visit baru dibuat lewat POST /orders (kind: home_visit)
router.use(authenticate);

router.get('/', getMine);
router.get('/:id', authorize(['doctor', 'admin']), getById);
router.patch('/:id/status', authorize(['doctor', 'admin']), updateStatus);

module.exports = router;
