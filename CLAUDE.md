# Swampy South Labs Website

Coming-soon landing page for Swampy South Labs, an independent software studio in New Orleans. Server-rendered Astro site, deployed to Railway, with an email signup that posts to Buttondown.

This file is for whoever (human or Claude) picks this project up next. Read it before making changes so the voice and tech decisions stay coherent.

## Stack

- **Astro 4** with TypeScript and strict tsconfig.
- **Tailwind CSS** via `@astrojs/tailwind`. Base styles live in `src/styles/global.css`; the integration is configured with `applyBaseStyles: false` so the layout owns the cascade.
- **`@astrojs/node` in `standalone` mode** for SSR. `npm start` runs `node ./dist/server/entry.mjs`. The adapter reads `HOST` and `PORT` from the environment.
- **Fonts**: Fraunces (serif) for the wordmark and headlines, Inter (sans) for body. Loaded from Google Fonts with `preconnect` and `display=swap`.

### Why SSR instead of a static build

`src/pages/api/subscribe.ts` runs on the server so the Buttondown API key never reaches the browser. That requires `output: 'server'` in `astro.config.mjs`, which is why the project uses `@astrojs/node` rather than a static-only output.

## Project layout

```
src/
  components/
    Hero.astro          in use
    EmailSignup.astro   in use
    Footer.astro        in use
    Logomark.astro      not currently imported
    About.astro         not currently imported (drafted copy for full launch)
    Products.astro      not currently imported (drafted copy for full launch)
  layouts/Layout.astro
  pages/
    index.astro
    api/subscribe.ts
  styles/global.css
  env.d.ts
public/favicon.svg
.claude/launch.json     dev server config for the Claude Code preview
```

### Unused stubs

`About.astro` and `Products.astro` hold drafted copy from the original brief (studio about + three product blurbs: IEP Assist, Project Touchline, Family AI Assistant). They're not imported anywhere right now. Wire them back into `src/pages/index.astro` when the full page is ready, or delete them.

`Logomark.astro` is a small SVG mark (two horizontal curves inside a square, evoking water/swamp without kitsch). Removed from the visible page because the user is still settling on a real logo. The favicon (`public/favicon.svg`) still uses the same mark as a quiet placeholder; swap it when the brand mark is finalized.

## What the page is right now

Coming-soon only. Three visible sections, vertically centered on tall viewports:

1. **Hero**: small "SWAMPY SOUTH LABS" wordmark in moss green, big "Coming soon." headline in Fraunces, one-line subhead: "An independent software studio in New Orleans. More soon."
2. **EmailSignup**: one short paragraph framing the signup, email input + moss-green "Send me the launch note" button.
3. **Footer**: copyright on the left, `info@swampysouthlabs.com` mailto link on the right.

The original brief described a fuller launch page (about copy, three product blurbs, a "Support the work" link to `chris-matthews.me/support`). That was scoped down to coming-soon at the user's request. The "Support the work" link was explicitly removed.

## Email signup flow

1. Form submits JSON `{ email }` to `POST /api/subscribe`.
2. The route validates the address against a basic regex.
3. If valid, it POSTs to `https://api.buttondown.email/v1/subscribers` with `Authorization: Token $BUTTONDOWN_API_KEY` and body `{ "email_address": "..." }`.
4. Already-subscribed emails (Buttondown returns 400 with `already`/`exists` in the detail or code) are treated as success.
5. The form falls back to a standard form submit when JS is disabled. The route then 303-redirects to `/?subscribed=ok#signup` and the page shows the success state from the query param.
6. On success the form hides and the status line shows "Thanks. I'll be in touch when there's something worth sharing."

If `BUTTONDOWN_API_KEY` is unset, the route returns 500 with a friendly message. The form will render fine without it; signups just won't go through.

## Design tokens

Defined in `tailwind.config.mjs`:

| Token | Hex | Use |
|---|---|---|
| `cream` | `#F5F1EA` | Page background |
| `ink` | `#161E2B` | Body and headline text |
| `moss` | `#4F6A55` | Accent (wordmark, button) |
| `moss.deep` | `#3D5443` | Button background, hover |
| `moss.soft` | `#7A8F7E` | Reserved for secondary accents |

Three colors total, per the brief. No kitsch (no alligators, fleurs-de-lis, jazz typography, or bayou textures). "Swampy South" is a quiet reference to place, not a visual theme.

Layout: `body` is `min-h-screen flex flex-col`. The main element is `flex-1 flex flex-col justify-center` so content centers vertically on tall viewports and the footer pins to the bottom. Mobile-first single column, reading content uses `max-w-prose` (38rem).

## Voice rules (non-negotiable)

The brief was explicit. Every copy edit must follow these:

- **No em dashes anywhere.** Use periods, commas, or rewrite the sentence. This applies to README and this CLAUDE.md too.
- **No AI-slop words.** Banned: leveraging, empowering, revolutionizing, cutting-edge, seamlessly, robust, transform, unlock, harness, journey, ecosystem, solutions, "at the intersection of."
- **Conversational, not corporate.** Short paragraphs, prose over bullets where it reads naturally.
- **Show, don't tell.** Describe what a thing is, not what it will change.
- **Don't oversell stage.** "In development with Hynes Charter School" is honest; "Trusted by educators nationwide" is a lie.
- **Don't mention team size in either direction.** Brand voice is "we're building...", never "I'm a solo founder" or "our team of...".

## Environment variables

| Var | Where | Notes |
|---|---|---|
| `BUTTONDOWN_API_KEY` | `.env` locally, Railway dashboard in prod | Required for signups to actually work |
| `HOST` | Railway dashboard | Set to `0.0.0.0` so the container accepts external traffic |
| `PORT` | Auto-injected by Railway | Don't set manually in prod |
| `NODE_ENV` | Optional | Recommended to set to `production` in Railway |

`.env.example` is committed. `.env` is gitignored.

## Deploy to Railway

1. Push to GitHub.
2. New Railway service from the repo.
3. Build command: `npm run build`. Start command: `npm start`.
4. Set the env vars above in the Railway dashboard.
5. Generate or attach a domain.

Subsequent pushes to the linked branch redeploy.

## Local commands

| Command | What it does |
|---|---|
| `npm run dev` | Astro dev server on `localhost:4321` |
| `npm run build` | Builds client and SSR server bundles into `dist/` |
| `npm start` | Runs the built server (`node ./dist/server/entry.mjs`) |
| `npm run preview` | Astro's preview of the built site |

## Open items

1. **Logo**. User is still working on one. Decide whether to revive `Logomark.astro` or drop in a new mark and matching favicon.
2. **Buttondown key**. Needs to be set in Railway env vars before launch.
3. **Domain**. `astro.config.mjs` does not set a `site:` value yet. `Layout.astro` falls back to `https://swampysouth.com` for the canonical URL. Update both once the real domain is wired up.
4. **Open Graph image**. None yet. If desired, drop `public/og.png` (1200x630) and add a `<meta property="og:image">` to `Layout.astro`.
5. **Full launch page**. When the studio is ready to talk about products, re-import `About.astro` and `Products.astro` in `src/pages/index.astro` and review the drafted copy. The "Support the work" link to `chris-matthews.me/support` would also typically go in the footer at that point.

## Things to be careful about

- Don't run `git add -A`/`git add .` blindly. The `.gitignore` covers `.env`, `node_modules`, `dist`, and `.astro`, but explicit staging keeps accidents off the table.
- Don't add analytics or a cookie banner without a reason. The brief said no.
- Don't add chat widgets, fake testimonials, customer logos, or metrics. The brief said no.
- Don't introduce em dashes when editing copy. Linters won't catch them. Search for `—` before committing copy changes.
