/**
 * Siapin database ZenQ dengan SATU perintah (jalan di Windows, Mac, Linux):
 *
 *   npm run seed
 *
 * Yang dilakukan:
 *   1. Baca DATABASE_URL dari file .env
 *   2. Kalau database-nya (misal "zenq") belum ada -> dibuat otomatis
 *   3. Jalankan database/schema.sql  -> bikin semua tabel (tabel lama DIHAPUS dulu)
 *   4. Jalankan database/seed.sql    -> isi data demo (akun, dokter, obat, dll)
 *   5. Isi konten edukasi lengkap (database/content/articles.js)
 *   6. Isi daftar obat umum buat scan obat (database/content/medicines.js)
 *
 * PERHATIAN: semua data lama di database ZenQ akan TERHAPUS dan diganti data demo.
 * Gak perlu psql / pgAdmin, cukup Node.js.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { seedArticles } = require('./seedArticles');
const { seedMedicines } = require('./seedMedicines');

const DATABASE_URL = process.env.DATABASE_URL;

async function ensureDatabase() {
  const url = new URL(DATABASE_URL);
  const dbName = decodeURIComponent(url.pathname.slice(1));
  url.pathname = '/postgres'; // konek ke database bawaan dulu buat ngecek/bikin database
  const admin = new Client({ connectionString: url.toString() });
  try {
    await admin.connect();
    const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (rowCount) {
      console.log(`✔ Database "${dbName}" sudah ada`);
    } else {
      await admin.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
      console.log(`✔ Database "${dbName}" dibuat`);
    }
  } catch (err) {
    // Password salah / server mati -> berhenti (pesan jelas di bawah)
    if (err.code === '28P01' || err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') throw err;
    // Hosting database online (Neon, Supabase, Render) biasanya sudah menyiapkan database-nya
    // dan tidak mengizinkan akses ke database "postgres" -> lewati pengecekan ini.
    console.log(`ℹ Lewati pengecekan database (${err.message}). Lanjut pakai database "${dbName}".`);
  } finally {
    await admin.end().catch(() => {});
  }
}

async function runFile(client, file) {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'database', file), 'utf8');
  await client.query(sql);
  console.log(`✔ ${file} selesai`);
}

async function main() {
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL belum diisi di file backend/.env');
  }

  await ensureDatabase();

  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    await client.query('SET client_min_messages TO WARNING'); // sembunyiin NOTICE "table does not exist"
    await runFile(client, 'schema.sql');
    await runFile(client, 'seed.sql');
    const { added, filled } = await seedArticles(client);
    console.log(`✔ konten edukasi (${added + filled} artikel)`);
    const meds = await seedMedicines(client);
    console.log(`✔ daftar obat umum (${meds.added} obat)`);
  } finally {
    await client.end();
  }

  console.log('\n🎉 Database siap! Login demo: pasien@zenq.id / password123');
  console.log('   Sekarang jalankan: npm run dev');
}

main().catch((err) => {
  console.error('\n❌ Gagal menyiapkan database:', err.message);
  if (err.code === '28P01') console.error('   -> Password di DATABASE_URL (.env) salah.');
  if (err.code === 'ECONNREFUSED') console.error('   -> PostgreSQL belum nyala. Buka Services Windows, start "postgresql".');
  if (err.code === 'ENOTFOUND') console.error('   -> Alamat database tidak ditemukan. Cek lagi DATABASE_URL (salin ulang dari Neon).');
  process.exit(1);
});
