/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  /** When `true`, requests use `/api/v1/...` instead of `/api/...` (e.g. .NET v1 host). */
  readonly VITE_API_USE_V1: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string;
  /** If `true`, dev uses `VITE_API_URL` for the public news feed (default: same-origin / Vite proxy). */
  readonly VITE_DEV_NEWS_USE_REMOTE_API: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
