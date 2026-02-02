import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Bed, MapPin, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { api } from '@/lib/api';
import { PROVINCES, getProvinceBySlug } from '@/data/provinces';
import type { ProvinceSlug } from '@/data/provinces';
import { HOMESTAY_TYPES } from '@/data/districts';
import { useCurrency } from '@/lib/currency';

const PRICE_SLIDER_MIN = 0;
const PRICE_SLIDER_MAX = 25000;
const PRICE_SLIDER_STEP = 500;

type Province = { id: number; name: string; slug: string };
type District = { id: number; province_id: number; name: string };

type Listing = {
  id: number;
  title: string;
  type?: string;
  location: string;
  price_per_night: string;
  max_guests: number;
  image_url?: string | null;
  amenities?: string[];
};

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const provinceParam = searchParams.get('province') as ProvinceSlug | null;
  const provinceFromUrl = provinceParam ? getProvinceBySlug(provinceParam) : null;
  const [location, setLocation] = useState(
    provinceFromUrl ? provinceFromUrl.name : (searchParams.get('location') || '')
  );
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [guests, setGuests] = useState(searchParams.get('guests') || '');
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<'default' | 'price_asc' | 'price_desc'>('default');
  const [district, setDistrict] = useState(searchParams.get('district') || '');
  const [homestayType, setHomestayType] = useState<string>(searchParams.get('type') || '');
  const { format: formatPrice } = useCurrency();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);

  const provinceFromApi = provinceParam ? provinces.find((p) => p.slug === provinceParam) : null;
  const provinceId = provinceFromApi?.id;
  const districtId = district && districts.length ? districts.find((d) => d.name === district)?.id : undefined;

  useEffect(() => {
    api.get<Province[]>('/api/provinces').then((res) => setProvinces(res.data ?? [])).catch(() => setProvinces([]));
  }, []);

  useEffect(() => {
    if (provinceId) {
      api.get<District[]>(`/api/provinces/${provinceId}/districts`).then((res) => setDistricts(res.data ?? [])).catch(() => setDistricts([]));
    } else {
      setDistricts([]);
    }
  }, [provinceId]);

  useEffect(() => {
    if (provinceFromUrl && !searchParams.get('location') && !searchParams.get('district')) {
      setLocation(provinceFromUrl.name);
    }
    const districtParam = searchParams.get('district');
    if (districtParam) setDistrict(districtParam);
    const typeParam = searchParams.get('type');
    if (typeParam) setHomestayType(typeParam);
  }, [provinceFromUrl, searchParams]);

  useEffect(() => {
    const params: Record<string, string | number> = {};
    if (provinceId) params.province_id = provinceId;
    if (districtId) params.district_id = districtId;
    const searchLocation = district || location;
    if (searchLocation && !districtId) params.location = searchLocation;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (guests) params.guests = guests;
    setLoading(true);
    api
      .get<{ listings: Listing[]; total: number }>('/api/listings', { params })
      .then((res) => {
        setListings(res.data.listings ?? []);
        setTotal(res.data.total ?? 0);
      })
      .catch(() => { setListings([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [provinceId, districtId, district, location, minPrice, maxPrice, guests]);

  const filteredByType = listings.filter((l) => {
    if (homestayType && (l.type || '').toLowerCase() !== homestayType.toLowerCase()) return false;
    return true;
  });

  const sortedListings = [...filteredByType].sort((a, b) => {
    if (sort === 'price_asc') return parseFloat(a.price_per_night) - parseFloat(b.price_per_night);
    if (sort === 'price_desc') return parseFloat(b.price_per_night) - parseFloat(a.price_per_night);
    return 0;
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (district) params.set('district', district);
    else if (location) params.set('location', location);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (guests) params.set('guests', guests);
    if (provinceParam) params.set('province', provinceParam);
    if (homestayType) params.set('type', homestayType);
    setSearchParams(params);
  };

  const clearProvince = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('province');
    params.delete('district');
    setLocation('');
    setDistrict('');
    setSearchParams(params);
  };

  const minPriceNum = minPrice === '' ? PRICE_SLIDER_MIN : Math.min(PRICE_SLIDER_MAX, Math.max(PRICE_SLIDER_MIN, Number(minPrice) || 0));
  const maxPriceNum = maxPrice === '' ? PRICE_SLIDER_MAX : Math.min(PRICE_SLIDER_MAX, Math.max(PRICE_SLIDER_MIN, Number(maxPrice) || PRICE_SLIDER_MAX));

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="w-full shrink-0 rounded-lg border border-primary-200 bg-card p-4 lg:w-64">
        <h3 className="font-semibold text-primary-800">Filters</h3>
        {provinceFromUrl && (
          <p className="mt-2 flex items-center gap-2 text-sm text-accent-600">
            <span>Province: {provinceFromUrl.name}</span>
            <Button type="button" variant="ghost" size="sm" onClick={clearProvince}>
              Clear
            </Button>
          </p>
        )}
        <form onSubmit={handleSearch} className="mt-4 space-y-4">
          <div>
            <Label>Province</Label>
            <select
              value={provinceParam || ''}
              onChange={(e) => {
                const slug = e.target.value as ProvinceSlug | '';
                if (slug) {
                  const p = provinces.find((x) => x.slug === slug) ?? getProvinceBySlug(slug);
                  if (p) {
                    setLocation(p.name);
                    setDistrict('');
                    setSearchParams((prev) => {
                      const next = new URLSearchParams(prev);
                      next.set('province', slug);
                      next.delete('district');
                      return next;
                    });
                  }
                } else {
                  setLocation('');
                  setDistrict('');
                  setSearchParams((prev) => {
                    const next = new URLSearchParams(prev);
                    next.delete('province');
                    next.delete('district');
                    return next;
                  });
                }
              }}
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            >
              <option value="">All provinces</option>
              {(provinces.length ? provinces : PROVINCES).map((p) => (
                <option key={String(p.id)} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          {districts.length > 0 && (
            <div>
              <Label>District</Label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              >
                <option value="">All districts</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <Label>Location (city/area)</Label>
            <Input placeholder="e.g. Kathmandu" value={district || location} onChange={(e) => { setDistrict(''); setLocation(e.target.value); }} className="mt-1" />
          </div>
          <div>
            <Label>Homestay type</Label>
            <select
              value={homestayType}
              onChange={(e) => setHomestayType(e.target.value)}
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            >
              <option value="">Any type</option>
              {HOMESTAY_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-primary-800">Price range (NPR)</Label>
            <div className="mt-2 space-y-3">
              <div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Min: {formatPrice(minPriceNum)}</span>
                  <span>Max: {formatPrice(maxPriceNum)}</span>
                </div>
                <div className="mt-1 flex flex-col gap-2">
                  <div>
                    <Label className="sr-only">Min price (NPR)</Label>
                    <input
                      type="range"
                      min={PRICE_SLIDER_MIN}
                      max={PRICE_SLIDER_MAX}
                      step={PRICE_SLIDER_STEP}
                      value={minPriceNum}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setMinPrice(v <= PRICE_SLIDER_MIN ? '' : String(v));
                        if (maxPrice !== '' && v > Number(maxPrice)) setMaxPrice(String(v));
                      }}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="sr-only">Max price (NPR)</Label>
                    <input
                      type="range"
                      min={PRICE_SLIDER_MIN}
                      max={PRICE_SLIDER_MAX}
                      step={PRICE_SLIDER_STEP}
                      value={maxPriceNum}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setMaxPrice(v >= PRICE_SLIDER_MAX ? '' : String(v));
                        if (minPrice !== '' && v < Number(minPrice)) setMinPrice(String(v));
                      }}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <Label>Guests</Label>
            <Input type="number" value={guests} onChange={(e) => setGuests(e.target.value)} className="mt-1" />
          </div>
          <Button type="submit" className="w-full bg-accent-500 hover:bg-accent-600">Search</Button>
        </form>
      </aside>
      <div className="flex-1">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-primary-800">
            {provinceFromUrl ? `Homestays in ${provinceFromUrl.name}` : 'Search results'}
          </h1>
          {!loading && sortedListings.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="List view"
                  onClick={() => setViewMode('list')}
                  className={`rounded-md p-2 ${viewMode === 'list' ? 'bg-accent-100 text-accent-700' : 'text-muted-foreground hover:bg-primary-100'}`}
                >
                  <LayoutGrid className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  aria-label="Map view"
                  onClick={() => setViewMode('map')}
                  className={`rounded-md p-2 ${viewMode === 'map' ? 'bg-accent-100 text-accent-700' : 'text-muted-foreground hover:bg-primary-100'}`}
                >
                  <MapPin className="h-5 w-5" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <Label className="text-sm text-muted-foreground">Sort</Label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as 'default' | 'price_asc' | 'price_desc')}
                  className="rounded-md border border-primary-200 bg-background px-3 py-2 text-sm"
                >
                  <option value="default">Default</option>
                  <option value="price_asc">Price: low to high</option>
                  <option value="price_desc">Price: high to low</option>
                </select>
              </div>
            </div>
          )}
        </div>
        {!loading && sortedListings.length > 0 && (
          <p className="mt-1 text-sm text-muted-foreground">Showing {sortedListings.length} of {total} homestays</p>
        )}
        {loading ? (
          <p className="mt-4 text-muted-foreground">Loading…</p>
        ) : sortedListings.length === 0 ? (
          <Card className="mt-4 border-primary-200 p-8 text-center">
            <p className="text-muted-foreground">No homestays found. Try broader search.</p>
            <Button variant="outline" className="mt-4" onClick={() => setSearchParams({})}>Clear filters</Button>
          </Card>
        ) : viewMode === 'map' ? (
          <Card className="mt-4 border-primary-200 p-12 text-center">
            <MapPin className="mx-auto h-16 w-16 text-primary-300" />
            <h3 className="mt-4 font-semibold text-primary-800">Map view</h3>
            <p className="mt-2 text-sm text-muted-foreground">Map integration (e.g. Google Maps or Leaflet) can be added here to show homestays by location.</p>
            <p className="mt-2 text-sm text-muted-foreground">{sortedListings.length} homestays available in list view.</p>
            <Button variant="outline" className="mt-4" onClick={() => setViewMode('list')}>Show list view</Button>
          </Card>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sortedListings.map((listing) => (
              <Card key={listing.id} className="overflow-hidden border-primary-200 transition-shadow hover:shadow-lg">
                <div className="aspect-video bg-primary-100">
                  {listing.image_url ? (
                    <img src={listing.image_url.startsWith('http') ? listing.image_url : (import.meta.env.VITE_API_URL || '') + listing.image_url} alt={listing.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Bed className="h-12 w-12 text-primary-400" />
                    </div>
                  )}
                </div>
                <CardHeader className="pb-2">
                  <CardContent className="p-0">
                    <h3 className="font-semibold text-primary-800">{listing.title}</h3>
                    <p className="text-sm text-muted-foreground">{listing.location}</p>
                  </CardContent>
                </CardHeader>
                <CardFooter className="flex items-center justify-between pt-0">
                  <span className="font-medium text-accent-600">{formatPrice(listing.price_per_night)}/night</span>
                  <Button size="sm" className="bg-primary-600 hover:bg-primary-700" onClick={() => navigate(`/listings/${listing.id}`)}>View Details</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
