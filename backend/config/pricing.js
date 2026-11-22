/**
 * Biaya tambahan di tiap jenis pesanan (sesuai mockup).
 * Harga SELALU dihitung di backend dari DB, gak percaya angka dari frontend.
 */
module.exports = {
  serviceFee: { consultation: 2000, home_visit: 2000 },
  homeVisitTransportFee: 25000,
  paymentDeadlineHours: 24,
  // Prefix nomor Virtual Account simulasi per bank
  banks: { BCA: '39', Mandiri: '88', BRI: '26', BNI: '98' },
};
