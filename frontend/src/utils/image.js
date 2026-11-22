/**
 * Kecilkan foto sebelum dikirim ke backend (lalu ke Gemini).
 *
 * Foto HP bisa 3-10 MB. Kalau dikirim mentah: upload lambat, bisa melewati batas
 * MAX_UPLOAD_MB (5 MB), dan memakan kuota token Gemini lebih banyak.
 * Diperkecil ke sisi terpanjang 1600 px + JPEG kualitas 85% -> biasanya 200-500 KB,
 * tulisan di kemasan tetap terbaca jelas.
 *
 * @param {string} dataUrl  foto dalam bentuk dataURL (dari kamera / galeri)
 * @returns {Promise<Blob>} file JPEG siap dikirim lewat FormData
 */
export function compressImage(dataUrl, maxSide = 1600, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff'; // PNG transparan -> latar putih
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Gagal memproses foto.'))),
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => reject(new Error('Foto tidak dapat dibuka.'));
    img.src = dataUrl;
  });
}

/** Baca File (dari input type=file) jadi dataURL */
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error('File tidak dapat dibaca.'));
    r.readAsDataURL(file);
  });
}

/**
 * Potong foto jadi persegi (ambil bagian tengah) lalu kecilkan -> dataURL JPEG.
 * Dipakai buat foto profil (default 400x400, biasanya cuma 30-60 KB).
 */
export function cropSquare(dataUrl, size = 400, quality = 0.86) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('Foto tidak dapat dibuka.'));
    img.src = dataUrl;
  });
}

/** Kecilkan foto (sisi terpanjang maxSide) -> dataURL JPEG. Dipakai buat sampul artikel. */
export function resizeToDataUrl(dataUrl, maxSide = 1280, quality = 0.82) {
  return compressImage(dataUrl, maxSide, quality).then(
    (blob) => new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.readAsDataURL(blob);
    })
  );
}
