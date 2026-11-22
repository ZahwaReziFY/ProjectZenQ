const config = require('../config/env');
const { query } = require('../config/db');
const { haversineKm } = require('../utils/geo');

/**
 * Faskes terdekat. Urutan sumber:
 *  1. OpenStreetMap lewat Overpass API (gratis, tanpa API key, data nyata)
 *  2. Fallback: tabel health_facilities (data demo) kalo Overpass gagal/timeout
 * Hasil Overpass di-cache 10 menit per area (dibulatkan ~1 km) biar gak spam server publik.
 */
const CACHE_MS = 10 * 60 * 1000;
const cache = new Map();

const OSM_TYPE = { hospital: 'hospital', clinic: 'clinic', doctors: 'clinic' };

function osmQuery(lat, lng, radiusM) {
  const around = `(around:${radiusM},${lat},${lng})`;
  return `[out:json][timeout:15];
(
  nwr["amenity"~"^(hospital|clinic)$"]${around};
  nwr["healthcare"~"^(hospital|clinic|centre)$"]${around};
);
out center tags 60;`;
}

function mapOsm(el, lat, lng) {
  const t = el.tags || {};
  const la = el.lat ?? el.center?.lat;
  const ln = el.lon ?? el.center?.lon;
  if (la == null || ln == null || !t.name) return null;

  const name = t.name;
  const isPuskesmas = /puskesmas/i.test(name);
  const type = isPuskesmas ? 'puskesmas' : OSM_TYPE[t.amenity] || (t.healthcare === 'hospital' ? 'hospital' : 'clinic');
  const address = [t['addr:street'], t['addr:city'] || t['addr:subdistrict']].filter(Boolean).join(', ');

  return {
    id: `osm-${el.type}-${el.id}`,
    name,
    type,
    address: address || null,
    phone: t.phone || t['contact:phone'] || null,
    has_emergency: t.emergency === 'yes' || type === 'hospital',
    latitude: la,
    longitude: ln,
    distance_km: Number(haversineKm(lat, lng, la, ln).toFixed(2)),
    source: 'openstreetmap',
  };
}

async function fromOverpass(lat, lng, radiusKm) {
  if (!config.overpassUrl) return null;
  const key = `${lat.toFixed(2)},${lng.toFixed(2)},${radiusKm}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.items;

  try {
    const res = await fetch(config.overpassUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(osmQuery(lat, lng, Math.round(radiusKm * 1000)))}`,
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const seen = new Set();
    const items = (json.elements || [])
      .map((el) => mapOsm(el, lat, lng))
      .filter((f) => f && !seen.has(f.name) && seen.add(f.name));
    cache.set(key, { at: Date.now(), items });
    return items;
  } catch (err) {
    console.warn('Overpass gagal, pakai data lokal:', err.message);
    return null;
  }
}

async function fromDatabase(lat, lng) {
  const res = await query('SELECT * FROM health_facilities');
  return res.rows.map((f) => ({
    ...f,
    latitude: Number(f.latitude),
    longitude: Number(f.longitude),
    distance_km: Number(haversineKm(lat, lng, Number(f.latitude), Number(f.longitude)).toFixed(2)),
    source: 'local',
  }));
}

async function findNearbyFacilities({ lat, lng, radiusKm = 10, type, limit = 15 }) {
  let items = await fromOverpass(lat, lng, radiusKm);
  let source = 'openstreetmap';
  if (!items || !items.length) {
    items = (await fromDatabase(lat, lng)).filter((f) => f.distance_km <= Math.max(radiusKm, 30));
    source = 'local';
  }
  const list = items
    .filter((f) => !type || f.type === type)
    .sort((a, b) => a.distance_km - b.distance_km)
    .slice(0, limit);
  return { source, items: list };
}

async function getEmergencyContacts() {
  const result = await query('SELECT * FROM emergency_contacts ORDER BY id');
  return result.rows;
}

module.exports = { findNearbyFacilities, getEmergencyContacts };
