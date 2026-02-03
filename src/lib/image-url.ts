/**
 * Resolve listing/host image URL for display (img src).
 * Uses same origin so dev proxy (/images -> backend) and prod same-host work.
 */
export function getImageDisplayUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const path = url.startsWith('/') ? url : `/${url}`;
  if (typeof window !== 'undefined') return window.location.origin + path;
  return path;
}
