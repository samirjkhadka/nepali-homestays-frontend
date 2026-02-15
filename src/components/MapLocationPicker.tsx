import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

const NEPAL_CENTER: [number, number] = [27.7172, 85.324];

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function parseLatLngProp(v: number | string | null | undefined): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const n = parseFloat(String(v).trim());
  return Number.isFinite(n) ? n : null;
}

type MapLocationPickerProps = {
  latitude: number | string | null;
  longitude: number | string | null;
  onSelect: (lat: number, lng: number) => void;
  className?: string;
  height?: string;
  /** Show search and lat/lng inputs (default true) */
  showSearchAndInputs?: boolean;
};

type NominatimResult = { lat: string; lon: string; display_name: string };

export function MapLocationPicker({
  latitude,
  longitude,
  onSelect,
  className = '',
  height = '320px',
  showSearchAndInputs = true,
}: MapLocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const latNum = parseLatLngProp(latitude);
  const lngNum = parseLatLngProp(longitude);
  const hasCoords = latNum !== null && lngNum !== null;

  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [latInput, setLatInput] = useState(() => (latNum != null ? String(latNum) : ''));
  const [lngInput, setLngInput] = useState(() => (lngNum != null ? String(lngNum) : ''));

  // Sync inputs when props change (e.g. from parent form load)
  useEffect(() => {
    setLatInput(latNum != null ? String(latNum) : '');
    setLngInput(lngNum != null ? String(lngNum) : '');
  }, [latNum, lngNum]);

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setSearching(true);
    setSearchError(null);
    try {
      const params = new URLSearchParams({
        q: q + (q.toLowerCase().includes('nepal') ? '' : ', Nepal'),
        format: 'json',
        limit: '1',
      });
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        headers: { 'User-Agent': 'NepaliHomestays/1.0' },
      });
      if (!res.ok) throw new Error('Search failed');
      const data = (await res.json()) as NominatimResult[];
      if (!data.length) {
        setSearchError('No results found. Try a different place name.');
        return;
      }
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      onSelectRef.current(lat, lng);
      setLatInput(String(lat));
      setLngInput(String(lng));
      setSearchError(null);
    } catch {
      setSearchError('Could not search location. Check your connection and try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleLatChange = (value: string) => {
    setLatInput(value);
    const n = value.trim() === '' ? null : parseFloat(value);
    if (n !== null && Number.isFinite(n)) {
      const lng = lngNum ?? 0;
      onSelectRef.current(n, lng);
    }
  };

  const handleLngChange = (value: string) => {
    setLngInput(value);
    const n = value.trim() === '' ? null : parseFloat(value);
    if (n !== null && Number.isFinite(n)) {
      const lat = latNum ?? 0;
      onSelectRef.current(lat, n);
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;

    const center: [number, number] = hasCoords ? [latNum!, lngNum!] : NEPAL_CENTER;
    const zoom = hasCoords ? 14 : 10;

    const map = L.map(containerRef.current).setView(center, zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    if (hasCoords) {
      const marker = L.marker([latNum!, lngNum!], { icon: defaultIcon }).addTo(map);
      markerRef.current = marker;
    }

    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      onSelectRef.current(lat, lng);
      setLatInput(String(lat));
      setLngInput(String(lng));
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
      mapRef.current.setView([latNum!, lngNum!], 14);
      if (markerRef.current) {
        markerRef.current.setLatLng([latNum!, lngNum!]);
      } else {
        const marker = L.marker([latNum!, lngNum!], { icon: defaultIcon }).addTo(mapRef.current);
        markerRef.current = marker;
      }
    } else {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      mapRef.current.setView(NEPAL_CENTER, 10);
    }
  }, [hasCoords, latNum, lngNum]);

  return (
    <div className={className}>
      {showSearchAndInputs && (
        <div className="space-y-3 mb-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search place (e.g. Thamel, Kathmandu)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                className="pl-8"
              />
            </div>
            <Button type="button" variant="secondary" size="default" onClick={handleSearch} disabled={searching}>
              {searching ? 'Searching…' : 'Search'}
            </Button>
          </div>
          {searchError && <p className="text-sm text-destructive">{searchError}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Latitude</Label>
              <Input
                type="number"
                step="any"
                min={-90}
                max={90}
                placeholder="e.g. 27.7172"
                value={latInput}
                onChange={(e) => handleLatChange(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Longitude</Label>
              <Input
                type="number"
                step="any"
                min={-180}
                max={180}
                placeholder="e.g. 85.324"
                value={lngInput}
                onChange={(e) => handleLngChange(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>
      )}
      <p className="text-sm text-muted-foreground mb-2">Click on the map to set the homestay location (pin).</p>
      <div ref={containerRef} style={{ height }} className="w-full rounded-lg border border-primary-200 bg-primary-50" />
    </div>
  );
}
