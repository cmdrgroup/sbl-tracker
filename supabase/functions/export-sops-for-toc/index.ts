// export-sops-for-toc — one-shot export of the SOP engine's data for the
// Command OS absorb (TOC `import-overlay-sops` calls this server-to-server).
// Returns workstreams + playbooks for every client that has a toc_member_id
// mapping; demo/unmapped clients are excluded. Overlay remains the live
// source of truth — this is a read-only copy feed, not a cutover.
//
// Auth: X-Viktor-Secret = VIKTOR_WEBHOOK_SECRET (same shared-secret gate as
// toc-delivery-bridge). verify_jwt=false.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)

  const SECRET = Deno.env.get('VIKTOR_WEBHOOK_SECRET')
  if (!SECRET || req.headers.get('x-viktor-secret') !== SECRET) {
    return json({ error: 'invalid secret' }, 401)
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
  const SR_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!SUPABASE_URL || !SR_KEY) return json({ error: 'server misconfigured' }, 500)
  const supa = createClient(SUPABASE_URL, SR_KEY, { auth: { persistSession: false } })

  const { data: clients, error: cErr } = await supa
    .from('clients')
    .select('id, name, toc_member_id')
    .not('toc_member_id', 'is', null)
  if (cErr) return json({ error: cErr.message }, 500)

  const clientIds = (clients ?? []).map((c) => c.id)
  if (clientIds.length === 0) return json({ clients: [], workstreams: [], playbooks: [] })

  const [{ data: workstreams, error: wErr }, { data: playbooks, error: pErr }] = await Promise.all([
    supa.from('workstreams')
      .select('id, client_id, name, owner_name, color, sort_order, created_at')
      .in('client_id', clientIds),
    supa.from('playbooks')
      .select('id, client_id, workstream_id, code, title, type, status, owner_name, loom_url, loom_duration_min, scribe_url, notes, submitted_at, created_at, updated_at')
      .in('client_id', clientIds),
  ])
  if (wErr) return json({ error: wErr.message }, 500)
  if (pErr) return json({ error: pErr.message }, 500)

  return json({
    clients: clients ?? [],
    workstreams: workstreams ?? [],
    playbooks: playbooks ?? [],
  })
})

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}
