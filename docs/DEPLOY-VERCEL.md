# Deploying Command Overlay to Vercel

**Status:** config prepared + verified locally on branch `claude-code/vercel-migration`. The
actual Vercel deploy is your step (needs your Vercel login). Nothing here has been deployed.

## What changed and why
The app was wired by Lovable to build for **Cloudflare Workers**. Since it's a 100%
client-rendered app (no SSR data, no server functions), the cleanest Vercel target is a
**static SPA**. Two files were added and one edited on the branch:

| File | Change |
|---|---|
| `vite.config.ts` | `defineConfig({ cloudflare: false, tanstackStart: { spa: { enabled: true } } })` — drop the Workers bundle, emit a static SPA shell. |
| `.npmrc` | `legacy-peer-deps=true` — so Vercel's `npm install` resolves the zod peer conflict (Lovable used bun). |
| `vercel.json` | Static build settings + SPA fallback rewrite to `/_shell.html`. |

**Verified locally:** `npm run build` → `dist/client/_shell.html` + `dist/client/assets/*`.
Served through a Vercel-style rewrite, `/`, deep routes (`/coaching`), and JS/CSS assets all
return 200 correctly.

## `vercel.json` (already committed on the branch)
```json
{
  "framework": null,
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "outputDirectory": "dist/client",
  "rewrites": [{ "source": "/(.*)", "destination": "/_shell.html" }]
}
```
(Vercel serves real static files first; the rewrite only catches app routes that have no file.)

## Deploy steps (you)
1. **Push the branch** (or merge to `main` first — see below):
   `git push -u origin claude-code/vercel-migration`
2. In **Vercel → Add New → Project → Import Git Repository**, pick `cmdrgroup/sbl-tracker`.
3. Vercel reads `vercel.json` automatically. Confirm: Framework = Other, Build = `npm run build`,
   Output = `dist/client`. Set **Node.js 20.x or 22.x**. No env vars needed (Supabase keys are
   in the source).
4. Deploy. You'll get a `*.vercel.app` URL. Test login + data load there.
5. **Domain:** Vercel → Project → Settings → Domains → add `commandoverlay.com` (and/or
   `app.commandoverlay.com`). Follow Vercel's DNS instructions at your registrar (A/CNAME). The
   old `sbl.commandoverlay.com` subdomain currently points at the Lovable demo — leave or
   repoint as you choose.

## ⚠️ Auth on the new domain
`dev-bypass.ts` only bypasses auth on `localhost` and `*.lovable.app`. On a Vercel/custom
domain, **real Supabase auth applies** — you'll hit the login screen. Before/at go-live:
- Ensure a real user exists in the `users` table + Supabase Auth, **and**
- In Supabase → Auth → URL Configuration, add the Vercel/`commandoverlay.com` URLs to the
  allowed redirect/site URLs.
- If you want a public/demo-open deploy instead, add the new host to `isDevBypassHost()` (not
  recommended for anything with real client data).

## Branch / Lovable ordering
- The branch leaves `main` untouched (still Lovable's mirror).
- Recommended order: **disconnect Lovable's GitHub** (Lovable settings) → merge
  `claude-code/vercel-migration` into `main` → connect Vercel to `main`. That way Lovable can't
  later overwrite the Vercel config on `main`.

## Full independence from Lovable (optional, later)
The build still imports `@lovable.dev/vite-tanstack-config`. To remove it, replace
`vite.config.ts` with an explicit config: `tanstackStart({ spa: { enabled: true } })` +
`viteReact()` + `@tailwindcss/vite` + `vite-tsconfig-paths`, drop `lovable-tagger` and the
`@lovable.dev/*` devDeps. Defer until after a clean Vercel deploy so you change one thing at a time.
