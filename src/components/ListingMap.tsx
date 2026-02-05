import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const NEPAL_CENTER: [number, number] = [27.7172, 85.324];

type ListingMapProps = {
  latitude?: number | null;
  longitude?: number | null;
  title?: string;
  className?: string;
};

export function ListingMap({ latitude, longitude, title, className = '' }: ListingMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const lat = latitude != null ? Number(latitude) : undefined;
  const lng = longitude != null ? Number(longitude) : undefined;
  const hasCoords =
    typeof lat === 'number' && !Number.isNaN(lat) && typeof lng === 'number' && !Number.isNaN(lng);

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;

    const center: [number, number] = hasCoords ? [lat!, lng!] : NEPAL_CENTER;
    const zoom = hasCoords ? 14 : 8;

    const map = L.map(containerRef.current).setView(center, zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    if (hasCoords) {
      const icon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });
      const marker = L.marker([lat!, lng!], { icon }).addTo(map);
      if (title) marker.bindPopup(title);
      markerRef.current = marker;
    }

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    if (hasCoords && lat != null && lng != null) {
      mapRef.current.setView([lat, lng], 14);
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
        if (title) markerRef.current.getPopup()?.setContent(title);
      } else {
        const icon = L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        });
        const marker = L.marker([lat, lng], { icon }).addTo(mapRef.current);
        if (title) marker.bindPopup(title);
        markerRef.current = marker;
      }
    } else {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      mapRef.current.setView(NEPAL_CENTER, 8);
    }
  }, [hasCoords, lat, lng, title]);

  return (
    <div className={className}>
      <div ref={containerRef} className="h-64 w-full rounded-lg border border-primary-200 bg-primary-50" />
      {!hasCoords && (
        <p className="mt-2 text-sm text-muted-foreground">Exact map location not set. Host can add coordinates when editing the listing.</p>
      )}
    </div>
  );
}
