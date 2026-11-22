/**
 * Tambahkan daftar obat umum (database/content/medicines.js) ke tabel medicines.
 *
 *   npm run obat
 *
 * AMAN dijalankan kapan saja: obat yang namanya sudah ada TIDAK ditimpa,
 * data lain (akun, pesanan, dll) tidak disentuh. Tidak perlu seed ulang.
 */
require('dotenv').config();
const { Client } = require('pg');
const MEDICINES = require('../database/content/medicines');

async function seedMedicines(client) {
  let added = 0;
  for (const m of MEDICINES) {
    const exists = await client.query('SELECT 1 FROM medicines WHERE LOWER(name) = LOWER($1)', [m.name]);
    if (exists.rowCount) continue;
    await client.query(
      `INSERT INTO medicines (name, generic_name, keywords, category, dosage, side_effects, interactions,
                              contraindications, halal_status, halal_source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'unknown', 'Belum diverifikasi, cek di bpjph.halal.go.id')`,
      [m.name, m.generic_name, m.keywords, m.category, m.dosage, m.side_effects, m.interactions, m.contraindications]
    );
    added += 1;
  }
  return { added, total: MEDICINES.length };
}

if (require.main === module) {
  (async () => {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    try {
      const { added, total } = await seedMedicines(client);
      const { rows } = await client.query('SELECT COUNT(*)::int AS n FROM medicines');
      console.log(`✔ ${added} obat baru ditambahkan (${total - added} sudah ada). Total obat di database: ${rows[0].n}`);
    } finally {
      await client.end();
    }
  })().catch((err) => {
    console.error('❌ Gagal menambahkan obat:', err.message);
    process.exit(1);
  });
}

module.exports = { seedMedicines };
