import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export type AdminTableColumn<T> = {
  key: string;
  label: string;
  sortable?: boolean;
  /** Return value to sort by; default is row[key] */
  sortValue?: (row: T) => string | number;
  render?: (row: T) => React.ReactNode;
  thClassName?: string;
  tdClassName?: string;
};

type AdminTableProps<T> = {
  data: T[];
  columns: AdminTableColumn<T>[];
  keyExtractor: (row: T) => string | number;
  pageSize?: number;
  emptyMessage?: string;
  /** If true, show all rows (no pagination) but keep sort and sticky header */
  noPagination?: boolean;
  /** Optional wrapper class for the scroll container (e.g. max-h for sticky to work) */
  containerClassName?: string;
};

export function AdminTable<T>({
  data,
  columns,
  keyExtractor,
  pageSize = 20,
  emptyMessage = 'No data.',
  noPagination = false,
  containerClassName = '',
}: AdminTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortable) return data;
    const getVal = col.sortValue ?? ((row: T) => (row as Record<string, unknown>)[sortKey] as string | number);
    return [...data].sort((a, b) => {
      const va = getVal(a);
      const vb = getVal(b);
      const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va ?? '').localeCompare(String(vb ?? ''));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir, columns]);

  const totalPages = noPagination ? 1 : Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = noPagination ? sortedData : sortedData.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (key: string) => {
    const col = columns.find((c) => c.key === key);
    if (!col?.sortable) return;
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  if (data.length === 0) {
    return <p className="p-8 text-center text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className={`overflow-x-auto ${containerClassName}`}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-primary-200 bg-primary-50/50 sticky top-0 z-10 shadow-sm">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`p-3 text-left text-sm font-medium text-primary-800 ${col.thClassName ?? ''} ${col.sortable ? 'cursor-pointer select-none hover:bg-primary-100/80' : ''}`}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {col.sortable && (
                    sortKey === col.key ? (
                      sortDir === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                    )
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((row) => (
            <tr key={keyExtractor(row)} className="border-b border-primary-100">
              {columns.map((col) => (
                <td key={col.key} className={`p-3 text-sm ${col.tdClassName ?? ''}`}>
                  {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!noPagination && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-primary-200 px-4 py-2 bg-background">
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({sortedData.length} total)
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
