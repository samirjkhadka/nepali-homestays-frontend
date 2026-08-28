import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || '').trim();
const useApiV1 = import.meta.env.VITE_API_USE_V1 === 'true';
const CSRF_COOKIE = 'nh_csrf';
const CSRF_HEADER = 'X-CSRF-Token';

export function apiPath(p: string): string {
  if (!useApiV1) return p;
  if (p.startsWith('/api/') && !p.startsWith('/api/v1/')) return `/api/v1/${p.slice(5)}`;
  return p;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export const api = axios.create({
  baseURL: API_URL || undefined,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

let refreshPromise: Promise<void> | null = null;

async function tryRefreshSession(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = api
      .post('/api/auth/refresh')
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null;
      });
  }
  await refreshPromise;
}

api.interceptors.request.use((config) => {
  if (typeof config.url === 'string' && config.url) config.url = apiPath(config.url);
  const method = (config.method ?? 'get').toUpperCase();
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrf = getCookie(CSRF_COOKIE);
    if (csrf) config.headers[CSRF_HEADER] = csrf;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 403 && err.response?.data?.code === 'MUST_CHANGE_PASSWORD') {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/profile/change-password')) {
        window.location.href = '/profile/change-password';
      }
    }
    if (err.response?.status === 401 && original && !original._retry) {
      const requestUrl = original.url ?? '';
      const isAuthRequest = /\/api\/(?:v1\/)?auth\//.test(requestUrl);
      if (!isAuthRequest) {
        original._retry = true;
        try {
          await tryRefreshSession();
          return api(original);
        } catch {
          if (typeof window !== 'undefined') window.location.href = '/login';
        }
      }
    }
    return Promise.reject(err);
  }
);

function devLocalApiOrigin(): string | undefined {
  if (typeof window === 'undefined' || !import.meta.env.DEV) return undefined;
  if (import.meta.env.VITE_DEV_NEWS_USE_REMOTE_API === 'true') return undefined;
  return window.location.origin;
}

export async function fetchNewsFeed<T = { items: unknown[]; source?: string }>(): Promise<T> {
  const o = devLocalApiOrigin();
  const res = await api.get<T>('/api/news/feed', o ? { baseURL: o } : {});
  return res.data;
}

export async function fetchPartnersSettings<T = Record<string, unknown>>(): Promise<T> {
  const o = devLocalApiOrigin();
  const res = await api.get<T>('/api/settings/partners', o ? { baseURL: o } : {});
  return res.data;
}

export async function fetchFestivalsSettings<T = Record<string, unknown>>(): Promise<T> {
  const o = devLocalApiOrigin();
  const res = await api.get<T>('/api/settings/festivals', o ? { baseURL: o } : {});
  return res.data;
}

export async function fetchTripPlannerSettings<T = Record<string, unknown>>(): Promise<T> {
  const o = devLocalApiOrigin();
  const res = await api.get<T>('/api/settings/trip-planner', o ? { baseURL: o } : {});
  return res.data;
}

export async function fetchHomeContentSettings<T = Record<string, unknown>>(): Promise<T> {
  const res = await api.get<T>('/api/settings/home-content');
  return res.data;
}

export async function fetchMarketingPageSettings<T = Record<string, unknown>>(
  page: 'team' | 'careers' | 'press' | 'packages' | 'destinations' | 'experiences'
): Promise<T> {
  const res = await api.get<T>(`/api/settings/${page}`);
  return res.data;
}

export async function fetchImpactStats<T = Record<string, unknown>>(): Promise<T> {
  const res = await api.get<T>('/api/stats/impact');
  return res.data;
}
