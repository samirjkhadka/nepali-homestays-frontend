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
| `VITE_API_URL` | Backend API base URL. Leave **empty** in dev to use Vite proxy; set in production (e.g. `https://api.example.com`) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key for payments |

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
- **Production:** Set `VITE_API_URL` to your API base URL (e.g. `https://api.yoursite.com`).

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
