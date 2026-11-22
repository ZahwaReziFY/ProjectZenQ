import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronDown, CreditCard, House, LifeBuoy, Mail, MessagesSquare, ScanLine, Search, ShieldCheck, Siren, Sparkles, UserRound,
} from 'lucide-react';
import { useLang } from '../i18n';
import { useAuth } from '../context/AuthContext';

const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || 'bantuan@zenq.id';

/**
 * PUSAT BANTUAN - FAQ disusun mengikuti alur & aturan ZenQ yang sebenarnya:
 * dokter offline tidak bisa dipesan, pembatalan setelah bayar lewat admin, status home visit 4 tahap,
 * video call butuh kedua pihak di ruang konsultasi, dst. Teks dalam bahasa Indonesia = kunci terjemahan (i18n/en.js).
 * ?order=ZQ-xxx -> datang dari Detail Pesanan, kode pesanan otomatis ikut di email bantuan.
 */
const TOPICS = [
  {
    id: 'akun', Icon: UserRound, title: 'Akun & Keamanan',
    faqs: [
      ['Bagaimana cara membuat akun?', 'Buka halaman Masuk, pilih Daftar, lalu isi nama, email, dan kata sandi minimal 8 karakter yang mengandung huruf dan angka.'],
      ['Saya lupa kata sandi, apa yang harus dilakukan?', 'Hubungi tim bantuan ZenQ lewat email di bawah dengan menyertakan email akun Anda. Admin akan membantu mengatur ulang kata sandi setelah identitas diverifikasi.'],
      ['Bagaimana cara mengganti kata sandi?', 'Buka Profil, pilih Ganti Kata Sandi, masukkan kata sandi lama lalu kata sandi baru. Kata sandi lama wajib diisi agar akun tetap aman.'],
      ['Akun saya terkunci setelah salah memasukkan kata sandi.', 'Demi keamanan, login diblokir sementara 15 menit setelah 5 kali salah memasukkan kata sandi. Tunggu 15 menit lalu coba lagi.'],
      ['Apakah kata sandi saya aman?', 'Kata sandi tidak pernah disimpan dalam bentuk asli. ZenQ hanya menyimpan hasil hash bcrypt, sehingga admin pun tidak bisa melihat kata sandi Anda.'],
      ['Bagaimana cara mengganti foto profil atau bahasa?', 'Buka Profil. Ketuk ikon kamera di foto untuk mengganti foto, dan pilih Bahasa untuk beralih antara Bahasa Indonesia dan English.'],
    ],
  },
  {
    id: 'konsultasi', Icon: MessagesSquare, title: 'Konsultasi Online',
    faqs: [
      ['Bagaimana cara konsultasi dengan dokter?', 'Buka menu Dokter, pilih dokter yang berstatus Online, tekan Konsultasi, lalu selesaikan pembayaran. Setelah lunas, ruang konsultasi langsung terbuka dan Anda bisa mulai chat.'],
      ['Kenapa dokter tidak bisa dipesan?', 'Dokter yang sedang offline tidak menerima pesanan baru. Pilih dokter lain yang berstatus Online, atau gunakan filter Sedang Online di halaman Dokter.'],
      ['Bagaimana cara video call atau telepon?', 'Di ruang konsultasi, tekan tombol plus lalu pilih Video Call atau Telepon. Lawan bicara harus sedang membuka ruang konsultasi yang sama, dan browser harus diizinkan mengakses kamera serta mikrofon.'],
      ['Video call gagal tersambung.', 'Pastikan kedua pihak memakai alamat https, izin kamera dan mikrofon sudah diberikan, dan koneksi internet stabil. Jaringan kantor atau kampus kadang memblokir panggilan, coba gunakan data seluler.'],
      ['Bisakah saya mengirim foto keluhan ke dokter?', 'Bisa. Tekan tombol plus di ruang konsultasi lalu pilih Kamera. Foto otomatis dikecilkan sebelum dikirim.'],
      ['Bagaimana mengakhiri sesi konsultasi?', 'Tekan Akhiri Sesi di kartu dokter. Riwayat chat tetap tersimpan dan bisa dilihat kembali.'],
    ],
  },
  {
    id: 'homevisit', Icon: House, title: 'Home Visit',
    faqs: [
      ['Bagaimana cara memesan home visit?', 'Buka menu Home Visit, pilih dokter yang online, tentukan tanggal dan jam, isi alamat serta keluhan, lalu lanjutkan ke pembayaran.'],
      ['Apa arti status pesanan home visit?', 'Setelah dibayar, status berjalan: Dokter melihat pesanan Anda, Dokter sedang dalam perjalanan, lalu Pesanan selesai. Status diperbarui langsung oleh dokter dan bisa dipantau di Riwayat.'],
      ['Bisakah saya membatalkan home visit?', 'Pesanan yang belum dibayar bisa dibatalkan sendiri dari halaman Detail Pesanan. Pesanan yang sudah dibayar hanya bisa dibatalkan oleh admin, hubungi tim bantuan dengan menyertakan kode pesanan.'],
      ['Dokter belum mengubah status pesanan saya.', 'Dokter akan melihat pesanan sesuai jadwal praktiknya. Jika lewat dari jadwal kunjungan belum ada kabar, hubungi tim bantuan dengan kode pesanan Anda.'],
    ],
  },
  {
    id: 'pembayaran', Icon: CreditCard, title: 'Pembayaran',
    faqs: [
      ['Metode pembayaran apa saja yang tersedia?', 'Transfer bank melalui Virtual Account (BCA, Mandiri, BRI, BNI) dan QR Pembayaran (QRIS).'],
      ['Bagaimana cara membayar dengan scan QR?', 'Pilih QR Pembayaran (QRIS), lalu scan kode QR yang muncul dengan kamera HP. Halaman ZenQ Pay akan terbuka, tekan Bayar. Halaman pembayaran di perangkat Anda akan otomatis berpindah ke status Selesai.'],
      ['Berapa lama batas waktu pembayaran?', 'Pesanan bisa dibayar dalam 24 jam. Link pembayaran QR juga berlaku 24 jam.'],
      ['Saya sudah membayar, tetapi status belum berubah.', 'Tunggu beberapa detik, halaman pembayaran memeriksa status secara otomatis. Jika masih belum berubah, muat ulang halaman atau hubungi tim bantuan dengan kode pesanan.'],
      ['Apakah pembayaran ini sungguhan?', 'Pada versi demo ini, pembayaran adalah simulasi dan tidak ada uang yang ditarik. Integrasi payment gateway resmi dilakukan saat aplikasi dipakai secara nyata.'],
    ],
  },
  {
    id: 'scan', Icon: ScanLine, title: 'Scan Obat',
    faqs: [
      ['Bagaimana cara memakai Scan Obat?', 'Buka menu Scan Obat, ambil foto kemasan obat dari depan atau pilih dari galeri. Gemini AI membaca nama obat, lalu ZenQ menampilkan dosis, efek samping, dan status halal dari database.'],
      ['Obat saya tidak dikenali.', 'Pastikan nama obat terlihat jelas, tidak buram, dan cukup cahaya. Anda juga bisa mengetik nama obat secara manual. Obat yang belum ada di database ZenQ belum bisa ditampilkan informasinya.'],
      ['Apakah informasi obat bisa menggantikan resep dokter?', 'Tidak. Informasi obat hanya untuk edukasi. Selalu ikuti anjuran dokter atau apoteker.'],
    ],
  },
  {
    id: 'darurat', Icon: Siren, title: 'Darurat',
    faqs: [
      ['Apa yang harus dilakukan saat keadaan darurat?', 'Segera hubungi layanan gawat darurat 119 atau datang ke IGD terdekat. Menu Darurat menampilkan rumah sakit terdekat beserta nomor ambulans.'],
      ['Kenapa lokasi saya tidak muncul di peta?', 'Izinkan akses lokasi di browser. Jika ditolak, peta tetap menampilkan fasilitas kesehatan di sekitar lokasi bawaan.'],
      ['Apakah pengajuan ambulans di ZenQ langsung mengirim ambulans?', 'Pada versi demo ini pengajuan ambulans adalah simulasi. Dalam keadaan darurat, selalu telepon 119 atau nomor ambulans yang tercantum.'],
    ],
  },
  {
    id: 'privasi', Icon: ShieldCheck, title: 'Privasi & Data',
    faqs: [
      ['Siapa yang bisa melihat percakapan konsultasi saya?', 'Hanya Anda dan dokter yang Anda konsultasikan. Video call terhubung langsung antarperangkat dan terenkripsi.'],
      ['Apakah foto yang saya kirim disimpan?', 'Foto profil, foto kemasan obat, dan foto di chat konsultasi disimpan untuk keperluan layanan. Foto kemasan obat dibaca oleh Gemini AI dan tidak dipakai untuk hal lain.'],
    ],
  },
];

function Help() {
  const { t } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const orderCode = params.get('order');
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('semua');
  const [open, setOpen] = useState(null);

  // Cari di pertanyaan & jawaban (dalam bahasa yang sedang aktif)
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TOPICS
      .filter((tp) => topic === 'semua' || tp.id === topic || q)
      .map((tp) => ({
        ...tp,
        faqs: tp.faqs.filter(([qq, a]) => !q || `${t(qq)} ${t(a)}`.toLowerCase().includes(q)),
      }))
      .filter((tp) => tp.faqs.length);
  }, [query, topic, t]);

  const subject = orderCode ? t('Bantuan pesanan {code}', { code: orderCode }) : t('Bantuan ZenQ');
  const body = [
    t('Halo tim ZenQ,'), '', t('Saya butuh bantuan terkait:'), '', '',
    '---', user ? `${user.name} · ${user.email}` : '', orderCode ? `${t('Kode pesanan')}: ${orderCode}` : '',
  ].join('\n');
  const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <div className="wrap">
      <h1 className="title">{t('Pusat Bantuan')}</h1>
      <p className="sub">{t('Temukan jawaban seputar akun, konsultasi, home visit, pembayaran, dan fitur ZenQ lainnya.')}</p>

      {orderCode && (
        <div className="toast" style={{ background: 'var(--soft)', color: 'var(--text)', marginTop: 0, marginBottom: 18 }}>
          {t('Anda membuka bantuan untuk pesanan {code}. Kode ini otomatis disertakan saat menghubungi tim bantuan.', { code: orderCode })}
        </div>
      )}

      <div className="help-search">
        <Search size={18} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('Cari pertanyaan, mis. video call, QRIS, home visit')}
          aria-label={t('Cari bantuan')}
        />
      </div>

      <div className="chips" style={{ margin: '16px 0 22px' }}>
        <button className={topic === 'semua' ? 'on' : ''} onClick={() => setTopic('semua')}>{t('Semua')}</button>
        {TOPICS.map((tp) => (
          <button key={tp.id} className={topic === tp.id ? 'on' : ''} onClick={() => setTopic(tp.id)}>{t(tp.title)}</button>
        ))}
      </div>

      <div className="split" style={{ '--cols': '1.6fr 1fr' }}>
        <div>
          {!results.length && (
            <div className="card center-msg">
              <span className="em"><LifeBuoy size={40} /></span>
              <p className="muted" style={{ margin: 0 }}>{t('Tidak ada jawaban yang cocok. Coba kata lain atau hubungi tim bantuan.')}</p>
            </div>
          )}
          {results.map(({ id, Icon, title, faqs }) => (
            <section key={id} className="help-topic">
              <h2><span className="lic"><Icon size={18} /></span>{t(title)}</h2>
              {faqs.map(([q, a]) => {
                const key = `${id}:${q}`;
                const isOpen = open === key || Boolean(query.trim());
                return (
                  <div key={key} className={`faq ${isOpen ? 'open' : ''}`}>
                    <button onClick={() => setOpen(open === key ? null : key)} aria-expanded={isOpen}>
                      <span>{t(q)}</span>
                      <ChevronDown size={18} />
                    </button>
                    {isOpen && <p>{t(a)}</p>}
                  </div>
                );
              })}
            </section>
          ))}
        </div>

        <div className="grid" style={{ gap: 16, alignContent: 'start' }}>
          <div className="card help-contact">
            <h3>{t('Masih butuh bantuan?')}</h3>
            <p className="small muted">{t('Tim bantuan ZenQ membalas email pada hari kerja, pukul 08.00 sampai 20.00 WIB.')}</p>
            <a className="btn block" href={mailto}><Mail size={17} /> {t('Email tim bantuan')}</a>
            <div className="small muted" style={{ textAlign: 'center', marginTop: 8 }}>{SUPPORT_EMAIL}</div>
            {user?.role === 'patient' && (
              <button className="btn ghost block" style={{ marginTop: 12 }} onClick={() => navigate('/chatbot')}>
                <Sparkles size={17} /> {t('Tanya AI ZenQ')}
              </button>
            )}
          </div>
          <div className="card help-sos">
            <span className="lic"><Siren size={20} /></span>
            <div>
              <b>{t('Keadaan darurat?')}</b>
              <div className="small">{t('Jangan menunggu balasan email. Segera telepon 119 atau buka menu Darurat.')}</div>
              <button className="link small" style={{ marginTop: 6 }} onClick={() => navigate('/emergency')}>{t('Buka menu Darurat')}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Help;
