const { query } = require('../config/db');
const { searchBpom } = require('./bpomService');
const geminiOcr = require('./geminiOcrService');

/**
 * Scan obat. Dua jalur masuk:
 *   A. FOTO  -> Gemini membaca kemasan (merek, zat aktif, nomor BPOM, logo halal)
 *   B. TEKS  -> ketik manual, atau hasil tesseract.js di browser (cadangan kalau Gemini gagal)
 *
 * Urutan pencocokan ke tabel medicines (dari yang paling pasti):
 *   1. Nomor BPOM yang terbaca == nomor BPOM di database
 *   2. MEREK yang dibaca Gemini (contoh "Panadol") cocok dengan nama/kata kunci obat
 *   3. ZAT AKTIF yang dibaca Gemini cocok dengan nama generik (contoh "Paracetamol, Caffeine")
 *   4. Kata-kata dari teks bebas (jalur tesseract / ketik manual)
 * Semua toleran salah huruf ("PARACETAMOI", "parasetamol" tetap dikenali).
 *
 * Hasilnya juga memuat `verification`: status BPOM dan halal untuk badge di halaman scan.
 */

// Kata umum di kemasan yang tidak boleh dipakai buat menentukan obat (bikin salah cocok)
const STOPWORDS = new Set([
  'tablet', 'tablets', 'kaplet', 'kapsul', 'capsule', 'capsules', 'sirup', 'syrup', 'kunyah', 'obat',
  'generik', 'dewasa', 'anak', 'strip', 'box', 'isi', 'effective', 'relief', 'oral', 'vitamin', 'forte',
  'plus', 'extra', 'herbal', 'krim', 'cream', 'salep', 'tetes', 'mata', 'zat', 'besi', 'acid', 'asam',
  'hcl', 'maleate', 'maleat', 'sodium', 'natrium', 'extract', 'ekstrak', 'kompleks', 'kalsium', 'calcium',
]);

const normalize = (s) => (s || '').toLowerCase().replace(/[^a-z\s]/g, ' ');
const wordsOf = (s, min = 3) => normalize(s).split(/\s+/).filter((w) => w.length >= min);

// Ejaan Indonesia vs internasional dibuat sama: paracetamol=parasetamol, caffeine=kafein, chlor=klor
const canon = (w) => w
  .replace(/ph/g, 'f').replace(/ch/g, 'k').replace(/qu/g, 'kw').replace(/x/g, 'ks')
  .replace(/c(?=[eiy])/g, 's').replace(/c/g, 'k').replace(/y/g, 'i').replace(/(.)\1+/g, '$1')
  .replace(/e$/, '');

// Jarak Levenshtein: berapa huruf yang harus diganti/ditambah/dihapus biar 2 kata sama
function levenshtein(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}

// Toleransi: kata >= 8 huruf boleh beda 2, >= 5 huruf boleh beda 1, sisanya harus persis.
// substring=true hanya untuk teks OCR bebas (kata sering nempel). Untuk merek & zat aktif dari
// Gemini dimatikan, supaya "Levocetirizine" tidak dianggap "Cetirizine".
function wordMatches(word, token, substring = true) {
  if (word === token) return true;
  const a = canon(word);
  const b = canon(token);
  if (a === b) return true;
  if (substring && b.length >= 6 && a.includes(b)) return true;
  const maxDist = b.length >= 8 ? 2 : b.length >= 5 ? 1 : 0;
  return maxDist > 0 && Math.abs(a.length - b.length) <= maxDist && levenshtein(a, b) <= maxDist;
}

const strongTokens = (s) => wordsOf(s).filter((w) => !STOPWORDS.has(w));

// Kata penanda MEREK sebuah obat: nama + kata kunci
function brandTokens(m) {
  return [...new Set(strongTokens([m.name, ...(m.keywords || [])].join(' ')))];
}

// Zat aktif sebuah obat: "Paracetamol, Caffeine" -> [['paracetamol'], ['caffeine']]
function ingredientsOf(generic) {
  return (generic || '').split(/[,+;/]|\bdan\b/i)
    .map((part) => strongTokens(part).filter((w) => w.length >= 4))
    .filter((arr) => arr.length);
}

const ingredientMatch = (a, b) => a.some((w) => b.some((t) => wordMatches(w, t, false)));

// Format NIE BPOM: DBL/DKL/GBL/GKL/DTL... (obat), TR/TI/TL (tradisional), SD/SI/SL (suplemen), dll
function validNie(raw) {
  if (!raw) return null;
  const s = raw.toUpperCase().replace(/^BPOM\s*RI\s*/, '').replace(/^POM\s*/, '').replace(/[\s.-]/g, '');
  if (/^[DG][BKTPN]L\d{9,10}[A-Z]\d{1,2}$/.test(s)) return s;
  if (/^(TR|TI|TL|QD|QI|QL|SD|SI|SL|FF|NA|NB|NC|ND|NE|MD|ML|POMNA)\d{8,13}$/.test(s)) return s;
  return null;
}

/**
 * @param {object} p
 *   text            teks bebas (gabungan tulisan di kemasan / ketikan user)
 *   productName     merek dari Gemini
 *   ingredients     zat aktif dari Gemini
 *   bpomNumber      nomor BPOM dari Gemini
 */
async function findMedicine({ text = '', productName = null, ingredients = [], bpomNumber = null }) {
  const { rows } = await query('SELECT * FROM medicines');

  // 1. Nomor BPOM
  const nie = validNie(bpomNumber);
  if (nie) {
    const exact = rows.find((m) => (m.bpom_number || '').replace(/\s/g, '').toUpperCase() === nie);
    if (exact) return { ...exact, matched_by: 'bpom', matched_words: [nie] };
  }

  const detectedIngs = ingredients.map((x) => strongTokens(x).filter((w) => w.length >= 4)).filter((a) => a.length);
  const brandWords = strongTokens(productName || '');
  const freeWords = [...new Set(strongTokens(text))].slice(0, 200);

  let best = null;
  rows.forEach((m) => {
    let score = 0;
    let by = null;
    const matched = [];

    // 2. Merek: kata pertama merek harus cocok (contoh "Panadol" Extra -> "panadol")
    const bt = brandTokens(m);
    const nameWords = strongTokens(m.name);
    if (brandWords.length && nameWords.length) {
      const hitName = nameWords.filter((t) => brandWords.some((w) => wordMatches(w, t, false)));
      if (hitName.length) {
        score += 300 + hitName.length * 60 - Math.abs(nameWords.length - hitName.length) * 40;
        // nama mengandung kata yang TIDAK ada di merek terbaca ("Extra") -> dikurangi
        by = 'brand';
        matched.push(...hitName);
      }
    }

    // 3. Zat aktif: semakin lengkap & persis kombinasinya, semakin tinggi
    const ings = ingredientsOf(m.generic_name);
    if (detectedIngs.length && ings.length) {
      const hit = ings.filter((ing) => detectedIngs.some((d) => ingredientMatch(d, ing))).length;
      if (hit) {
        const extraDetected = detectedIngs.length - hit; // terbaca di kemasan tapi obat ini tidak punya
        const missing = ings.length - hit; // obat ini punya tapi tidak terbaca
        score += hit * 80 - extraDetected * 50 - missing * 35;
        by = by || 'ingredients';
        matched.push(...ings.filter((ing) => detectedIngs.some((d) => ingredientMatch(d, ing))).map((x) => x[0]));
      }
    }

    // 4. Teks bebas (jalur tesseract / ketik manual) -> bobot lebih kecil
    if (!by && freeWords.length) {
      const hit = bt.filter((t) => t.length >= 4 && freeWords.some((w) => wordMatches(w, t)));
      if (hit.length) {
        score += hit.length * 60 + Math.max(...hit.map((t) => t.length));
        by = 'text';
        matched.push(...hit);
      }
    }

    if (by && score > 0 && (!best || score > best.score)) best = { m, score, by, matched };
  });

  return best ? { ...best.m, matched_by: best.by, matched_words: [...new Set(best.matched)] } : null;
}

// Kompatibel dengan kode lama
const findMedicineByText = (text, bpomNumber = null) => findMedicine({ text, bpomNumber });

/**
 * Status BPOM & halal untuk badge di halaman scan.
 *  bpom.status : 'verified'   -> dikonfirmasi API BPOM
 *                'registered' -> nomor NIE terbaca di kemasan / tercatat di database ZenQ
 *                'demo'       -> data contoh
 *                'unverified' -> belum ada bukti
 *  halal.status: 'certified'  -> tercatat bersertifikat halal di database ZenQ
 *                'logo'       -> logo halal terlihat di kemasan (dibaca Gemini)
 *                'not_certified' | 'unknown'
 */
function buildVerification(matched, detected, bpomItems) {
  // Cocok cuma lewat zat aktif = produk lain yang zatnya sama -> status BPOM/halal-nya TIDAK boleh dipakai
  const medicine = matched && matched.matched_by !== 'ingredients' ? matched : null;
  const nieRead = validNie(detected?.bpom_number);
  const nieDb = medicine?.bpom_number || null;
  const isDemo = (v) => /^DEMO/i.test(v || '');
  const sameNie = (a, b) => a && b && a.replace(/\s/g, '').toUpperCase() === b.replace(/\s/g, '').toUpperCase();

  let bpom = { status: 'unverified', nie: nieRead || (isDemo(nieDb) ? null : nieDb), source: null };
  const apiHit = bpomItems.find((b) => sameNie(b.bpom_number, nieRead) || sameNie(b.bpom_number, nieDb));
  if (apiHit) bpom = { status: 'verified', nie: apiHit.bpom_number, source: 'api', product: apiHit.name, bpom_status: apiHit.bpom_status };
  else if (nieRead) bpom = { status: 'registered', nie: nieRead, source: 'kemasan' };
  else if (nieDb && !isDemo(nieDb)) bpom = { status: 'registered', nie: nieDb, source: 'database' };
  else if (isDemo(nieDb)) bpom = { status: 'demo', nie: nieDb, source: 'database' };

  let halal = { status: 'unknown', cert: null, source: null };
  if (medicine?.halal_status === 'certified') {
    halal = { status: 'certified', cert: medicine.halal_cert_number, source: medicine.halal_source || 'database' };
  } else if (detected?.halal_logo) {
    halal = { status: 'logo', cert: detected.halal_cert_number, source: 'kemasan' };
  } else if (medicine?.halal_status === 'not_certified') {
    halal = { status: 'not_certified', cert: null, source: medicine.halal_source };
  }

  return { bpom, halal };
}

/**
 * @returns {{
 *   extractedText, medicine, bpom, ocrSource, detected, verification,
 *   aiInfo,          // info umum dari Gemini kalau obat belum ada di database
 *   needsClientOcr,  // true = Gemini gagal, frontend sebaiknya pakai tesseract
 *   ocrError, model
 * }}
 */
async function scan({ imageBuffer, mimeType, manualText }) {
  let text = (manualText || '').trim();
  let ocrSource = text ? 'text' : 'none';
  let detected = null;
  let ocrError = null;
  let model = null;

  // Jalur A: ada foto -> minta Gemini membacanya
  if (imageBuffer && !text) {
    const result = await geminiOcr.readMedicinePhoto(imageBuffer, mimeType);
    if (result.ok) {
      detected = result.data;
      model = result.model;
      ocrSource = 'gemini';
      text = [detected.product_name, ...detected.active_ingredients, detected.text].filter(Boolean).join(' ');
    } else {
      ocrError = result.reason;
    }
  }

  let medicine = null;
  if (detected && detected.is_medicine) {
    medicine = await findMedicine({
      productName: detected.product_name,
      ingredients: detected.active_ingredients,
      bpomNumber: detected.bpom_number,
    });
    // Merek & zat aktif tidak cocok sama sekali -> coba teks lengkap kemasan
    if (!medicine && !detected.product_name && !detected.active_ingredients.length) {
      medicine = await findMedicine({ text });
    }
  } else if (text && !detected) {
    medicine = await findMedicine({ text });
  }

  // Validasi ke API BPOM (kalau BPOM_API_KEY diisi)
  let bpom = [];
  const keyword = detected?.product_name || medicine?.name || detected?.active_ingredients?.[0];
  if (keyword) bpom = await searchBpom(keyword.replace(/\d+\s*mg/i, '').trim());

  // Obat belum ada di database, tapi Gemini yakin ini obat apa -> tampilkan info umum dari AI
  const info = detected?.info;
  const aiInfo = !medicine && detected?.is_medicine && detected.product_name && info && Object.values(info).some(Boolean)
    ? info
    : null;

  return {
    extractedText: text,
    medicine,
    bpom: bpom.slice(0, 5),
    ocrSource,
    detected,
    verification: buildVerification(medicine, detected, bpom),
    aiInfo,
    needsClientOcr: Boolean(imageBuffer) && ocrSource !== 'gemini',
    ocrError,
    model,
  };
}

module.exports = { scan, findMedicine, findMedicineByText, wordMatches, levenshtein, validNie, buildVerification, canon };
