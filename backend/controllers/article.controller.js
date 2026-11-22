const { query } = require('../config/db');
const sendResponse = require('../utils/response');
const { getHealthNews } = require('../services/newsService');

const LIST_FIELDS = 'id, title, slug, summary, category, emoji, is_featured, tags, cover_url, created_at';

// GET /articles?category=&search=
const getAll = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const conditions = ['is_published = TRUE'];
    const params = [];

    if (category) {
      params.push(category);
      conditions.push(`category = $${params.length}`);
    }
    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      conditions.push(`LOWER(title) LIKE $${params.length}`);
    }

    const result = await query(
      `SELECT ${LIST_FIELDS} FROM articles WHERE ${conditions.join(' AND ')}
       ORDER BY is_featured DESC, created_at DESC`,
      params
    );
    return sendResponse(res, { data: result.rows });
  } catch (err) {
    return next(err);
  }
};

// GET /articles/recommended - dipersonalisasi sesuai usia & kondisi user
const getRecommended = async (req, res, next) => {
  try {
    const userRes = await query('SELECT birth_date, health_conditions FROM users WHERE id = $1', [req.user.id]);
    const user = userRes.rows[0] || {};
    const age = user.birth_date
      ? Math.floor((Date.now() - new Date(user.birth_date)) / (365.25 * 24 * 3600 * 1000))
      : null;

    const result = await query(
      `SELECT ${LIST_FIELDS}, (CASE WHEN tags && $1::text[] THEN 1 ELSE 0 END) AS relevance
       FROM articles
       WHERE is_published = TRUE AND ($2::int IS NULL OR $2::int BETWEEN min_age AND max_age)
       ORDER BY relevance DESC, created_at DESC LIMIT 10`,
      [user.health_conditions || [], age]
    );
    return sendResponse(res, { data: result.rows });
  } catch (err) {
    return next(err);
  }
};

// GET /articles/news - berita kesehatan (proxy api-berita-indonesia /suara/health)
const getNews = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 12, 40);
    return sendResponse(res, { data: await getHealthNews(limit) });
  } catch (err) {
    return next(err);
  }
};

// GET /articles/:slug
const getBySlug = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM articles WHERE slug = $1 AND is_published = TRUE', [req.params.slug]);
    if (!result.rows.length) return sendResponse(res, { code: 404, success: false, message: 'Artikel tidak ditemukan.' });
    return sendResponse(res, { data: result.rows[0] });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getAll, getRecommended, getNews, getBySlug };
