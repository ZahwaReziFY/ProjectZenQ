const router = require('express').Router();
const { getAll, getRecommended, getNews, getBySlug } = require('../controllers/article.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/', getAll);
router.get('/news', getNews);
router.get('/recommended', authenticate, getRecommended);
router.get('/:slug', getBySlug);

module.exports = router;
