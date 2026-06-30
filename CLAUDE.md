# CLAUDE.md — Command Overlay (sbl-tracker)

Working guide for Claude Code sessions on this repo. For *what the app is and how it's
built*, see [ARCHITECTURE.md](ARCHITECTURE.md). For deploy specifics see
[docs/DEPLOY-VERCEL.md](docs/DEPLOY-VERCEL.md).

## What this is
**Command Overlay** — a multi-tenant operational dashboard for the fractional Chief-of-Staff
practice (CMDR Group). Tracks playbooks/SOPs, coaching logs, action items and AI briefs per
client. Live (Lovable-hosted) at `sbl-tracker.lovable.app`; the older demo SOP-submission form
lives only inside Lovable at `sbl.commandoverlay.com`. Repo: `cmdrgroup/sbl-tracker`.

## Stack
- **TanStack Start** (`@tanstack/react-start` v1.167) on **Vite 7**, **React 19**, **TypeScript**.
- **TanStack Router** (file-based, `src/routes/`) + **TanStack Query** (data layer).
- **Tailwind v4** + **shadcn/ui** (Radix) in `src/components/ui/`.
- **Supabase** backend (project **Command Overlay CRM** = `bsvreslnbuqkjgnufpis`). Client +
  anon key are **hardcoded** in `src/lib/supabase.ts` (no `.env` needed to run).
- Build config is wrapped by Lovable's `@lovable.dev/vite-tanstack-config` (see ARCHITECTURE.md).

## Run / build (this machine — Windows 11 + antivirus TLS interception)
Two flags are required on this machine; both are already encoded so you usually don't think
about them (`.npmrc` sets `legacy-peer-deps`; only the CA env is manual):

```powershell
cd c:\Users\User\TOC\TOC\CMDR-CODE\sbl-tracker
$env:NODE_OPTIONS="--use-system-ca"     # antivirus MITM cert — else npm/build TLS errors
npm install                              # .npmrc already forces legacy-peer-deps
npm run dev                              # http://localhost:8080  (auto dev-bypass auth)
npm run build                            # -> dist/client (static SPA) + dist/server (unused)
```

- **Why `--use-system-ca`**: local antivirus/proxy presents an untrusted leaf cert; Node 24
  trusts the Windows store with this flag. Not needed on Vercel/CI. See memory
  `local-dev-environment`.
- **Why `legacy-peer-deps`**: Lovable builds with bun (lenient peers); `package.json` pins
  `zod@4` while `@tanstack/zod-adapter` declares a `zod@3` peer. npm needs the flag. `.npmrc`
  handles it for both local and Vercel.

## Auth / data model gotchas
- `src/lib/dev-bypass.ts`: on `localhost` and `*.lovable.app` preview hosts, auth is bypassed
  with a mock "Preview User" (`commander`) + mock client, so the app is fully usable with no
  login. Production host `sbl-tracker.lovable.app` enforces real Supabase auth. **If you deploy
  to a new domain (e.g. Vercel), that host is NOT in the bypass list → real auth applies.**
- Every data hook in `src/lib/hooks.ts` branches on `isDevBypassHost()` and returns mock data
  in preview. Real reads/writes go straight to Supabase from the client (no server functions).
- The app is **100% client-rendered** — no `createServerFn`, no route `loader`/`beforeLoad`,
  no SSR data. This is why it deploys as a static SPA.
- `generate-brief` is a Supabase **edge function** invoked from `useGenerateBrief()`; it lives
  on the Supabase project, not in this repo.

## Conventions
- File-based routes under `src/routes/`; `_app.tsx` is the authed shell, `_app.*.tsx` are pages.
  `routeTree.gen.ts` is **generated** — don't hand-edit.
- Path alias `@/` → `src/`.
- Keep `ARCHITECTURE.md` updated **in the same commit** as code/convention changes (CMDR house
  rule, so Viktor/Claude read current truth from GitHub).

## Branch / Lovable sync
- `main` mirrors Lovable's two-way GitHub sync (commits by `lovable-dev[bot]`).
- Migration work is on branch **`claude-code/vercel-migration`** (Vercel config + these docs).
- Once Lovable's GitHub integration is **disconnected** (manual step in Lovable settings),
  Claude Code → commit → push becomes the only writer and this branch can merge to `main`.
