/**
 * Resolve listing/host image URL for display (img src).
 * When VITE_API_URL is set (e.g. UAT/prod with API on another host), images are
 * loaded from the API origin. Otherwise uses same origin (dev proxy or same-host).
 */
export function getImageDisplayUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const apiBase = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
  if (apiBase) return apiBase + path;
  if (typeof window !== 'undefined') return window.location.origin + path;
  return path;
}
