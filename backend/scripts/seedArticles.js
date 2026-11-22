/**
 * Masukkan konten edukasi bawaan (database/content/articles.js) ke tabel articles.
 *
 *   npm run content
 *
 * AMAN dijalankan di database yang sudah berisi data:
 *  - artikel baru (slug belum ada) -> ditambahkan
 *  - artikel lama yang isinya masih "Konten artikel demo..." -> diisi konten lengkap
 *  - artikel yang SUDAH diedit admin -> TIDAK disentuh
 *  - gambar ilustrasi bawaan (frontend/public/edu/<slug>.svg) dipasang ke artikel yang
 *    belum punya sampul. Sampul yang sudah diganti admin TIDAK ditimpa.
 * Data lain (user, pesanan, dll) tidak diubah sama sekali.
 */
require('dotenv').config();
const { Client } = require('pg');
const ARTICLES = require('../database/content/articles');

const PLACEHOLDER = 'Konten artikel demo%';
// Gambar ilustrasi bawaan disajikan frontend dari folder public/edu
const coverOf = (a) => `/edu/${a.slug}.svg`;

async function seedArticles(client) {
  let added = 0;
  let filled = 0;
  let covers = 0;
  const admin = await client.query("SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1");
  const authorId = admin.rows[0]?.id || null;

  for (const a of ARTICLES) {
    const existing = await client.query('SELECT id, content FROM articles WHERE slug = $1', [a.slug]);
    if (!existing.rows.length) {
      await client.query(
        `INSERT INTO articles (title, slug, summary, content, category, emoji, is_featured, tags, author_id, cover_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [a.title, a.slug, a.summary, a.content, a.category, a.emoji, Boolean(a.is_featured), a.tags || [], authorId, coverOf(a)]
      );
      added += 1;
    } else {
      const res = await client.query(
        `UPDATE articles SET title = $1, summary = $2, content = $3, category = $4, emoji = $5, tags = $6
         WHERE slug = $7 AND content LIKE $8`,
        [a.title, a.summary, a.content, a.category, a.emoji, a.tags || [], a.slug, PLACEHOLDER]
      );
      filled += res.rowCount;
      const cov = await client.query('UPDATE articles SET cover_url = $1 WHERE slug = $2 AND cover_url IS NULL', [coverOf(a), a.slug]);
      covers += cov.rowCount;
    }
  }
  return { added, filled, covers };
}

if (require.main === module) {
  (async () => {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    try {
      const { added, filled, covers } = await seedArticles(client);
      console.log(`✔ Konten edukasi: ${added} artikel baru, ${filled} artikel demo diisi konten lengkap, ${covers} gambar sampul dipasang.`);
    } finally {
      await client.end();
    }
  })().catch((err) => {
    console.error('❌ Gagal memasukkan konten edukasi:', err.message);
    if (err.code === '28P01') console.error('   -> Password di DATABASE_URL (.env) salah.');
    process.exit(1);
  });
}

module.exports = { seedArticles };
