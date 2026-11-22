const router = require('express').Router();
const {
  getAll,
  getSpecializations,
  getById,
  addReview,
  getMe,
  setOnlineStatus,
} = require('../controllers/doctor.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Public - daftar & profil dokter bisa dilihat tanpa login
router.get('/', getAll);
router.get('/specializations', getSpecializations);

// Dokter (harus di atas '/:id' biar 'me' gak dianggap id)
router.get('/me', authenticate, authorize('doctor'), getMe);
router.patch('/me/status', authenticate, authorize('doctor'), setOnlineStatus);

router.get('/:id', getById);

// Pasien
router.post('/:id/reviews', authenticate, authorize('patient'), addReview);

module.exports = router;
