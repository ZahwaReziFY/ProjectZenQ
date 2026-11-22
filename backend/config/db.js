const { Pool } = require('pg');
const config = require('./env');

/**
 * 1 pool koneksi PostgreSQL buat seluruh app. Controller cukup panggil
 * query(sql, params) - selalu pake parameter ($1, $2, ...) biar aman
 * dari SQL injection.
 */
const pool = new Pool({ connectionString: config.databaseUrl });

pool.on('error', (err) => {
  console.error('Koneksi database error:', err.message);
});

const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };
