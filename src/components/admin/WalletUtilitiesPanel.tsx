import { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, Search, Wallet, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatDateOnly } from '@/lib/format';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type WalletSlabRowDraft = {
  min_npr: string;
  max_npr: string;
  type: 'discount' | 'service_charge' | 'cashback';
  kind: 'percent' | 'fixed';
  value: string;
};

type WalletPlatformRow = {
  wallet_service_name: string;
  platform_enabled: boolean;
  slabs_json: string | null;
  catalog_refreshed_at?: string | null;
  updated_at?: string;
};

type UtilTxn = {
  id: number;
  host_user_id: number;
  wallet_service_name: string;
  face_value_paisa: number;
  host_due_paisa: number;
  status: string;
  created_at: string;
  host_name?: string | null;
  host_email?: string | null;
};

type WalletUtilServiceGroup = {
  id: string;
  label: string;
  subtitle: string;
  kind: 'nea' | 'standard';
  rows: WalletPlatformRow[];
  primaryName: string;
  platformEnabled: boolean;
  slabCount: number;
};

function emptyWalletSlabRow(): WalletSlabRowDraft {
  return { min_npr: '0', max_npr: '', type: 'service_charge', kind: 'percent', value: '0' };
}

function parseWalletSlabsToRows(slabsJson: string | null): WalletSlabRowDraft[] {
  const raw = slabsJson?.trim();
  if (!raw) return [];
  try {
    const o = JSON.parse(raw) as { slabs?: unknown[] };
    const slabs = Array.isArray(o.slabs) ? o.slabs : [];
    return slabs.map((x) => {
      const r = x as Record<string, unknown>;
      const t = String(r.type ?? 'service_charge');
      const type: WalletSlabRowDraft['type'] =
        t === 'discount' || t === 'cashback' || t === 'service_charge' ? t : 'service_charge';
      const k = String(r.kind ?? 'percent');
      return {
        min_npr: String(r.min_npr ?? ''),
        max_npr: r.max_npr == null || r.max_npr === '' ? '' : String(r.max_npr),
        type,
        kind: k === 'fixed' ? 'fixed' : 'percent',
        value: String(r.value ?? ''),
      };
    });
  } catch {
    return [];
  }
}

function serializeWalletSlabRows(rows: WalletSlabRowDraft[]): string {
  return JSON.stringify({
    slabs: rows.map((r) => ({
      min_npr: Number(r.min_npr),
      max_npr: r.max_npr.trim() === '' ? null : Number(r.max_npr),
      type: r.type,
      kind: r.kind,
      value: Number(r.value),
    })),
  });
}

function formatNprFromPaisa(paisa: number): string {
  const n = Number(paisa) / 100;
  return `NPR ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function normalizeWalletServiceKey(name: string): string {
  return name.trim().toUpperCase().replace(/-/g, '_').replace(/ /g, '_');
}

function isWalletNeaSubStep(name: string): boolean {
  const u = normalizeWalletServiceKey(name);
  if (u === 'NEA' || !u.startsWith('NEA')) return false;
  return u.startsWith('NEA_') || u.includes('COUNTER') || u.includes('DETAIL') || u.includes('PAY');
}

function formatWalletServiceLabel(name: string): string {
  if (normalizeWalletServiceKey(name) === 'NEA' || isWalletNeaSubStep(name)) return 'NEA Electricity';
  return name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildWalletUtilGroups(
  services: WalletPlatformRow[],
  slabRows: Record<string, WalletSlabRowDraft[]>
): WalletUtilServiceGroup[] {
  const neaRows = services.filter((s) => isWalletNeaSubStep(s.wallet_service_name));
  const standardRows = services.filter((s) => !isWalletNeaSubStep(s.wallet_service_name));
  const groups: WalletUtilServiceGroup[] = standardRows.map((row) => ({
    id: row.wallet_service_name,
    label: formatWalletServiceLabel(row.wallet_service_name),
    subtitle: row.wallet_service_name,
    kind: 'standard' as const,
    rows: [row],
    primaryName: row.wallet_service_name,
    platformEnabled: row.platform_enabled,
    slabCount: (slabRows[row.wallet_service_name] ?? []).length,
  }));
  if (neaRows.length > 0) {
    const payRow =
      neaRows.find((r) => normalizeWalletServiceKey(r.wallet_service_name).includes('PAY')) ?? neaRows[0];
    groups.push({
      id: 'NEA',
      label: 'NEA Electricity',
      subtitle: `${neaRows.length} HimalPay steps · hosts see one “NEA” card`,
      kind: 'nea',
      rows: neaRows,
      primaryName: payRow.wallet_service_name,
      platformEnabled: neaRows.some((r) => r.platform_enabled),
      slabCount: (slabRows[payRow.wallet_service_name] ?? []).length,
    });
  }
  return groups.sort((a, b) => a.label.localeCompare(b.label));
}

function txnServiceLabel(name: string): string {
  return isWalletNeaSubStep(name) ? 'NEA' : name;
}

export function WalletUtilitiesPanel() {
  const { toast } = useToast();
  const [services, setServices] = useState<WalletPlatformRow[]>([]);
  const [slabRows, setSlabRows] = useState<Record<string, WalletSlabRowDraft[]>>({});
  const [txns, setTxns] = useState<UtilTxn[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingName, setSavingName] = useState<string | null>(null);
  const [recheckingId, setRecheckingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'enabled' | 'disabled'>('all');

  const loadAll = () =>
    Promise.all([
      api.get<{ services: WalletPlatformRow[] }>('/api/admin/wallet-utilities/services'),
      api.get<{ transactions: UtilTxn[] }>('/api/admin/wallet-utilities/transactions?page=1&limit=50'),
    ]).then(([s, tx]) => {
      const list = s.data.services ?? [];
      setServices(list);
      const rowsMap: Record<string, WalletSlabRowDraft[]> = {};
      for (const r of list) rowsMap[r.wallet_service_name] = parseWalletSlabsToRows(r.slabs_json);
      setSlabRows(rowsMap);
      setTxns(tx.data.transactions ?? []);
    });

  useEffect(() => {
    setLoading(true);
    loadAll()
      .catch(() => toast({ title: 'Could not load wallet utilities.', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [toast]);

  const groups = useMemo(() => buildWalletUtilGroups(services, slabRows), [services, slabRows]);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    return groups.filter((g) => {
      if (filter === 'enabled' && !g.platformEnabled) return false;
      if (filter === 'disabled' && g.platformEnabled) return false;
      if (!q) return true;
      return (
        g.label.toLowerCase().includes(q) ||
        g.subtitle.toLowerCase().includes(q) ||
        g.rows.some((r) => r.wallet_service_name.toLowerCase().includes(q))
      );
    });
  }, [groups, search, filter]);

  const enabledCount = groups.filter((g) => g.platformEnabled).length;

  const setGroupPlatformEnabled = (group: WalletUtilServiceGroup, enabled: boolean) => {
    const names = new Set(group.rows.map((r) => r.wallet_service_name));
    setServices((prev) =>
      prev.map((x) => (names.has(x.wallet_service_name) ? { ...x, platform_enabled: enabled } : x))
    );
  };

  const saveService = (name: string, slabList: WalletSlabRowDraft[]) => {
    for (const s of slabList) {
      if (Number.isNaN(Number(s.min_npr)) || Number.isNaN(Number(s.value))) {
        toast({ title: `Invalid numbers in slab row for ${name}.`, variant: 'destructive' });
        return;
      }
      if (s.max_npr.trim() !== '' && Number.isNaN(Number(s.max_npr))) {
        toast({ title: `Invalid max NPR in slab for ${name}.`, variant: 'destructive' });
        return;
      }
    }
    const platform_enabled = services.find((x) => x.wallet_service_name === name)?.platform_enabled ?? false;
    setSavingName(name);
    api
      .patch<{ message?: string; service?: WalletPlatformRow }>('/api/admin/wallet-utilities/services', {
        wallet_service_name: name,
        platform_enabled,
        slabs_json: serializeWalletSlabRows(slabList),
      })
      .then((res) => {
        toast({ title: res.data.message || 'Saved.' });
        const svc = res.data.service;
        if (svc) {
          const isNea = isWalletNeaSubStep(name);
          setServices((prev) =>
            prev.map((x) => {
              if (x.wallet_service_name === name) return { ...x, ...svc };
              if (isNea && isWalletNeaSubStep(x.wallet_service_name))
                return { ...x, platform_enabled: svc.platform_enabled };
              return x;
            })
          );
          setSlabRows((prev) => ({ ...prev, [name]: parseWalletSlabsToRows(svc.slabs_json) }));
        }
      })
      .catch((err) => toast({ title: err.response?.data?.message || 'Save failed.', variant: 'destructive' }))
      .finally(() => setSavingName(null));
  };

  const refreshCatalog = () => {
    setRefreshing(true);
    api
      .post<{ message?: string; services?: WalletPlatformRow[] }>('/api/admin/wallet-utilities/refresh')
      .then((res) => {
        const list = res.data.services ?? [];
        setServices(list);
        const rowsMap: Record<string, WalletSlabRowDraft[]> = {};
        for (const r of list) rowsMap[r.wallet_service_name] = parseWalletSlabsToRows(r.slabs_json);
        setSlabRows(rowsMap);
        toast({ title: res.data.message || 'Catalog refreshed.' });
        return api
          .get<{ transactions: UtilTxn[] }>('/api/admin/wallet-utilities/transactions?page=1&limit=50')
          .then((tx) => setTxns(tx.data.transactions ?? []));
      })
      .catch((err) =>
        toast({ title: err.response?.data?.message || 'Refresh failed.', variant: 'destructive' })
      )
      .finally(() => setRefreshing(false));
  };

  return (
    <div className="mt-6 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-primary-800">Wallet utilities</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Refresh SKUs from HimalPay, configure platform pricing, and review host utility transactions.
          </p>
        </div>
        <Button
          type="button"
          className="bg-accent-500 hover:bg-accent-600"
          disabled={refreshing}
          onClick={refreshCatalog}
        >
          <RefreshCw className={`mr-2 h-4 w-4 inline ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing…' : 'Refresh from HimalPay'}
        </Button>
      </div>

      {loading && <p className="text-muted-foreground">Loading…</p>}

      {!loading && (
        <>
          <Card>
            <CardHeader className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-primary-800">Platform services</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Click a service to expand. Enabled services open by default. NEA steps are grouped into one card.
                </p>
              </div>
              {services.length > 0 && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by name…"
                      className="pl-9 border-primary-200"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground mr-1">
                      {enabledCount} of {groups.length} enabled
                    </span>
                    {(['all', 'enabled', 'disabled'] as const).map((f) => (
                      <Button
                        key={f}
                        type="button"
                        size="sm"
                        variant={filter === f ? 'default' : 'outline'}
                        className={filter === f ? 'bg-primary hover:bg-primary/90' : ''}
                        onClick={() => setFilter(f)}
                      >
                        {f === 'all' ? 'All' : f === 'enabled' ? 'Enabled' : 'Disabled'}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {services.length === 0 ? (
                <p className="text-sm text-muted-foreground">No rows yet. Use Refresh to import SKUs from HimalPay.</p>
              ) : filteredGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground">No services match your search or filter.</p>
              ) : (
                <Accordion
                  type="multiple"
                  defaultValue={filteredGroups.filter((g) => g.platformEnabled).map((g) => g.id)}
                  className="space-y-3"
                >
                  {filteredGroups.map((group) => {
                    const name = group.primaryName;
                    const slabList = slabRows[name] ?? [];
                    const saving = savingName === name;
                    const metaRow = group.rows[0];
                    return (
                      <AccordionItem
                        key={group.id}
                        value={group.id}
                        className="rounded-lg border border-primary-200 bg-background px-4 border-b-0 data-[state=open]:shadow-sm"
                      >
                        <AccordionTrigger className="hover:no-underline py-4">
                          <div className="flex flex-1 items-center gap-3 text-left min-w-0 pr-2">
                            <div
                              className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                                group.platformEnabled ? 'bg-accent-100' : 'bg-primary-100'
                              }`}
                            >
                              <Wallet
                                className={`h-5 w-5 ${
                                  group.platformEnabled ? 'text-accent-600' : 'text-primary-500'
                                }`}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-primary-800 truncate">{group.label}</p>
                              <p className="text-xs text-muted-foreground truncate font-mono">{group.subtitle}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              <Badge
                                variant={group.platformEnabled ? 'default' : 'secondary'}
                                className={
                                  group.platformEnabled
                                    ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100'
                                    : ''
                                }
                              >
                                {group.platformEnabled ? 'Enabled' : 'Disabled'}
                              </Badge>
                              <Badge variant="outline" className="font-normal">
                                {group.slabCount === 0
                                  ? 'No slabs'
                                  : `${group.slabCount} slab${group.slabCount === 1 ? '' : 's'}`}
                              </Badge>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 pb-4">
                          {group.kind === 'nea' && (
                            <p className="text-xs text-muted-foreground rounded-md bg-primary-50/80 border border-primary-100 px-3 py-2">
                              Saving or toggling platform enabled updates all NEA HimalPay steps. Slabs apply to{' '}
                              <span className="font-mono">{group.primaryName}</span>.
                            </p>
                          )}
                          <label className="flex items-center gap-3 cursor-pointer rounded-md border border-primary-100 bg-primary-50/40 px-3 py-2.5 w-fit">
                            <input
                              type="checkbox"
                              checked={group.platformEnabled}
                              onChange={(e) => setGroupPlatformEnabled(group, e.target.checked)}
                              className="h-4 w-4 rounded border-primary-300"
                            />
                            <span className="text-sm font-medium text-primary-800">Platform enabled</span>
                          </label>
                          {group.kind === 'nea' && group.rows.length > 1 && (
                            <div className="flex flex-wrap gap-1.5">
                              {group.rows.map((r) => (
                                <span
                                  key={r.wallet_service_name}
                                  className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-primary-200 bg-muted/50 text-muted-foreground"
                                >
                                  {r.wallet_service_name}
                                </span>
                              ))}
                            </div>
                          )}
                          {(metaRow.catalog_refreshed_at != null || metaRow.updated_at != null) && (
                            <p className="text-xs text-muted-foreground">
                              {metaRow.catalog_refreshed_at != null &&
                                `Catalog refreshed ${formatDateOnly(String(metaRow.catalog_refreshed_at))}`}
                              {metaRow.catalog_refreshed_at != null && metaRow.updated_at != null && ' · '}
                              {metaRow.updated_at != null &&
                                `Last saved ${formatDateOnly(String(metaRow.updated_at))}`}
                            </p>
                          )}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium text-primary-700">Pricing slabs</span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setSlabRows((prev) => ({
                                    ...prev,
                                    [name]: [...(prev[name] ?? []), emptyWalletSlabRow()],
                                  }))
                                }
                              >
                                <Plus className="h-4 w-4 mr-1 inline" />
                                Add slab
                              </Button>
                            </div>
                            {slabList.length === 0 && (
                              <p className="text-xs text-muted-foreground py-2">
                                No slabs — host due equals face value for this SKU.
                              </p>
                            )}
                            {slabList.map((slab, idx) => (
                              <div
                                key={`${name}-${idx}`}
                                className="grid grid-cols-2 sm:grid-cols-12 gap-2 items-end rounded-md border border-primary-100 bg-primary-50/30 p-3"
                              >
                                <div className="sm:col-span-2">
                                  <label className="text-xs font-medium text-muted-foreground">Min NPR</label>
                                  <input
                                    type="number"
                                    className="mt-1 w-full rounded-md border border-primary-200 bg-background px-2 py-1.5 text-sm"
                                    value={slab.min_npr}
                                    onChange={(e) =>
                                      setSlabRows((prev) => {
                                        const list = [...(prev[name] ?? [])];
                                        list[idx] = { ...list[idx], min_npr: e.target.value };
                                        return { ...prev, [name]: list };
                                      })
                                    }
                                  />
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="text-xs font-medium text-muted-foreground">Max NPR</label>
                                  <input
                                    type="number"
                                    className="mt-1 w-full rounded-md border border-primary-200 bg-background px-2 py-1.5 text-sm"
                                    value={slab.max_npr}
                                    onChange={(e) =>
                                      setSlabRows((prev) => {
                                        const list = [...(prev[name] ?? [])];
                                        list[idx] = { ...list[idx], max_npr: e.target.value };
                                        return { ...prev, [name]: list };
                                      })
                                    }
                                    placeholder="No max"
                                  />
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="text-xs font-medium text-muted-foreground">Type</label>
                                  <select
                                    className="mt-1 w-full rounded-md border border-primary-200 bg-background px-2 py-1.5 text-sm"
                                    value={slab.type}
                                    onChange={(e) =>
                                      setSlabRows((prev) => {
                                        const list = [...(prev[name] ?? [])];
                                        list[idx] = {
                                          ...list[idx],
                                          type: e.target.value as WalletSlabRowDraft['type'],
                                        };
                                        return { ...prev, [name]: list };
                                      })
                                    }
                                  >
                                    <option value="service_charge">Service charge</option>
                                    <option value="discount">Discount</option>
                                    <option value="cashback">Cashback</option>
                                  </select>
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="text-xs font-medium text-muted-foreground">Kind</label>
                                  <select
                                    className="mt-1 w-full rounded-md border border-primary-200 bg-background px-2 py-1.5 text-sm"
                                    value={slab.kind}
                                    onChange={(e) =>
                                      setSlabRows((prev) => {
                                        const list = [...(prev[name] ?? [])];
                                        list[idx] = {
                                          ...list[idx],
                                          kind: e.target.value as WalletSlabRowDraft['kind'],
                                        };
                                        return { ...prev, [name]: list };
                                      })
                                    }
                                  >
                                    <option value="percent">Percent</option>
                                    <option value="fixed">Fixed NPR</option>
                                  </select>
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="text-xs font-medium text-muted-foreground">Value</label>
                                  <input
                                    type="number"
                                    className="mt-1 w-full rounded-md border border-primary-200 bg-background px-2 py-1.5 text-sm"
                                    value={slab.value}
                                    onChange={(e) =>
                                      setSlabRows((prev) => {
                                        const list = [...(prev[name] ?? [])];
                                        list[idx] = { ...list[idx], value: e.target.value };
                                        return { ...prev, [name]: list };
                                      })
                                    }
                                  />
                                </div>
                                <div className="sm:col-span-2 flex justify-end pb-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground hover:text-destructive"
                                    aria-label="Remove slab"
                                    onClick={() =>
                                      setSlabRows((prev) => ({
                                        ...prev,
                                        [name]: (prev[name] ?? []).filter((_, i) => i !== idx),
                                      }))
                                    }
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                          <Button
                            type="button"
                            className="bg-accent-500 hover:bg-accent-600"
                            disabled={saving}
                            onClick={() => saveService(name, slabList)}
                          >
                            {saving ? 'Saving…' : 'Save changes'}
                          </Button>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              )}
            </CardContent>
          </Card>

          <Card>
            <Accordion type="single" collapsible defaultValue="wallet-txns">
              <AccordionItem value="wallet-txns" className="border-0">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-primary-800">Utility transactions</h3>
                    <p className="text-sm text-muted-foreground font-normal mt-0.5">
                      Latest 50 across all hosts · {txns.length} loaded
                    </p>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6 overflow-x-auto">
                  {txns.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No transactions yet.</p>
                  ) : (
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-primary-200 text-left text-muted-foreground">
                          <th className="py-2 pr-2">ID</th>
                          <th className="py-2 pr-2">Host</th>
                          <th className="py-2 pr-2">Service</th>
                          <th className="py-2 pr-2">Face</th>
                          <th className="py-2 pr-2">Host due</th>
                          <th className="py-2 pr-2">Status</th>
                          <th className="py-2 pr-2">Created</th>
                          <th className="py-2 pr-2"> </th>
                        </tr>
                      </thead>
                      <tbody>
                        {txns.map((t) => (
                          <tr key={t.id} className="border-b border-primary-100 hover:bg-primary-50/30">
                            <td className="py-2 pr-2 font-mono text-xs">{t.id}</td>
                            <td className="py-2 pr-2">
                              <div className="font-medium text-primary-800">
                                {t.host_name || `User ${t.host_user_id}`}
                              </div>
                              {t.host_email && (
                                <div className="text-xs text-muted-foreground">{t.host_email}</div>
                              )}
                            </td>
                            <td className="py-2 pr-2 font-mono text-xs">{txnServiceLabel(t.wallet_service_name)}</td>
                            <td className="py-2 pr-2">{formatNprFromPaisa(t.face_value_paisa)}</td>
                            <td className="py-2 pr-2">{formatNprFromPaisa(t.host_due_paisa)}</td>
                            <td className="py-2 pr-2">
                              <Badge variant="outline" className="font-normal capitalize">
                                {t.status.replace(/_/g, ' ')}
                              </Badge>
                            </td>
                            <td className="py-2 pr-2 text-xs text-muted-foreground">
                              {formatDateOnly(String(t.created_at))}
                            </td>
                            <td className="py-2 pr-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={recheckingId === t.id}
                                onClick={() => {
                                  setRecheckingId(t.id);
                                  api
                                    .post(`/api/admin/wallet-utilities/transactions/${t.id}/recheck-status`)
                                    .then(() => {
                                      toast({ title: 'Status rechecked.' });
                                      return api
                                        .get<{ transactions: UtilTxn[] }>(
                                          '/api/admin/wallet-utilities/transactions?page=1&limit=50'
                                        )
                                        .then((r) => setTxns(r.data.transactions ?? []));
                                    })
                                    .catch((err) =>
                                      toast({
                                        title: err.response?.data?.message || 'Recheck failed.',
                                        variant: 'destructive',
                                      })
                                    )
                                    .finally(() => setRecheckingId(null));
                                }}
                              >
                                {recheckingId === t.id ? '…' : 'Recheck'}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        </>
      )}
    </div>
  );
}
