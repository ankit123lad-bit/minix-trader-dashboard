# Minix Trader Dashboard V3 Enterprise – Final Live Setup

## Completed
- Supabase database tables
- Secure Admin login
- Daily Trader entry
- Daily Nifty / BankNifty entry
- Optional one-time CSV bulk import
- Dashboard auto refresh from Supabase
- Built-in historical JSON fallback

## One-time setup
1. In Supabase SQL Editor, run `supabase/database-schema.sql` once.
2. Authentication > Users: create the admin user.
3. Insert/update the user in `public.profiles` with role `admin`.
4. Put Project URL and Publishable Key in `config.js`. Never put a Secret/Service Role key in the browser project.
5. Upload/replace all project files in GitHub and commit. Vercel deploys automatically.
6. Hard refresh the website once (Ctrl+Shift+R) or clear site cache because the service worker was updated.

## Daily use
Open `/admin/` > Login > Add Entry > Save. The dashboard refreshes automatically based on `autoRefreshSeconds` in `config.js`. No daily CSV upload or GitHub/Vercel update is required.

## URLs
- Dashboard: `/dashboard.html`
- Admin: `/admin/`
