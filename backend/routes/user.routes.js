const router = require('express').Router();
const { updateProfile, updateAvatar, changePassword } = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.put('/me', updateProfile);
router.put('/me/avatar', updateAvatar);
router.put('/me/password', changePassword);

module.exports = router;
