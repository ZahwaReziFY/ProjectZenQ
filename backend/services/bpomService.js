const config = require('../config/env');

/**
 * Cari data obat terdaftar BPOM lewat API Indonesia (apiindonesia.id).
 *   GET {BPOM_API_URL}?q=<keyword>     header: x-api-key
 *   Field: nie, product_name, status, (ingredients)
 *   Berbayar per request (ada bonus kredit gratis buat akun baru) -> hasil di-cache 24 jam.
 *
 * API ini TIDAK ngasih status halal, dosis, efek samping, atau interaksi.
 * Jadi hasilnya cuma dipake buat validasi "obat ini terdaftar di BPOM (NIE ...)",
 * info lengkapnya tetap dari tabel medicines lokal.
 *
 * Alternatif: dataset "APP - Master Produk Komoditi Obat" di Satu Data BPOM
 * (https://satudata.pom.go.id/datasets). Kalo bisa di-download (CSV), import ke tabel
 * medicines pake scripts/importMedicinesCsv.js.
 */
const CACHE_MS = 24 * 60 * 60 * 1000;
const cache = new Map();

const isEnabled = () => Boolean(config.bpomApiKey);

function normalize(json) {
  const list = json?.data?.items || json?.data || json?.results || json?.items || [];
  const arr = Array.isArray(list) ? list : [list];
  return arr
    .filter((x) => x && (x.nie || x.product_name))
    .map((x) => ({
      bpom_number: x.nie || x.nomor_registrasi || null,
      name: x.product_name || x.nama_produk || '',
      bpom_status: x.status || null,
      ingredients: x.ingredients || x.komposisi || null,
      manufacturer: x.manufacturer || x.pendaftar || null,
    }));
}

async function searchBpom(keyword) {
  if (!isEnabled() || !keyword) return [];
  const key = keyword.toLowerCase().trim();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.items;

  try {
    const url = `${config.bpomApiUrl}?q=${encodeURIComponent(key)}`;
    const res = await fetch(url, {
      headers: { 'x-api-key': config.bpomApiKey },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const items = normalize(await res.json());
    cache.set(key, { at: Date.now(), items });
    return items;
  } catch (err) {
    console.warn('Gagal akses API BPOM:', err.message);
    return [];
  }
}

module.exports = { searchBpom, isEnabled, normalize };
