# ARCHITECTURE — Command Overlay (sbl-tracker)

> Build-knowledge doc (Domain B). Kept current in the same commit as code changes so Viktor and
> Claude read accurate truth from GitHub. See also [CLAUDE.md](CLAUDE.md) (working guide),
> [docs/SUPABASE-NOTES.md](docs/SUPABASE-NOTES.md), [docs/TOC-INTEGRATION.md](docs/TOC-INTEGRATION.md).

## Purpose
Multi-tenant operational picture for the fractional Chief-of-Staff engagement. One row per
client; tracks the **deliverables pipeline** (playbooks/SOPs), **coaching cadence** (Captain's
Table logs + decisions + action items), **AI briefs**, and a per-client **activity feed**.

- **Product name:** Command Overlay (formerly "SBL Tracker" / "SBL Playbook").
- **Hosting today:** Lovable, `sbl-tracker.lovable.app`. Repo `cmdrgroup/sbl-tracker`.
- **Target hosting:** Vercel as a static SPA; eventual domain `commandoverlay.com`.

## Tech
| Layer | Choice |
|---|---|
| Framework | TanStack Start v1.167 (Vite 7, React 19, TS) — used purely client-side, no SSR data |
| Routing | TanStack Router, file-based (`src/routes/`) |
| Server state | TanStack Query (`src/lib/hooks.ts`) |
| UI | Tailwind v4 + shadcn/ui (Radix) in `src/components/ui/`; framer-motion; recharts |
| Backend | Supabase (`bsvreslnbuqkjgnufpis` "Command Overlay CRM"), ap-northeast-1 |
| Build wrapper | `@lovable.dev/vite-tanstack-config` (injects tanstack/react/tailwind/tsconfig-paths/cloudflare/componentTagger) |

## Routes (`src/routes/`)
- `__root.tsx` — HTML shell (`shellComponent`), head/meta, 404.
- `_app.tsx` — authed layout: loads clients, provides `ClientContext`, renders `AppShell`.
- `_app.index.tsx` — Overview/dashboard. `_app.playbooks` · `_app.sops` · `_app.submit`
  (quick SOP submit) · `_app.coaching` (logs + decisions) · `_app.insights` (AI briefs) ·
  `_app.team` · `_app.settings`.

## Data model (Supabase `public`)
`clients` (tenants) → has many `workstreams`, `playbooks` (127 rows; type ∈ sop/framework/
script/policy/campaign/playbook/other; status pipeline not_started→submitted→under_review→
refined→approved), `coaching_logs` (+ `coaching_decisions`, `brett_sitrep`/`curtis_sitrep`),
`action_items` (open/done/overdue), `activity_feed`, `ai_briefs`, `client_integrations`
(loom/slack/google_drive/xero/notion/clickup — 0 rows, scaffolded). `users` ↔ `clients` via
`client_users` (roles commander/owner/member). Full column detail + FKs in
[docs/SUPABASE-NOTES.md](docs/SUPABASE-NOTES.md).

## Key client modules (`src/lib/`)
- `supabase.ts` — singleton client; URL + anon key hardcoded.
- `hooks.ts` — all TanStack Query hooks; each branches on `isDevBypassHost()` for mock data.
- `dev-bypass.ts` — mock user/profile/clients for localhost + lovable preview hosts.
- `auth-context.ts` / `auth-provider.tsx` — Supabase Auth session; real auth only on the
  published production host.
- `client-context.ts` — active-client switcher state (`useActiveClient`, `useRequiredClient`).
- `types.ts` — DB row types (source of truth for shapes). `staff.ts`, `demo-data.ts`,
  `demo-seed.ts` — roster + demo seeding helpers.

## Rendering / deployment shape
- No server functions, loaders, or `beforeLoad` → **fully client-rendered**.
- Production build (`cloudflare:false`, `spa.enabled:true`) emits a static SPA:
  `dist/client/_shell.html` + hashed `dist/client/assets/*`. Serve `_shell.html` for all
  non-asset routes (SPA fallback). `dist/server/` is produced but unused for static hosting.
- Lovable dependency: the `@lovable.dev/*` build packages and the `componentTagger`/HMR-gate
  dev plugins. They install from npm and don't block independence, but full de-coupling means
  inlining the Vite config (see docs/DEPLOY-VERCEL.md "Full independence").

## Place in the CMDR system
Command Overlay is a **client-delivery tracker** sitting alongside, not inside, the production
**TOC** app (`commandtoc.com`, `cmdrgroup/toc-app`, Supabase `CMDR-TOC`). Data is intentionally
**not unified** across CMDR Supabase projects (bridge-not-merge pattern). Feeding Command
Overlay client-tracking data into TOC is a future integration — options in
[docs/TOC-INTEGRATION.md](docs/TOC-INTEGRATION.md).
