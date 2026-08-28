import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CancellationPolicyPicker } from '@/components/host/CancellationPolicyPicker';
import { HostExperiencesPanel } from '@/components/host/HostExperiencesPanel';
import { ListingUnitsPanel } from '@/components/host/ListingUnitsPanel';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/RichTextEditor';
import { api } from '@/lib/api';
import { getImageDisplayUrl } from '@/lib/image-url';
import { useToast } from '@/hooks/use-toast';
import { resizeImageFiles } from '@/lib/image-resize';
import { HOMESTAY_TYPES, HOMESTAY_CATEGORIES } from '@/data/districts';
import type { ExtraServiceFormItem } from '@/data/amenities';
import { AmenitiesAndExtras } from '@/components/AmenitiesAndExtras';
import { MapLocationPicker } from '@/components/MapLocationPicker';
import { ImagePlus, GripVertical, X } from 'lucide-react';

const MAX_IMAGES = 10;

const SECTION_KEYS = {
  history: 'Our History',
  owners_story: 'Our Story',
  about_us: 'About Us',
  their_community: 'Our Community',
  itinerary: 'What to Expect (Itinerary)',
  host_video_intro: 'Host Video Introduction',
  local_experiences: 'Local Experiences',
  meet_the_community: 'Meet the Community',
  price_transparency: 'Price Transparency',
  weather_best_time: 'Weather / Best Time to Visit',
  village_stories: 'Stories from the Village',
  guest_photo_wall: 'Guest Photo Wall',
  experience_badges: 'Experience Badges (comma-separated ids)',
} as const;

type Province = { id: number; name: string; slug: string };
type District = { id: number; province_id: number; name: string };

export default function HostListingEdit() {
  const { id } = useParams<{ id: string }>();
  const [homestayKind, setHomestayKind] = useState<string>('individual');
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
    community_houses: '' as string,
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
    extra_services: [] as ExtraServiceFormItem[],
    image_urls: [] as string[],
    sections: {} as Record<string, string>,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    api.get<Province[]>('/api/provinces').then((res) => setProvinces(res.data ?? [])).catch(() => setProvinces([]));
  }, []);
  useEffect(() => {
    if (!id) return;
    api.get(`/api/listings/${id}`).then((res) => {
      const d = res.data as {
        province_id?: number | null;
        district_id?: number | null;
        sections?: Record<string, string>;
        images?: { url: string }[];
        extra_services?: { name: string; price_npr: number; unit: string; description?: string | null }[];
        [k: string]: unknown;
      };
      const sections = (d.sections as Record<string, string> | undefined) ?? {};
      const sectionForm: Record<string, string> = {};
      Object.entries(sections).forEach(([k, v]) => {
        if (typeof v !== 'string') return;
        if (!k.startsWith('facility_') && Object.prototype.hasOwnProperty.call(SECTION_KEYS, k)) {
          sectionForm[k] = v;
        }
      });
      // Seed the houses panel from what the listing actually says, rather than
      // letting it sit on its 'individual' default and mislead the host.
      if (typeof d.homestay_kind === 'string') setHomestayKind(d.homestay_kind);
      const images = (d.images as { url: string }[] | undefined) ?? [];
      const image_urls = images.map((i) => i.url);
      const rawExtras = (d.extra_services ?? []) as { name: string; price_npr: number; unit: string; description?: string | null }[];
      const extra_services: ExtraServiceFormItem[] = rawExtras.map((e) => ({
        name: e.name,
        price_npr: Number(e.price_npr) || 0,
        unit: e.unit === 'per_person' || e.unit === 'per_group' ? e.unit : 'fixed',
        description: e.description ?? undefined,
      }));
      const desc = (d.description as string) || '';
      const communityMatch = desc.match(/^Community homestay \((\d+) house[s]?\)\.\s*/i);
      const communityHouses = communityMatch ? communityMatch[1] : '';
      const descriptionWithoutPrefix = communityMatch ? desc.slice(communityMatch[0].length).trim() : desc;
      setForm({
        title: (d.title as string) ?? '',
        type: (d.type as string) || 'individual',
        category: (d.category as string) ?? '',
        community_houses: communityHouses,
        location: (d.location as string) ?? '',
        municipality: '',
        price_per_night: String(d.price_per_night ?? ''),
        max_guests: String(d.max_guests ?? '2'),
        description: descriptionWithoutPrefix,
        way_to_get_there: (d.way_to_get_there as string) || '',
        province_id: d.province_id ?? null,
        district_id: d.district_id ?? null,
        latitude: d.latitude != null ? String(d.latitude) : '',
        longitude: d.longitude != null ? String(d.longitude) : '',
        amenities: Array.isArray(d.amenities) ? (d.amenities as string[]) : [],
        extra_services,
        image_urls,
        sections: sectionForm,
      });
    }).catch(() => navigate('/dashboard/host?tab=listings'));
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
    const errs: Record<string, string> = {};
    if (form.type === 'community') {
      const n = parseInt(form.community_houses, 10);
      if (Number.isNaN(n) || n < 1) errs.community_houses = 'Enter number of houses (at least 1)';
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast({ title: 'Please fix the errors below.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const sectionsFiltered: Record<string, string> = {};
    Object.entries(form.sections).forEach(([k, v]) => {
      if (v?.trim()) sectionsFiltered[k] = v.trim();
    });
    const locationStr = form.municipality.trim() ? `${form.municipality.trim()}, ${form.location}` : form.location;
    let description = form.description?.trim() ?? '';
    if (form.type === 'community' && form.community_houses.trim()) {
      const n = form.community_houses.trim();
      description = `Community homestay (${n} house${n === '1' ? '' : 's'}). ${description}`.trim();
    }
    api
      .patch(`/api/listings/${id}`, {
        title: form.title,
        type: form.type,
        category: form.category || undefined,
        location: locationStr,
        price_per_night: Number(form.price_per_night),
        max_guests: Number(form.max_guests),
        description: description || undefined,
        way_to_get_there: form.way_to_get_there || undefined,
        province_id: form.province_id ?? undefined,
        district_id: form.district_id ?? undefined,
        latitude: form.latitude ? Number(form.latitude) : undefined,
        longitude: form.longitude ? Number(form.longitude) : undefined,
        amenities: form.amenities,
        extra_services: form.extra_services.map((s) => ({ name: s.name, price_npr: s.price_npr, unit: s.unit, description: s.description || undefined })),
        image_urls: form.image_urls,
        sections: Object.keys(sectionsFiltered).length ? sectionsFiltered : undefined,
      })
      .then(() => {
        toast({ title: 'Listing updated.' });
        navigate('/dashboard/host');
      })
      .catch((err) => toast({ title: err.response?.data?.message || 'Failed.', variant: 'destructive' }))
      .finally(() => setLoading(false));
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold">Edit listing</h1>
      {id && (
        <Card className="mt-6 max-w-2xl">
          <CardHeader>
            <h2 className="font-semibold">Houses</h2>
            <p className="text-sm text-muted-foreground">
              How many groups you can take at the same time.
            </p>
          </CardHeader>
          <CardContent>
            <ListingUnitsPanel listingId={Number(id)} kind={homestayKind} onKindChange={setHomestayKind} />
          </CardContent>
        </Card>
      )}

      {id && (
        <Card className="mt-6 max-w-2xl">
          <CardHeader>
            <h2 className="font-semibold">Experiences</h2>
            <p className="text-sm text-muted-foreground">
              Describe your activities so guests can find them on their own.
            </p>
          </CardHeader>
          <CardContent>
            <HostExperiencesPanel listingId={Number(id)} />
          </CardContent>
        </Card>
      )}

      {id && (
        <Card className="mt-6 max-w-2xl">
          <CardHeader><h2 className="font-semibold">Cancellation</h2></CardHeader>
          <CardContent>
            {/* Saves on its own, not with the form below: it has its own
                endpoint, and a host who picks a policy then navigates away
                should not silently lose it. */}
            <CancellationPolicyPicker listingId={Number(id)} value={null} />
          </CardContent>
        </Card>
      )}

      <Card className="mt-6 max-w-2xl">
        <CardHeader><h2 className="font-semibold">Homestay details</h2></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required className="mt-1" />
            </div>
            <div>
              <Label>Homestay type</Label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {HOMESTAY_TYPES.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
                {!HOMESTAY_TYPES.includes(form.type as 'individual' | 'community') && (
                  <option value={form.type}>{form.type}</option>
                )}
              </select>
              {form.type === 'community' && (
                <div className="mt-2">
                  <Label htmlFor="community_houses" className="text-primary-800">Number of houses</Label>
                  <Input id="community_houses" type="number" min={1} value={form.community_houses} onChange={(e) => setForm((f) => ({ ...f, community_houses: e.target.value }))} className={`mt-1 w-32 ${errors.community_houses ? 'border-destructive' : ''}`} />
                  {errors.community_houses && <p className="mt-1 text-xs text-destructive">{errors.community_houses}</p>}
                </div>
              )}
            </div>
            <div>
              <Label>Homestay category</Label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select category (optional)</option>
                {HOMESTAY_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Province</Label>
              <select value={form.province_id ?? ''} onChange={(e) => setForm((f) => ({ ...f, province_id: e.target.value ? Number(e.target.value) : null, district_id: null }))} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select province</option>
                {provinces.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>District</Label>
              <select value={form.district_id ?? ''} onChange={(e) => setForm((f) => ({ ...f, district_id: e.target.value ? Number(e.target.value) : null, municipality: '' }))} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select district</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Municipality (optional)</Label>
              <select value={form.municipality} onChange={(e) => setForm((f) => ({ ...f, municipality: e.target.value }))} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" disabled={!form.district_id}>
                <option value="">Select municipality</option>
                {municipalities.map((m) => (<option key={m.name} value={m.name}>{m.name}</option>))}
              </select>
            </div>
            <div>
              <Label>Location (city/area)</Label>
              <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} required className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price per night (NPR)</Label>
                <Input type="number" min={1} value={form.price_per_night} onChange={(e) => setForm((f) => ({ ...f, price_per_night: e.target.value }))} required className="mt-1" />
              </div>
              <div>
                <Label>Max guests</Label>
                <Input type="number" min={1} value={form.max_guests} onChange={(e) => setForm((f) => ({ ...f, max_guests: e.target.value }))} required className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <RichTextEditor value={form.description} onChange={(html) => setForm((f) => ({ ...f, description: html }))} placeholder="Describe your homestay…" className="mt-1" minHeight="140px" />
            </div>
            <div>
              <Label>Way to get there</Label>
              <RichTextEditor value={form.way_to_get_there} onChange={(html) => setForm((f) => ({ ...f, way_to_get_there: html }))} placeholder="Directions for guests…" className="mt-1" minHeight="120px" />
            </div>
            <div>
              <Label className="text-primary-800">Map location (optional)</Label>
              <MapLocationPicker
                latitude={form.latitude}
                longitude={form.longitude}
                onSelect={(lat, lng) => setForm((f) => ({ ...f, latitude: String(lat), longitude: String(lng) }))}
                className="mt-2"
              />
            </div>

            {/* Photos */}
            <Card className="border-primary-200">
              <CardHeader className="border-b border-primary-100 bg-primary-50/50">
                <h2 className="font-semibold text-primary-800">Homestay photos (up to {MAX_IMAGES})</h2>
                <p className="text-sm text-muted-foreground">First image is the thumbnail on the homepage. Reorder by moving.</p>
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

            {/* Amenities & Extra services */}
            <AmenitiesAndExtras
              amenities={form.amenities}
              onAmenitiesChange={(amenities) => setForm((f) => ({ ...f, amenities }))}
              extraServices={form.extra_services}
              onExtraServicesChange={(extra_services) => setForm((f) => ({ ...f, extra_services }))}
            />

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
                    <RichTextEditor id={`section-${key}`} value={form.sections[key] ?? ''} onChange={(html) => setForm((f) => ({ ...f, sections: { ...f.sections, [key]: html } }))} placeholder={`Write about ${label.toLowerCase()}…`} className="mt-1" minHeight="100px" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
