/** Format a Date to YYYY-MM-DD (local date string). */
export function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse YYYY-MM-DD string to Date at noon local to avoid TZ edge cases. */
export function parseYMD(s: string): Date {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(NaN);
  return new Date(s + 'T12:00:00');
}

/** Start of today in local time (00:00:00). */
export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
