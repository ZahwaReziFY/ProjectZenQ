/**
 * OCR CADANGAN di browser pake tesseract.js (gratis, tanpa API key).
 * Jalur utama scan obat sekarang Gemini (backend/services/geminiOcrService.js).
 * File ini cuma dipakai kalau Gemini gagal (key kosong, kuota habis, internet putus).
 *
 * Kenapa gak langsung Tesseract.recognize(foto)? Foto kemasan biasanya MIRING,
 * tulisannya putih di atas warna, dan hurufnya bergaya. Tesseract cuma jago baca
 * tulisan yang lurus dan kontras. Jadi sebelum dibaca, foto:
 *   1. diperbesar/diperkecil ke ukuran ideal (sisi terpanjang 1600 px)
 *   2. diputar (dicoba beberapa sudut: 0°, 15°, -15°, 25°, -25°)
 *   3. dijadikan hitam-putih + kontrasnya dinaikkan
 * Tiap sudut dibaca; berhenti begitu teksnya mengandung nama obat (fungsi isGood).
 *
 * Catatan: pertama kali jalan, tesseract download data bahasa (~10 MB) dari internet.
 * Kalo gagal, user tetap bisa ketik nama obat manual.
 */

const ANGLES = [0, 15, -15, 25, -25];
const TARGET_SIZE = 1600;

let workerPromise = null;

// Worker tesseract dibuat SEKALI lalu dipakai ulang (bikin worker itu lambat)
function getWorker() {
  if (!workerPromise) {
    workerPromise = import('tesseract.js').then(({ createWorker }) => createWorker('eng'));
    workerPromise.catch(() => {
      workerPromise = null; // gagal (misal offline) -> boleh dicoba lagi nanti
    });
  }
  return workerPromise;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Putar + hitam-putih + naikkan kontras -> canvas siap dibaca tesseract
function prepare(img, angle) {
  const scale = Math.min(3, TARGET_SIZE / Math.max(img.width, img.height));
  const w = img.width * scale;
  const h = img.height * scale;
  const rad = (angle * Math.PI) / 180;
  const cw = Math.ceil(Math.abs(w * Math.cos(rad)) + Math.abs(h * Math.sin(rad)));
  const ch = Math.ceil(Math.abs(w * Math.sin(rad)) + Math.abs(h * Math.cos(rad)));

  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, cw, ch);
  ctx.translate(cw / 2, ch / 2);
  ctx.rotate(rad); // sudut positif = searah jarum jam
  ctx.drawImage(img, -w / 2, -h / 2, w, h);

  // Hitam-putih (luminance) + regangkan kontras pakai persentil 2%-98%
  const data = ctx.getImageData(0, 0, cw, ch);
  const px = data.data;
  const gray = new Uint8ClampedArray(cw * ch);
  const hist = new Uint32Array(256);
  for (let i = 0, j = 0; i < px.length; i += 4, j += 1) {
    const g = Math.round(0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]);
    gray[j] = g;
    hist[g] += 1;
  }
  const total = cw * ch;
  let lo = 0;
  let hi = 255;
  for (let acc = 0; lo < 255 && acc + hist[lo] < total * 0.02; lo += 1) acc += hist[lo];
  for (let acc = 0; hi > 0 && acc + hist[hi] < total * 0.02; hi -= 1) acc += hist[hi];
  const range = Math.max(1, hi - lo);
  for (let i = 0, j = 0; i < px.length; i += 4, j += 1) {
    const v = Math.max(0, Math.min(255, ((gray[j] - lo) * 255) / range));
    px[i] = v;
    px[i + 1] = v;
    px[i + 2] = v;
  }
  ctx.putImageData(data, 0, 0);
  return canvas;
}

/**
 * @param {string} image  dataURL foto
 * @param {object} opts
 *   onProgress(persen)  - progres 0..100
 *   isGood(teks)        - balikin true kalo teks sudah memuat nama obat (berhenti lebih awal)
 * @returns {Promise<string>} gabungan teks dari semua sudut yang dicoba
 */
export async function readTextFromImage(image, { onProgress, isGood } = {}) {
  const [worker, img] = await Promise.all([getWorker(), loadImage(image)]);
  const texts = [];

  for (let i = 0; i < ANGLES.length; i += 1) {
    onProgress?.(Math.round((i / ANGLES.length) * 100));
    const { data } = await worker.recognize(prepare(img, ANGLES[i]));
    texts.push(data.text || '');
    if (isGood?.(data.text || '')) break;
  }

  onProgress?.(100);
  return texts.join('\n');
}
