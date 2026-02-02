import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import { api } from '@/lib/api';

export type CurrencyCode = 'NPR' | 'USD' | 'INR' | 'GBP' | 'EUR' | 'AUD';

type CurrencyRates = { base: string; rates: Record<string, number> };

const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  NPR: 'NPR',
  USD: 'USD',
  INR: 'INR',
  GBP: 'GBP',
  EUR: 'EUR',
  AUD: 'AUD',
};

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  NPR: 'रू',
  USD: '$',
  INR: '₹',
  GBP: '£',
  EUR: '€',
  AUD: 'A$',
};

type CurrencyContextValue = {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  rates: CurrencyRates | null;
  loading: boolean;
  /** Convert price (stored in NPR) to display amount in selected currency */
  convert: (priceNpr: number | string) => number;
  /** Format price (NPR) in selected currency with symbol */
  format: (priceNpr: number | string) => string;
  currencyLabel: (code: CurrencyCode) => string;
  currencySymbol: (code: CurrencyCode) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const STORAGE_KEY = 'nepali_homestays_currency';

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s && ['NPR', 'USD', 'INR', 'GBP', 'EUR', 'AUD'].includes(s)) return s as CurrencyCode;
    } catch {}
    return 'NPR';
  });
  const [rates, setRates] = useState<CurrencyRates | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<CurrencyRates>('/api/settings/currency')
      .then((res) => setRates(res.data))
      .catch(() => setRates({ base: 'NPR', rates: { USD: 0.0075, INR: 0.62, GBP: 0.0059, EUR: 0.0069, AUD: 0.0115 } }))
      .finally(() => setLoading(false));
  }, []);

  const setCurrency = (c: CurrencyCode) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(STORAGE_KEY, c);
    } catch {}
  };

  const convert = useMemo(() => {
    return function convert(priceNpr: number | string): number {
      const npr = typeof priceNpr === 'string' ? parseFloat(priceNpr) : priceNpr;
      if (Number.isNaN(npr)) return 0;
      if (currency === 'NPR') return npr;
      const r = rates?.rates?.[currency];
      if (r == null) return npr;
      return npr * r;
    };
  }, [currency, rates]);

  const format = useMemo(() => {
    return function format(priceNpr: number | string): string {
      const amount = convert(priceNpr);
      const sym = CURRENCY_SYMBOLS[currency];
      if (currency === 'NPR') return `${sym} ${Math.round(amount).toLocaleString()}`;
      return `${sym} ${amount.toFixed(2)}`;
    };
  }, [currency, convert]);

  const value: CurrencyContextValue = {
    currency,
    setCurrency,
    rates,
    loading,
    convert,
    format,
    currencyLabel: (code) => CURRENCY_LABELS[code] ?? code,
    currencySymbol: (code) => CURRENCY_SYMBOLS[code] ?? code,
  };

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}

export { CURRENCY_LABELS, CURRENCY_SYMBOLS };
