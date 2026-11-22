import { useCallback, useEffect, useRef, useState } from 'react';
import { getSocket } from '../utils/socket';

/**
 * Hook VIDEO CALL & TELEPON pakai WebRTC (peer-to-peer) + Socket.IO (signaling).
 *
 * Alur:
 *   PENELEPON                              PENERIMA
 *   start('video')  -- call:ring -------->  status 'incoming' (muncul tombol Terima/Tolak)
 *                   <------- call:accept --  accept(): nyalain kamera/mic, siapin koneksi
 *   bikin OFFER     -- webrtc:signal ---->  terima offer, bikin ANSWER
 *                   <---- webrtc:signal --
 *   tukar ICE candidate (alamat jaringan) dua arah
 *   ===> video & suara nyambung LANGSUNG antar browser (status 'connected')
 *
 * STUN (gratis, Google) dipakai buat cari alamat publik. Kalau jaringan ketat (wifi kampus/kantor)
 * dan gagal nyambung, isi TURN server di frontend/.env (VITE_TURN_URL, VITE_TURN_USERNAME, VITE_TURN_CREDENTIAL).
 *
 * status: idle | outgoing (berdering) | incoming | connecting | connected
 */
const ICE_SERVERS = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];
if (import.meta.env.VITE_TURN_URL) {
  ICE_SERVERS.push({
    urls: import.meta.env.VITE_TURN_URL,
    username: import.meta.env.VITE_TURN_USERNAME,
    credential: import.meta.env.VITE_TURN_CREDENTIAL,
  });
}

const END_TEXT = {
  declined: 'Panggilan ditolak.',
  missed: 'Panggilan tidak dijawab.',
  disconnect: 'Lawan bicara terputus.',
  hangup: '',
};

function mediaError(err) {
  if (!navigator.mediaDevices) return 'Kamera/mikrofon butuh alamat https (atau localhost).';
  if (err?.name === 'NotAllowedError') return 'Izin kamera/mikrofon ditolak. Izinkan lewat ikon gembok di address bar.';
  if (err?.name === 'NotFoundError') return 'Kamera atau mikrofon tidak ditemukan di perangkat ini.';
  if (err?.name === 'NotReadableError') return 'Kamera/mikrofon sedang dipakai aplikasi lain.';
  return `Gagal membuka kamera/mikrofon: ${err?.message || err}`;
}

export function useCall(consultationId, { onMessage } = {}) {
  const [status, setStatus] = useState('idle');
  const [callType, setCallType] = useState('video');
  const [peerName, setPeerName] = useState('');
  const [online, setOnline] = useState([]);
  const [info, setInfo] = useState('');
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [connectedAt, setConnectedAt] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const statusRef = useRef('idle');
  const typeRef = useRef('video');
  const pcRef = useRef(null);
  const localRef = useRef(null);
  const pendingIce = useRef([]);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const setStat = (s) => {
    statusRef.current = s;
    setStatus(s);
  };

  // Bersihin semua (kamera dimatikan, koneksi ditutup)
  const cleanup = useCallback((message = '') => {
    localRef.current?.getTracks().forEach((t) => t.stop());
    localRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    pendingIce.current = [];
    setLocalStream(null);
    setRemoteStream(null);
    setConnectedAt(null);
    setMicOn(true);
    setCamOn(true);
    setStat('idle');
    setInfo(message);
  }, []);

  const openMedia = async (type) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
      video: type === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false,
    });
    localRef.current = stream;
    setLocalStream(stream);
    return stream;
  };

  const createPeer = (stream) => {
    const socket = getSocket();
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    pc.onicecandidate = (e) => {
      if (e.candidate) socket.emit('webrtc:signal', { consultationId, data: { candidate: e.candidate } });
    };
    pc.ontrack = (e) => setRemoteStream(e.streams[0]);
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected' && statusRef.current !== 'connected') {
        setStat('connected');
        setConnectedAt(Date.now());
      }
      if (pc.connectionState === 'failed') {
        socket.emit('call:end', { consultationId });
        cleanup('Koneksi gagal. Jaringan mungkin memblokir panggilan (butuh TURN server).');
      }
    };
    pcRef.current = pc;
    return pc;
  };

  const flushIce = async () => {
    const pc = pcRef.current;
    while (pc && pendingIce.current.length) {
      await pc.addIceCandidate(pendingIce.current.shift()).catch(() => {});
    }
  };

  // ---------- Socket: masuk room konsultasi + dengerin event ----------
  useEffect(() => {
    if (!consultationId) return undefined;
    const socket = getSocket();
    const join = () => socket.emit('consult:join', { consultationId });

    const onPresence = ({ online: list }) => setOnline(list);
    const onIncoming = ({ type, from }) => {
      if (statusRef.current !== 'idle') return; // lagi sibuk
      typeRef.current = type;
      setCallType(type);
      setPeerName(from);
      setInfo('');
      setStat('incoming');
    };
    // Penelepon: lawan menerima -> bikin offer
    const onAccepted = async () => {
      if (statusRef.current !== 'outgoing') return;
      setStat('connecting');
      const pc = createPeer(localRef.current);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('webrtc:signal', { consultationId, data: { sdp: pc.localDescription } });
    };
    const onSignal = async (data) => {
      const pc = pcRef.current;
      if (!pc) return;
      try {
        if (data.sdp) {
          await pc.setRemoteDescription(data.sdp);
          if (data.sdp.type === 'offer') {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('webrtc:signal', { consultationId, data: { sdp: pc.localDescription } });
          }
          await flushIce();
        } else if (data.candidate) {
          if (pc.remoteDescription) await pc.addIceCandidate(data.candidate);
          else pendingIce.current.push(data.candidate); // offer/answer belum sampai, simpan dulu
        }
      } catch (err) {
        console.warn('[call] signal error', err);
      }
    };
    const onEnded = ({ reason } = {}) => {
      if (statusRef.current !== 'idle') cleanup(END_TEXT[reason] ?? '');
    };
    const onChat = (m) => onMessageRef.current?.(m);

    socket.on('connect', join);
    socket.on('consult:presence', onPresence);
    socket.on('call:incoming', onIncoming);
    socket.on('call:accepted', onAccepted);
    socket.on('webrtc:signal', onSignal);
    socket.on('call:ended', onEnded);
    socket.on('chat:message', onChat);
    if (socket.connected) join();

    return () => {
      if (statusRef.current !== 'idle') socket.emit('call:end', { consultationId });
      socket.emit('consult:leave', { consultationId });
      socket.off('connect', join);
      socket.off('consult:presence', onPresence);
      socket.off('call:incoming', onIncoming);
      socket.off('call:accepted', onAccepted);
      socket.off('webrtc:signal', onSignal);
      socket.off('call:ended', onEnded);
      socket.off('chat:message', onChat);
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consultationId]);

  // ---------- Aksi ----------
  const start = async (type) => {
    if (statusRef.current !== 'idle') return;
    setInfo('');
    typeRef.current = type;
    setCallType(type);
    setCamOn(type === 'video');
    try {
      await openMedia(type);
    } catch (err) {
      setInfo(mediaError(err));
      return;
    }
    setStat('outgoing');
    getSocket().emit('call:ring', { consultationId, type }, (res) => {
      if (!res?.ok) cleanup(res?.error || 'Panggilan gagal.');
    });
  };

  const accept = async () => {
    if (statusRef.current !== 'incoming') return;
    setCamOn(typeRef.current === 'video');
    try {
      const stream = await openMedia(typeRef.current);
      createPeer(stream); // siap menerima offer
    } catch (err) {
      getSocket().emit('call:decline', { consultationId });
      cleanup(mediaError(err));
      return;
    }
    setStat('connecting');
    getSocket().emit('call:accept', { consultationId });
  };

  const decline = () => {
    getSocket().emit('call:decline', { consultationId });
    cleanup();
  };

  const hangup = () => {
    getSocket().emit('call:end', { consultationId });
    cleanup();
  };

  const toggleMic = () => {
    const next = !micOn;
    localRef.current?.getAudioTracks().forEach((t) => { t.enabled = next; });
    setMicOn(next);
  };

  const toggleCam = () => {
    const next = !camOn;
    localRef.current?.getVideoTracks().forEach((t) => { t.enabled = next; });
    setCamOn(next);
  };

  return {
    status, callType, peerName, online, info, setInfo,
    micOn, camOn, speakerOn, connectedAt, localStream, remoteStream,
    start, accept, decline, hangup, toggleMic, toggleCam, toggleSpeaker: () => setSpeakerOn((v) => !v),
  };
}
