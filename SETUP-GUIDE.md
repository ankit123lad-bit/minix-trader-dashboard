# MINIX Trader Web App — Setup Guide

## 1. Test on your laptop
Do not double-click dashboard.html because browser security may block JSON loading.

Windows easy method:
1. Extract this ZIP.
2. Open the folder in VS Code.
3. Install the “Live Server” extension.
4. Right-click `index.html` → **Open with Live Server**.
5. Open Dashboard. Demo login: `admin` / `Minix@123`.

## 2. Upload a new CSV in demo mode
1. Open **Admin CSV Upload**.
2. Select the Traders CSV.
3. Click **Preview CSV**.
4. Click **Save for Dashboard on This Device**.
5. Open Dashboard.

Local mode only updates the same browser/device. For all mobiles and laptops, complete Supabase setup.

## 3. Supabase cloud setup
1. Create a Supabase project.
2. Open SQL Editor.
3. Copy and run `supabase/schema.sql`.
4. Open Project Settings → API.
5. Copy Project URL and anon public key.
6. Open `config.js` and replace `YOUR_SUPABASE_URL` and `YOUR_SUPABASE_ANON_KEY`.
7. Open Admin CSV Upload and use **Upload to Supabase Cloud**.

Important: The included SQL policies are demo policies. Before real confidential company use, configure Supabase Authentication and Admin-only write policies.

## 4. Make it live on Vercel
1. Create a GitHub repository.
2. Upload all extracted files and folders.
3. Sign in to Vercel with GitHub.
4. Click Add New → Project.
5. Import the repository.
6. Framework Preset: Other.
7. Click Deploy.
8. Vercel gives a URL that works on mobile and laptop.

## 5. Mobile app-style install
Android Chrome: Menu → Add to Home screen.
iPhone Safari: Share → Add to Home Screen.

## Current package contents
- Existing full dashboard preserved
- 1,454 sample CSV records bundled
- Automatic data loading
- Admin CSV preview/upload page
- Local device mode
- Supabase cloud-ready mode
- PWA files
- Vercel deployment file


## Bundled data in this updated ZIP
- `data/Traders All Data.csv` — latest trader data (47 columns)
- `data/Nifty Banknifty.csv` — latest index data (12 columns)
- `data/traders.json` — auto-loaded trader dashboard data
- `data/nifty-banknifty.json` — auto-loaded Nifty / BankNifty dashboard data

Open the dashboard through Live Server or Vercel. Both datasets will load automatically.
