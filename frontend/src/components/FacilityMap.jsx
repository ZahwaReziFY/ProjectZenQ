import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { translate } from '../i18n';

/**
 * Peta Leaflet + OpenStreetMap (gratis, tanpa API key).
 * Props: center {lat,lng} (lokasi user), facilities [{id,name,latitude,longitude}], selectedId, onSelect
 * Pake Leaflet langsung (tanpa react-leaflet) biar dependency-nya minimal.
 */
const userIcon = L.divIcon({ className: '', html: '<div class="pin-user"></div>', iconSize: [18, 18], iconAnchor: [9, 9] });
const hospIcon = L.divIcon({ className: '', html: '<div class="pin-hosp">+</div>', iconSize: [30, 30], iconAnchor: [15, 15] });

function FacilityMap({ center, facilities = [], selectedId, onSelect }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);

  // Bikin peta sekali
  useEffect(() => {
    const map = L.map(elRef.current, { zoomControl: true }).setView([center.lat, center.lng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => map.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update marker tiap data berubah
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    const user = L.marker([center.lat, center.lng], { icon: userIcon }).bindTooltip(translate('Lokasi Anda'), { permanent: true, direction: 'bottom', offset: [0, 10] });
    layer.addLayer(user);

    const points = [[center.lat, center.lng]];
    facilities.forEach((f) => {
      const m = L.marker([f.latitude, f.longitude], { icon: hospIcon }).bindTooltip(f.name);
      m.on('click', () => onSelect?.(f));
      layer.addLayer(m);
      points.push([f.latitude, f.longitude]);
    });
    if (points.length > 1) map.fitBounds(points, { padding: [40, 40], maxZoom: 15 });
    else map.setView([center.lat, center.lng], 14);
  }, [center, facilities, onSelect]);

  // Fokus ke faskes yang dipilih dari list
  useEffect(() => {
    const f = facilities.find((x) => x.id === selectedId);
    if (f && mapRef.current) mapRef.current.setView([f.latitude, f.longitude], 16);
  }, [selectedId, facilities]);

  return <div ref={elRef} className="map-leaflet" />;
}

export default FacilityMap;
