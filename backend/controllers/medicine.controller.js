const { query } = require('../config/db');
const sendResponse = require('../utils/response');
const { parseId } = require('../utils/validation');
const medicineScanService = require('../services/medicineScanService');
const bpomService = require('../services/bpomService');

const DISCLAIMER = 'Informasi obat tidak menggantikan saran dokter atau apoteker.';

// GET /medicines?search=
const search = async (req, res, next) => {
  try {
    const keyword = (req.query.search || '').trim().toLowerCase();
    const result = keyword
      ? await query(
        `SELECT * FROM medicines
         WHERE LOWER(name) LIKE $1 OR LOWER(generic_name) LIKE $1 OR $2 = ANY(keywords)
         ORDER BY name LIMIT 200`,
        [`%${keyword}%`, keyword]
      )
      : await query('SELECT * FROM medicines ORDER BY name LIMIT 200');
    return sendResponse(res, { data: result.rows });
  } catch (err) {
    return next(err);
  }
};

// GET /medicines/bpom?q= - cek langsung ke API BPOM (kalo BPOM_API_KEY diisi)
const searchBpom = async (req, res, next) => {
  try {
    if (!bpomService.isEnabled()) {
      return sendResponse(res, { code: 503, success: false, message: 'API BPOM belum dikonfigurasi (BPOM_API_KEY kosong).' });
    }
    return sendResponse(res, { data: await bpomService.searchBpom(req.query.q || '') });
  } catch (err) {
    return next(err);
  }
};

// GET /medicines/:id
const getById = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM medicines WHERE id = $1', [parseId(req.params.id)]);
    if (!result.rows.length) return sendResponse(res, { code: 404, success: false, message: 'Obat tidak ditemukan.' });
    return sendResponse(res, { data: result.rows[0] });
  } catch (err) {
    return next(err);
  }
};

// POST /medicines/scan  (multipart: image = foto kemasan, ATAU text = ketik manual / hasil tesseract)
const scan = async (req, res, next) => {
  try {
    if (!req.file && !req.body?.text) {
      return sendResponse(res, { code: 400, success: false, message: 'Kirim foto kemasan atau teks nama obat.' });
    }

    const result = await medicineScanService.scan({
      imageBuffer: req.file?.buffer,
      mimeType: req.file?.mimetype,
      manualText: req.body?.text,
    });
    const { extractedText, medicine, bpom, ocrSource, detected, verification, aiInfo, needsClientOcr, ocrError, model } = result;

    await query(
      'INSERT INTO medicine_scans (user_id, extracted_text, medicine_id) VALUES ($1, $2, $3)',
      [req.user.id, extractedText.slice(0, 2000), medicine?.id || null]
    );

    let message = 'Obat dikenali.';
    if (!medicine) {
      if (needsClientOcr) message = 'Gemini tidak dapat membaca foto, mencoba OCR cadangan.';
      else if (detected && !detected.is_medicine) message = 'Foto ini sepertinya bukan kemasan obat.';
      else if (aiInfo) message = `Terbaca "${detected.product_name}". Obat ini belum ada di database ZenQ, info di bawah dari Gemini AI.`;
      else if (detected?.product_name) message = `Terbaca "${detected.product_name}", tetapi obat ini belum ada di database ZenQ.`;
      else message = 'Obat belum dikenali. Coba foto lebih jelas atau ketik nama obat.';
    }

    return sendResponse(res, {
      message,
      data: {
        extracted_text: extractedText,
        medicine,
        bpom,
        ocr_source: ocrSource, // 'gemini' | 'text' | 'none'
        detected, // hasil baca Gemini (nama produk, zat aktif, dll)
        verification, // { bpom: {status, nie, source}, halal: {status, cert, source} } -> badge
        ai_info: aiInfo, // info umum dari Gemini kalau obat belum ada di database
        model, // model Gemini yang dipakai
        needs_client_ocr: needsClientOcr, // true -> frontend jalankan tesseract.js
        ocr_error: ocrError,
        disclaimer: DISCLAIMER,
      },
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = { search, searchBpom, getById, scan };
