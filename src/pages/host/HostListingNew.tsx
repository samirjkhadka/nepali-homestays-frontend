import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';

const apiBase = (import.meta.env.VITE_API_URL || api.defaults.baseURL || '').toString().trim();
const imageSrc = (url: string) => (url.startsWith('http') ? url : `${apiBase}${url}`);
import { useToast } from '@/hooks/use-toast';
import { FACILITY_GROUPS, HOMESTAY_TYPES, HOMESTAY_CATEGORIES, WARD_NUMBERS, PRICE_TYPE_OPTIONS } from '@/data/districts';
import { resizeImageFiles } from '@/lib/image-resize';
import { ImagePlus, GripVertical, X, AlertCircle } from 'lucide-react';

type Province = { id: number; name: string; slug: string };
type District = { id: number; province_id: number; name: string };

const MAX_IMAGES = 10;

const SECTION_KEYS = {
  history: 'Our History',
  owners_story: 'Our Story',
  about_us: 'About Us',
  their_community: 'Our Community',
} as const;

export default function HostListingNew() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [form, setForm] = useState({
    title: '',
    type: 'individual',
    category: '' as string,
    community_houses: '' as string,
    location: '',
    ward_no: '' as string,
    street: '',
    price_per_night: '',
    max_guests: '2',
    description: '',
    way_to_get_there: '',
    province_id: null as number | null,
    district_id: null as number | null,
    latitude: '' as string,
    longitude: '' as string,
    amenities: [] as string[],
    image_urls: [] as string[],
    sections: {
      history: '',
      owners_story: '',
      about_us: '',
      their_community: '',
    } as Record<string, string>,
    /** Facility extras: community_hall_capacity, X_price_type, X_price (stored in sections as facility_*) */
    facilityExtras: {} as Record<string, string>,
  });

  useEffect(() => {
    api.get<Province[]>('/api/provinces').then((res) => setProvinces(res.data ?? [])).catch(() => setProvinces([]));
  }, []);
  useEffect(() => {
    if (form.province_id) {
      api.get<District[]>(`/api/provinces/${form.province_id}/districts`).then((res) => setDistricts(res.data ?? [])).catch(() => setDistricts([]));
    } else {
      setDistricts([]);
      setForm((f) => ({ ...f, district_id: null }));
    }
  }, [form.province_id]);

  const toggleAmenity = (id: string, groupId: string, groupType: 'single' | 'multi') => {
    setForm((f) => {
      const group = FACILITY_GROUPS.find((g) => g.id === groupId);
      if (!group) return f;
      const optionIds = group.options.map((o) => o.id);
      if (groupType === 'single') {
        const already = f.amenities.includes(id);
        const withoutGroup = f.amenities.filter((a) => !optionIds.includes(a));
        return { ...f, amenities: already ? withoutGroup : [...withoutGroup, id] };
      }
      return { ...f, amenities: f.amenities.includes(id) ? f.amenities.filter((x) => x !== id) : [...f.amenities, id] };
    });
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (form.title.length > 200) e.title = 'Title must be at most 200 characters';
    if (!form.type) e.type = 'Homestay type is required';
    if (form.type === 'community') {
      const n = parseInt(form.community_houses, 10);
      if (Number.isNaN(n) || n < 1) e.community_houses = 'Enter number of houses (at least 1)';
    }
    if (!form.location.trim()) e.location = 'Location (city/area) is required';
    const price = parseFloat(form.price_per_night);
    if (Number.isNaN(price) || price <= 0) e.price_per_night = 'Enter a valid price per night (NPR)';
    const guests = parseInt(form.max_guests, 10);
    if (Number.isNaN(guests) || guests < 1) e.max_guests = 'Guest capacity must be at least 1';
    if (form.image_urls.length > MAX_IMAGES) e.image_urls = `Maximum ${MAX_IMAGES} images allowed`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!files.length) return;
    if (form.image_urls.length + files.length > MAX_IMAGES) {
      toast({ title: `You can add up to ${MAX_IMAGES} images total.`, variant: 'destructive' });
      return;
    }
    setUploadingImages(true);
    try {
      const resized = await resizeImageFiles(files);
      const formData = new FormData();
      resized.forEach((file) => formData.append('images', file));
      const res = await api.post<{ urls: string[] }>('/api/listings/images', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const urls = res.data?.urls ?? [];
      setForm((f) => ({ ...f, image_urls: [...f.image_urls, ...urls].slice(0, MAX_IMAGES) }));
      if (urls.length < resized.length) toast({ title: 'Some images could not be uploaded.', variant: 'destructive' });
    } catch {
      toast({ title: 'Image upload failed.', variant: 'destructive' });
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setForm((f) => ({ ...f, image_urls: f.image_urls.filter((_, i) => i !== index) }));
  };

  const moveImage = (index: number, dir: number) => {
    const next = index + dir;
    if (next < 0 || next >= form.image_urls.length) return;
    const urls = [...form.image_urls];
    [urls[index], urls[next]] = [urls[next], urls[index]];
    setForm((f) => ({ ...f, image_urls: urls }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast({ title: 'Please fix the errors below.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const locationParts = [form.street, form.ward_no ? `Ward ${form.ward_no}` : null, form.location].filter(Boolean);
    const location = locationParts.length ? locationParts.join(', ') : form.location;
    let description = form.description.trim();
    if (form.type === 'community' && form.community_houses.trim()) {
      const n = form.community_houses.trim();
      description = `Community homestay (${n} house${n === '1' ? '' : 's'}). ${description}`.trim();
    }
    const sectionsFiltered: Record<string, string> = {};
    Object.entries(form.sections).forEach(([k, v]) => {
      if (v?.trim()) sectionsFiltered[k] = v.trim();
    });
    Object.entries(form.facilityExtras).forEach(([k, v]) => {
      if (v?.trim()) sectionsFiltered[`facility_${k}`] = v.trim();
    });
    api
      .post('/api/listings', {
        title: form.title.trim(),
        type: form.type,
        category: form.category.trim() || undefined,
        location,
        price_per_night: parseFloat(form.price_per_night),
        max_guests: parseInt(form.max_guests, 10),
        description: description || undefined,
        way_to_get_there: form.way_to_get_there.trim() || undefined,
        province_id: form.province_id || undefined,
        district_id: form.district_id || undefined,
        latitude: form.latitude ? parseFloat(form.latitude) : undefined,
        longitude: form.longitude ? parseFloat(form.longitude) : undefined,
        amenities: form.amenities.length ? form.amenities : undefined,
        image_urls: form.image_urls.length ? form.image_urls : undefined,
        sections: Object.keys(sectionsFiltered).length ? sectionsFiltered : undefined,
      })
      .then(() => {
        toast({ title: 'Listing created. It will appear after admin approval.' });
        navigate('/dashboard/host');
      })
      .catch((err) => toast({ title: err.response?.data?.message || 'Failed to create listing.', variant: 'destructive' }))
      .finally(() => setLoading(false));
  };

  const selectClass = 'mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm';

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-primary-800">Add homestay listing</h1>
      <p className="mt-1 text-sm text-muted-foreground">Fill in the form below. Your listing will be reviewed before it goes live.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-8">
        {/* Basic info */}
        <Card className="border-primary-200">
          <CardHeader className="border-b border-primary-100 bg-primary-50/50">
            <h2 className="font-semibold text-primary-800">Basic information</h2>
            <p className="text-sm text-muted-foreground">Title and homestay type</p>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div>
              <Label htmlFor="title" className="text-primary-800">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Traditional Newari Homestay in Patan"
                maxLength={200}
                className={`mt-1 ${errors.title ? 'border-destructive' : ''}`}
              />
              {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title}</p>}
              <p className="mt-1 text-xs text-muted-foreground">{form.title.length}/200</p>
            </div>
            <div>
              <Label className="text-primary-800">Homestay type</Label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className={`${selectClass} ${errors.type ? 'border-destructive' : ''}`}>
                {HOMESTAY_TYPES.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
              {form.type === 'community' && (
                <div className="mt-2">
                  <Label htmlFor="community_houses" className="text-primary-800">Number of houses</Label>
                  <Input
                    id="community_houses"
                    type="number"
                    min={1}
                    value={form.community_houses}
                    onChange={(e) => setForm((f) => ({ ...f, community_houses: e.target.value }))}
                    placeholder="e.g. 5"
                    className={`mt-1 w-32 ${errors.community_houses ? 'border-destructive' : ''}`}
                  />
                  {errors.community_houses && <p className="mt-1 text-xs text-destructive">{errors.community_houses}</p>}
                </div>
              )}
            </div>
            <div>
              <Label className="text-primary-800">Homestay category</Label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className={selectClass}>
                <option value="">Select category (optional)</option>
                {HOMESTAY_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">e.g. Rural, Urban, Eco, Cultural, Farmstay</p>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card className="border-primary-200">
          <CardHeader className="border-b border-primary-100 bg-primary-50/50">
            <h2 className="font-semibold text-primary-800">Location</h2>
            <p className="text-sm text-muted-foreground">Province, district, ward, street and city/area</p>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-primary-800">Province</Label>
                <select value={form.province_id ?? ''} onChange={(e) => setForm((f) => ({ ...f, province_id: e.target.value ? Number(e.target.value) : null, district_id: null }))} className={selectClass}>
                  <option value="">Select province</option>
                  {provinces.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-primary-800">District</Label>
                <select value={form.district_id ?? ''} onChange={(e) => setForm((f) => ({ ...f, district_id: e.target.value ? Number(e.target.value) : null }))} className={selectClass} disabled={!form.province_id}>
                  <option value="">Select district</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label className="text-primary-800">Ward no.</Label>
              <select value={form.ward_no} onChange={(e) => setForm((f) => ({ ...f, ward_no: e.target.value }))} className={selectClass}>
                <option value="">Select ward (1–40)</option>
                {WARD_NUMBERS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="street" className="text-primary-800">Street / area name</Label>
              <Input id="street" value={form.street} onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))} placeholder="e.g. Thamel" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="location" className="text-primary-800">Location (city/area) *</Label>
              <Input id="location" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} required placeholder="e.g. Kathmandu" className={`mt-1 ${errors.location ? 'border-destructive' : ''}`} />
              {errors.location && <p className="mt-1 text-xs text-destructive">{errors.location}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-primary-800">Latitude (optional, for map on listing page)</Label>
                <Input type="number" step="any" min={-90} max={90} placeholder="e.g. 27.7172" value={form.latitude} onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-primary-800">Longitude (optional, for map on listing page)</Label>
                <Input type="number" step="any" min={-180} max={180} placeholder="e.g. 85.324" value={form.longitude} onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">If you enter coordinates, a map with your homestay location will be shown on the listing detail page.</p>
          </CardContent>
        </Card>

        {/* Photos */}
        <Card className="border-primary-200">
          <CardHeader className="border-b border-primary-100 bg-primary-50/50">
            <h2 className="font-semibold text-primary-800">Homestay photos</h2>
            <p className="text-sm text-muted-foreground">Up to {MAX_IMAGES} images. First image is the thumbnail on the homepage. Images are auto-resized to fit under 1 MB (JPEG/PNG).</p>
          </CardHeader>
          <CardContent className="pt-6">
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" multiple className="hidden" onChange={onImageSelect} />
            <div className="flex flex-wrap gap-3">
              {form.image_urls.map((url, i) => (
                <div key={url} className="relative group">
                  <img src={imageSrc(url)} alt="" className="h-24 w-24 rounded-lg object-cover border border-primary-200" />
                  <div className="absolute inset-0 flex items-center justify-center gap-1 rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0} className="rounded bg-white/90 p-1 disabled:opacity-50" title="Move left"><GripVertical className="h-4 w-4" /></button>
                    <button type="button" onClick={() => removeImage(i)} className="rounded bg-white/90 p-1" title="Remove"><X className="h-4 w-4" /></button>
                    <button type="button" onClick={() => moveImage(i, 1)} disabled={i === form.image_urls.length - 1} className="rounded bg-white/90 p-1 disabled:opacity-50" title="Move right"><GripVertical className="h-4 w-4 rotate-90" /></button>
                  </div>
                  {i === 0 && <span className="absolute bottom-1 left-1 rounded bg-accent-600 px-1.5 py-0.5 text-xs text-white">Thumbnail</span>}
                </div>
              ))}
              {form.image_urls.length < MAX_IMAGES && (
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingImages} className="flex h-24 w-24 flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary-300 text-muted-foreground hover:border-accent-500 hover:text-accent-600 transition-colors">
                  <ImagePlus className="h-8 w-8" />
                  <span className="text-xs mt-1">{uploadingImages ? 'Uploading…' : 'Add'}</span>
                </button>
              )}
            </div>
            {errors.image_urls && <p className="mt-2 text-xs text-destructive">{errors.image_urls}</p>}
          </CardContent>
        </Card>

        {/* Pricing & capacity */}
        <Card className="border-primary-200">
          <CardHeader className="border-b border-primary-100 bg-primary-50/50">
            <h2 className="font-semibold text-primary-800">Pricing & capacity</h2>
            <p className="text-sm text-muted-foreground">Per night cost per person (default NPR) and guest capacity</p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="price_per_night" className="text-primary-800">Per night cost per person (NPR) *</Label>
                <Input id="price_per_night" type="number" min={1} step={1} value={form.price_per_night} onChange={(e) => setForm((f) => ({ ...f, price_per_night: e.target.value }))} required placeholder="e.g. 2500" className={`mt-1 ${errors.price_per_night ? 'border-destructive' : ''}`} />
                {errors.price_per_night && <p className="mt-1 text-xs text-destructive">{errors.price_per_night}</p>}
              </div>
              <div>
                <Label htmlFor="max_guests" className="text-primary-800">Guest capacity *</Label>
                <Input id="max_guests" type="number" min={1} value={form.max_guests} onChange={(e) => setForm((f) => ({ ...f, max_guests: e.target.value }))} required className={`mt-1 ${errors.max_guests ? 'border-destructive' : ''}`} />
                {errors.max_guests && <p className="mt-1 text-xs text-destructive">{errors.max_guests}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Facilities */}
        <Card className="border-primary-200">
          <CardHeader className="border-b border-primary-100 bg-primary-50/50">
            <h2 className="font-semibold text-primary-800">Facilities</h2>
            <p className="text-sm text-muted-foreground">Select options for each category. Community Hall: Yes + capacity. Activities: Yes + price (per person / per group / other).</p>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {FACILITY_GROUPS.map((group) => {
              const amenityId = group.options[0]?.id;
              const isYes = amenityId && form.amenities.includes(amenityId);
              return (
                <div key={group.id} className="rounded-lg border border-primary-200 p-3">
                  <p className="text-sm font-medium text-primary-800 mb-2">{group.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.options.map((opt) => (
                      <label key={opt.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-primary-200 px-3 py-2 text-sm hover:bg-primary-50/50 has-[:checked]:border-accent-500 has-[:checked]:bg-accent-50/50">
                        <input
                          type={group.type === 'single' ? 'radio' : 'checkbox'}
                          name={group.id}
                          checked={form.amenities.includes(opt.id)}
                          onChange={() => toggleAmenity(opt.id, group.id, group.type)}
                          className={group.type === 'single' ? 'rounded-full border-primary-300' : 'rounded border-primary-300'}
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                  {group.hasCapacity && isYes && (
                    <div className="mt-3">
                      <Label htmlFor={`facility_${group.id}_capacity`} className="text-primary-800 text-sm">Capacity (if Yes)</Label>
                      <Input
                        id={`facility_${group.id}_capacity`}
                        type="number"
                        min={1}
                        placeholder="e.g. 50"
                        value={form.facilityExtras[`${group.id}_capacity`] ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, facilityExtras: { ...f.facilityExtras, [`${group.id}_capacity`]: e.target.value } }))}
                        className="mt-1 w-32"
                      />
                    </div>
                  )}
                  {group.hasPriceType && isYes && (
                    <div className="mt-3 space-y-2">
                      <div>
                        <Label className="text-primary-800 text-sm">Price type</Label>
                        <select
                          value={form.facilityExtras[`${group.id}_price_type`] ?? ''}
                          onChange={(e) => setForm((f) => ({ ...f, facilityExtras: { ...f.facilityExtras, [`${group.id}_price_type`]: e.target.value } }))}
                          className="mt-1 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="">Select</option>
                          {PRICE_TYPE_OPTIONS.map((o) => (
                            <option key={o.id} value={o.id}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label className="text-primary-800 text-sm">Price (NPR, optional)</Label>
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          placeholder="e.g. 500"
                          value={form.facilityExtras[`${group.id}_price`] ?? ''}
                          onChange={(e) => setForm((f) => ({ ...f, facilityExtras: { ...f.facilityExtras, [`${group.id}_price`]: e.target.value } }))}
                          className="mt-1 w-32"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Description & way to get there */}
        <Card className="border-primary-200">
          <CardHeader className="border-b border-primary-100 bg-primary-50/50">
            <h2 className="font-semibold text-primary-800">Description & directions</h2>
            <p className="text-sm text-muted-foreground">General description and how to reach</p>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div>
              <Label htmlFor="description" className="text-primary-800">Description</Label>
              <Textarea id="description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={4} placeholder="Describe your homestay, what guests can expect..." className="mt-1" />
            </div>
            <div>
              <Label htmlFor="way_to_get_there" className="text-primary-800">Way to get there</Label>
              <Textarea id="way_to_get_there" value={form.way_to_get_there} onChange={(e) => setForm((f) => ({ ...f, way_to_get_there: e.target.value }))} rows={2} placeholder="Directions, transport options..." className="mt-1" />
            </div>
          </CardContent>
        </Card>

        {/* About your homestay (sections) */}
        <Card className="border-primary-200">
          <CardHeader className="border-b border-primary-100 bg-primary-50/50">
            <h2 className="font-semibold text-primary-800">About your homestay</h2>
            <p className="text-sm text-muted-foreground">Our History, Our Story, About Us, Our Community (optional)</p>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {(Object.entries(SECTION_KEYS) as [keyof typeof SECTION_KEYS, string][]).map(([key, label]) => (
              <div key={key}>
                <Label htmlFor={`section-${key}`} className="text-primary-800">{label}</Label>
                <Textarea id={`section-${key}`} value={form.sections[key] ?? ''} onChange={(e) => setForm((f) => ({ ...f, sections: { ...f.sections, [key]: e.target.value } }))} rows={3} className="mt-1" placeholder={`Write about ${label.toLowerCase()}...`} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Required documents note */}
        <Card className="border-amber-200 bg-amber-50/30">
          <CardContent className="flex gap-3 p-4">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
            <div className="text-sm">
              <p className="font-medium text-primary-800">Documents required for listing approval</p>
              <p className="mt-1 text-muted-foreground">You can send the following documents to the contact email provided by us. Your listing will be reviewed after submission.</p>
              <ul className="mt-2 list-inside list-disc text-muted-foreground space-y-0.5">
                <li>Registration Certificate</li>
                <li>PAN/VAT Registration Certificate</li>
                <li>Homestay Registration Certificate</li>
                <li>Contact Person Identity Certificate (front)</li>
                <li>Contact Person Identity Certificate (back)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading} className="bg-accent-500 hover:bg-accent-600">{loading ? 'Creating…' : 'Submit for approval'}</Button>
          <Button type="button" variant="outline" onClick={() => navigate('/dashboard/host')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
