import axios from 'axios';

// Empty or unset = use same origin so Vite proxy (dev) or same host (prod) is used. No leading/trailing space.
const API_URL = (import.meta.env.VITE_API_URL || '').trim();

export const api = axios.create({
  baseURL: API_URL || undefined,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const requestUrl = err.config?.url ?? '';
      const isAuthRequest = /\/api\/auth\//.test(requestUrl);
      if (!isAuthRequest) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

/** In dev, use page origin so `/api` hits the Vite proxy unless `VITE_DEV_NEWS_USE_REMOTE_API=true`. */
function devLocalApiOrigin(): string | undefined {
  if (typeof window === 'undefined' || !import.meta.env.DEV) return undefined;
  if (import.meta.env.VITE_DEV_NEWS_USE_REMOTE_API === 'true') return undefined;
  return window.location.origin;
}

/**
 * Public `GET /api/news/feed`.
 * In dev, forces `baseURL` to `window.location.origin` so requests hit the Vite dev server
 * and its `/api` proxy (local backend with `imageUrl`). The axios instance may still have
 * `VITE_API_URL` set, which would otherwise bypass the proxy.
 * Set `VITE_DEV_NEWS_USE_REMOTE_API=true` to use the instance `baseURL` in dev.
 */
export async function fetchNewsFeed<T = { items: unknown[]; source?: string }>(): Promise<T> {
  const o = devLocalApiOrigin();
  const res = await api.get<T>('/api/news/feed', o ? { baseURL: o } : {});
  return res.data;
}

/** Public `GET /api/settings/partners` — homepage partner grid (admin-configured). */
export async function fetchPartnersSettings<T = Record<string, unknown>>(): Promise<T> {
  const o = devLocalApiOrigin();
  const res = await api.get<T>('/api/settings/partners', o ? { baseURL: o } : {});
  return res.data;
}

/** Public `GET /api/settings/festivals` — festivals page content (admin-configured). */
export async function fetchFestivalsSettings<T = Record<string, unknown>>(): Promise<T> {
  const o = devLocalApiOrigin();
  const res = await api.get<T>('/api/settings/festivals', o ? { baseURL: o } : {});
  return res.data;
}

/** Public `GET /api/settings/trip-planner` — trip planner page content (admin-configured). */
export async function fetchTripPlannerSettings<T = Record<string, unknown>>(): Promise<T> {
  const o = devLocalApiOrigin();
  const res = await api.get<T>('/api/settings/trip-planner', o ? { baseURL: o } : {});
  return res.data;
}
