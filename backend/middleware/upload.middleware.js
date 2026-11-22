const multer = require('multer');
const config = require('../config/env');

/**
 * Upload foto kemasan obat. Disimpen di memory (buffer) karena langsung
 * diproses OCR di services/medicineScanService.js, gak perlu disimpen ke disk.
 */
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadMb * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      const err = new Error('Format gambar harus JPG, PNG, atau WEBP.');
      err.status = 400;
      return cb(err);
    }
    return cb(null, true);
  },
});

module.exports = { uploadImage };
