const router = require('express').Router();
const { sendMessage, getHistory } = require('../controllers/chatbot.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.post('/message', sendMessage);
router.get('/history', getHistory);

module.exports = router;
