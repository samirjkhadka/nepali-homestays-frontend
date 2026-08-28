import { useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/DateRangePicker';
import { Building2, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { AdminTable } from '@/components/admin/AdminTable';
import type { Corporate, ChargeableAmenity, ApprovedListing, User } from '../adminTypes';

interface CorporatesSectionProps {
  /** Guests to choose from when an admin books on a corporate's behalf. */
  users: User[];
  /**
   * Called after a corporate booking is created.
   *
   * The section used to write the bookings list's state directly. A callback
   * instead, so one section does not reach into another's state — which is the
   * coupling that made this file hard to take apart in the first place.
   */
  onBookingCreated?: () => void;
}

/**
 * Corporate accounts and admin-assisted bookings.
 *
 * First section extracted from AdminDashboard (phase 2). Its data already
 * loaded only when the section was open, so this changes no behaviour — it
 * changes how much you have to read to alter any of it.
 */
export default function CorporatesSection({ users, onBookingCreated }: CorporatesSectionProps) {
  const { toast } = useToast();

  const [corporates, setCorporates] = useState<Corporate[]>([]);
  const [corporatesTotal, setCorporatesTotal] = useState(0);
  const [corporatesSearch, setCorporatesSearch] = useState('');
  const [corporatesStatus, setCorporatesStatus] = useState<string>('');
  const [corporateFormOpen, setCorporateFormOpen] = useState(false);
  const [editingCorporate, setEditingCorporate] = useState<Corporate | null>(null);
  const [corporateForm, setCorporateForm] = useState<Partial<Corporate>>({ name: '', status: 'provisional', contact_name: '', contact_email: '', contact_phone: '', billing_method: '', approval_required: false, max_nightly_rate: null, notes: '' });
  const [corporateFormSaving, setCorporateFormSaving] = useState(false);
  const [createBookingOpen, setCreateBookingOpen] = useState(false);
  const [createBookingForm, setCreateBookingForm] = useState({ corporate_id: '' as string, listing_id: '', guest_id: '', guest_names: '', check_in: '', check_out: '', guests: '1', message: '' });
  const [createBookingSaving, setCreateBookingSaving] = useState(false);
  const [createBookingListingPrice, setCreateBookingListingPrice] = useState<number | null>(null);
  const [createBookingChargeableAmenities, setCreateBookingChargeableAmenities] = useState<ChargeableAmenity[]>([]);
  const [createBookingAmenityQuantities, setCreateBookingAmenityQuantities] = useState<Record<number, number>>({});
  const [addAmenityForm, setAddAmenityForm] = useState({ name: '', price_npr: '', charge_type: 'one_time' as 'per_night' | 'one_time' });
  const [addAmenitySaving, setAddAmenitySaving] = useState(false);
  const [corporatesApprovedListings, setCorporatesApprovedListings] = useState<ApprovedListing[]>([]);
  const [createBookingCalendarOpen, setCreateBookingCalendarOpen] = useState(false);
  const createBookingCalendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    
    const params = new URLSearchParams();
    if (corporatesSearch.trim()) params.set('search', corporatesSearch.trim());
    if (corporatesStatus) params.set('status', corporatesStatus);
    api.get<{ corporates: Corporate[]; total: number }>(`/api/admin/corporates?${params}`).then((res) => {
      setCorporates(res.data.corporates || []);
      setCorporatesTotal(res.data.total ?? 0);
    }).catch(() => { setCorporates([]); setCorporatesTotal(0); });
  }, [corporatesSearch, corporatesStatus]);

  useEffect(() => {
    
    api.get<{ listings: ApprovedListing[] }>('/api/admin/listings/approved').then((res) => {
      setCorporatesApprovedListings(res.data.listings || []);
    }).catch(() => setCorporatesApprovedListings([]));
  }, []);

  useEffect(() => {
    if (!createBookingOpen || !createBookingForm.listing_id) {
      setCreateBookingListingPrice(null);
      setCreateBookingChargeableAmenities([]);
      setCreateBookingAmenityQuantities({});
      return;
    }
    const id = Number(createBookingForm.listing_id);
    if (!Number.isInteger(id)) return;
    api.get<{ price_per_night?: number }>(`/api/listings/${id}`).then((res) => setCreateBookingListingPrice(res.data.price_per_night ?? null)).catch(() => setCreateBookingListingPrice(null));
    api.get<{ amenities: ChargeableAmenity[] }>(`/api/listings/${id}/chargeable-amenities`).then((res) => {
      setCreateBookingChargeableAmenities(res.data.amenities || []);
      setCreateBookingAmenityQuantities({});
    }).catch(() => setCreateBookingChargeableAmenities([]));
  }, [createBookingOpen, createBookingForm.listing_id]);

  return (
        <div className="mt-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-semibold text-foreground">Corporate accounts & admin-assisted bookings</h2>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => { setEditingCorporate(null); setCorporateForm({ name: '', status: 'provisional', contact_name: '', contact_email: '', contact_phone: '', billing_method: '', approval_required: false, max_nightly_rate: null, notes: '' }); setCorporateFormOpen(true); }}>
                <Plus className="h-4 w-4 mr-1" /> Add corporate
              </Button>
              <Button size="sm" className="bg-accent-500 hover:bg-accent-600" onClick={() => { setCreateBookingForm({ corporate_id: '', listing_id: '', guest_id: '', guest_names: '', check_in: '', check_out: '', guests: '1', message: '' }); setCreateBookingListingPrice(null); setCreateBookingChargeableAmenities([]); setCreateBookingAmenityQuantities({}); setCreateBookingOpen(true); }}>
                Create corporate booking
              </Button>
            </div>
          </div>
          <Card className="border-border">
            <CardHeader className="border-b border-border bg-muted/40">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-accent-500" />
                  <h2 className="font-semibold text-foreground">Corporates</h2>
                </div>
                <input
                  type="text"
                  placeholder="Search by name or email"
                  value={corporatesSearch}
                  onChange={(e) => setCorporatesSearch(e.target.value)}
                  className="rounded-md border border-primary-200 bg-background px-3 py-1.5 text-sm max-w-[200px]"
                />
                <select
                  value={corporatesStatus}
                  onChange={(e) => setCorporatesStatus(e.target.value)}
                  className="rounded-md border border-primary-200 bg-background px-3 py-1.5 text-sm"
                >
                  <option value="">All statuses</option>
                  <option value="active">Active</option>
                  <option value="provisional">Provisional</option>
                  <option value="pending_verification">Pending verification</option>
                </select>
              </div>
              <p className="text-sm text-muted-foreground">{corporatesTotal} corporate(s)</p>
            </CardHeader>
            <CardContent className="p-0">
              <AdminTable<Corporate>
                data={corporates.filter((c) => !corporatesSearch.trim() || c.name?.toLowerCase().includes(corporatesSearch.toLowerCase()) || c.contact_email?.toLowerCase().includes(corporatesSearch.toLowerCase()))}
                keyExtractor={(c) => c.id}
                pageSize={15}
                emptyMessage="No corporates found. Add one to start recording corporate bookings."
                containerClassName="max-h-[70vh] overflow-y-auto"
                columns={[
                  { key: 'name', label: 'Name', sortable: true },
                  { key: 'status', label: 'Status', sortable: true, render: (c) => <span className="rounded-full px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800">{c.status}</span> },
                  { key: 'contact', label: 'Contact', render: (c) => `${c.contact_name || '—'} ${c.contact_email ? `(${c.contact_email})` : ''}` },
                  { key: 'billing_method', label: 'Billing', render: (c) => c.billing_method || '—' },
                  { key: 'max_nightly_rate', label: 'Max rate', sortValue: (c) => c.max_nightly_rate ?? 0, render: (c) => c.max_nightly_rate != null ? `NPR ${Number(c.max_nightly_rate).toLocaleString()}` : '—' },
                  { key: 'actions', label: 'Actions', render: (c) => <Button variant="outline" size="sm" onClick={() => { setEditingCorporate(c); setCorporateForm({ name: c.name, status: c.status, contact_name: c.contact_name ?? '', contact_email: c.contact_email ?? '', contact_phone: c.contact_phone ?? '', billing_method: c.billing_method ?? '', approval_required: c.approval_required, max_nightly_rate: c.max_nightly_rate, notes: c.notes ?? '' }); setCorporateFormOpen(true); }}>Edit</Button> },
                ]}
              />
            </CardContent>
          </Card>

          {/* Create/Edit Corporate dialog */}
          <Dialog.Root open={corporateFormOpen} onOpenChange={(open) => { setCorporateFormOpen(open); if (!open) setEditingCorporate(null); }}>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/50" />
              <Dialog.Content aria-describedby={undefined} className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-primary-200 bg-background p-6 shadow-lg">
                <Dialog.Title className="text-lg font-semibold text-foreground">{editingCorporate ? 'Edit corporate' : 'Add corporate'}</Dialog.Title>
                <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); setCorporateFormSaving(true); const payload = { name: corporateForm.name!, status: (corporateForm.status as string) || 'provisional', contact_name: corporateForm.contact_name || undefined, contact_email: corporateForm.contact_email || undefined, contact_phone: corporateForm.contact_phone || undefined, billing_method: corporateForm.billing_method || undefined, approval_required: !!corporateForm.approval_required, max_nightly_rate: corporateForm.max_nightly_rate != null ? Number(corporateForm.max_nightly_rate) : undefined, notes: corporateForm.notes || undefined }; if (editingCorporate) { api.patch(`/api/admin/corporates/${editingCorporate.id}`, payload).then((res) => { toast({ title: 'Corporate updated.' }); setCorporateFormOpen(false); const updated = res.data.corporate as Corporate; setCorporates((prev) => prev.map((x) => x.id === editingCorporate.id ? updated : x)); }).catch(() => toast({ title: 'Failed to update.', variant: 'destructive' })).finally(() => setCorporateFormSaving(false)); } else { api.post('/api/admin/corporates', payload).then((res) => { toast({ title: 'Corporate created.' }); setCorporates((prev) => [res.data.corporate, ...prev]); setCorporatesTotal((t) => t + 1); setCorporateFormOpen(false); }).catch(() => toast({ title: 'Failed to create.', variant: 'destructive' })).finally(() => setCorporateFormSaving(false)); } }}>
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Name *</label>
                    <input type="text" value={corporateForm.name ?? ''} onChange={(e) => setCorporateForm((f) => ({ ...f, name: e.target.value }))} className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Status</label>
                    <select value={corporateForm.status ?? 'provisional'} onChange={(e) => setCorporateForm((f) => ({ ...f, status: e.target.value }))} className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm">
                      <option value="active">Active</option>
                      <option value="provisional">Provisional</option>
                      <option value="pending_verification">Pending verification</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Contact name</label>
                    <input type="text" value={corporateForm.contact_name ?? ''} onChange={(e) => setCorporateForm((f) => ({ ...f, contact_name: e.target.value }))} className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Contact email</label>
                    <input type="email" value={corporateForm.contact_email ?? ''} onChange={(e) => setCorporateForm((f) => ({ ...f, contact_email: e.target.value }))} className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Contact phone</label>
                    <input type="text" value={corporateForm.contact_phone ?? ''} onChange={(e) => setCorporateForm((f) => ({ ...f, contact_phone: e.target.value }))} className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Billing method</label>
                    <input type="text" placeholder="e.g. postpaid_monthly" value={corporateForm.billing_method ?? ''} onChange={(e) => setCorporateForm((f) => ({ ...f, billing_method: e.target.value }))} className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="approval_required" checked={!!corporateForm.approval_required} onChange={(e) => setCorporateForm((f) => ({ ...f, approval_required: e.target.checked }))} className="rounded border-primary-300" />
                    <label htmlFor="approval_required" className="text-sm text-primary-700">Approval required</label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Max nightly rate (NPR)</label>
                    <input type="number" min={0} step={1} value={corporateForm.max_nightly_rate ?? ''} onChange={(e) => setCorporateForm((f) => ({ ...f, max_nightly_rate: e.target.value === '' ? null : Number(e.target.value) }))} className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Notes</label>
                    <textarea value={corporateForm.notes ?? ''} onChange={(e) => setCorporateForm((f) => ({ ...f, notes: e.target.value }))} className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm" rows={2} />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setCorporateFormOpen(false)}>Cancel</Button>
                    <Button type="submit" className="bg-accent-500 hover:bg-accent-600" disabled={corporateFormSaving}>{corporateFormSaving ? 'Saving…' : editingCorporate ? 'Update' : 'Create'}</Button>
                  </div>
                </form>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          {/* Create corporate booking dialog */}
          <Dialog.Root open={createBookingOpen} onOpenChange={setCreateBookingOpen}>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/50" />
              <Dialog.Content aria-describedby={undefined} className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-primary-200 bg-background p-6 shadow-lg">
                <Dialog.Title className="text-lg font-semibold text-foreground">Create corporate booking</Dialog.Title>
                <p className="mt-1 text-sm text-muted-foreground">Add guest names (one per line or comma-separated) or upload CSV. Number of guests and total price are calculated from the list.</p>
                <form className="mt-4 space-y-3" onSubmit={(e) => {
                  e.preventDefault();
                  const listing_id = Number(createBookingForm.listing_id);
                  if (!listing_id || !createBookingForm.check_in || !createBookingForm.check_out) { toast({ title: 'Please select listing and dates.', variant: 'destructive' }); return; }
                  const raw = createBookingForm.guest_names.trim().replace(/\r\n/g, '\n').split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
                  const guestCount = raw.length >= 1 ? raw.length : Math.max(1, parseInt(createBookingForm.guests, 10) || 1);
                  const useGuestNames = raw.length >= 1;
                  if (useGuestNames && guestCount !== raw.length) { toast({ title: 'Guest names count mismatch.', variant: 'destructive' }); return; }
                  if (!useGuestNames && !createBookingForm.guest_id) { toast({ title: 'Add guest names or select a primary guest (user).', variant: 'destructive' }); return; }
                  setCreateBookingSaving(true);
                  const amenitiesPayload = createBookingChargeableAmenities
                    .filter((a) => (createBookingAmenityQuantities[a.id] ?? 0) > 0)
                    .map((a) => ({ id: a.id, quantity: createBookingAmenityQuantities[a.id] ?? 0 }));
                  const payload = {
                    listing_id,
                    check_in: createBookingForm.check_in,
                    check_out: createBookingForm.check_out,
                    guests: guestCount,
                    message: createBookingForm.message || undefined,
                    corporate_id: createBookingForm.corporate_id ? Number(createBookingForm.corporate_id) : null,
                    ...(useGuestNames ? { guest_names: raw.join('\n'), guest_id: null } : { guest_id: Number(createBookingForm.guest_id) }),
                    ...(amenitiesPayload.length > 0 ? { amenities: amenitiesPayload } : {}),
                  };
                  api.post('/api/admin/bookings/corporate', payload).then(() => {
                    toast({ title: 'Booking created (approved).' });
                    setCreateBookingOpen(false);
                    setCreateBookingChargeableAmenities([]);
                    setCreateBookingAmenityQuantities({});
                    // The bookings list belongs to another section. Telling the
                    // parent it changed is the section's business; refetching
                    // someone else's data was not.
                    onBookingCreated?.();
                  }).catch((err) => toast({ title: err.response?.data?.message || 'Failed to create booking.', variant: 'destructive' })).finally(() => setCreateBookingSaving(false));
                }}>
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Corporate (optional)</label>
                    <select value={createBookingForm.corporate_id} onChange={(e) => setCreateBookingForm((f) => ({ ...f, corporate_id: e.target.value }))} className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm">
                      <option value="">— None —</option>
                      {corporates.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Listing *</label>
                    <select value={createBookingForm.listing_id} onChange={(e) => setCreateBookingForm((f) => ({ ...f, listing_id: e.target.value }))} className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm" required>
                      <option value="">Select listing</option>
                      {corporatesApprovedListings.map((l) => (
                        <option key={l.id} value={l.id}>{l.title} — {l.location}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Guest names (one per line or comma-separated)</label>
                    <textarea value={createBookingForm.guest_names} onChange={(e) => setCreateBookingForm((f) => ({ ...f, guest_names: e.target.value }))} className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm" rows={4} placeholder={'e.g. Ram Sharma\nSita Rai\nOr: Ram Sharma, Sita Rai'} />
                    <p className="mt-1 text-xs text-muted-foreground">Or upload CSV/txt (one name per line or comma-separated)</p>
                    <input type="file" accept=".csv,.txt" className="mt-1 block w-full text-sm text-muted-foreground file:mr-2 file:rounded-md file:border-0 file:bg-primary-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-800 hover:file:bg-primary-200" onChange={(ev) => { const f = ev.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => { const text = (r.result as string) || ''; const lines = text.replace(/\r\n/g, '\n').split(/[\n,]/).map((s) => s.trim()).filter(Boolean); setCreateBookingForm((prev) => ({ ...prev, guest_names: lines.join('\n') })); }; r.readAsText(f); ev.target.value = ''; }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Primary guest (user) — only if not using guest names above</label>
                    <select value={createBookingForm.guest_id} onChange={(e) => setCreateBookingForm((f) => ({ ...f, guest_id: e.target.value }))} className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm">
                      <option value="">— None (use guest names list) —</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                  </div>
                  <div className="relative" ref={createBookingCalendarRef}>
                    <button
                      type="button"
                      onClick={() => setCreateBookingCalendarOpen((v) => !v)}
                      className="grid grid-cols-2 gap-3 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-left hover:bg-primary-50/50 transition-colors"
                      aria-expanded={createBookingCalendarOpen}
                    >
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground">Check-in *</label>
                        <span className="text-sm text-primary-800">
                          {createBookingForm.check_in
                            ? new Date(createBookingForm.check_in + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                            : 'Add date'}
                        </span>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground">Check-out *</label>
                        <span className="text-sm text-primary-800">
                          {createBookingForm.check_out
                            ? new Date(createBookingForm.check_out + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                            : 'Add date'}
                        </span>
                      </div>
                    </button>
                    {createBookingCalendarOpen && (
                      <div className="absolute right-0 z-[100] mt-1 bg-card border border-primary-200 rounded-xl shadow-xl p-3 calendar-popup">
                        <DateRangePicker
                          checkIn={createBookingForm.check_in}
                          checkOut={createBookingForm.check_out}
                          onCheckInChange={(v: string) => setCreateBookingForm((f) => ({ ...f, check_in: v }))}
                          onCheckOutChange={(v: string) => {
                            setCreateBookingForm((f) => ({ ...f, check_out: v }));
                            if (v) setCreateBookingCalendarOpen(false);
                          }}
                        />
                      </div>
                    )}
                  </div>
                  {createBookingForm.listing_id && (
                    <div>
                      <label className="block text-sm font-medium text-primary-700">Chargeable amenities (optional)</label>
                      <p className="mt-0.5 text-xs text-muted-foreground">Add optional add-ons; charges will appear on the invoice.</p>
                      {createBookingChargeableAmenities.length > 0 ? (
                        <div className="mt-2 space-y-2 rounded-lg border border-primary-200 bg-primary-50/30 p-3">
                          {createBookingChargeableAmenities.map((a) => (
                            <div key={a.id} className="flex items-center justify-between gap-4">
                              <span className="text-sm text-primary-800">{a.name} — NPR {Number(a.price_npr).toLocaleString()}{a.charge_type === 'per_night' ? ' / night' : ' (one-time)'}</span>
                              <input
                                type="number"
                                min={0}
                                value={createBookingAmenityQuantities[a.id] ?? 0}
                                onChange={(e) => setCreateBookingAmenityQuantities((prev) => ({ ...prev, [a.id]: Math.max(0, parseInt(e.target.value, 10) || 0) }))}
                                className="w-20 rounded-md border border-primary-200 bg-background px-2 py-1 text-sm"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-2 rounded-lg border border-dashed border-primary-200 bg-primary-50/20 p-3">
                          <p className="text-sm text-muted-foreground mb-2">No chargeable amenities for this listing. Add one:</p>
                          <div className="flex flex-wrap items-end gap-2">
                            <input type="text" placeholder="Name (e.g. Community hall)" value={addAmenityForm.name} onChange={(e) => setAddAmenityForm((f) => ({ ...f, name: e.target.value }))} className="rounded-md border border-primary-200 bg-background px-2 py-1.5 text-sm w-40" />
                            <input type="number" min={0} step={0.01} placeholder="Price NPR" value={addAmenityForm.price_npr} onChange={(e) => setAddAmenityForm((f) => ({ ...f, price_npr: e.target.value }))} className="rounded-md border border-primary-200 bg-background px-2 py-1.5 text-sm w-24" />
                            <select value={addAmenityForm.charge_type} onChange={(e) => setAddAmenityForm((f) => ({ ...f, charge_type: e.target.value as 'per_night' | 'one_time' }))} className="rounded-md border border-primary-200 bg-background px-2 py-1.5 text-sm">
                              <option value="one_time">One-time</option>
                              <option value="per_night">Per night</option>
                            </select>
                            <Button type="button" size="sm" variant="outline" disabled={addAmenitySaving || !addAmenityForm.name.trim() || !Number(addAmenityForm.price_npr)} onClick={() => {
                              const lid = Number(createBookingForm.listing_id);
                              if (!lid) return;
                              setAddAmenitySaving(true);
                              api.post(`/api/admin/listings/${lid}/chargeable-amenities`, { name: addAmenityForm.name.trim(), price_npr: Number(addAmenityForm.price_npr), charge_type: addAmenityForm.charge_type }).then(() => {
                                setAddAmenityForm({ name: '', price_npr: '', charge_type: 'one_time' });
                                return api.get<{ amenities: ChargeableAmenity[] }>(`/api/listings/${lid}/chargeable-amenities`);
                              }).then((res) => {
                                setCreateBookingChargeableAmenities(res.data.amenities || []);
                                toast({ title: 'Chargeable amenity added.' });
                              }).catch((err) => toast({ title: err.response?.data?.message || 'Failed to add amenity', variant: 'destructive' })).finally(() => setAddAmenitySaving(false));
                            }}>{addAmenitySaving ? 'Adding…' : 'Add'}</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {(() => {
                    const raw = createBookingForm.guest_names.trim().replace(/\r\n/g, '\n').split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
                    const guests = raw.length >= 1 ? raw.length : Math.max(1, parseInt(createBookingForm.guests, 10) || 1);
                    const nights = createBookingForm.check_in && createBookingForm.check_out
                      ? Math.max(0, Math.ceil((new Date(createBookingForm.check_out).getTime() - new Date(createBookingForm.check_in).getTime()) / (24 * 60 * 60 * 1000)))
                      : 0;
                    const pricePerNight = createBookingListingPrice ?? 0;
                    const subtotal = nights * pricePerNight * guests;
                    let amenityTotal = 0;
                    createBookingChargeableAmenities.forEach((a) => {
                      const qty = createBookingAmenityQuantities[a.id] ?? 0;
                      if (qty <= 0) return;
                      if (a.charge_type === 'per_night') amenityTotal += qty * nights * Number(a.price_npr);
                      else amenityTotal += qty * Number(a.price_npr);
                    });
                    amenityTotal = Math.round(amenityTotal * 100) / 100;
                    const total = Math.round((subtotal + amenityTotal) * 100) / 100;
                    return (
                      <div className="rounded-lg border border-primary-200 bg-primary-50/50 p-3 text-sm">
                        <p><span className="font-medium text-muted-foreground">Number of guests:</span> {guests}{raw.length >= 1 ? ` (from ${raw.length} name(s))` : ''}</p>
                        {nights > 0 && <p><span className="font-medium text-muted-foreground">Nights:</span> {nights}</p>}
                        {nights > 0 && pricePerNight > 0 && <p><span className="font-medium text-muted-foreground">Accommodation subtotal (NPR):</span> {subtotal.toLocaleString()} ({pricePerNight.toLocaleString()} × {nights} × {guests})</p>}
                        {amenityTotal > 0 && <p><span className="font-medium text-muted-foreground">Amenities (NPR):</span> {amenityTotal.toLocaleString()}</p>}
                        {total > 0 && <p className="font-semibold text-foreground"><span className="font-medium text-muted-foreground">Total (NPR):</span> {total.toLocaleString()}</p>}
                      </div>
                    );
                  })()}
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Message (optional)</label>
                    <textarea value={createBookingForm.message} onChange={(e) => setCreateBookingForm((f) => ({ ...f, message: e.target.value }))} className="mt-1 w-full rounded-md border border-primary-200 bg-background px-3 py-2 text-sm" rows={2} />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setCreateBookingOpen(false)}>Cancel</Button>
                    <Button type="submit" className="bg-accent-500 hover:bg-accent-600" disabled={createBookingSaving}>{createBookingSaving ? 'Creating…' : 'Create booking'}</Button>
                  </div>
                </form>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
  );
}
