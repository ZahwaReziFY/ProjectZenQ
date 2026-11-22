const config = require('../config/env');

/**
 * Berita kesehatan dari api-berita-indonesia (https://api-berita-indonesia.vercel.app).
 * Halaman Edukasi 100% pakai berita ini -> admin gak perlu upload konten manual.
 *
 * Sumber yang dipakai (dua-duanya kategori kesehatan):
 *   - Suara.com  -> /suara/health
 *   - Tribunnews -> /tribun/kesehatan
 * Hasilnya digabung, diurutkan dari yang terbaru, judul kembar dibuang.
 * Kalau satu sumber mati, sumber lain tetap dipakai.
 *
 * Backend jadi perantara (proxy) supaya:
 *  - frontend gak kena masalah CORS
 *  - hasilnya di-cache 30 menit (gak nembak API tiap user buka halaman)
 *  - kalau API mati, pakai cache terakhir
 *
 * Format API: { success, data: { posts: [{ link, title, pubDate, description, thumbnail }] } }
 */
const CACHE_MS = 30 * 60 * 1000;
const BASE = config.newsApiBase;
const SOURCES = [
  { path: '/suara/health', name: 'Suara.com' },
  { path: '/tribun/kesehatan', name: 'Tribunnews' },
];

let cache = { at: 0, items: [] };

function normalize(json, sourceName) {
  const posts = json?.data?.posts || json?.posts || json?.data || [];
  if (!Array.isArray(posts)) return [];
  return posts
    .map((p) => ({
      title: (p.title || '').trim(),
      link: p.link || p.url || '',
      description: (p.description || p.contentSnippet || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(),
      thumbnail: p.thumbnail || p.image?.small || (typeof p.image === 'string' ? p.image : null) || null,
      published_at: p.pubDate || p.isoDate || p.date || null,
      source: sourceName,
    }))
    .filter((p) => p.title && p.link);
}

async function fetchSource({ path, name }) {
  const res = await fetch(`${BASE}${path}`, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  return normalize(await res.json(), name);
}

async function loadAll() {
  const results = await Promise.allSettled(SOURCES.map(fetchSource));
  const items = [];
  results.forEach((r) => {
    if (r.status === 'fulfilled') items.push(...r.value);
    else console.warn('Gagal ambil berita kesehatan:', r.reason.message);
  });

  // Buang judul kembar, urutkan terbaru dulu
  const seen = new Set();
  return items
    .filter((n) => {
      const key = n.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0));
}

async function getHealthNews(limit = 12) {
  if (Date.now() - cache.at < CACHE_MS && cache.items.length) {
    return cache.items.slice(0, limit);
  }
  const items = await loadAll();
  if (items.length) cache = { at: Date.now(), items };
  return (items.length ? items : cache.items).slice(0, limit); // API mati -> pakai cache lama
}

module.exports = { getHealthNews, normalize };
