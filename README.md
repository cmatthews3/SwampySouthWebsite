# Swampy South Labs landing

A single page Astro site for swampysouth.com. Server-rendered, deployed to Railway, email signup posts to Buttondown.

## Stack

- Astro 4 with TypeScript
- Tailwind CSS
- `@astrojs/node` in standalone mode (real server, not static)
- Fraunces + Inter (Google Fonts)

## Local development

```bash
npm install
cp .env.example .env   # fill in BUTTONDOWN_API_KEY
npm run dev            # http://localhost:4321
```

The dev server reads `.env` automatically. Without `BUTTONDOWN_API_KEY` the form will still render, but `POST /api/subscribe` will return a 500.

## Build and run locally

```bash
npm run build
npm start              # serves dist/server/entry.mjs
```

`npm start` runs `node ./dist/server/entry.mjs`. The Astro node adapter reads `HOST` and `PORT` from the environment.

## Deploy to Railway

1. Push the repo to GitHub (or use `railway up`).
2. Create a new Railway service from the repo. Railway will detect Node automatically.
3. In the Railway service settings:
   - **Build command:** `npm run build`
   - **Start command:** `npm start`
   - **Watch paths:** default is fine.
4. Set the following environment variables in the Railway dashboard:

   | Name | Value | Notes |
   |---|---|---|
   | `BUTTONDOWN_API_KEY` | (your key) | From buttondown.com -> Settings -> API |
   | `HOST` | `0.0.0.0` | Required so the container accepts external traffic |
   | `NODE_ENV` | `production` | Optional but recommended |

   You do **not** need to set `PORT`. Railway injects it automatically and the Astro node adapter picks it up.

5. Add a public domain in Railway (`Settings -> Networking -> Generate Domain` or add a custom domain).

That's it. After the first build, every push to the linked branch redeploys.

### Why `output: 'server'` and not a static build

`src/pages/api/subscribe.ts` runs server-side so the Buttondown API key never reaches the browser. That requires SSR, which is why we use `@astrojs/node` in `standalone` mode.

## Buttondown setup

1. Sign up at https://buttondown.com.
2. `Settings -> API -> API key`. Copy it.
3. Set it as `BUTTONDOWN_API_KEY` locally (in `.env`) and on Railway.

The form posts JSON `{ "email": "..." }` to `/api/subscribe`. The server-side handler calls `POST https://api.buttondown.email/v1/subscribers` with the `Authorization: Token <key>` header. Already-subscribed emails are treated as success.

## Project layout

```
src/
  components/        Hero, About, Products, EmailSignup, Footer, Logomark
  layouts/Layout.astro
  pages/
    index.astro
    api/subscribe.ts
  styles/global.css
public/favicon.svg
astro.config.mjs
tailwind.config.mjs
```

## Placeholders to fill in

Things I guessed or stubbed that you should review:

- **`BUTTONDOWN_API_KEY`**. Not committed. Set in `.env` locally and in Railway env vars.
- **Site domain in `Layout.astro`**. `Astro.site` falls back to `https://swampysouth.com` for the canonical URL. If the real domain is different, set it in `astro.config.mjs` via `site: 'https://yourdomain.com'`.
- **Open Graph image**. None included. If you want one, add `public/og.png` (1200x630) and a `<meta property="og:image">` tag in `Layout.astro`.
- **Launch timing copy**. The subhead says "The site lands later this year." Adjust if you want a specific month or a vaguer phrasing.
- **Footer copy**. `Support the work` links to `https://chris-matthews.me/support`. Change the link text if you want it more or less prominent.
- **Favicon**. A stand-in based on the logomark. Replace `public/favicon.svg` with a final asset when ready.

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
