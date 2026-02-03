import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const NEPAL_CENTER: [number, number] = [27.7172, 85.324];

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

type MapLocationPickerProps = {
  latitude: number | null;
  longitude: number | null;
  onSelect: (lat: number, lng: number) => void;
  className?: string;
  height?: string;
};

export function MapLocationPicker({ latitude, longitude, onSelect, className = '', height = '320px' }: MapLocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const hasCoords = typeof latitude === 'number' && typeof longitude === 'number';

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;

    const center: [number, number] = hasCoords ? [latitude!, longitude!] : NEPAL_CENTER;
    const zoom = hasCoords ? 14 : 10;

    const map = L.map(containerRef.current).setView(center, zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    if (hasCoords) {
      const marker = L.marker([latitude!, longitude!], { icon: defaultIcon }).addTo(map);
      markerRef.current = marker;
    }

    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      onSelectRef.current(lat, lng);
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const marker = L.marker([lat, lng], { icon: defaultIcon }).addTo(map);
        markerRef.current = marker;
      }
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    if (hasCoords) {
      mapRef.current.setView([latitude!, longitude!], 14);
      if (markerRef.current) {
        markerRef.current.setLatLng([latitude!, longitude!]);
      } else {
        const marker = L.marker([latitude!, longitude!], { icon: defaultIcon }).addTo(mapRef.current);
        markerRef.current = marker;
      }
    } else {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      mapRef.current.setView(NEPAL_CENTER, 10);
    }
  }, [hasCoords, latitude, longitude]);

  return (
    <div className={className}>
      <p className="text-sm text-muted-foreground mb-2">Click on the map to set the homestay location (pin).</p>
      <div ref={containerRef} style={{ height }} className="w-full rounded-lg border border-primary-200 bg-primary-50" />
    </div>
  );
}
