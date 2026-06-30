# Supabase backend — Command Overlay CRM

Read-only inventory taken 2026-07-01. **No schema changes were made.**

- **Project:** `Command Overlay CRM` — ref `bsvreslnbuqkjgnufpis`, region ap-northeast-1, Postgres 17.
- **Connection:** hardcoded in `src/lib/supabase.ts` (URL + anon key). Anon key is the public
  client key — safe to ship, but it means all access control rests on **RLS** (see warnings).
- **Edge function:** `generate-brief` (invoked by `useGenerateBrief`). Not in this repo.

## Tables (`public`) — rows as of inventory
| Table | Rows | Notes |
|---|---|---|
| clients | 2 | tenants; `slug` unique, `health_score` 0–100, timezone default Australia/Brisbane |
| users | 4 | profile rows; `id` FK → `auth.users`; role ∈ commander/client_owner/team_member |
| client_users | 2 | user↔client membership; role ∈ commander/owner/member |
| workstreams | 14 | per-client departments/channels |
| **playbooks** | **127** | core deliverables; type + status pipeline; `loom_url` + `scribe_url`, owner_name |
| coaching_logs | 2 | Captain's Table; `brett_sitrep`/`curtis_sitrep`. **Read-only in Overlay — capture removed; coaching SoR = TOC** |
| coaching_decisions | 9 | child of coaching_logs |
| action_items | 13 | open/done/overdue; optional FK → coaching_logs |
| activity_feed | 16 | per-client event log |
| client_integrations | 0 | scaffolded providers: loom/slack/google_drive/xero/notion/clickup |
| ai_briefs | 2 | generated_by default 'claude'; brief_type weekly/daily/coaching_prep/ad_hoc |

All FKs hang off `clients.id`. RLS is **enabled on every table**. There's a
`get_my_client_ids()` SECURITY DEFINER helper (used by SELECT policies to scope rows to the
caller's clients) and a `handle_new_user()` trigger fn.

## Security advisories (all WARN, none ERROR)
Lovable-generated; worth tightening before opening to real multi-client production use. Full
linter docs at the remediation links.

**UPDATE 2026-07-01 — items 1 & 3 RESOLVED:** migration `tighten_rls_insert_policies` was applied —
dropped the 8 permissive `WITH CHECK (true)` INSERT policies (scoped commander/owner policies now
govern writes) and pinned `set_updated_at`/`update_updated_at` search_path. Items 2 & 4 remain.
Separately, migration `playbooks_scribe_url` added a nullable `playbooks.scribe_url`.

1. **Permissive INSERT policies (8 tables):** `WITH CHECK (true)` on INSERT for
   action_items, activity_feed, client_users, clients, coaching_decisions, coaching_logs,
   playbooks, workstreams. Any authenticated user can insert rows for **any** client — a
   multi-tenant isolation gap on writes. (SELECT appears properly scoped via `get_my_client_ids`.)
   Fix: replace `true` with a check that the target `client_id` ∈ `get_my_client_ids()`.
   → https://supabase.com/docs/guides/database/database-linter?lint=0024_permissive_rls_policy
2. **SECURITY DEFINER fns callable by anon/authenticated:** `get_my_client_ids()`,
   `handle_new_user()` exposed via `/rest/v1/rpc/...`. Revoke EXECUTE from `anon` (and
   `authenticated` for `handle_new_user`) or switch to SECURITY INVOKER where appropriate.
   → lint 0028 / 0029
3. **Function search_path mutable:** `update_updated_at`, `set_updated_at` — set
   `search_path = ''` (or pin schema). → lint 0011
4. **Leaked-password protection disabled** in Auth — enable HaveIBeenPwned check.
   → https://supabase.com/docs/guides/auth/password-security

These mirror (less severely) the `command-map-engine` RLS issue noted in memory — INSERT-only
here, not `FOR ALL TO public`. **Recommend fixing before exposing the app on a public domain
with real client data.** I did not change anything; these need your go-ahead (and they touch
the live DB the Lovable app also uses).

## Related projects (for context / TOC integration)
Same Supabase org `bmsalodiuownywuibfrh`: `CMDR-TOC` (`ymtcarlatmvlzhnayttm`), `CMDR-Central`
(`idyibazgkwsyqoeskieu`), `SBL Solutions Services Pty Ltd Data` (`nzqmbduvnfdagobgzbre` — likely
the old SBL demo backend), `command-close`, `cmdr-finance`, `deployquote`.
