import { getLang, translate } from '../i18n';
export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const TOKEN_KEY = 'zenq_token';

/**
 * Token login disimpan PER TAB (sessionStorage), bukan dibagi semua tab.
 *
 * Kenapa? Dulu token cuma di localStorage (dipakai bareng semua tab). Kalau tab 1 login
 * pasien lalu tab 2 login dokter, token pasien KETIMPA -> tab 1 masih kelihatan pasien
 * tapi semua request terkirim atas nama dokter (chat salah pengirim, Home Visit 403).
 *
 * Sekarang:
 *  - sessionStorage = token milik tab ini (tiap tab punya sendiri)
 *  - localStorage   = login terakhir, cuma dipakai tab BARU biar gak perlu login ulang
 */
export function getToken() {
  let token = sessionStorage.getItem(TOKEN_KEY);
  if (!token) {
    token = localStorage.getItem(TOKEN_KEY); // tab baru -> ikut login terakhir
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
  }
  return token;
}

export function setToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  const mine = sessionStorage.getItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  // Hapus juga "login terakhir" cuma kalau itu token tab ini (biar gak logout-in tab lain)
  if (localStorage.getItem(TOKEN_KEY) === mine) localStorage.removeItem(TOKEN_KEY);
}

/**
 * Wrapper fetch ke backend ZenQ. Otomatis:
 *  - nempelin header Authorization kalo ada token
 *  - parse JSON {code, success, message, data}
 *  - lempar Error berisi `message` dari backend kalo gagal
 *  - kirim event 'zenq:unauthorized' kalo token expired (401) -> AuthContext logout
 */
async function request(method, path, body) {
  const token = getToken();
  const isForm = body instanceof FormData;

  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  headers['Accept-Language'] = getLang();
  if (body && !isForm) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  const json = await res.json().catch(() => ({}));

  if (res.status === 401 && token) {
    window.dispatchEvent(new Event('zenq:unauthorized'));
  }
  if (!res.ok || json.success === false) {
    throw new Error(translate(json.message) || translate('Request gagal: {status}', { status: res.status }));
  }
  // Pesan dari backend (bahasa Indonesia) diterjemahkan kalau bahasa aktif Inggris
  if (json.message) json.message = translate(json.message);
  return json;
}

const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  patch: (path, body) => request('PATCH', path, body),
  delete: (path) => request('DELETE', path),
};

// Dipertahanin buat kompatibel sama pola template lama
export const apiGet = api.get;

export default api;
