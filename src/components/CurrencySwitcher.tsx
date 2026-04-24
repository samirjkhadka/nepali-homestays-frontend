import { useCurrency } from '@/lib/currency';
import type { CurrencyCode } from '@/lib/currency';

const CURRENCIES: CurrencyCode[] = ['NPR', 'USD', 'INR', 'GBP', 'EUR', 'AUD'];

export function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();
  return (
    <select
      value={currency}
      onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
      className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      aria-label="Currency"
    >
      {CURRENCIES.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}
