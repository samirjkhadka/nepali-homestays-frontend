# Nepali Homestays — Frontend

React 18 + Vite + TypeScript frontend for the Nepali Homestays marketplace. Tailwind CSS and Radix-style UI components.

## Prerequisites

- **Node.js** 20+
- **Backend API** running (see [nepali-homestays-backend](https://github.com/your-org/nepali-homestays-backend) or your backend repo)

## Quick start

```bash
npm install
npm run dev
```

App runs at **http://localhost:5173**. In development, Vite proxies `/api` and `/images` to the backend (default `http://localhost:3000`).

## Environment

Optional: create `.env` from `.env.example`:

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | API origin (scheme + host, no path). Leave **empty** in dev to use the Vite proxy; set for production (e.g. `https://testcms.dghub.io`) so the browser calls that host. |
| `VITE_API_USE_V1` | Set to `true` when the server exposes versioned routes at `/api/v1/...` (not `/api/...`); the client maps paths accordingly. |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key for payments |
| `VITE_DEV_API_PROXY` / `VITE_DEV_IMAGES_PROXY` | Dev-only: proxy targets for `/api` and `/images` (default local backend). |
| `VITE_DEV_NEWS_USE_REMOTE_API` | Dev-only: if `true`, news/settings fetches use `VITE_API_URL` instead of the dev proxy. See `src/lib/api.ts`. |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Vite) |
| `npm run build` | TypeScript check + production build to `dist/` |
| `npm run preview` | Serve production build locally |

## Project structure

- `src/` — App code: `App.tsx`, `main.tsx`, `pages/`, `components/`, `lib/`
- `assets/` — Static images (hero, logo)
- `public/` — Favicon and static files

## Features

- **Auth:** Login, signup, email OTP verify, forgot password (OTP → set new password)
- **Listings:** Search, filters, listing detail, map
- **Bookings:** Guest booking flow, payment (Stripe/NPX)
- **Host:** Dashboard, create/edit listings
- **Admin:** Dashboard, moderate listings, view bookings and payments
- **Currency:** NPR default, optional USD/INR/GBP/EUR/AUD

## Backend integration

Point the app at your backend by either:

- **Development:** Run backend on `http://localhost:3000`; Vite proxy handles `/api` and `/images`.
- **Production:** Set `VITE_API_URL` to the API origin and `VITE_API_USE_V1=true` if routes live under `/api/v1/...` (e.g. `https://testcms.dghub.io`).

## Verification (new API host)

After a deploy, smoke-check: `POST` login (expect `/api/v1/auth/...` on the wire), a public `GET` (e.g. listings or CMS), and an image that uses the API host for a relative path. The API must allow your site origin in **CORS** and, if you rely on cookies, support **credentials** with the axios client (`src/lib/api.ts` uses `withCredentials: true`).

## Pushing to GitHub

This repo is intended as a **standalone** repository (frontend only). To push to a new GitHub repo:

```bash
git init
git add .
git commit -m "Initial commit: Nepali Homestays frontend"
git branch -M main
git remote add origin https://github.com/YOUR_ORG/nepali-homestays-frontend.git
git push -u origin main
```

Replace `YOUR_ORG` and repo name with your GitHub org/user and repository. Create the repository on GitHub first (empty, no README).

## License

Private — Nepali Homestays project.
