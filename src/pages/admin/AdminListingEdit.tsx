import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { getImageDisplayUrl } from '@/lib/image-url';
import { useToast } from '@/hooks/use-toast';
import { resizeImageFiles } from '@/lib/image-resize';
import { FACILITY_GROUPS, HOMESTAY_TYPES, HOMESTAY_CATEGORIES, PRICE_TYPE_OPTIONS } from '@/data/districts';
import { MapLocationPicker } from '@/components/MapLocationPicker';
import { ImagePlus, GripVertical, X } from 'lucide-react';

const MAX_IMAGES = 10;

const SECTION_KEYS = {
  history: 'Our History',
  owners_story: 'Our Story',
  about_us: 'About Us',
  their_community: 'Our Community',
} as const;

function parseLatLng(s: string): number | null {
  if (s.trim() === '') return null;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

type Province = { id: number; name: string; slug: string };
type District = { id: number; province_id: number; name: string };

export default function AdminListingEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [municipalities, setMunicipalities] = useState<{ name: string }[]>([]);
  const [form, setForm] = useState({
    title: '',
    type: 'individual',
    category: '' as string,
    location: '',
    municipality: '' as string,
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
    sections: {} as Record<string, string>,
    facilityExtras: {} as Record<string, string>,
  });

  useEffect(() => {
    api.get<Province[]>('/api/provinces').then((res) => setProvinces(res.data ?? [])).catch(() => setProvinces([]));
  }, []);
  useEffect(() => {
    if (!id) return;
    api.get(`/api/admin/listings/${id}`).then((res) => {
      const d = res.data as { province_id?: number | null; district_id?: number | null; sections?: Record<string, string>; images?: { url: string }[]; [k: string]: unknown };
      const sections = (d.sections as Record<string, string> | undefined) ?? {};
      const sectionForm: Record<string, string> = {};
      const facilityExtras: Record<string, string> = {};
      Object.entries(sections).forEach(([k, v]) => {
        if (typeof v !== 'string') return;
        if (k.startsWith('facility_')) {
          facilityExtras[k.slice(9)] = v;
        } else if (Object.prototype.hasOwnProperty.call(SECTION_KEYS, k)) {
          sectionForm[k] = v;
        }
      });
      const images = (d.images as { url: string }[] | undefined) ?? [];
      const image_urls = images.map((i) => i.url);
      setForm({
        title: (d.title as string) ?? '',
        type: (d.type as string) || 'individual',
        category: (d.category as string) ?? '',
        location: (d.location as string) ?? '',
        municipality: '',
        price_per_night: String(d.price_per_night ?? ''),
        max_guests: String(d.max_guests ?? '2'),
        description: (d.description as string) || '',
        way_to_get_there: (d.way_to_get_there as string) || '',
        province_id: d.province_id ?? null,
        district_id: d.district_id ?? null,
        latitude: d.latitude != null ? String(d.latitude) : '',
        longitude: d.longitude != null ? String(d.longitude) : '',
        amenities: Array.isArray(d.amenities) ? (d.amenities as string[]) : [],
        image_urls,
        sections: sectionForm,
        facilityExtras,
      });
    }).catch(() => navigate('/admin/dashboard?tab=listings'));
  }, [id, navigate]);
  useEffect(() => {
    if (form.province_id) {
      api.get<District[]>(`/api/provinces/${form.province_id}/districts`).then((res) => setDistricts(res.data ?? [])).catch(() => setDistricts([]));
    } else {
      setDistricts([]);
    }
  }, [form.province_id]);
  useEffect(() => {
    if (form.district_id) {
      api.get<{ name: string }[]>(`/api/provinces/districts/${form.district_id}/municipalities`).then((res) => setMunicipalities(res.data ?? [])).catch(() => setMunicipalities([]));
    } else {
      setMunicipalities([]);
      setForm((f) => ({ ...f, municipality: '' }));
    }
  }, [form.district_id]);

  const toggleAmenity = (optId: string, groupId: string, groupType: 'single' | 'multi') => {
    setForm((f) => {
      const group = FACILITY_GROUPS.find((g) => g.id === groupId);
      if (!group) return f;
      const optionIds = group.options.map((o) => o.id);
      if (groupType === 'single') {
        const already = f.amenities.includes(optId);
        const withoutGroup = f.amenities.filter((a) => !optionIds.includes(a));
        return { ...f, amenities: already ? withoutGroup : [...withoutGroup, optId] };
      }
      return { ...f, amenities: f.amenities.includes(optId) ? f.amenities.filter((x) => x !== optId) : [...f.amenities, optId] };
    });
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
      const res = await api.post<{ urls: string[] }>('/api/admin/listings/images', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const urls = res.data?.urls ?? [];
      setForm((f) => ({ ...f, image_urls: [...f.image_urls, ...urls].slice(0, MAX_IMAGES) }));
      if (urls.length < resized.length) toast({ title: 'Some images could not be uploaded.', variant: 'destructive' });
    } catch {
      toast({ title: 'Image upload failed.', variant: 'destructive' });
    } finally {
      setUploadingImages(false);
    }
  };
  const removeImage = (index: number) => setForm((f) => ({ ...f, image_urls: f.image_urls.filter((_, i) => i !== index) }));
  const moveImage = (index: number, dir: number) => {
    const next = index + dir;
    if (next < 0 || next >= form.image_urls.length) return;
    const urls = [...form.image_urls];
    [urls[index], urls[next]] = [urls[next], urls[index]];
    setForm((f) => ({ ...f, image_urls: urls }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setLoading(true);
    const sectionsFiltered: Record<string, string> = {};
    Object.entries(form.sections).forEach(([k, v]) => { if (v?.trim()) sectionsFiltered[k] = v.trim(); });
    Object.entries(form.facilityExtras).forEach(([k, v]) => { if (v?.trim()) sectionsFiltered[`facility_${k}`] = v.trim(); });
    const locationStr = form.municipality.trim() ? `${form.municipality.trim()}, ${form.location}` : form.location;
    api
      .patch(`/api/listings/${id}`, {
        title: form.title,
        type: form.type,
        category: form.category || undefined,
        location: locationStr,
        price_per_night: Number(form.price_per_night),
        max_guests: Number(form.max_guests),
        description: form.description || undefined,
        way_to_get_there: form.way_to_get_there || undefined,
        province_id: form.province_id ?? undefined,
        district_id: form.district_id ?? undefined,
        latitude: form.latitude ? Number(form.latitude) : undefined,
        longitude: form.longitude ? Number(form.longitude) : undefined,
        amenities: form.amenities,
        image_urls: form.image_urls,
        sections: Object.keys(sectionsFiltered).length ? sectionsFiltered : undefined,
      })
      .then(() => {
        toast({ title: 'Listing updated.' });
        navigate('/admin/dashboard', { state: { tab: 'listings' } });
      })
      .catch((err) => toast({ title: err.response?.data?.message || 'Failed.', variant: 'destructive' }))
      .finally(() => setLoading(false));
  };

  const selectClass = 'mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm';

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <Link to="/admin/dashboard" className="text-sm text-muted-foreground hover:text-foreground">← Back to admin</Link>
      </div>
      <h1 className="text-2xl font-semibold text-primary-800">Edit listing</h1>
      <p className="mt-1 text-sm text-muted-foreground">Update homestay details. The primary host can also edit this from their dashboard.</p>
      <Card className="mt-6 max-w-2xl">
        <CardHeader><h2 className="font-semibold text-primary-800">Homestay details</h2></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-primary-800">Title</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required className="mt-1" />
            </div>
            <div>
              <Label className="text-primary-800">Homestay type</Label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {HOMESTAY_TYPES.map((t) => (<option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>))}
                {!HOMESTAY_TYPES.includes(form.type as 'individual' | 'community') && <option value={form.type}>{form.type}</option>}
              </select>
            </div>
            <div>
              <Label className="text-primary-800">Homestay category</Label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select category (optional)</option>
                {HOMESTAY_CATEGORIES.map((c) => (<option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>))}
              </select>
            </div>
            <div>
              <Label className="text-primary-800">Province</Label>
              <select value={form.province_id ?? ''} onChange={(e) => setForm((f) => ({ ...f, province_id: e.target.value ? Number(e.target.value) : null, district_id: null }))} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select province</option>
                {provinces.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
              </select>
            </div>
            <div>
              <Label className="text-primary-800">District</Label>
              <select value={form.district_id ?? ''} onChange={(e) => setForm((f) => ({ ...f, district_id: e.target.value ? Number(e.target.value) : null, municipality: '' }))} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select district</option>
                {districts.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
              </select>
            </div>
            <div>
              <Label className="text-primary-800">Municipality (optional)</Label>
              <select value={form.municipality} onChange={(e) => setForm((f) => ({ ...f, municipality: e.target.value }))} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" disabled={!form.district_id}>
                <option value="">Select municipality</option>
                {municipalities.map((m) => (<option key={m.name} value={m.name}>{m.name}</option>))}
              </select>
            </div>
            <div>
              <Label className="text-primary-800">Location (city/area)</Label>
              <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} required className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-primary-800">Price per night (NPR)</Label>
                <Input type="number" min={1} value={form.price_per_night} onChange={(e) => setForm((f) => ({ ...f, price_per_night: e.target.value }))} required className="mt-1" />
              </div>
              <div>
                <Label className="text-primary-800">Max guests</Label>
                <Input type="number" min={1} value={form.max_guests} onChange={(e) => setForm((f) => ({ ...f, max_guests: e.target.value }))} required className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-primary-800">Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-primary-800">Way to get there</Label>
              <Textarea value={form.way_to_get_there} onChange={(e) => setForm((f) => ({ ...f, way_to_get_there: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-primary-800">Map location (optional)</Label>
              <MapLocationPicker
                latitude={parseLatLng(form.latitude)}
                longitude={parseLatLng(form.longitude)}
                onSelect={(lat, lng) => setForm((f) => ({ ...f, latitude: String(lat), longitude: String(lng) }))}
                className="mt-2"
              />
              <div className="mt-2 grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-primary-800 text-xs">Latitude</Label>
                  <Input type="number" step="any" min={-90} max={90} placeholder="e.g. 27.7172" value={form.latitude} onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label className="text-primary-800 text-xs">Longitude</Label>
                  <Input type="number" step="any" min={-180} max={180} placeholder="e.g. 85.324" value={form.longitude} onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))} className="mt-1" />
                </div>
              </div>
            </div>

            <Card className="border-primary-200">
              <CardHeader className="border-b border-primary-100 bg-primary-50/50">
                <h2 className="font-semibold text-primary-800">Homestay photos (up to {MAX_IMAGES})</h2>
                <p className="text-sm text-muted-foreground">First image is the thumbnail. Reorder by moving.</p>
              </CardHeader>
              <CardContent className="pt-6">
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" multiple className="hidden" onChange={onImageSelect} />
                <div className="flex flex-wrap gap-3">
                  {form.image_urls.map((url, i) => (
                    <div key={`${url}-${i}`} className="relative group">
                      <img src={getImageDisplayUrl(url)} alt="" className="h-24 w-24 rounded-lg object-cover border border-primary-200" />
                      <div className="absolute inset-0 flex items-center justify-center gap-1 rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0} className="rounded bg-white/90 p-1 disabled:opacity-50" aria-label="Move left"><GripVertical className="h-4 w-4" /></button>
                        <button type="button" onClick={() => removeImage(i)} className="rounded bg-white/90 p-1" aria-label="Remove"><X className="h-4 w-4" /></button>
                        <button type="button" onClick={() => moveImage(i, 1)} disabled={i === form.image_urls.length - 1} className="rounded bg-white/90 p-1 disabled:opacity-50" aria-label="Move right"><GripVertical className="h-4 w-4 rotate-90" /></button>
                      </div>
                      {i === 0 && <span className="absolute bottom-1 left-1 rounded bg-accent-600 px-1.5 py-0.5 text-xs text-white">Thumbnail</span>}
                    </div>
                  ))}
                  {form.image_urls.length < MAX_IMAGES && (
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingImages} className="flex h-24 w-24 flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary-300 text-muted-foreground hover:border-accent-500 hover:text-accent-600 transition-colors">
                      <ImagePlus className="h-8 w-8" /><span className="text-xs mt-1">{uploadingImages ? 'Uploading…' : 'Add'}</span>
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary-200">
              <CardHeader className="border-b border-primary-100 bg-primary-50/50">
                <h2 className="font-semibold text-primary-800">Facilities</h2>
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
                            <input type={group.type === 'single' ? 'radio' : 'checkbox'} name={group.id} checked={form.amenities.includes(opt.id)} onChange={() => toggleAmenity(opt.id, group.id, group.type)} className={group.type === 'single' ? 'rounded-full border-primary-300' : 'rounded border-primary-300'} />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                      {group.hasCapacity && isYes && (
                        <div className="mt-3">
                          <Label className="text-primary-800 text-sm">Capacity</Label>
                          <Input type="number" min={1} placeholder="e.g. 50" value={form.facilityExtras[`${group.id}_capacity`] ?? ''} onChange={(e) => setForm((f) => ({ ...f, facilityExtras: { ...f.facilityExtras, [`${group.id}_capacity`]: e.target.value } }))} className="mt-1 w-32" />
                        </div>
                      )}
                      {group.hasPriceType && isYes && (
                        <div className="mt-3 space-y-2">
                          <div>
                            <Label className="text-primary-800 text-sm">Price type</Label>
                            <select value={form.facilityExtras[`${group.id}_price_type`] ?? ''} onChange={(e) => setForm((f) => ({ ...f, facilityExtras: { ...f.facilityExtras, [`${group.id}_price_type`]: e.target.value } }))} className={selectClass + ' max-w-xs'}>
                              <option value="">Select</option>
                              {PRICE_TYPE_OPTIONS.map((o) => (<option key={o.id} value={o.id}>{o.label}</option>))}
                            </select>
                          </div>
                          <div>
                            <Label className="text-primary-800 text-sm">Price (NPR)</Label>
                            <Input type="number" min={0} placeholder="e.g. 500" value={form.facilityExtras[`${group.id}_price`] ?? ''} onChange={(e) => setForm((f) => ({ ...f, facilityExtras: { ...f.facilityExtras, [`${group.id}_price`]: e.target.value } }))} className="mt-1 w-32" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="border-primary-200">
              <CardHeader className="border-b border-primary-100 bg-primary-50/50">
                <h2 className="font-semibold text-primary-800">About the homestay</h2>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {(Object.entries(SECTION_KEYS) as [keyof typeof SECTION_KEYS, string][]).map(([key, label]) => (
                  <div key={key}>
                    <Label htmlFor={`section-${key}`} className="text-primary-800">{label}</Label>
                    <Textarea id={`section-${key}`} value={form.sections[key] ?? ''} onChange={(e) => setForm((f) => ({ ...f, sections: { ...f.sections, [key]: e.target.value } }))} rows={3} className="mt-1" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
              <Link to="/admin/dashboard"><Button type="button" variant="outline">Cancel</Button></Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
