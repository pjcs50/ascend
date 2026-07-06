# Deploying Ascend

Ascend is a static Vite PWA + Supabase backend. Hosting is free on Vercel or Netlify.

## Option A — Vercel (recommended)

1. Push this repo to GitHub (or run `vercel` from the CLI).
2. In Vercel: **New Project → import the repo.** It auto-detects Vite
   (build command `npm run build`, output `dist`).
3. **Add environment variables** (Project → Settings → Environment Variables):
   - `VITE_SUPABASE_URL` = `https://oufrcnicvodweyscnnbs.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = the `sb_publishable_…` key
4. Deploy. `vercel.json` already handles SPA routing so `/habits`, `/people`,
   etc. don't 404 on refresh.

## Option B — Netlify

1. **New site from Git** → pick the repo.
2. Build command `npm run build`, publish directory `dist`.
3. Add the same two env vars under Site settings → Environment.
4. `public/_redirects` already handles SPA routing.

## After deploy

- Add the Supabase project's deployed URL to **Authentication → URL Configuration**
  (Site URL + redirect URLs) if you later add email links. Not needed for
  password login, but good hygiene.
- Open the deployed HTTPS URL on your Pixel (Chrome → **Install app**), Mac
  (Chrome/Safari → install to dock), and iPad (Safari → Add to Home Screen).
- Sign in once per device — data syncs live via Supabase.
