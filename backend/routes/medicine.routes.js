const router = require('express').Router();
const { search, searchBpom, getById, scan } = require('../controllers/medicine.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { uploadImage } = require('../middleware/upload.middleware');

router.get('/', search);
router.get('/bpom', searchBpom);
router.post('/scan', authenticate, uploadImage.single('image'), scan);
router.get('/:id', getById);

module.exports = router;
