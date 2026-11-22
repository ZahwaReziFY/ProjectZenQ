const router = require('express').Router();
const { getNearby, getContacts, requestAmbulance } = require('../controllers/emergency.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Public - info darurat harus bisa diakses TANPA login
router.get('/nearby', getNearby);
router.get('/contacts', getContacts);

// Pengajuan ambulans (simulasi) -> khusus pasien yang login
router.post('/ambulance-request', authenticate, authorize('patient'), requestAmbulance);

module.exports = router;
