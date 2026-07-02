// toc-delivery-bridge — Fable 5 §6.1: SOP/playbook pipeline movements are
// reported upstream to the TOC as engagement events, so Curtis sees delivery
// progress in the member brief and the Silence Protocol counts it.
//
// Invoked by the app (supabase.functions.invoke) with the user's JWT.
// The TOC shared secret lives HERE (server-side). Fire-and-forget from the
// client; failures never block the SOP workflow.
//
// POST { client_id: uuid, playbook_title?: string, status?: string }
// Verifies the caller belongs to the client (client_users), resolves
// clients.toc_member_id, then POSTs to TOC's engagement-webhook.

import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TOC_WEBHOOK_URL =
  "https://ymtcarlatmvlzhnayttm.supabase.co/functions/v1/engagement-webhook";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SR_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const TOC_SECRET = Deno.env.get("VIKTOR_WEBHOOK_SECRET");
  if (!SUPABASE_URL || !SR_KEY) return json({ error: "server misconfigured" }, 500);
  if (!TOC_SECRET) return json({ ok: false, skipped: "TOC bridge secret not configured" });

  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: "not signed in" }, 401);

  let body: { client_id?: string; playbook_title?: string; status?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid JSON body" }, 400);
  }
  if (!body.client_id) return json({ error: "client_id required" }, 400);

  const supa = createClient(SUPABASE_URL, SR_KEY, { auth: { persistSession: false } });

  // Caller must belong to the client
  const { data: membership } = await supa
    .from("client_users")
    .select("id")
    .eq("client_id", body.client_id)
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (!membership) return json({ error: "not a member of that client" }, 403);

  const { data: client } = await supa
    .from("clients")
    .select("toc_member_id, name")
    .eq("id", body.client_id)
    .maybeSingle();
  const memberId = (client as { toc_member_id: string | null } | null)?.toc_member_id ?? null;
  if (!memberId) return json({ ok: false, skipped: "client has no toc_member_id mapping" });

  try {
    const res = await fetch(TOC_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Viktor-Secret": TOC_SECRET },
      body: JSON.stringify({
        member_id: memberId,
        type: "overlay_delivery",
        payload: {
          playbook: body.playbook_title ?? null,
          status: body.status ?? null,
          client: (client as { name?: string } | null)?.name ?? null,
        },
        source_app: "command-overlay",
      }),
    });
    const payload = await res.json().catch(() => null);
    if (!res.ok) return json({ ok: false, toc_status: res.status, toc_error: payload?.error ?? null });
    return json({ ok: true, event_id: payload?.event_id ?? null });
  } catch {
    return json({ ok: false, error: "TOC unreachable" });
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
