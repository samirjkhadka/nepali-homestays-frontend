import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Check, Download, Loader2, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import { api, apiPath } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type StaticType = {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  uses_label: boolean;
  uses_country: boolean;
  is_system: boolean;
  item_count: number;
};

type StaticItem = {
  id: number;
  type_code: string;
  code?: string | null;
  label?: string | null;
  value: string;
  country_code?: string | null;
  sort_order: number;
  is_active: boolean;
};

type ImportPreview = {
  mode: string;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  errors: { row: number; message: string }[];
  sample: { label?: string | null; value: string; code?: string | null; countryCode?: string | null }[];
  message: string;
};

const PAGE_SIZE = 50;

export default function AdminStaticData() {
  const { toast } = useToast();

  const [types, setTypes] = useState<StaticType[]>([]);
  const [activeCode, setActiveCode] = useState<string>('');
  const [items, setItems] = useState<StaticItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [draft, setDraft] = useState<Partial<StaticItem> | null>(null);
  const [saving, setSaving] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const activeType = useMemo(() => types.find((t) => t.code === activeCode), [types, activeCode]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadTypes = useCallback(async () => {
    const res = await api.get(apiPath('/api/admin/static-data/types'));
    const list: StaticType[] = res.data?.types ?? [];
    setTypes(list);
    setActiveCode((cur) => cur || list[0]?.code || '');
  }, []);

  const loadItems = useCallback(async () => {
    if (!activeCode) return;
    setLoading(true);
    try {
      const res = await api.get(apiPath('/api/admin/static-data'), {
        params: { type: activeCode, search: search || undefined, page, limit: PAGE_SIZE },
      });
      setItems(res.data?.items ?? []);
      setTotal(res.data?.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [activeCode, search, page]);

  useEffect(() => {
    loadTypes().catch(() => toast({ title: 'Could not load the lists', variant: 'destructive' }));
  }, [loadTypes, toast]);

  useEffect(() => {
    loadItems().catch(() => toast({ title: 'Could not load entries', variant: 'destructive' }));
  }, [loadItems, toast]);

  // Reset paging whenever the list or the search term changes.
  useEffect(() => setPage(1), [activeCode, search]);

  async function saveDraft() {
    if (!draft || !activeType) return;
    if (!draft.value?.trim()) {
      toast({ title: 'Value is required', variant: 'destructive' });
      return;
    }
    if (activeType.uses_label && !draft.label?.trim()) {
      toast({ title: 'Label is required for this list', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (draft.id) {
        await api.patch(apiPath(`/api/admin/static-data/${draft.id}`), {
          code: draft.code ?? null,
          label: draft.label ?? null,
          value: draft.value,
          sort_order: draft.sort_order ?? 0,
          is_active: draft.is_active ?? true,
        });
      } else {
        await api.post(apiPath('/api/admin/static-data'), {
          type_code: activeType.code,
          code: draft.code ?? null,
          label: draft.label ?? null,
          value: draft.value,
          country_code: draft.country_code ?? (activeType.uses_country ? 'NP' : null),
          sort_order: draft.sort_order ?? 0,
          is_active: draft.is_active ?? true,
        });
      }
      toast({ title: draft.id ? 'Entry updated' : 'Entry added' });
      setDraft(null);
      await Promise.all([loadItems(), loadTypes()]);
    } catch {
      toast({ title: 'Could not save the entry', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(item: StaticItem) {
    if (!window.confirm(`Delete “${item.value}”? This cannot be undone.`)) return;
    try {
      await api.delete(apiPath(`/api/admin/static-data/${item.id}`));
      toast({ title: 'Entry deleted' });
      await Promise.all([loadItems(), loadTypes()]);
    } catch {
      toast({ title: 'Could not delete the entry', variant: 'destructive' });
    }
  }

  function downloadTemplate() {
    const base = (import.meta.env.VITE_API_URL || '').trim();
    window.open(`${base}${apiPath('/api/admin/static-data/template')}?type=${encodeURIComponent(activeCode)}`, '_blank');
  }

  async function runImport(mode: 'preview' | 'commit') {
    if (!file) {
      toast({ title: 'Choose a .xlsx file first', variant: 'destructive' });
      return;
    }
    setImporting(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post(
        `${apiPath('/api/admin/static-data/import')}?type=${encodeURIComponent(activeCode)}&mode=${mode}`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      if (mode === 'preview') {
        setPreview(res.data as ImportPreview);
      } else {
        toast({ title: res.data?.message ?? 'Import complete' });
        setPreview(null);
        setFile(null);
        if (fileRef.current) fileRef.current.value = '';
        await Promise.all([loadItems(), loadTypes()]);
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'The import could not be processed';
      toast({ title: message, variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Static data</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-600">
          Reference lists the site depends on — municipalities, gender, countries. These rarely change,
          but everything from search filters to signup forms reads them.
        </p>
      </header>

      {/* List selector */}
      <div className="mb-6 flex flex-wrap gap-2">
        {types.map((t) => (
          <button
            key={t.code}
            type="button"
            onClick={() => setActiveCode(t.code)}
            className={`rounded-full border px-4 py-1.5 text-sm transition ${
              t.code === activeCode
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
            }`}
          >
            {t.name}
            <span className={`ml-2 text-xs ${t.code === activeCode ? 'text-gray-300' : 'text-gray-500'}`}>
              {t.item_count}
            </span>
          </button>
        ))}
      </div>

      {activeType && (
        <>
          {/* Bulk import */}
          <section className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[240px] flex-1">
                <Label htmlFor="import-file" className="text-xs font-medium uppercase tracking-wide text-gray-600">
                  Bulk import
                </Label>
                <Input
                  id="import-file"
                  ref={fileRef}
                  type="file"
                  accept=".xlsx"
                  className="mt-1 bg-white"
                  onChange={(e) => {
                    setFile(e.target.files?.[0] ?? null);
                    setPreview(null);
                  }}
                />
              </div>
              <Button type="button" variant="outline" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Template
              </Button>
              <Button type="button" onClick={() => runImport('preview')} disabled={!file || importing}>
                {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Check file
              </Button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Uploading never overwrites blindly — you will see what changes before anything is saved.
              Rows are matched on {activeType.uses_country ? 'country, ' : ''}
              {activeType.uses_label ? 'label and ' : ''}value, so re-uploading a corrected sheet updates
              entries instead of duplicating them.
            </p>

            {preview && (
              <div className="mt-4 rounded-md border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{preview.message}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {preview.total_rows} rows read · {preview.valid_rows} ready · {preview.invalid_rows} with problems
                    </p>
                  </div>
                  <button type="button" onClick={() => setPreview(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {preview.invalid_rows > 0 && (
                  <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto rounded bg-red-50 p-3 text-xs text-red-800">
                    {preview.errors.map((e) => (
                      <li key={e.row} className="flex gap-2">
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>
                          Row {e.row}: {e.message}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {preview.valid_rows > 0 && preview.invalid_rows === 0 && (
                  <Button type="button" className="mt-3" onClick={() => runImport('commit')} disabled={importing}>
                    {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                    Import {preview.valid_rows} entries
                  </Button>
                )}
              </div>
            )}
          </section>

          {/* Search + add */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${activeType.name.toLowerCase()}`}
                className="pl-9"
              />
            </div>
            <Button
              type="button"
              onClick={() =>
                setDraft({ value: '', label: '', code: '', sort_order: 0, is_active: true, country_code: activeType.uses_country ? 'NP' : null })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Add entry
            </Button>
          </div>

          {/* Editor */}
          {draft && (
            <div className="mb-4 rounded-lg border border-gray-300 bg-white p-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {activeType.uses_label && (
                  <div>
                    <Label htmlFor="d-label">Label</Label>
                    <Input
                      id="d-label"
                      value={draft.label ?? ''}
                      onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                      placeholder="District"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="d-value">Value</Label>
                  <Input
                    id="d-value"
                    value={draft.value ?? ''}
                    onChange={(e) => setDraft({ ...draft, value: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="d-code">Code</Label>
                  <Input
                    id="d-code"
                    value={draft.code ?? ''}
                    onChange={(e) => setDraft({ ...draft, code: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <Label htmlFor="d-sort">Sort order</Label>
                  <Input
                    id="d-sort"
                    type="number"
                    value={draft.sort_order ?? 0}
                    onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <Button type="button" onClick={saveDraft} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save
                </Button>
                <Button type="button" variant="outline" onClick={() => setDraft(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Items */}
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  {activeType.uses_label && <th className="px-4 py-3 font-medium">Label</th>}
                  <th className="px-4 py-3 font-medium">Value</th>
                  <th className="px-4 py-3 font-medium">Code</th>
                  {activeType.uses_country && <th className="px-4 py-3 font-medium">Country</th>}
                  <th className="px-4 py-3 font-medium">Sort</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {loading && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                    </td>
                  </tr>
                )}
                {!loading && items.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                      {search ? 'No entries match that search.' : 'No entries yet. Add one or import a spreadsheet.'}
                    </td>
                  </tr>
                )}
                {!loading &&
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      {activeType.uses_label && <td className="px-4 py-3 text-gray-600">{item.label}</td>}
                      <td className="px-4 py-3 font-medium text-gray-900">{item.value}</td>
                      <td className="px-4 py-3 text-gray-500">{item.code || '—'}</td>
                      {activeType.uses_country && <td className="px-4 py-3 text-gray-500">{item.country_code || '—'}</td>}
                      <td className="px-4 py-3 tabular-nums text-gray-500">{item.sort_order}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                            item.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {item.is_active ? 'Active' : 'Hidden'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button type="button" variant="ghost" size="sm" onClick={() => setDraft(item)}>
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item)}
                            aria-label={`Delete ${item.value}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {pageCount > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <span>
                Page {page} of {pageCount} · {total} entries
              </span>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= pageCount}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
