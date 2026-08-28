const DEFAULT_ALLOWED_HOST_SUFFIXES = [
  'himalpay.com.np',
  'nepalpayment.com',
  'stripe.com',
  'localhost',
  '127.0.0.1',
];

function extraHostsFromEnv(): string[] {
  const raw = (import.meta.env.VITE_PAYMENT_ALLOWED_HOSTS || '').trim();
  if (!raw) return [];
  return raw.split(',').map((h: string) => h.trim()).filter(Boolean);
}

export function isAllowedPaymentUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
    if (u.protocol === 'http:' && u.hostname !== 'localhost' && u.hostname !== '127.0.0.1') return false;
    const hosts = [...DEFAULT_ALLOWED_HOST_SUFFIXES, ...extraHostsFromEnv()];
    return hosts.some((h) => u.hostname === h || u.hostname.endsWith('.' + h));
  } catch {
    return false;
  }
}

export function openPaymentUrl(url: string): void {
  if (!isAllowedPaymentUrl(url)) {
    throw new Error('Payment URL is not allowed');
  }
  window.location.href = url;
}

export function submitPaymentForm(form: { action: string; method: string; fields: Record<string, string> }): void {
  if (!isAllowedPaymentUrl(form.action)) {
    throw new Error('Payment form action is not allowed');
  }
  const el = document.createElement('form');
  el.method = form.method || 'POST';
  el.action = form.action;
  el.enctype = 'multipart/form-data';
  Object.entries(form.fields).forEach(([name, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = String(value);
    el.appendChild(input);
  });
  document.body.appendChild(el);
  el.submit();
}
