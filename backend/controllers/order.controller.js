const sendResponse = require('../utils/response');
const { parseId } = require('../utils/validation');
const orderService = require('../services/orderService');

const wrap = (fn) => async (req, res, next) => {
  try {
    return await fn(req, res);
  } catch (err) {
    return next(err);
  }
};

const idOr400 = (req, res) => {
  const id = parseId(req.params.id);
  if (!id) sendResponse(res, { code: 400, success: false, message: 'ID pesanan tidak valid.' });
  return id;
};

// POST /orders { kind: consultation|home_visit|ambulance, ... }
const create = wrap(async (req, res) => {
  const order = await orderService.createOrder(req.user, req.body || {});
  return sendResponse(res, { code: 201, message: 'Pesanan dibuat.', data: order });
});

// GET /orders?category=Semua|Booking Dokter|Pembelian|Pengajuan
const list = wrap(async (req, res) =>
  sendResponse(res, { data: await orderService.listOrders(req.user, req.query.category) }));

// GET /orders/:id
const getById = wrap(async (req, res) => {
  const id = idOr400(req, res);
  if (!id) return null;
  return sendResponse(res, { data: await orderService.getOrder(id, req.user) });
});

// POST /orders/:id/payment { method: bank|qris, bank }
const choosePayment = wrap(async (req, res) => {
  const id = idOr400(req, res);
  if (!id) return null;
  const order = await orderService.choosePayment(id, req.user, req.body || {});
  return sendResponse(res, { message: 'Silakan selesaikan pembayaran.', data: order });
});

// POST /orders/:id/confirm  (simulasi "Saya Sudah Bayar")
const confirm = wrap(async (req, res) => {
  const id = idOr400(req, res);
  if (!id) return null;
  const order = await orderService.confirmPayment(id, req.user);
  return sendResponse(res, { message: 'Pembayaran berhasil.', data: order });
});

// POST /orders/:id/cancel
const cancel = wrap(async (req, res) => {
  const id = idOr400(req, res);
  if (!id) return null;
  const order = await orderService.cancelOrder(id, req.user);
  return sendResponse(res, { message: 'Pesanan dibatalkan.', data: order });
});

module.exports = { create, list, getById, choosePayment, confirm, cancel };
