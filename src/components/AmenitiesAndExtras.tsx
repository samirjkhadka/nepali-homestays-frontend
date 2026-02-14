import { useState } from 'react';
import {
  Wifi,
  Coffee,
  Leaf,
  Utensils,
  Car,
  Droplets,
  Flower2,
  Home,
  Mountain,
  AirVent,
  Flame,
  Shirt,
  Plus,
  Pencil,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AMENITIES_OPTIONS,
  EXTRA_SERVICE_UNITS,
  type AmenityOption,
  type ExtraServiceFormItem,
  type ExtraServiceUnit,
} from '@/data/amenities';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';

const AMENITY_ICONS: Record<string, LucideIcon> = {
  Wifi,
  Coffee,
  Leaf,
  Utensils,
  Car,
  Droplets,
  Flower2,
  Home,
  Mountain,
  AirVent,
  Flame,
  Shirt,
};

type AmenitiesAndExtrasProps = {
  amenities: string[];
  onAmenitiesChange: (amenities: string[]) => void;
  extraServices: ExtraServiceFormItem[];
  onExtraServicesChange: (items: ExtraServiceFormItem[]) => void;
  errors?: { amenities?: string; extra_services?: string };
};

const emptyExtra: ExtraServiceFormItem = {
  name: '',
  price_npr: 0,
  unit: 'fixed',
  description: '',
};

export function AmenitiesAndExtras({
  amenities,
  onAmenitiesChange,
  extraServices,
  onExtraServicesChange,
  errors = {},
}: AmenitiesAndExtrasProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [form, setForm] = useState<ExtraServiceFormItem>(emptyExtra);
  const [formErrors, setFormErrors] = useState<{ name?: string; price?: string }>({});

  const toggleAmenity = (id: string) => {
    if (amenities.includes(id)) {
      onAmenitiesChange(amenities.filter((a) => a !== id));
    } else {
      onAmenitiesChange([...amenities, id]);
    }
  };

  const openAdd = () => {
    setEditingIndex(null);
    setForm(emptyExtra);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (index: number) => {
    setEditingIndex(index);
    setForm({ ...extraServices[index] });
    setFormErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingIndex(null);
    setForm(emptyExtra);
    setFormErrors({});
  };

  const validateExtra = (): boolean => {
    const e: { name?: string; price?: string } = {};
    if (!form.name.trim()) e.name = 'Name is required';
    const price = Number(form.price_npr);
    if (!Number.isFinite(price) || price < 0) e.price = 'Enter a valid price (0 or more)';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const saveExtra = () => {
    if (!validateExtra()) return;
    const item: ExtraServiceFormItem = {
      name: form.name.trim(),
      price_npr: Number(form.price_npr) || 0,
      unit: form.unit,
      description: form.description?.trim() || undefined,
    };
    if (editingIndex !== null) {
      const next = [...extraServices];
      next[editingIndex] = item;
      onExtraServicesChange(next);
    } else {
      onExtraServicesChange([...extraServices, item]);
    }
    closeModal();
  };

  const removeExtra = (index: number) => {
    onExtraServicesChange(extraServices.filter((_, i) => i !== index));
  };

  const totalExtra = extraServices.reduce((sum, s) => sum + (Number(s.price_npr) || 0), 0);

  return (
    <>
      <Card className="border-primary-200">
        <CardHeader className="border-b border-primary-100 bg-primary-50/50">
          <h2 className="font-semibold text-primary-800">Amenities (free inclusions)</h2>
          <p className="text-sm text-muted-foreground">Select all that apply. Shown in orange when selected.</p>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {AMENITIES_OPTIONS.map((opt) => {
              const Icon = AMENITY_ICONS[opt.icon] ?? Wifi;
              const selected = amenities.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleAmenity(opt.id)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border-2 px-3 py-3 text-left text-sm transition-all min-h-[48px] touch-manipulation',
                    selected
                      ? 'border-orange-500 bg-orange-50 text-orange-900'
                      : 'border-primary-200 bg-white hover:bg-primary-50 text-primary-800'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="font-medium">{opt.label}</span>
                </button>
              );
            })}
          </div>
          {errors.amenities && <p className="mt-2 text-xs text-destructive">{errors.amenities}</p>}
        </CardContent>
      </Card>

      <Card className="border-primary-200">
        <CardHeader className="border-b border-primary-100 bg-primary-50/50">
          <h2 className="font-semibold text-primary-800">Extra services (paid add-ons)</h2>
          <p className="text-sm text-muted-foreground">Optional paid services guests can add when booking. Add name, price, unit and optional description.</p>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <Button type="button" variant="outline" onClick={openAdd} className="gap-2 min-h-[44px]">
            <Plus className="h-4 w-4" />
            Add Extra Service
          </Button>

          {extraServices.length > 0 && (
            <div className="space-y-3">
              {extraServices.map((s, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg border border-primary-200 bg-primary-50/30 p-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-primary-900">{s.name}</p>
                    <p className="text-sm text-muted-foreground">
                      NPR {Number(s.price_npr).toLocaleString()} ({EXTRA_SERVICE_UNITS.find((u) => u.id === s.unit)?.label ?? s.unit})
                    </p>
                    {s.description && <p className="text-sm text-primary-700 mt-1">{s.description}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button type="button" variant="ghost" size="icon" onClick={() => openEdit(i)} className="h-10 w-10" aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeExtra(i)} className="h-10 w-10 text-destructive hover:text-destructive" aria-label="Delete">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <p className="text-sm text-muted-foreground">
                Total extra (preview): NPR {totalExtra.toLocaleString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog.Root open={modalOpen} onOpenChange={(open) => !open && closeModal()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-primary-200 bg-background p-6 shadow-lg">
            <Dialog.Title className="text-lg font-semibold text-primary-800">{editingIndex !== null ? 'Edit Extra Service' : 'Add Extra Service'}</Dialog.Title>
            <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="extra-name">Name *</Label>
              <Input
                id="extra-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Airport pickup"
                className={cn('mt-1', formErrors.name && 'border-destructive')}
              />
              {formErrors.name && <p className="mt-1 text-xs text-destructive">{formErrors.name}</p>}
            </div>
            <div>
              <Label htmlFor="extra-price">Price (NPR) *</Label>
              <Input
                id="extra-price"
                type="number"
                min={0}
                step={1}
                value={form.price_npr || ''}
                onChange={(e) => setForm((f) => ({ ...f, price_npr: e.target.value === '' ? 0 : Number(e.target.value) }))}
                placeholder="0"
                className={cn('mt-1', formErrors.price && 'border-destructive')}
              />
              {formErrors.price && <p className="mt-1 text-xs text-destructive">{formErrors.price}</p>}
            </div>
            <div>
              <Label htmlFor="extra-unit">Unit</Label>
              <select
                id="extra-unit"
                value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value as ExtraServiceUnit }))}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {EXTRA_SERVICE_UNITS.map((u) => (
                  <option key={u.id} value={u.id}>{u.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="extra-desc">Description (optional)</Label>
              <Textarea
                id="extra-desc"
                value={form.description ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                placeholder="Short description for guests"
                className="mt-1"
              />
            </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
              <Button type="button" onClick={saveExtra}>{editingIndex !== null ? 'Save' : 'Add'}</Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
