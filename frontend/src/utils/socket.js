import { io } from 'socket.io-client';
import { BASE_URL, getToken } from './api';

/**
 * Satu koneksi Socket.IO per tab ke backend (dipakai video call, telepon, chat real-time).
 * Login dicek pakai token yang sama dengan REST API (token tab ini).
 * Kalau token berubah (logout/login akun lain), koneksi lama ditutup dan dibuat ulang.
 */
let socket = null;
let socketToken = null;

export function getSocket() {
  const token = getToken();
  if (socket && socketToken === token) return socket;
  if (socket) socket.disconnect();
  socketToken = token;
  socket = io(BASE_URL, { auth: { token }, transports: ['websocket', 'polling'] });
  return socket;
}
