const router = require('express').Router();
const admin = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Semua endpoint admin wajib login + role admin
router.use(authenticate, authorize('admin'));

router.get('/stats', admin.getStats);

router.post('/doctors', admin.createDoctor);
router.put('/doctors/:id', admin.updateDoctor);
router.delete('/doctors/:id', admin.deleteDoctor);

router.get('/articles', admin.getArticles);
router.post('/articles', admin.createArticle);
router.put('/articles/:id', admin.updateArticle);
router.delete('/articles/:id', admin.deleteArticle);


router.get('/orders', admin.getOrders);
router.patch('/orders/:id/status', admin.updateOrderStatus);

module.exports = router;
