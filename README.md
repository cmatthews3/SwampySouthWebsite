# Swampy South Labs landing

A single-page Astro site for swampysouthlabs.com. Server-rendered, deployed to Railway. The email signup writes to a CSV on disk; download it later with an authenticated endpoint.

## Stack

- Astro 4 with TypeScript
- Tailwind CSS
- `@astrojs/node` in standalone mode (real server, not static)
- Fraunces + Inter (Google Fonts)

## Local development

```bash
npm install
cp .env.example .env   # fill in SUBSCRIBERS_DOWNLOAD_TOKEN
npm run dev            # http://localhost:4321
```

The dev server reads `.env` automatically. By default subscribers are written to `./data/subscribers.csv`. That directory is gitignored.

## Build and run locally

```bash
npm run build
npm start              # serves dist/server/entry.mjs
```

`npm start` runs `node ./dist/server/entry.mjs`. The Astro node adapter reads `HOST` and `PORT` from the environment.

## How signups are stored

`POST /api/subscribe` appends a row to a CSV at `$SUBSCRIBERS_FILE` (default `./data/subscribers.csv`). Two columns: `timestamp,email`. Duplicate emails are silently ignored. The file and its parent directory are created on demand.

No third-party email service. No data ever leaves the server.

### Pulling the list

Set `SUBSCRIBERS_DOWNLOAD_TOKEN` to any long random string, then hit:

```
GET https://yourdomain.com/api/subscribers.csv?token=<the-token>
```

The route returns the full CSV as a download. The token can also be passed via the `x-subscribers-token` header. If the env var is unset, the endpoint returns 503 (disabled).

Suggested way to generate a token:

```bash
openssl rand -hex 32
```

You can also pull the file directly from the Railway volume via `railway run cat /data/subscribers.csv` or the Railway dashboard's volume browser if you'd rather skip the HTTP route.

## Deploy to Railway

1. Push the repo to GitHub (or use `railway up`).
2. Create a new Railway service from the repo. Railway will detect Node automatically.
3. In the Railway service settings:
   - **Build command:** `npm run build`
   - **Start command:** `npm start`
4. **Attach a volume** so the subscribers file survives deploys:
   - Service settings -> Volumes -> Create volume.
   - Mount path: `/data`.
5. Set the following environment variables in the Railway dashboard:

   | Name | Value | Notes |
   |---|---|---|
   | `SUBSCRIBERS_FILE` | `/data/subscribers.csv` | Path inside the mounted volume |
   | `SUBSCRIBERS_DOWNLOAD_TOKEN` | (long random string) | Generate with `openssl rand -hex 32` |
   | `UMAMI_SCRIPT_URL` | `https://your-umami-host/script.js` | Full URL to your self-hosted Umami `script.js` |
   | `UMAMI_WEBSITE_ID` | (your website UUID) | From the Umami admin panel |
   | `HOST` | `0.0.0.0` | Required so the container accepts external traffic |
   | `NODE_ENV` | `production` | Optional but recommended |

   You do **not** need to set `PORT`. Railway injects it automatically and the Astro node adapter picks it up.

6. Add a public domain in Railway (`Settings -> Networking -> Generate Domain` or add a custom domain).

That's it. After the first build, every push to the linked branch redeploys. The volume persists across deploys.

### Why `output: 'server'` and not a static build

`src/pages/api/subscribe.ts` runs server-side so it can write to disk. The CSV download route needs to read from disk too. Both require SSR, which is why we use `@astrojs/node` in `standalone` mode.

## Project layout

```
src/
  components/        Hero, About, Products, EmailSignup, Footer, Logomark
  layouts/Layout.astro
  pages/
    index.astro
    api/
      subscribe.ts          POST: append to CSV
      subscribers.csv.ts    GET:  download CSV (token-gated)
  styles/global.css
public/favicon.svg
astro.config.mjs
tailwind.config.mjs
```

## Placeholders to fill in

Things to review:

- **`SUBSCRIBERS_DOWNLOAD_TOKEN`**. Pick a long random string. Set in `.env` locally and in Railway env vars.
- **Railway Volume**. Required in production so the CSV isn't wiped on every deploy.
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
