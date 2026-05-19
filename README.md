# Swampy South Labs landing

A single-page Astro site for swampysouthlabs.com. Server-rendered, deployed to Railway. The email signup writes each address to a Google Sheet via the Sheets API.

## Stack

- Astro 4 with TypeScript
- Tailwind CSS
- `@astrojs/node` in standalone mode (real server, not static)
- `google-auth-library` for service-account auth, raw `fetch` for the Sheets REST API
- Fraunces + Inter (Google Fonts)

## Local development

```bash
npm install
cp .env.example .env   # fill in GOOGLE_SHEETS_ID and GOOGLE_SERVICE_ACCOUNT_JSON
npm run dev            # http://localhost:4321
```

The dev server reads `.env` automatically. Without the Google env vars set, the form will render fine but `POST /api/subscribe` returns a 500 (with the email logged to stderr so you can recover it).

## Build and run locally

```bash
npm run build
npm start              # serves dist/server/entry.mjs
```

`npm start` runs `node ./dist/server/entry.mjs`. The Astro node adapter reads `HOST` and `PORT` from the environment.

## How signups are stored

`POST /api/subscribe` validates the email, then calls the Google Sheets API:

1. **Read** column B of the `Subscribers` tab to build a set of existing emails (case-insensitive).
2. If the email is new, **append** a row `[<ISO timestamp>, <email>]` to the bottom of the `Subscribers` tab.
3. Duplicates are silently treated as success.

No third-party email service. The data lives in your Google Sheet.

If anything in step 1 or 2 throws (network error, quota, auth failure), the email is logged to stderr alongside the error so you can recover it from Railway logs.

## Google setup (one-time)

You need a Google Cloud service account that can write to your sheet.

### 1. Create the sheet

1. New Google Sheet at https://sheets.google.com.
2. Rename the first tab to `Subscribers` (exact, case-sensitive).
3. Optional: put `timestamp` in A1 and `email` in B1 as headers. Data is appended after the last filled row, so headers won't interfere.
4. Copy the Sheet ID from the URL: `https://docs.google.com/spreadsheets/d/<this-part>/edit`.

### 2. Create the service account

1. Go to https://console.cloud.google.com.
2. Create a new project (or pick an existing one).
3. Enable the **Google Sheets API**: APIs & Services -> Library -> search "Google Sheets API" -> Enable.
4. APIs & Services -> Credentials -> Create Credentials -> **Service account**.
5. Give it a name like `swampy-south-signups`. Skip the optional role grants. Done.
6. Click into the new service account -> Keys tab -> Add Key -> Create new key -> JSON. A JSON file downloads.

### 3. Share the sheet with the service account

1. Open the JSON file. Find the `client_email` field. It looks like `swampy-south-signups@your-project.iam.gserviceaccount.com`.
2. In the Google Sheet, click Share, paste that email, give it **Editor** access. Uncheck "Notify people" since the service account doesn't have an inbox.

### 4. Set env vars

| Name | Value |
|---|---|
| `GOOGLE_SHEETS_ID` | The ID from the sheet URL |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | The full contents of the JSON file you downloaded |

For `GOOGLE_SERVICE_ACCOUNT_JSON`, paste the file contents as-is. Railway accepts multi-line values. The `\n` escape sequences inside the `private_key` field will survive `JSON.parse` and become real newlines for the PEM parser.

## Deploy to Railway

1. Push the repo to GitHub (or use `railway up`).
2. Create a new Railway service from the repo. Railway will detect Node automatically.
3. In the Railway service settings:
   - **Build command:** `npm run build`
   - **Start command:** `npm start`
4. Set the following environment variables in the Railway dashboard:

   | Name | Value | Notes |
   |---|---|---|
   | `GOOGLE_SHEETS_ID` | (your sheet ID) | From the sheet URL |
   | `GOOGLE_SERVICE_ACCOUNT_JSON` | (paste the JSON) | The full service account key file contents |
   | `HOST` | `0.0.0.0` | Required so the container accepts external traffic |
   | `NODE_ENV` | `production` | Optional but recommended |

   You do **not** need to set `PORT`. Railway injects it automatically and the Astro node adapter picks it up.

5. Add a public domain in Railway (`Settings -> Networking -> Generate Domain` or add a custom domain).

That's it. Every push to the linked branch redeploys.

### Why `output: 'server'` and not a static build

`src/pages/api/subscribe.ts` calls the Google Sheets API server-side so the service account key never reaches the browser. That requires SSR, which is why we use `@astrojs/node` in `standalone` mode.

## Project layout

```
src/
  components/        Hero, About, Products, EmailSignup, Footer, Logomark
  layouts/Layout.astro
  pages/
    index.astro
    api/subscribe.ts     POST: validate + append to Google Sheet
  styles/global.css
public/favicon.svg
astro.config.mjs
tailwind.config.mjs
```

## Placeholders to fill in

Things to review:

- **Google Sheet, service account, env vars** (see "Google setup" above). The form returns 500 until these are in place.
- **Site domain**. Set to `https://swampysouthlabs.com` in `astro.config.mjs` and as the fallback in `src/layouts/Layout.astro`. Change both if the domain ever moves.
- **Open Graph image**. None included. If you want one, add `public/og.png` (1200x630) and a `<meta property="og:image">` tag in `Layout.astro`.
- **Launch timing copy**. The subhead says "More soon." Adjust if you want a specific month or different phrasing.
- **Favicon**. A stand-in based on the (now-hidden) logomark. Replace `public/favicon.svg` with a final asset when ready.

### Unused stubs

`src/components/About.astro` and `src/components/Products.astro` are not currently imported anywhere. They contain drafted copy for the eventual full launch (studio about + three product blurbs). Wire them back into `src/pages/index.astro` when you're ready to flesh the page out, or delete them if you'd rather start fresh.

## Lighthouse

Run after `npm run build && npm start`:

```bash
npx lighthouse http://localhost:4321 --preset=desktop --view
npx lighthouse http://localhost:4321 --form-factor=mobile --view
```

The page is plain HTML + Tailwind + a tiny inline script for the form. Fonts load from Google Fonts with preconnect. Should sit comfortably above 95 on mobile.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Astro dev server on `localhost:4321` |
| `npm run build` | Builds to `dist/` (client + server) |
| `npm start` | Runs the built server (`node ./dist/server/entry.mjs`) |
| `npm run preview` | Astro's preview of the built site |
