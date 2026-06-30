# ☀️ Morning briefing — Command Overlay off Lovable

What I did overnight (1 Jul 2026) while you slept. **Everything is reversible**: all work is on
a local branch `claude-code/vercel-migration`, **nothing pushed**, **nothing deployed**, **no
database changes**.

## ✅ Done & verified
1. **Off Lovable, running locally.** Cloned `cmdrgroup/sbl-tracker` → it's the real Command
   Overlay app (TanStack Start + React 19 + Supabase). Runs at `http://localhost:8080`.
   - Solved two install blockers on your machine: antivirus TLS cert (`NODE_OPTIONS=--use-system-ca`)
     and a zod peer-dep conflict (`legacy-peer-deps`, now baked into `.npmrc`).
2. **Production build works independently of Lovable** (exit 0).
3. **Vercel-ready as a static SPA** (the app is 100% client-rendered, so no serverless needed).
   Changed `vite.config.ts` (`cloudflare:false` + SPA), added `vercel.json` + `.npmrc`. Built it
   and **served the output through a Vercel-style rewrite — `/`, deep routes, and assets all
   return 200.** Ready for you to deploy.
4. **Documented the project**: `CLAUDE.md`, `ARCHITECTURE.md`, `docs/DEPLOY-VERCEL.md`,
   `docs/SUPABASE-NOTES.md`, `docs/TOC-INTEGRATION.md`.
5. **Read-only backend inventory** of the Supabase project (schema + security advisories).

## 🔎 Things you'll want to know
- **There are two versions.** The full app = this repo (`sbl-tracker`). The **older demo** —
  "SBL Playbook" SOP-submission form at `sbl.commandoverlay.com` — exists **only inside Lovable**
  (not on GitHub; `FORM-PAGE` is an empty placeholder). To rescue its code you'd "Connect to
  GitHub" from *that* Lovable project. It looks superseded; confirm if you still need it.
- **Security**: the Supabase RLS has permissive INSERT policies (any authed user can write to
  any client) + a few WARN-level lints. Fine for a private demo, **should be fixed before a
  public domain with real client data.** Details in `docs/SUPABASE-NOTES.md`. I did not touch it.
- **Auth on a new domain**: `localhost`/Lovable auto-bypass login; a Vercel/`commandoverlay.com`
  host will enforce real Supabase auth. See the ⚠️ section in `docs/DEPLOY-VERCEL.md`.
- **TOC integration is feasible and there's a clear path** — CMDR-TOC already has members /
  coaching / action-items / sitreps that map to Command Overlay's. Proposal (bridge, not merge,
  matching your existing pattern) in `docs/TOC-INTEGRATION.md`.

## 👉 Decisions I need from you
1. **Disconnect Lovable now?** You said yes — that's a click in Lovable (Settings → GitHub →
   Disconnect). Do it when ready; then I merge this branch to `main`.
2. **Push the branch / deploy to Vercel?** I left both for you (deploy needs your Vercel login).
   Say the word and I'll push the branch; you click Import in Vercel.
3. **Old SBL demo** — rescue its code from Lovable, or let it go?
4. **TOC integration** — answer the 4 questions at the top of `docs/TOC-INTEGRATION.md`
   (esp. *is a Command Overlay "client" the same as a TOC "member"?*) and I'll build the bridge.
5. **Fix Supabase RLS** before any public deploy? (I'd recommend yes; I can write the migration.)

## How to run it yourself
```powershell
cd c:\Users\User\TOC\TOC\CMDR-CODE\sbl-tracker
$env:NODE_OPTIONS="--use-system-ca"
npm run dev   # http://localhost:8080
```

## Branch contents
`vite.config.ts` (Vercel target) · `vercel.json` · `.npmrc` · `CLAUDE.md` · `ARCHITECTURE.md` ·
`docs/DEPLOY-VERCEL.md` · `docs/SUPABASE-NOTES.md` · `docs/TOC-INTEGRATION.md` · this file.
(`main` is untouched — still the clean Lovable mirror.)
