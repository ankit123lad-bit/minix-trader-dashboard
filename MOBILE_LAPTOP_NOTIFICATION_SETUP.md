# Minix Mobile + Laptop Notification Setup

## Files to deploy

Keep these names in the same Vercel/GitHub project folder:

- `dashboard.html`
- `admin.html`
- `index.html`
- `config.js`
- `service-worker.js`
- `manifest.json`
- `vercel.json`

## 1. Run database SQL

Open Supabase → SQL Editor → New Query. Paste and run the complete contents of `minix_push_notification_setup.sql`.

## 2. Generate VAPID keys (one time — no npm required)

Open `vapid-key-generator.html` in Chrome or Edge and press **Generate New Keys**. It returns `publicKey` and `privateKey` locally in the browser.

- Paste only `publicKey` in `config.js` at `vapidPublicKey`.
- Never put `privateKey` in GitHub, HTML, JavaScript or `config.js`.

## 3. Deploy the Supabase Edge Function

The function is in `supabase/functions/send-daily-reports/index.ts`.

Using Supabase CLI:

```bash
supabase functions deploy send-daily-reports --no-verify-jwt
```

If deploying from the Supabase Dashboard, turn **Verify JWT / Enforce JWT verification OFF** for this function. The function validates the private `x-cron-secret` for scheduled calls and validates the Admin access token for manual resend.

Set these Edge Function secrets in Supabase Dashboard:

- `VAPID_PUBLIC_KEY` = generated public key
- `VAPID_PRIVATE_KEY` = generated private key
- `VAPID_SUBJECT` = `mailto:your-admin-email@example.com`
- `PUSH_CRON_SECRET` = a long private random password
- `DASHBOARD_URL` = full deployed dashboard URL, for example `https://your-site.vercel.app/dashboard.html`

Supabase automatically provides `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to the function.

## 4. Create schedules

In Supabase Dashboard → Integrations → Cron, create three HTTP POST jobs for:

- 10:30 UTC — 4:00 PM IST
- 10:45 UTC — 4:15 PM IST reminder
- 11:00 UTC — 4:30 PM IST reminder

URL:

`https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-daily-reports`

Headers:

- `Content-Type: application/json`
- `x-cron-secret: SAME_PUSH_CRON_SECRET`

Body:

```json
{"mode":"scheduled"}
```

## 5. Deploy web files

Replace the old files in GitHub/Vercel, deploy, and press `Ctrl + F5` once.

Push notifications require HTTPS. They will work on the Vercel URL, not a normal `file:///D:/...` local file.

## 6. Enable each device once

On every mobile and laptop:

1. Open the deployed dashboard URL.
2. Login with that user's dashboard username/password.
3. Press `Enable Notifications`.
4. Press browser `Allow`.
5. Press `Test` and confirm the test notification arrives.

For iPhone/iPad: Safari → Share → Add to Home Screen → open the installed app → Enable Notifications.

## Admin controls

Admin page → `Push Notification Centre` provides:

- Enabled mobile/laptop device list
- Notification sent/failed history
- Resend to one selected user
- Resend to all active devices

The report contains Total Margin, Margin Utilized, F&O/Cash/MCX Gross and Charges, Total Gross, Total Charges and Total Net P&L.
