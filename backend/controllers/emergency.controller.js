const sendResponse = require('../utils/response');
const { validateCoordinates } = require('../utils/validation');
const { findNearbyFacilities, getEmergencyContacts } = require('../services/emergencyService');
const orderService = require('../services/orderService');

const FACILITY_TYPES = ['hospital', 'puskesmas', 'clinic'];

// GET /emergency/nearby?lat=&lng=&radius_km=&type=
const getNearby = async (req, res, next) => {
  try {
    const { lat, lng, radius_km: radius, type } = req.query;
    const error = validateCoordinates(lat, lng);
    if (error) return sendResponse(res, { code: 400, success: false, message: error });

    const { source, items } = await findNearbyFacilities({
      lat: Number(lat),
      lng: Number(lng),
      radiusKm: Math.min(Math.max(Number(radius) || 10, 1), 50),
      type: FACILITY_TYPES.includes(type) ? type : undefined,
    });

    return sendResponse(res, {
      message: source === 'openstreetmap' ? 'Data dari OpenStreetMap' : 'Data demo lokal',
      data: { source, items },
    });
  } catch (err) {
    return next(err);
  }
};

// GET /emergency/contacts
const getContacts = async (req, res, next) => {
  try {
    return sendResponse(res, { data: await getEmergencyContacts() });
  } catch (err) {
    return next(err);
  }
};

// POST /emergency/ambulance-request { place } - pengajuan simulasi, masuk Riwayat kategori "Pengajuan"
const requestAmbulance = async (req, res, next) => {
  try {
    const order = await orderService.createOrder(req.user, { kind: 'ambulance', place: req.body?.place });
    return sendResponse(res, {
      code: 201,
      message: 'Pengajuan ambulans tercatat (simulasi). Untuk kondisi darurat nyata, segera telepon 119.',
      data: order,
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getNearby, getContacts, requestAmbulance };
