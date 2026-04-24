/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string;
  /** If `true`, dev uses `VITE_API_URL` for the public news feed (default: same-origin / Vite proxy). */
  readonly VITE_DEV_NEWS_USE_REMOTE_API: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
