# CLAUDE.md — Command Overlay (sbl-tracker)

Working guide for Claude Code sessions on this repo. For *what the app is and how it's
built*, see [ARCHITECTURE.md](ARCHITECTURE.md). For deploy specifics see
[docs/DEPLOY-VERCEL.md](docs/DEPLOY-VERCEL.md).

## What this is
**Command Overlay** — a client-facing, multi-tenant **delivery** tool for the fractional
Chief-of-Staff practice (CMDR Group): tracks the SOP/playbook pipeline, workstreams, agreed
decisions, action items and AI briefs per client. **Coaching is NOT captured here** — it's owned
by the TOC (system of record); `/coaching` is a read-only "Decisions & Commitments" view.
**Live on Vercel at `app.commandoverlay.com`** (git-connected to `cmdrgroup/sbl-tracker`; push to
`main` → auto-deploy). `commandoverlay.com`/`www` is a *separate* marketing-landing Vercel project.
The older demo SOP-submission form lives only inside Lovable at `sbl.commandoverlay.com`.

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
  with a mock "Preview User" (`commander`) + mock client, so the app is usable with no login.
  **`app.commandoverlay.com` (and any non-localhost/non-lovable host) is NOT bypassed → real
  Supabase auth applies.** Login is **magic-link** (`signInWithOtp`); a `commander` user
  (`curtis@cmdr.group`) exists; Supabase Auth Site URL + redirect allow-list include
  `app.commandoverlay.com`.
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
- **Coaching capture is removed** (coaching SoR = TOC). `/coaching` is read-only Decisions &
  Commitments; coaching *write* hooks were deleted from `hooks.ts` (`useCoachingLogs` read stays).
- Playbooks carry `loom_url` **and** `scribe_url` — clients author SOPs in Loom or Scribe.
- `/register` (SOP Register) is the printable/exportable index of **approved** SOPs + links
  (Print→PDF via `@media print` in `styles.css`; Copy-as-Markdown).
- Keep `ARCHITECTURE.md` updated **in the same commit** as code/convention changes (CMDR house
  rule, so Viktor/Claude read current truth from GitHub).

## Branding — CMDR Group Design System (doctrine)
`src/styles.css` follows the canonical CMDR Design System (mirror: `../cmdr-command-centre/lib/design/tokens.ts`;
canonical source `CMDR-Operations/CMDR Group Design System/`). Rules: fonts **Bebas Neue** (display, UPPERCASE — matches TOC) / **Barlow** (body) /
**JetBrains Mono** (data); palette
command-black `#0A0A0A`, command-gold `#C4A04F`, warning-red `#C12E27`, steel-white `#E4E4E7`,
gunmetal `#2D2D2F`, slate-grey `#8B8B90`, field-green `#2B4F17`. **No gradients, no
glassmorphism/backdrop-blur, no soft/glow shadows, radius ≤ 8px (6px default), no pills, UPPERCASE
headings.** `.glass`/`.gradient-text` are redefined flat so consumers stay doctrine-compliant.

**Surface layering (matches TOC — 3-tier):** page `#0A0A0A` (`bg-background`) → chrome `#161618`
(`bg-surface` — sidebar/topbar) → card `#1E1E20` (`bg-card` — panels). Inputs use `bg-surface`, so
they read as dark insets on cards. Display font is **Bebas Neue** to match TOC exactly. (Note:
`cmdr-command-centre`'s tokens.ts still lists Barlow Condensed — TOC/Bebas is the chosen standard.)

## Branch / Lovable sync
- Work lands directly on **`main`**, and **Vercel auto-deploys `main`** to `app.commandoverlay.com`
  (the `claude-code/vercel-migration` branch was merged).
- Lovable's GitHub integration should be **disconnected** in Lovable settings (manual, Curtis's
  click) so its bot can't push to the repo; the code already lives on GitHub regardless.
