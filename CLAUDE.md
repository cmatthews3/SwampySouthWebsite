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
    Hero.astro             moss-toned hero with headline, lede, CTAs
    Services.astro         three service pillars on bone background ("What we build")
    HowWeWork.astro        four-step process section on moss-50 background
    ProofBand.astro        short "we build for ourselves" section linking to /labs
    WhoWeAre.astro         founder / studio intro on moss-50 background
    Contact.astro          contact form on cypress (moss-deep) background
    Footer.astro           bayou-dark footer
    About.astro            unused; drafted copy from the previous brief
    Logomark.astro         unused; old SVG mark
  layouts/Layout.astro
  pages/
    index.astro            services-led homepage
    labs.astro             dedicated /labs page with active pilots + early-dev catalog
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
design_handoff_landing_page/   original design brief, kept for reference.
```

### Unused stubs

`About.astro` and `Logomark.astro` are leftovers from earlier iterations and are not imported anywhere. Wire them back in or delete them when the next change in this area lands.

## What the page is right now

Two pages: the services-led homepage and a dedicated `/labs` catalog page. Both share `Nav` and `Footer`.

### Homepage (`/`)

Top to bottom:

1. **Nav** — sticky 64px bar. Brand lockup on the left, four section anchors in the center (Services / How we work / Labs / Contact), a "Get in touch" CTA on the right. Active link is highlighted on scroll. On screens ≤ 900px, the center link list hides and only the brand and CTA remain.
2. **Hero** — full-bleed moss background, big two-line H1 ("Measured software / for the **work that matters.**"), a buyer-focused lede paragraph, two CTAs ("Start a project" / "See how we work"), faint gator-mark watermark in the lower-right.
3. **Services** ("What we build") — three pillars on the bone background. Titles only (no eyebrow tags). Content in `Services.astro` frontmatter.
4. **How we work** — four-step process on moss-50. Section heading "No black boxes. / No surprises at the end.", a short lede, then four numbered steps (real conversation, scoped first piece, built in the open, built to be handed off). Content in `HowWeWork.astro` frontmatter.
5. **Proof band** — short "we build and run our own products" section on bone. Two pilot callouts (IEP Assist, Project Touchline) with a link out to `/labs`. Anchored with `id="labs"` so the nav's "Labs" link still scrolls to it if someone clicks before navigating; the link itself goes to `/labs`.
6. **Who we are** — founder/studio intro on moss-50. **Currently contains bracketed placeholders** (`[Founder name]` and a one-sentence bio) that must be filled in before launch. The placeholders render visibly so they're easy to spot.
7. **Contact** — full-bleed `--moss-deep` background. Left column is a short paragraph and a direct mailto. Right column is the contact form (name, email, "What are you trying to build?").
8. **Footer** — bayou-dark, brand lockup left, anchor list right (Services / How we work / Labs / Contact), copyright row below.

### Labs page (`/labs`)

A single file at `src/pages/labs.astro`, not split into per-section components — the page is page-specific enough that inlining the sections is cleaner than spawning four new component files. Order:

1. **Labs hero** — light background, eyebrow ("// The Labs"), H1 ("The Labs."), intro paragraph, working-titles note.
2. **In active pilots** — moss-50, group header + two large product cards (IEP Assist, Project Touchline) with category eyebrow, body, status pill, and a "See it in action" link. The link `href` values still point at the raw dev URLs; per the brief, swap them for a controlled demo (video or polished screenshots) before launch. A `TODO` comment in the frontmatter calls this out.
3. **In early development** — bone, group header + two cards (Project Winston, Project Reps). Same card shape, no external link.
4. **Closing band** — moss-deep, short CTA ("See something here you'd want built for your own work?") with a "Start a project" button that anchors to `/#contact`.

The page mounts its own shared scroll-reveal IntersectionObserver and smooth-anchor handler. The homepage does the same in `src/pages/index.astro`. Per-section behavior (the nav's active-link tracker) lives in `Nav.astro`'s `<script>` tag.

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
| `--moss-50` | `#EFEEDE` | Reed, soft tint of bone. How we work / Who we are background, Labs active-pilots section. |
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

1. **"Who we are" personal-background line**. `WhoWeAre.astro` has the founder name (Christopher Matthews) filled in but still ships with `[Personal background — one or two honest sentences about where you came from and why you started this.]` rendered visibly. Replace before the site goes public. The size-signaling copy from the original brief ("A small studio, on purpose" / "We stay small deliberately") was intentionally cut to match the project's "don't mention team size in either direction" voice rule.
2. **Pricing anchor (optional)**. The services-led brief suggests one honest line in `HowWeWork.astro` ("Engagements typically start in the [X] range…"). Not included by default. Add it under the four numbered steps if you want a price anchor.
3. **Labs demo links**. `src/pages/labs.astro` still points its "See it in action" CTAs at the raw dev URLs. Per the brief, swap these for a short demo video or polished screenshots before launch. A `TODO` comment in the page frontmatter flags this.
4. **More-about-the-studio page**. The brief's "More about the studio →" CTA isn't wired in — there's no `/about` page yet. Either build one or drop the CTA.
5. **Formspree project settings**. Lock down the project in Formspree's dashboard: restrict the allowed origin to the production domain, turn on reCAPTCHA or a similar bot filter, configure the destination email and the post-submit redirect URL.
6. **Open Graph image**. None yet. If desired, drop `public/og.png` (1200×630) and add a `<meta property="og:image">` to `Layout.astro`. `public/assets/logo-full.svg` is a reasonable source.
7. **Mobile nav**. The desktop link list is hidden on ≤ 900px with no replacement, matching the prototype. If a hamburger / drawer becomes worth it, add one to `Nav.astro`.
8. **Newsletter endpoints**. `/api/subscribe` and `/api/subscribers.csv` are still live but unused. Decide whether to keep them as cold spares or delete them. If they go, the site can drop SSR and ship as a static build.
9. **Accessibility**. The page is semantic HTML with reasonable focus states but hasn't been audited. Run through Lighthouse / axe before any big push.

## Things to be careful about

- Don't run `git add -A` / `git add .` blindly. The `.gitignore` covers `.env`, `node_modules`, `dist`, `.astro`, and `data/`, but explicit staging keeps accidents off the table.
- Don't add chat widgets, fake testimonials, customer logos, or invented metrics. The brief said no.
- Don't paraphrase existing landing-page copy. The wording was iterated against the brand voice and is intentional.
- Self-hosted Umami is wired in. It's cookieless, so no cookie banner is needed. Don't swap it for an analytics tool that requires a banner without checking first.
- The `@import './tokens.css'` line in `global.css` must stay above the `@tailwind` directives. PostCSS drops `@import` statements that come after other rules.
