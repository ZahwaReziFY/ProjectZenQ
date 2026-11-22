/**
 * Validasi gambar yang dikirim sebagai data URL (foto profil, sampul artikel, foto chat).
 * Gambar sudah dikecilkan di browser, jadi ukurannya kecil (puluhan s/d ratusan KB)
 * dan aman disimpan langsung di kolom TEXT database (gak butuh folder uploads,
 * jadi tetap jalan saat di-deploy ke hosting yang filesystem-nya gak permanen).
 */
const DATA_URL = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

function isImageDataUrl(value, maxKb = 600) {
  return typeof value === 'string' && value.length <= maxKb * 1024 * 1.37 && DATA_URL.test(value);
}

module.exports = { isImageDataUrl };
