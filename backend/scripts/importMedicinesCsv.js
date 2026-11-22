/**
 * Import data obat dari file CSV ke tabel medicines.
 * Kepake kalo tim berhasil download dataset "APP - Master Produk Komoditi Obat"
 * dari Satu Data BPOM (https://satudata.pom.go.id/datasets) atau bikin CSV sendiri.
 *
 * Cara pakai:
 *   node scripts/importMedicinesCsv.js path/ke/file.csv
 *
 * Kolom CSV yang dibaca (header baris pertama, nama kolom bisa disesuaikan di COLUMN_MAP):
 *   name, generic_name, bpom_number, category, dosage, side_effects, interactions,
 *   contraindications, halal_status, halal_cert_number
 * Kolom yang gak ada dibiarkan kosong. Data dengan bpom_number yang sama di-update.
 */
const fs = require('fs');
const { pool } = require('../config/db');

// Kiri = nama kolom di tabel, kanan = kemungkinan nama header di CSV (huruf kecil)
const COLUMN_MAP = {
  name: ['name', 'nama_produk', 'nama produk', 'product_name'],
  generic_name: ['generic_name', 'zat_aktif', 'komposisi', 'nama_generik'],
  bpom_number: ['bpom_number', 'nie', 'nomor_registrasi', 'no_registrasi', 'nomor registrasi'],
  category: ['category', 'kategori', 'bentuk_sediaan'],
  dosage: ['dosage', 'dosis'],
  side_effects: ['side_effects', 'efek_samping'],
  interactions: ['interactions', 'interaksi'],
  contraindications: ['contraindications', 'kontraindikasi'],
  halal_status: ['halal_status'],
  halal_cert_number: ['halal_cert_number', 'nomor_sertifikat_halal'],
};

// Parser CSV sederhana (dukung tanda kutip dan koma di dalam kutip)
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i += 1; } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',' || ch === ';') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim()));
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Pakai: node scripts/importMedicinesCsv.js <file.csv>');
    process.exit(1);
  }
  const [header, ...rows] = parseCsv(fs.readFileSync(file, 'utf8'));
  const headers = header.map((h) => h.trim().toLowerCase());
  const index = Object.fromEntries(
    Object.entries(COLUMN_MAP).map(([col, names]) => [col, headers.findIndex((h) => names.includes(h))])
  );
  if (index.name < 0) {
    console.error('Kolom nama produk tidak ditemukan. Header CSV:', headers.join(', '));
    process.exit(1);
  }

  let inserted = 0;
  for (const r of rows) {
    const v = (col) => (index[col] >= 0 ? (r[index[col]] || '').trim() || null : null);
    const halal = ['certified', 'not_certified'].includes(v('halal_status')) ? v('halal_status') : 'unknown';
    const existing = v('bpom_number')
      ? await pool.query('SELECT id FROM medicines WHERE bpom_number = $1', [v('bpom_number')])
      : { rows: [] };
    const values = [v('name'), v('generic_name'), v('bpom_number'), v('category'), v('dosage'), v('side_effects'),
      v('interactions'), v('contraindications'), halal, v('halal_cert_number')];

    if (existing.rows.length) {
      await pool.query(
        `UPDATE medicines SET name=$1, generic_name=$2, bpom_number=$3, category=$4, dosage=$5, side_effects=$6,
           interactions=$7, contraindications=$8, halal_status=$9, halal_cert_number=$10 WHERE id=$11`,
        [...values, existing.rows[0].id]
      );
    } else {
      await pool.query(
        `INSERT INTO medicines (name, generic_name, bpom_number, category, dosage, side_effects, interactions,
           contraindications, halal_status, halal_cert_number) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        values
      );
    }
    inserted += 1;
  }
  console.log(`Selesai: ${inserted} obat diimport/diupdate.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
