# Swampy South Labs Website

Marketing site for Swampy South Labs, an independent software studio in New Orleans. Server-rendered Astro site, deployed to Railway. The contact form on the landing page posts directly to Formspree; submissions land in the Formspree dashboard and the configured notification inbox. A separate newsletter signup endpoint also exists on the server but is no longer wired into a page.

This file is for whoever (human or Claude) picks the project up next. Read it before making changes so the voice and tech decisions stay coherent.

## Stack

- **Astro 4** with TypeScript and strict tsconfig.
- **Tailwind CSS** via `@astrojs/tailwind`. Base styles live in `src/styles/global.css`, which imports `src/styles/tokens.css` (design tokens as CSS custom properties). The integration is configured with `applyBaseStyles: false` so the layout owns the cascade. The landing-page components mostly use scoped Astro `<style>` blocks against the CSS variables rather than Tailwind utilities; Tailwind's reset and any future utility usage still work.
- **`@astrojs/node` in `standalone` mode** for SSR. `npm start` runs `node ./dist/server/entry.mjs`. The adapter reads `HOST` and `PORT` from the environment.
- **Fonts**: Rubik (display / headlines), Manrope (body / UI), JetBrains Mono (labels / mono UI). Loaded from Google Fonts with `preconnect` and `display=swap`.

### Why SSR instead of a static build

The legacy newsletter endpoint (`/api/subscribe`) appends to a CSV file on disk; `/api/subscribers.csv` reads from it under a token. That requires `output: 'server'` in `astro.config.mjs`, which is why the project uses `@astrojs/node` rather than a static-only output. If those endpoints get removed, the site can move back to a static build.

## Project layout

```
src/
  components/
    Nav.astro              sticky top nav with scroll-aware active state
    Hero.astro             moss-toned hero with headline + CTAs
    Products.astro         four product rows on moss-50 background
    Services.astro         three service pillars on bone background
    Contact.astro          contact form on cypress (moss-deep) background
    Footer.astro           bayou-dark footer
    About.astro            unused; drafted copy from the previous brief
    Logomark.astro         unused; old SVG mark
  layouts/Layout.astro
  pages/
    index.astro
    api/
      subscribe.ts                POST: validate + append to subscriber CSV (no longer surfaced on the page)
      subscribers.csv.ts          GET:  token-gated subscriber CSV download
  styles/
    global.css            Tailwind base + base resets; imports tokens.css
    tokens.css            design tokens as CSS custom properties
  env.d.ts
public/
  assets/
    mark.svg             gator/lab mark, used in the nav, hero watermark, and as the favicon
    logo-full.svg        full lockup (not currently referenced on the page)
.claude/launch.json      dev server config for the Claude Code preview
data/                    gitignored. Local subscribers.csv lives here in dev.
design_handoff_landing_page/   design brief the page was built from (kept for reference).
```

### Unused stubs

`About.astro` and `Logomark.astro` are leftovers from earlier iterations and are not imported anywhere. Wire them back in or delete them when the next change in this area lands.

## What the page is right now

Single-page marketing site, six sections, top to bottom:

1. **Nav** — sticky 64px bar. Brand lockup on the left, three section anchors in the center (Products / Services / Contact), a "Get in touch" CTA on the right. Active link is highlighted on scroll. On screens ≤ 900px, the center link list hides and only the brand and CTA remain.
2. **Hero** — full-bleed moss background, big two-line H1 ("Measured software / for the **work that matters.**"), two CTAs, a faint gator-mark watermark in the lower-right.
3. **Products** — four cards on a moss-tinted (`--moss-50`) background. Each card has a number, category eyebrow, title, body paragraph, status pill, and an optional external link. Content is defined inline in the `Products.astro` frontmatter.
4. **Services** — three pillars on the bone background. Titles only (no eyebrow tags). Content is defined inline in the `Services.astro` frontmatter.
5. **Contact** — full-bleed `--moss-deep` background. Left column is a short paragraph and a direct mailto. Right column is the contact form (name, email, note).
6. **Footer** — bayou-dark, brand lockup left, anchor list right, copyright row below.

The page mounts a shared scroll-reveal IntersectionObserver and smooth-anchor handler in `src/pages/index.astro`. Per-section behavior (the nav's active-link tracker) lives in the relevant component's `<script>` tag.

## Contact form flow

The contact form posts directly to a Formspree endpoint (`https://formspree.io/f/xlgvbylk`) defined in the frontmatter of `Contact.astro`. Submissions land in Formspree's dashboard and the configured notification inbox.

1. With JS enabled, the form submits via `fetch` as multipart form data with `Accept: application/json`. On success the form hides and the status line shows "Sent. We'll be in touch." On a Formspree validation error, the first error message is surfaced.
2. With JS disabled, the form falls back to a standard POST and Formspree handles the response (its own thank-you page, or a redirect configured in the Formspree dashboard).
3. A `_gotcha` honeypot input is included (off-screen) so naive spam bots that fill every field get silently dropped by Formspree.

The endpoint URL is checked into the source. It is a public submission URL by design — Formspree's protection lives in their dashboard (allowed origins, reCAPTCHA, etc.), not in keeping the URL secret. Reconfigure those settings in the Formspree project, not in this repo.

## Newsletter signup (legacy)

The newsletter signup form is no longer rendered on the page, but the underlying API is left in place at `POST /api/subscribe` and `GET /api/subscribers.csv` (gated by `SUBSCRIBERS_DOWNLOAD_TOKEN`). Same CSV-on-disk pattern as the contact form, with case-insensitive dedupe by email. Remove these endpoints if and when you're sure no caller exists for them.

## Design tokens

Defined as CSS custom properties in `src/styles/tokens.css`:

| Token | Hex | Role |
|---|---|---|
| `--moss` | `#526b41` | Primary brand color. Hero background. |
| `--moss-deep` | `#3F4F1F` | Cypress / anchor. Contact section background, dark accents. |
| `--moss-soft` | `#8A9F5C` | Lichen, used sparingly. |
| `--amber` | `#d9a628` | Main accent. Submit button. |
| `--amber-warm` | `#E0B647` | Lighter amber. Hover state, hero accent on dark, contact section accents. |
| `--amber-deep` | `#8E6E14` | Darker amber. Hover for text-only amber accents, amber on light backgrounds. |
| `--bone` | `#F5F1E6` | Paper. Page background, services section, body text on dark. |
| `--moss-50` | `#EFEEDE` | Reed, soft tint of bone. Products section background. |
| `--silt` | `#C9C7B5` | Divider / border. |
| `--bayou` | `#1A1F12` | Near-black with green undertone. Body text on light, footer, primary CTA. |
| `--ink` | `#2A2E1C` | Default body text. |
| `--ink-soft` | `#5C5E4B` | Muted body text, nav inactive, captions. |

Also defined: `--maxw: 1180px`, `--pad: 40px` (24px on mobile), `--nav-h: 64px`, and transition tokens `--t-fast` / `--t-med` / `--t-slow`. The brand uses square corners throughout. No border-radius unless something specific calls for it.

The full design rationale (palette pairings, type scale, mobile breakpoints) lives in `design_handoff_landing_page/README.md` and `Brand Guidelines.html`. Reference them for anything not covered here.

## Voice rules

- **Plainspoken, not ornate.** Short paragraphs, prose over bullets where it reads naturally.
- **Confident, not loud.** No exclamation marks unless quoting. No "🚀".
- **Specific over hand-wavy.** Numbers and concrete things beat abstract claims.
- **Warm, not folksy.** No "y'all" or "fixin' to".
- **Don't oversell stage.** "Piloting with one club" is honest; "Trusted by clubs nationwide" is a lie.
- **Don't mention team size in either direction.** It's "we're building...", never "I'm a solo founder" or "our team of...".
- **No AI-slop words.** Banned: leveraging, empowering, revolutionizing, cutting-edge, seamlessly, robust, transform, unlock, harness, journey, ecosystem, solutions, "at the intersection of."
- **Em dashes are fine** in body copy. The design brief uses them deliberately for rhythm; preserving them is part of preserving the voice. Don't paraphrase existing copy unless asked.

See `design_handoff_landing_page/README.md` "Notes on Voice & Copy" and the `Brand Guidelines.html` voice section for the canonical do/don't examples.

## Environment variables

| Var | Where | Notes |
|---|---|---|
| `SUBSCRIBERS_FILE` | `.env` locally, Railway in prod | Path to the (legacy) subscribers CSV. Default `./data/subscribers.csv`. |
| `SUBSCRIBERS_DOWNLOAD_TOKEN` | `.env` locally, Railway in prod | Long random string. Required to enable `/api/subscribers.csv`. |
| `UMAMI_SCRIPT_URL` | Railway (optional in dev) | Full URL to the Umami `script.js` on the self-hosted instance. |
| `UMAMI_WEBSITE_ID` | Railway (optional in dev) | Website UUID from Umami's admin panel. |
| `HOST` | Railway | Set to `0.0.0.0` so the container accepts external traffic. |
| `PORT` | Auto-injected by Railway | Don't set manually in prod. |
| `NODE_ENV` | Optional | Recommended `production` in Railway. |

`.env.example` is committed. `.env` is gitignored. `data/` is gitignored.

### Analytics

Self-hosted Umami. The `<script defer src=... data-website-id=...>` tag in `Layout.astro` renders only when both `UMAMI_SCRIPT_URL` and `UMAMI_WEBSITE_ID` are set. Leaving either blank locally is the easy way to disable analytics in dev. Umami is cookieless, so no cookie banner is needed.

## Deploy to Railway

1. Push to GitHub.
2. New Railway service from the repo (or push to the linked branch on an existing service).
3. Build command: `npm run build`. Start command: `npm start`.
4. **Attach a volume** (service settings → Volumes → Create volume, mount path `/data`) if you're keeping the legacy newsletter endpoint live. Without the volume, the subscribers CSV is wiped on every deploy.
5. Set the env vars above in the Railway dashboard. If using the legacy newsletter endpoint, point `SUBSCRIBERS_FILE` at the mounted volume (e.g. `/data/subscribers.csv`).
6. Generate or attach a domain.

Subsequent pushes to the linked branch redeploy. The volume persists.

## Local commands

| Command | What it does |
|---|---|
| `npm run dev` | Astro dev server on `localhost:4321` |
| `npm run build` | Builds client and SSR server bundles into `dist/` |
| `npm start` | Runs the built server (`node ./dist/server/entry.mjs`) |
| `npm run preview` | Astro's preview of the built site |

## Open items

1. **Formspree project settings**. Lock down the project in Formspree's dashboard: restrict the allowed origin to the production domain, turn on reCAPTCHA or a similar bot filter, configure the destination email and the post-submit redirect URL.
2. **Open Graph image**. None yet. If desired, drop `public/og.png` (1200×630) and add a `<meta property="og:image">` to `Layout.astro`. `public/assets/logo-full.svg` is a reasonable source.
3. **Mobile nav**. The desktop link list is hidden on ≤ 900px with no replacement, matching the prototype. If a hamburger / drawer becomes worth it, add one to `Nav.astro`.
4. **Newsletter endpoints**. `/api/subscribe` and `/api/subscribers.csv` are still live but unused. Decide whether to keep them as cold spares or delete them. If they go, the site can drop SSR and ship as a static build.
5. **Accessibility**. The page is semantic HTML with reasonable focus states but hasn't been audited. Run through Lighthouse / axe before any big push.

## Things to be careful about

- Don't run `git add -A` / `git add .` blindly. The `.gitignore` covers `.env`, `node_modules`, `dist`, `.astro`, and `data/`, but explicit staging keeps accidents off the table.
- Don't add chat widgets, fake testimonials, customer logos, or invented metrics. The brief said no.
- Don't paraphrase existing landing-page copy. The wording was iterated against the brand voice and is intentional.
- Self-hosted Umami is wired in. It's cookieless, so no cookie banner is needed. Don't swap it for an analytics tool that requires a banner without checking first.
- The `@import './tokens.css'` line in `global.css` must stay above the `@tailwind` directives. PostCSS drops `@import` statements that come after other rules.
