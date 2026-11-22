const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('./config/env');
const { query } = require('./config/db');

/**
 * SIGNALING SERVER untuk video call & telepon (WebRTC) + chat real-time.
 *
 * WebRTC mengirim video/suara LANGSUNG antar browser (peer-to-peer), bukan lewat server ini.
 * Tapi sebelum nyambung, dua browser harus "kenalan" dulu: tukar offer/answer/ICE candidate.
 * Pertukaran itu yang lewat sini, pakai Socket.IO (koneksi real-time).
 *
 * Ruangan: tiap konsultasi punya room "consult-<id>". Yang boleh masuk cuma pasien & dokter
 * dari konsultasi itu (dicek ke database), login dicek dari token JWT yang sama dengan REST API.
 *
 * Event dari browser:
 *   consult:join   { consultationId }            -> masuk room (dipanggil saat buka halaman konsultasi)
 *   call:ring      { consultationId, type }      -> mulai panggilan ('video' | 'audio')
 *   call:accept    { consultationId }            -> terima panggilan
 *   call:decline   { consultationId }            -> tolak panggilan
 *   call:end       { consultationId }            -> tutup panggilan
 *   webrtc:signal  { consultationId, data }      -> offer / answer / ice candidate (diteruskan apa adanya)
 * Event ke browser:
 *   consult:presence { online: [userId] }  call:incoming  call:accepted  call:declined  call:ended
 *   webrtc:signal  chat:message
 */

let io = null;
const calls = new Map(); // consultationId -> { type, callerId, startedAt, ringTimer }
const RING_TIMEOUT_MS = 40 * 1000;

const room = (id) => `consult-${id}`;

async function loadConsultation(id, user) {
  const { rows } = await query(
    `SELECT c.id, c.status, c.patient_id, d.user_id AS doctor_user_id
     FROM consultations c JOIN doctors d ON d.id = c.doctor_id WHERE c.id = $1`,
    [id]
  );
  const c = rows[0];
  if (!c) return { error: 'Konsultasi tidak ditemukan.' };
  if (c.patient_id !== user.id && c.doctor_user_id !== user.id) return { error: 'Tidak punya akses.' };
  return { c };
}

// Siapa saja (userId) yang lagi buka halaman konsultasi ini
async function onlineUsers(id) {
  const sockets = await io.in(room(id)).fetchSockets();
  return [...new Set(sockets.map((s) => s.data.user.id))];
}

async function addSystemMessage(consultationId, senderId, text) {
  const { rows } = await query(
    `INSERT INTO consultation_messages (consultation_id, sender_id, type, message)
     VALUES ($1, $2, 'system', $3) RETURNING *`,
    [consultationId, senderId, text]
  );
  io.to(room(consultationId)).emit('chat:message', rows[0]);
}

const fmtDuration = (ms) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};
const LABEL = { video: 'Video call', audio: 'Telepon' };

// Akhiri panggilan + catat riwayatnya di chat
async function finishCall(consultationId, reason) {
  const call = calls.get(consultationId);
  if (!call) return;
  clearTimeout(call.ringTimer);
  calls.delete(consultationId);
  io.to(room(consultationId)).emit('call:ended', { reason });

  let text;
  if (call.startedAt) text = `${LABEL[call.type]} selesai · ${fmtDuration(Date.now() - call.startedAt)}`;
  else if (reason === 'declined') text = `${LABEL[call.type]} ditolak`;
  else text = `${LABEL[call.type]} tidak terjawab`;
  await addSystemMessage(consultationId, call.callerId, text).catch((e) => console.warn('[call] gagal catat:', e.message));
}

function init(server) {
  io = new Server(server, { cors: { origin: config.frontendUrl } });

  // Cek token login sebelum boleh konek
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const decoded = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
      socket.data.user = { id: Number(decoded.id), name: decoded.name, role: decoded.role };
      return next();
    } catch {
      return next(new Error('Sesi login tidak valid.'));
    }
  });

  io.on('connection', (socket) => {
    const { user } = socket.data;
    const joined = new Set(); // id konsultasi yang dimasuki socket ini

    // Pastikan socket ini memang sudah join room konsultasi tsb
    const inRoom = (id) => joined.has(Number(id));

    socket.on('consult:join', async ({ consultationId } = {}, ack = () => {}) => {
      try {
        const id = Number(consultationId);
        const { c, error } = await loadConsultation(id, user);
        if (error) return ack({ ok: false, error });
        socket.join(room(id));
        joined.add(id);
        io.to(room(id)).emit('consult:presence', { online: await onlineUsers(id) });
        // Kalau ada panggilan yang lagi berdering buat user ini (misal baru buka halaman), kasih tahu
        const call = calls.get(id);
        if (call && !call.startedAt && call.callerId !== user.id) {
          socket.emit('call:incoming', { type: call.type, from: call.callerName });
        }
        return ack({ ok: true, status: c.status });
      } catch (err) {
        return ack({ ok: false, error: err.message });
      }
    });

    socket.on('consult:leave', async ({ consultationId } = {}) => {
      const id = Number(consultationId);
      if (!inRoom(id)) return;
      socket.leave(room(id));
      joined.delete(id);
      io.to(room(id)).emit('consult:presence', { online: await onlineUsers(id) });
    });

    socket.on('call:ring', async ({ consultationId, type } = {}, ack = () => {}) => {
      const id = Number(consultationId);
      if (!inRoom(id)) return ack({ ok: false, error: 'Belum masuk ruang konsultasi.' });
      if (!['video', 'audio'].includes(type)) return ack({ ok: false, error: 'Jenis panggilan tidak dikenal.' });
      const { c } = await loadConsultation(id, user);
      if (!c || c.status !== 'ongoing') return ack({ ok: false, error: 'Sesi konsultasi tidak aktif.' });
      if (calls.has(id)) return ack({ ok: false, error: 'Sedang ada panggilan berlangsung.' });

      const online = await onlineUsers(id);
      if (!online.some((uid) => uid !== user.id)) {
        return ack({ ok: false, error: 'Lawan bicara belum membuka ruang konsultasi ini.' });
      }

      const ringTimer = setTimeout(() => finishCall(id, 'missed'), RING_TIMEOUT_MS);
      calls.set(id, { type, callerId: user.id, callerName: user.name, startedAt: null, ringTimer });
      socket.to(room(id)).emit('call:incoming', { type, from: user.name });
      return ack({ ok: true });
    });

    socket.on('call:accept', ({ consultationId } = {}) => {
      const id = Number(consultationId);
      const call = calls.get(id);
      if (!inRoom(id) || !call || call.startedAt || call.callerId === user.id) return;
      clearTimeout(call.ringTimer);
      call.startedAt = Date.now();
      socket.to(room(id)).emit('call:accepted');
    });

    socket.on('call:decline', ({ consultationId } = {}) => {
      const id = Number(consultationId);
      if (inRoom(id) && calls.has(id)) finishCall(id, 'declined');
    });

    socket.on('call:end', ({ consultationId } = {}) => {
      const id = Number(consultationId);
      if (inRoom(id) && calls.has(id)) finishCall(id, 'hangup');
    });

    // offer / answer / ice candidate -> diteruskan ke lawan bicara
    socket.on('webrtc:signal', ({ consultationId, data } = {}) => {
      const id = Number(consultationId);
      if (inRoom(id) && calls.has(id)) socket.to(room(id)).emit('webrtc:signal', data);
    });

    // Tab ditutup / internet putus -> panggilan yang dia ikuti diakhiri
    socket.on('disconnect', async () => {
      for (const id of joined) {
        if (calls.has(id)) {
          const stillHere = (await onlineUsers(id)).includes(user.id);
          if (!stillHere) finishCall(id, 'disconnect');
        }
        io.to(room(id)).emit('consult:presence', { online: await onlineUsers(id) });
      }
    });
  });

  return io;
}

// Dipakai controller REST: kirim pesan chat baru ke room secara real-time
function emitToConsultation(consultationId, event, payload) {
  if (io) io.to(room(consultationId)).emit(event, payload);
}

module.exports = { init, emitToConsultation };
