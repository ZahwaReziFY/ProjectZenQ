const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { query } = require('../config/db');
const sendResponse = require('../utils/response');
const orderService = require('../services/orderService');
const { parseId } = require('../utils/validation');

/**
 * SCAN PEMBAYARAN (simulasi payment gateway QRIS).
 *
 * Alur:
 *  1. Pasien pilih QRIS di halaman Checkout
 *  2. Frontend minta token bayar   -> GET /orders/:id/pay-token
 *  3. Token dijadikan QR berisi link  https://<web-zenq>/pay/<token>
 *  4. Pasien scan QR pakai kamera HP -> halaman "ZenQ Pay" (GET /pay/:token)
 *  5. Klik "Bayar"                    -> POST /pay/:token/confirm -> pesanan LUNAS
 *  6. Halaman Checkout (yang mengecek status tiap 3 detik) otomatis lanjut ke "Selesai"
 *
 * Token = JWT yang ditandatangani server (isi: id pesanan, berlaku 24 jam), jadi link
 * tidak bisa ditebak atau diubah ke pesanan lain. Di aplikasi nyata, langkah 4-5 dilakukan
 * aplikasi bank/e-wallet lalu bank memberi tahu server lewat webhook.
 */
const PAY_TOKEN_TTL = '24h';

const signPayToken = (orderId) => jwt.sign({ oid: orderId, purpose: 'pay' }, config.jwtSecret, {
  algorithm: 'HS256',
  expiresIn: PAY_TOKEN_TTL,
});

function readPayToken(token) {
  try {
    const p = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
    return p.purpose === 'pay' ? Number(p.oid) : null;
  } catch {
    return null;
  }
}

const invalid = (res) => sendResponse(res, {
  code: 404, success: false, message: 'Link pembayaran tidak valid atau sudah kedaluwarsa.',
});

// Data pesanan + pemiliknya (tanpa cek login; aksesnya dijamin token)
async function loadOrder(orderId) {
  const found = await query(
    `SELECT o.*, u.name AS owner_name, u.role AS owner_role
     FROM orders o JOIN users u ON u.id = o.user_id WHERE o.id = $1`,
    [orderId]
  );
  if (!found.rows.length) return null;
  return orderService.withDetails(found.rows[0]);
}

// GET /orders/:id/pay-token  (pemilik pesanan, login)
const getPayToken = async (req, res, next) => {
  try {
    const order = await orderService.getOrder(parseId(req.params.id), req.user);
    if (order.status !== 'awaiting_payment') {
      return sendResponse(res, { code: 400, success: false, message: 'Pesanan ini tidak menunggu pembayaran.' });
    }
    return sendResponse(res, { data: { token: signPayToken(order.id), expires_in: PAY_TOKEN_TTL } });
  } catch (err) {
    return next(err);
  }
};

// GET /pay/:token  (publik) - ringkasan tagihan untuk halaman ZenQ Pay
const getPayment = async (req, res, next) => {
  try {
    const orderId = readPayToken(req.params.token);
    const order = orderId && (await loadOrder(orderId));
    if (!order) return invalid(res);
    return sendResponse(res, {
      data: {
        code: order.code,
        title: order.title,
        total: order.total,
        status: order.status,
        items: (order.items || []).map((i) => ({ label: i.label, amount: i.amount })),
        payer: order.owner_name,
        created_at: order.created_at,
      },
    });
  } catch (err) {
    return next(err);
  }
};

// POST /pay/:token/confirm  (publik) - simulasi "bank sudah menerima pembayaran"
const confirmByToken = async (req, res, next) => {
  try {
    const orderId = readPayToken(req.params.token);
    const order = orderId && (await loadOrder(orderId));
    if (!order) return invalid(res);
    if (order.status !== 'awaiting_payment') {
      return sendResponse(res, { message: 'Pesanan ini sudah dibayar.', data: { status: order.status } });
    }
    if (!order.payment_method) {
      await query("UPDATE orders SET payment_method = 'qris' WHERE id = $1", [order.id]);
    }
    const owner = { id: order.user_id, name: order.owner_name, role: order.owner_role };
    const paid = await orderService.confirmPayment(order.id, owner);
    return sendResponse(res, { message: 'Pembayaran berhasil.', data: { status: paid.status, code: paid.code } });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getPayToken, getPayment, confirmByToken };
