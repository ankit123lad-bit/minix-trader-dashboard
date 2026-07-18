# Minix Trader Dashboard V3 – Setup Guide

## 1. Supabase
1. Open your Supabase project.
2. Go to **SQL Editor**.
3. Run `supabase/database-schema.sql`.
4. Go to **Authentication → Users → Add user** and create the first admin email/password.
5. Copy that user's UUID.
6. Run this SQL:

```sql
insert into public.profiles(id, full_name, role)
values ('PASTE_USER_UUID','Administrator','admin');
```

## 2. Configure project
Open `config.js` and replace:

```js
supabaseUrl: 'YOUR_SUPABASE_URL',
supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY'
```

Find both values in Supabase **Project Settings → API**.

## 3. Deploy update
Upload/replace all project files in the same GitHub repository and commit. Vercel deploys automatically.

## 4. Daily use
- Admin: `https://YOUR-DOMAIN/admin/`
- Dashboard: `https://YOUR-DOMAIN/dashboard.html`
- Add one daily entry and press Save.
- All users see it automatically after refresh (default 60 seconds).

## 5. Existing historical data
Your current historical JSON/CSV remains bundled. For cloud-only history, use the existing CSV bulk upload page once or import rows through Supabase.

## Security note
The schema permits public read so link holders can view the dashboard. Add Supabase Auth to the dashboard itself before using highly confidential data outside a controlled audience.
