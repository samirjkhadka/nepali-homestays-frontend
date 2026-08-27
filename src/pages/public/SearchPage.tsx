import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, LayoutGrid, ChevronLeft, ChevronRight, Search, Filter, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { ListingBadges } from '@/components/ListingBadges';
import { DateRangePicker } from '@/components/DateRangePicker';
import { api } from '@/lib/api';
import { getImageDisplayUrl } from '@/lib/image-url';
import { assets } from '@/lib/design-tokens';
import { PROVINCES, getProvinceBySlug } from '@/data/provinces';
import type { ProvinceSlug } from '@/data/provinces';
import { HOMESTAY_TYPES, HOMESTAY_CATEGORIES } from '@/data/districts';
import { useCurrency } from '@/lib/currency';

const PAGE_SIZE = 20;

const PRICE_SLIDER_MIN = 0;
const PRICE_SLIDER_MAX = 25000;
const PRICE_SLIDER_STEP = 500;

const BADGE_LABELS: Record<string, string> = {
  recommended: 'Recommended',
  featured: 'Featured',
  new: 'New',
};

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
  badge?: string | null;
};

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const provinceParam = searchParams.get('province') as ProvinceSlug | null;
  const provinceFromUrl = provinceParam ? getProvinceBySlug(provinceParam) : null;
  const [nameQuery, setNameQuery] = useState(searchParams.get('name') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [guests, setGuests] = useState(searchParams.get('guests') || '');
  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || '');
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || '');
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<'default' | 'price_asc' | 'price_desc'>('default');
  const [showFilters, setShowFilters] = useState(false);
  const [district, setDistrict] = useState(searchParams.get('district') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [homestayType, setHomestayType] = useState<string>(searchParams.get('type') || '');
  const { format: formatPrice } = useCurrency();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [page, setPage] = useState(1);

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
    const districtParam = searchParams.get('district');
    if (districtParam) setDistrict(districtParam);
    const typeParam = searchParams.get('type');
    if (typeParam) setHomestayType(typeParam);
    const categoryParam = searchParams.get('category');
    if (categoryParam) setCategory(categoryParam);
    const nameParam = searchParams.get('name');
    if (nameParam) setNameQuery(nameParam);
    const checkInParam = searchParams.get('checkIn');
    if (checkInParam) setCheckIn(checkInParam);
    const checkOutParam = searchParams.get('checkOut');
    if (checkOutParam) setCheckOut(checkOutParam);
  }, [searchParams]);

  // A stay filters results only once both ends are chosen. Sending a half-range
  // would be rejected by the API, and mid-selection is a normal state in the
  // calendar — so the query simply stays unfiltered until the range is complete.
  const hasStay = Boolean(checkIn && checkOut && checkOut > checkIn);

  useEffect(() => {
    setPage(1);
  }, [provinceId, districtId, district, location, minPrice, maxPrice, guests, nameQuery, category, checkIn, checkOut]);

  useEffect(() => {
    const params: Record<string, string | number> = { page, limit: PAGE_SIZE };
    if (provinceId) params.province_id = provinceId;
    if (districtId) params.district_id = districtId;
    if (nameQuery.trim()) params.title = nameQuery.trim();
    if (category) params.category = category;
    const searchLocation = location.trim();
    if (searchLocation && !districtId) params.location = searchLocation;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (guests) params.guests = guests;
    if (hasStay) {
      params.checkIn = checkIn;
      params.checkOut = checkOut;
    }
    setLoading(true);
    api
      .get<{ listings: Listing[]; total: number }>('/api/listings', { params })
      .then((res) => {
        const list = res.data.listings ?? [];
        const t = res.data.total ?? 0;
        setListings(list);
        setTotal(t);
      })
      .catch(() => { setListings([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [page, provinceId, districtId, district, location, minPrice, maxPrice, guests, nameQuery, category, hasStay, checkIn, checkOut]);

  const filteredByType = listings.filter((l) => {
    if (homestayType && (l.type || '').toLowerCase() !== homestayType.toLowerCase()) return false;
    return true;
  });

  const sortedListings = [...filteredByType].sort((a, b) => {
    if (sort === 'price_asc') return parseFloat(a.price_per_night) - parseFloat(b.price_per_night);
    if (sort === 'price_desc') return parseFloat(b.price_per_night) - parseFloat(a.price_per_night);
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const startItem = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(page * PAGE_SIZE, total);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (nameQuery.trim()) params.set('name', nameQuery.trim());
    if (district) params.set('district', district);
    if (location.trim()) params.set('location', location.trim());
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (guests) params.set('guests', guests);
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    if (category) params.set('category', category);
    if (provinceParam) params.set('province', provinceParam);
    if (homestayType) params.set('type', homestayType);
    setSearchParams(params);
  };

  const clearProvince = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('province');
    params.delete('district');
    setDistrict('');
    setSearchParams(params);
  };

  const minPriceNum = minPrice === '' ? PRICE_SLIDER_MIN : Math.min(PRICE_SLIDER_MAX, Math.max(PRICE_SLIDER_MIN, Number(minPrice) || 0));
  const maxPriceNum = maxPrice === '' ? PRICE_SLIDER_MAX : Math.min(PRICE_SLIDER_MAX, Math.max(PRICE_SLIDER_MIN, Number(maxPrice) || PRICE_SLIDER_MAX));
  const activeFilterCount =
    (provinceParam ? 1 : 0) +
    (district ? 1 : 0) +
    (location.trim() ? 1 : 0) +
    (nameQuery.trim() ? 1 : 0) +
    (category ? 1 : 0) +
    (homestayType ? 1 : 0) +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    (guests ? 1 : 0);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-background pb-10">
      <div className="section-container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">Find Your Perfect Homestay</h1>
          <p className="text-muted-foreground mt-2">Discover authentic Nepali hospitality across the Himalayas</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, location..."
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-card rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </div>
          <Button type="button" variant="outline" onClick={() => setShowFilters((v) => !v)} className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">{activeFilterCount}</span>
            )}
          </Button>
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as 'default' | 'price_asc' | 'price_desc')}
              className="appearance-none pl-4 pr-10 py-3 bg-card rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none transition-all cursor-pointer"
            >
              <option value="default">Recommended</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </motion.div>

        <motion.div
          initial={false}
          animate={{ height: showFilters ? 'auto' : 0, opacity: showFilters ? 1 : 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden"
        >
          <form onSubmit={handleSearch} className="mb-6 rounded-xl border border-border bg-card p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label>Province</Label>
            <select
              value={provinceParam || ''}
              onChange={(e) => {
                const slug = e.target.value as ProvinceSlug | '';
                if (slug) {
                  setDistrict('');
                  setSearchParams((prev) => {
                    const next = new URLSearchParams(prev);
                    next.set('province', slug);
                    next.delete('district');
                    return next;
                  });
                } else {
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
          {provinceId && districts.length > 0 && (
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
            <Input placeholder="e.g. Kathmandu, Thamel" value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Name</Label>
            <Input placeholder="Search by homestay name" value={nameQuery} onChange={(e) => setNameQuery(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Category</Label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            >
              <option value="">Any category</option>
              {HOMESTAY_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
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
            <Label className="text-foreground">Price range (NPR)</Label>
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
          <div>
            <Label>Dates</Label>
            <DateRangePicker
              checkIn={checkIn}
              checkOut={checkOut}
              onCheckInChange={setCheckIn}
              onCheckOutChange={setCheckOut}
              className="mt-1"
            />
            {checkIn && !checkOut && (
              <p className="mt-1 text-sm text-muted-foreground">Pick a checkout date to filter by availability.</p>
            )}
          </div>
          <div className="flex items-end gap-2">
            <Button type="submit" className="w-full">Apply filters</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSearchParams({});
                setNameQuery('');
                setLocation('');
                setMinPrice('');
                setMaxPrice('');
                setGuests('');
                setCheckIn('');
                setCheckOut('');
                setDistrict('');
                setCategory('');
                setHomestayType('');
              }}
            >
              Clear
            </Button>
          </div>
          </form>
        </motion.div>

        {(provinceParam || district || category || homestayType) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {provinceFromUrl && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                {provinceFromUrl.name}
                <button type="button" onClick={clearProvince}><X className="w-3 h-3" /></button>
              </span>
            )}
            {district && <span className="inline-flex px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">{district}</span>}
            {category && <span className="inline-flex px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">{category}</span>}
            {homestayType && <span className="inline-flex px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">{homestayType}</span>}
          </div>
        )}

      <div className="w-full">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-display text-2xl font-bold text-foreground">
            {provinceFromUrl ? `Homestays in ${provinceFromUrl.name}` : 'Search results'}
          </h2>
          {!loading && sortedListings.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="List view"
                  onClick={() => setViewMode('list')}
                  className={`rounded-md p-2 ${viewMode === 'list' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
                >
                  <LayoutGrid className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  aria-label="Map view"
                  onClick={() => setViewMode('map')}
                  className={`rounded-md p-2 ${viewMode === 'map' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
                >
                  <MapPin className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
        {!loading && total > 0 && (
          <p className="mt-1 text-sm text-muted-foreground">
            Showing {startItem}–{endItem} of {total} homestays
          </p>
        )}
        {loading ? (
          <p className="mt-4 text-muted-foreground">Loading…</p>
        ) : sortedListings.length === 0 ? (
          <Card className="mt-4 border-border p-8 text-center shadow-soft">
            <p className="text-muted-foreground">No homestays found. Try broader search.</p>
            <Button variant="outline" className="mt-4" onClick={() => setSearchParams({})}>Clear filters</Button>
          </Card>
        ) : viewMode === 'map' ? (
          <Card className="mt-4 border-border p-12 text-center shadow-soft">
            <MapPin className="mx-auto h-16 w-16 text-primary/40" />
            <h3 className="mt-4 font-display font-semibold text-foreground">Map view</h3>
            <p className="mt-2 text-sm text-muted-foreground">Map integration (e.g. Google Maps or Leaflet) can be added here to show homestays by location.</p>
            <p className="mt-2 text-sm text-muted-foreground">{sortedListings.length} homestays available in list view.</p>
            <Button variant="outline" className="mt-4" onClick={() => setViewMode('list')}>Show list view</Button>
          </Card>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
            {sortedListings.map((listing) => {
              const imageSrc = getImageDisplayUrl(listing.image_url) || assets.logo;
              const useLogo = !listing.image_url;
              return (
              <Link key={listing.id} to={`/listings/${listing.id}`} className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-2xl">
                <Card className="group flex h-full cursor-pointer flex-col overflow-hidden border-border transition-all duration-300 hover:shadow-elevated h-full">
                  <div className="relative aspect-video overflow-hidden bg-muted/40 shrink-0">
                    <img
                      src={imageSrc}
                      alt={listing.title}
                      className={`h-full w-full object-cover ${useLogo ? 'object-contain p-4' : ''}`}
                      onError={(e) => {
                        e.currentTarget.src = assets.logo;
                        e.currentTarget.className = 'h-full w-full object-contain p-4';
                      }}
                    />
                    {listing.badge && (
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        <ListingBadges badge={listing.badge} badgeLabels={BADGE_LABELS} compact />
                      </div>
                    )}
                  </div>
                  <CardHeader className="pb-2">
                    <CardContent className="p-0 space-y-1.5">
                      <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors">{listing.title}</h3>
                      <p className="text-sm text-muted-foreground">{listing.location}</p>
                    </CardContent>
                  </CardHeader>
                  <CardFooter className="flex items-center justify-between pt-0 mt-auto shrink-0 border-t border-border/50">
                    <span className="font-medium text-primary">{formatPrice(listing.price_per_night)}/night</span>
                    <span className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">View</span>
                  </CardFooter>
                </Card>
              </Link>
            );})}
          </div>
        )}
        {!loading && total > 0 && totalPages > 1 && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
