const { pool, query } = require('../config/db');
const pricing = require('../config/pricing');
const { notify } = require('./notificationService');

/**
 * Semua transaksi ZenQ lewat sini: konsultasi, home visit, belanja, pengajuan ambulans.
 *
 * Alur status order:
 *   awaiting_payment --(confirm bayar)--> processing --(layanan selesai)--> completed
 *          └──────────────(cancel)──────────────> cancelled
 *
 * Pembayaran DISIMULASIKAN (VA / QRIS) karena pembayaran riil di luar lingkup proyek.
 * Kalo nanti mau pake payment gateway (misal Midtrans sandbox), ganti isi choosePayment()
 * dan confirmPayment() jadi webhook dari gateway.
 */

const httpError = (status, message) => Object.assign(new Error(message), { status });

function generateCode() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `ZQ-${ymd}${Math.floor(Math.random() * 1e4).toString().padStart(4, '0')}`;
}

async function insertOrder(client, userId, { kind, category, title, icon, place, lines, status = 'awaiting_payment' }) {
  const total = lines.reduce((sum, l) => sum + l.amount, 0);

  // Ulangi kalo kebetulan kode order bentrok (unik)
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await client.query('SAVEPOINT order_code');
      const res = await client.query(
        `INSERT INTO orders (code, user_id, kind, category, title, icon, place, status, total)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [generateCode(), userId, kind, category, title, icon, place, status, total]
      );
      const order = res.rows[0];
      for (const l of lines) {
        await client.query(
          'INSERT INTO order_items (order_id, label, product_id, quantity, amount) VALUES ($1, $2, $3, $4, $5)',
          [order.id, l.label, l.productId || null, l.quantity || 1, l.amount]
        );
      }
      return order;
    } catch (err) {
      await client.query('ROLLBACK TO SAVEPOINT order_code');
      if (err.code !== '23505') throw err;
    }
  }
  throw httpError(500, 'Gagal membuat kode pesanan.');
}

async function getDoctor(client, doctorId) {
  const res = await client.query(
    `SELECT d.*, u.name FROM doctors d JOIN users u ON u.id = d.user_id WHERE d.id = $1`,
    [doctorId]
  );
  if (!res.rows[0]) throw httpError(404, 'Dokter tidak ditemukan.');
  return res.rows[0];
}

// Dokter yang sedang OFFLINE tidak bisa dipesan (konsultasi maupun home visit)
function ensureOnline(doctor) {
  if (!doctor.is_online) {
    throw httpError(409, `${doctor.name} sedang offline. Pilih dokter lain yang sedang online atau coba lagi nanti.`);
  }
}

const builders = {
  async consultation(client, user, body) {
    const doctor = await getDoctor(client, Number(body.doctor_id));
    ensureOnline(doctor);
    const order = await insertOrder(client, user.id, {
      kind: 'consultation',
      category: 'Booking Dokter',
      title: `Konsultasi ${doctor.name}`,
      icon: '💬',
      place: doctor.hospital,
      lines: [
        { label: `Konsultasi ${doctor.name} (1 sesi)`, amount: doctor.consultation_fee },
        { label: 'Biaya layanan', amount: pricing.serviceFee.consultation },
      ],
    });
    const consult = await client.query(
      `INSERT INTO consultations (order_id, patient_id, doctor_id, complaint, source)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [order.id, user.id, doctor.id, body.complaint || null, body.source === 'chatbot' ? 'chatbot' : 'direct']
    );
    return { ...order, consultation_id: consult.rows[0].id };
  },

  async home_visit(client, user, body) {
    const doctor = await getDoctor(client, Number(body.doctor_id));
    ensureOnline(doctor);
    if (!doctor.accepts_home_visit) throw httpError(400, 'Dokter ini tidak menerima home visit.');

    const address = (body.address || '').trim();
    if (!address) throw httpError(400, 'Isi alamat kunjungan terlebih dahulu.');
    const scheduledAt = new Date(body.scheduled_at);
    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt < new Date()) {
      throw httpError(400, 'Jadwal kunjungan harus tanggal & jam yang akan datang.');
    }

    const when = scheduledAt.toLocaleString('id-ID', {
      dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta',
    });
    const order = await insertOrder(client, user.id, {
      kind: 'home_visit',
      category: 'Booking Dokter',
      title: `Home Visit ${doctor.name}`,
      icon: '🏠',
      place: `${address} (${when})`,
      lines: [
        { label: `Kunjungan ${doctor.name}`, amount: doctor.home_visit_fee },
        { label: 'Biaya transport dokter', amount: pricing.homeVisitTransportFee },
        { label: 'Biaya layanan', amount: pricing.serviceFee.home_visit },
      ],
    });
    const visit = await client.query(
      `INSERT INTO home_visits (order_id, patient_id, doctor_id, scheduled_at, address, latitude, longitude, complaint)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [order.id, user.id, doctor.id, scheduledAt, address, body.latitude || null, body.longitude || null, body.complaint || null]
    );
    return { ...order, home_visit_id: visit.rows[0].id };
  },

  // Pengajuan ambulans: tanpa biaya, langsung diproses (simulasi - 119 di luar lingkup)
  async ambulance(client, user, body) {
    return insertOrder(client, user.id, {
      kind: 'ambulance',
      category: 'Pengajuan',
      title: 'Panggil Ambulans',
      icon: '🚑',
      place: (body.place || '').trim() || 'Lokasi Anda',
      lines: [],
      status: 'processing',
    });
  },
};

async function createOrder(user, body) {
  const build = builders[body.kind];
  if (!build) throw httpError(400, 'Jenis pesanan tidak valid.');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const order = await build(client, user, body);
    await client.query('COMMIT');
    return order;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getOrder(id, user) {
  const res = await query('SELECT * FROM orders WHERE id = $1', [id]);
  const order = res.rows[0];
  if (!order) throw httpError(404, 'Pesanan tidak ditemukan.');
  if (order.user_id !== user.id && user.role !== 'admin') throw httpError(403, 'Tidak punya akses ke pesanan ini.');
  return withDetails(order);
}

// Detail lengkap pesanan (item, konsultasi, home visit). Cek akses dilakukan pemanggilnya.
async function withDetails(order) {
  const { id } = order;

  const [items, consult, visit] = await Promise.all([
    query('SELECT label, quantity, amount, product_id FROM order_items WHERE order_id = $1 ORDER BY id', [id]),
    query('SELECT id, status, doctor_id FROM consultations WHERE order_id = $1', [id]),
    query('SELECT id, status, doctor_id, scheduled_at FROM home_visits WHERE order_id = $1', [id]),
  ]);
  return {
    ...order,
    items: items.rows,
    consultation: consult.rows[0] || null,
    home_visit: visit.rows[0] || null,
  };
}

async function listOrders(user, category) {
  const params = [user.id];
  let filter = '';
  if (category && category !== 'Semua') {
    params.push(category);
    filter = 'AND category = $2';
  }
  const res = await query(
    `SELECT o.*, c.id AS consultation_id
     FROM orders o LEFT JOIN consultations c ON c.order_id = o.id
     WHERE o.user_id = $1 ${filter} ORDER BY o.created_at DESC`,
    params
  );
  return res.rows;
}

// Langkah 1: pilih metode -> bikin nomor VA / payload QRIS
async function choosePayment(id, user, { method, bank }) {
  const order = await getOrder(id, user);
  if (order.status !== 'awaiting_payment') throw httpError(400, 'Pesanan ini tidak menunggu pembayaran.');
  if (!['bank', 'qris'].includes(method)) throw httpError(400, 'Metode pembayaran tidak valid.');
  if (method === 'bank' && !pricing.banks[bank]) throw httpError(400, 'Bank tidak tersedia.');

  const va = method === 'bank'
    ? pricing.banks[bank] + '08' + Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join('')
    : null;

  await query(
    `UPDATE orders SET payment_method = $1, payment_bank = $2, va_number = $3,
       payment_expires_at = NOW() + ($4 || ' hours')::interval
     WHERE id = $5`,
    [method, method === 'bank' ? bank : null, va, String(pricing.paymentDeadlineHours), id]
  );
  return getOrder(id, user);
}

// Langkah 2: "Saya Sudah Bayar" (simulasi pembayaran berhasil)
async function confirmPayment(id, user) {
  const order = await getOrder(id, user);
  if (order.status !== 'awaiting_payment') throw httpError(400, 'Pesanan ini tidak menunggu pembayaran.');
  if (!order.payment_method) throw httpError(400, 'Pilih metode pembayaran dulu.');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`UPDATE orders SET status = 'processing', paid_at = NOW() WHERE id = $1`, [id]);

    if (order.consultation) {
      await client.query(
        `UPDATE consultations SET status = 'ongoing', started_at = NOW() WHERE id = $1`,
        [order.consultation.id]
      );
      const doc = await client.query('SELECT user_id FROM doctors WHERE id = $1', [order.consultation.doctor_id]);
      await notify(doc.rows[0].user_id, {
        title: 'Konsultasi baru',
        body: `${user.name} sudah membayar sesi konsultasi.`,
        type: 'consultation',
        referenceId: order.consultation.id,
      }, client);
      await notify(user.id, {
        title: order.title.replace('Konsultasi ', ''),
        body: 'Halo anda baru saja melakukan konsultasi dokter, anda bisa melanjutkan ke sesi berikutnya.',
        type: 'consultation',
        referenceId: order.consultation.id,
        senderDoctorId: order.consultation.doctor_id,
      }, client);
    }

    if (order.home_visit) {
      await client.query(`UPDATE home_visits SET status = 'pending' WHERE id = $1`, [order.home_visit.id]);
      const doc = await client.query('SELECT user_id FROM doctors WHERE id = $1', [order.home_visit.doctor_id]);
      await notify(doc.rows[0].user_id, {
        title: 'Pesanan home visit baru',
        body: order.place,
        type: 'home_visit',
        referenceId: order.home_visit.id,
      }, client);
      await notify(user.id, {
        title: 'Home Visit',
        body: 'Pembayaran diterima. Dokter akan tiba sesuai jadwal. Pantau statusnya di halaman Riwayat.',
        type: 'home_visit',
        referenceId: order.id,
      }, client);
    }


    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  return getOrder(id, user);
}

async function cancelOrder(id, user) {
  const order = await getOrder(id, user);
  if (['completed', 'cancelled'].includes(order.status)) throw httpError(400, 'Pesanan sudah selesai/dibatalkan.');
  if (order.status === 'processing' && order.kind !== 'ambulance' && user.role !== 'admin') {
    throw httpError(400, 'Pesanan yang sudah dibayar hanya bisa dibatalkan admin.');
  }
  await query(`UPDATE orders SET status = 'cancelled', cancelled_at = NOW() WHERE id = $1`, [id]);
  await query(`UPDATE consultations SET status = 'cancelled' WHERE order_id = $1`, [id]);
  await query(`UPDATE home_visits SET status = 'cancelled' WHERE order_id = $1`, [id]);
  return getOrder(id, user);
}

// Dipanggil pas konsultasi / home visit selesai -> order ikut selesai
async function completeOrderOf(table, entityId) {
  await query(
    `UPDATE orders SET status = 'completed', completed_at = NOW()
     WHERE id = (SELECT order_id FROM ${table === 'home_visits' ? 'home_visits' : 'consultations'} WHERE id = $1)
       AND status = 'processing'`,
    [entityId]
  );
}

module.exports = {
  withDetails,
  createOrder,
  getOrder,
  listOrders,
  choosePayment,
  confirmPayment,
  cancelOrder,
  completeOrderOf,
};
