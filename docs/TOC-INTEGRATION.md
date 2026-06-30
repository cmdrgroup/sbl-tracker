# Feeding Command Overlay into the TOC — design proposal

**Status: PROPOSAL for discussion — nothing built.** Goal (from Curtis): Command Overlay should
eventually feed client-tracking data into the **TOC** so client progress shows up in the central
operations brain.

## The two systems
| | Command Overlay CRM (`bsvreslnbuqkjgnufpis`) | CMDR-TOC (`ymtcarlatmvlzhnayttm`) |
|---|---|---|
| Role | Delivery tracker for a client engagement | Production ops hub (`commandtoc.com`) |
| Core entity | `clients` (2) | `members` (21) |
| Coaching | `coaching_logs` (2) + `coaching_decisions` | `coaching_sessions` (80), `session_proposals` |
| Actions | `action_items` (13) | `action_items` (653) |
| SITREPs | `brett_sitrep`/`curtis_sitrep` on coaching_logs | `sitrep_templates`/`schedules`/`submissions` |
| Unique to it | **`playbooks` (127)** — SOP/deliverable pipeline | members portal, Slack/Fathom/GHL, member_briefs, dossiers |

**Conceptual overlap is real** (clients↔members, coaching↔coaching, actions↔actions, sitreps
both sides). Command Overlay's distinctive asset TOC lacks is the **playbook/SOP delivery
pipeline** and per-client `health_score`/`workstreams`.

## Guiding constraint (from memory `toc-build-roadmap`)
CMDR data is deliberately **NOT unified** across Supabase projects. TOC already uses a
**bridge, not merge** pattern (e.g. `seed-dossier-from-cmdr-central` edge fn reads CMDR-Central
into TOC). The integration should follow that precedent, **not** pull everything into one DB.

## Questions to settle
1. **Identity mapping — RESOLVED (Curtis, 2026-07-01):** every Command Overlay `client` must
   also exist as a TOC `member`, so Curtis can manage/coach them centrally from TOC. So the
   integration **provisions/links a TOC member per CO client** and the CO client is the source
   for that member's delivery-tracking data. Mechanism: add `toc_member_id uuid` to CO `clients`;
   on client create (or first sync) ensure a matching TOC `members` row exists and store its id.
2. **Direction** — primary flow is **Command Overlay → TOC** (push client/delivery status up so
   it appears on the TOC member). TOC → CO not needed initially. *(confirm)*
3. **What TOC needs from each CO client** — proposed rollup: playbook pipeline status/% ,
   latest coaching summary + decisions, open action-item count, `health_score`, workstreams.
   *(confirm the exact fields)*
4. **Cadence** — on-change (webhook/trigger) vs scheduled nightly rollup. *(recommend: start
   nightly, add on-change later)*

## Options (lowest → highest coupling)
- **A. Scheduled bridge edge function (recommended).** A TOC-side edge fn (cron) reads Command
  Overlay via its anon/service key and upserts a per-member rollup into a new TOC table
  (`overlay_client_status`) or into `member_briefs`. Mirrors the existing `seed-dossier-*`
  pattern; one-directional; no schema entanglement. Easiest to reason about and reverse.
- **B. TOC reads on demand.** TOC MCP / dashboard queries Command Overlay live when rendering a
  member. Fresher, but couples TOC reads to Command Overlay availability + its RLS.
- **C. Event push.** Command Overlay writes (e.g. playbook approved, coaching log created) fire
  a webhook that posts to a TOC ingest edge fn. Real-time; more moving parts.
- **D. Merge schemas.** ❌ Against the locked "no unification" decision.

## Suggested first slice (Q1 resolved; confirm Q2–Q4)
1. **Provision link.** Add `toc_member_id uuid` to Command Overlay `clients`. For each CO client,
   ensure a TOC `members` row exists (match by email/slug, else create) and store its id.
   Backfill the current 2 clients manually.
2. **Rollup sync.** TOC edge fn `sync-overlay-status` (cron, nightly): for each linked member,
   pull from CO `{playbooks by status, latest coaching_log summary+decisions, open action_items
   count, health_score, workstreams}` and upsert into a new TOC `overlay_client_status` row keyed
   by `member_id`.
3. **Surface.** Show it as an "Overlay" panel on the TOC member view.

Read-only Command Overlay → TOC to start (matches the bridge-not-merge precedent). Revisit
on-change push and bidirectional once the rollup proves useful. **Not built yet — needs a
session against the TOC repo (`cmdrgroup/toc-app`) + CMDR-TOC schema, plus Q2–Q4 confirmed.**

## Prerequisites
- Tighten Command Overlay RLS first (see [SUPABASE-NOTES.md](SUPABASE-NOTES.md)) — a cross-project
  reader should use a scoped service role, not the public anon key.
- Confirm whether the **old SBL demo** (`sbl.commandoverlay.com`, backend
  `SBL Solutions Services Pty Ltd Data`) holds any data that must migrate in, or is throwaway.
