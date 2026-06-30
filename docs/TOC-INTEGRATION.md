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

## First questions to settle (need Curtis)
1. **Identity mapping** — is a Command Overlay `client` the same population as a TOC `member`,
   or different audiences? Integration needs a stable key (e.g. add `toc_member_id` to
   `clients`, or map by slug/email). *This is the crux.*
2. **Direction** — Command Overlay → TOC only (push progress up), or also TOC → Command Overlay?
3. **What TOC actually needs** — likely: playbook pipeline status/% per client, latest coaching
   summary + decisions, open action-item counts, health_score. A rollup, not raw rows.
4. **Cadence** — on-change (webhook/trigger) vs scheduled nightly rollup.

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

## Suggested first slice (after Q1–Q4 answered)
1. Add `toc_member_id uuid` to Command Overlay `clients` (nullable; manual map for the 2 clients).
2. TOC edge fn `sync-overlay-status` (cron, daily): for each mapped member, pull
   `{playbooks by status, latest coaching_log summary+decisions, open action_items count,
   health_score}` and upsert into a new `overlay_client_status` row keyed by `member_id`.
3. Surface it in the TOC member view as an "Overlay" panel.

Keep it read-only Command Overlay → TOC to start. Revisit bidirectional once the rollup proves useful.

## Prerequisites
- Tighten Command Overlay RLS first (see [SUPABASE-NOTES.md](SUPABASE-NOTES.md)) — a cross-project
  reader should use a scoped service role, not the public anon key.
- Confirm whether the **old SBL demo** (`sbl.commandoverlay.com`, backend
  `SBL Solutions Services Pty Ltd Data`) holds any data that must migrate in, or is throwaway.
