// supabase/functions/generate-brief/index.ts
// Supabase Edge Function — generates an AI executive brief for a client
// Deploy: supabase functions deploy generate-brief
// Requires env var: ANTHROPIC_API_KEY

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { client_id, brief_type = "weekly" } = await req.json();

    if (!client_id) {
      return new Response(JSON.stringify({ error: "client_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ─── Gather client data ───────────────────────────────
    const [clientRes, workstreamsRes, playbooksRes, coachingRes, actionsRes, activityRes] =
      await Promise.all([
        supabase.from("clients").select("*").eq("id", client_id).single(),
        supabase.from("workstreams").select("*").eq("client_id", client_id).order("sort_order"),
        supabase.from("playbooks").select("*, workstream:workstreams(name)").eq("client_id", client_id),
        supabase
          .from("coaching_logs")
          .select("*, decisions:coaching_decisions(*)")
          .eq("client_id", client_id)
          .order("session_date", { ascending: false })
          .limit(4),
        supabase.from("action_items").select("*").eq("client_id", client_id),
        supabase
          .from("activity_feed")
          .select("*")
          .eq("client_id", client_id)
          .order("created_at", { ascending: false })
          .limit(15),
      ]);

    const client = clientRes.data;
    const workstreams = workstreamsRes.data ?? [];
    const playbooks = playbooksRes.data ?? [];
    const coachingLogs = coachingRes.data ?? [];
    const actionItems = actionsRes.data ?? [];
    const activity = activityRes.data ?? [];

    // ─── Compute stats for context ────────────────────────
    const totalPb = playbooks.length;
    const approvedPb = playbooks.filter((p: any) => p.status === "approved").length;
    const inReview = playbooks.filter((p: any) => p.status === "under_review" || p.status === "refined").length;
    const notStarted = playbooks.filter((p: any) => p.status === "not_started").length;
    const pct = totalPb > 0 ? Math.round((approvedPb / totalPb) * 100) : 0;

    const openActions = actionItems.filter((a: any) => a.status !== "done");
    const overdueActions = actionItems.filter((a: any) => a.status === "overdue");

    const wsBreakdown = workstreams.map((ws: any) => {
      const items = playbooks.filter((p: any) => p.workstream_id === ws.id);
      const approved = items.filter((p: any) => p.status === "approved").length;
      const stuck = items.filter((p: any) => p.status === "under_review" || p.status === "refined").length;
      return `- ${ws.name} (${ws.owner_name ?? "no owner"}): ${approved}/${items.length} approved, ${stuck} in review`;
    }).join("\n");

    const recentDecisions = coachingLogs
      .flatMap((l: any) => (l.decisions ?? []).map((d: any) => d.decision))
      .slice(0, 10);

    const recentCoachingSummaries = coachingLogs
      .slice(0, 3)
      .map((l: any) => `Week ${l.week_number} (${l.session_date}, mood: ${l.mood}): ${l.summary}`)
      .join("\n");

    // ─── Build prompt ─────────────────────────────────────
    const systemPrompt = `You are the AI engine inside Command Overlay, an operational platform for fractional Chief of Staff engagements. You write executive briefs for the Commander (fractional COS) to review before their weekly coaching session ("Captain's Table") with the client.

Your tone is direct, confident, and operator-grade — like a trusted second-in-command briefing a general. Use short paragraphs. Bold the most critical insight. Reference specific numbers, names, and departments. End with 3 concrete recommended actions.

Do NOT use bullet points in the main brief — write in prose. Only use bullets for the action items at the end.`;

    const userPrompt = `Generate a ${brief_type} executive brief for ${client?.name ?? "this client"}.

CURRENT STATE:
- Overall playbook completion: ${approvedPb}/${totalPb} (${pct}%)
- In review: ${inReview} | Not started: ${notStarted}
- Open action items: ${openActions.length} (${overdueActions.length} overdue)
- Coaching sessions logged: ${coachingLogs.length}
- Health score: ${client?.health_score ?? "N/A"}/100

DEPARTMENT BREAKDOWN:
${wsBreakdown}

RECENT COACHING SESSIONS:
${recentCoachingSummaries || "No sessions recorded yet."}

RECENT DECISIONS:
${recentDecisions.length > 0 ? recentDecisions.map((d: string) => `- ${d}`).join("\n") : "No decisions recorded yet."}

OPEN ACTION ITEMS:
${openActions.length > 0 ? openActions.map((a: any) => `- ${a.title} (${a.owner_name ?? "unassigned"}, status: ${a.status}${a.due_date ? ", due: " + a.due_date : ""})`).join("\n") : "None."}

RECENT ACTIVITY:
${activity.slice(0, 8).map((a: any) => `- ${a.actor_name ?? "System"}: ${a.message}`).join("\n") || "No activity."}

Write the brief now. Keep it under 300 words.`;

    // ─── Call Claude API ──────────────────────────────────
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured. Set it in Supabase Edge Function secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!claudeRes.ok) {
      const errText = await claudeRes.text();
      console.error("Claude API error:", errText);
      return new Response(
        JSON.stringify({ error: "AI generation failed", details: errText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const claudeData = await claudeRes.json();
    const briefContent = claudeData.content?.[0]?.text ?? "Brief generation failed.";

    // ─── Save to database ─────────────────────────────────
    const { data: savedBrief, error: saveError } = await supabase
      .from("ai_briefs")
      .insert({
        client_id,
        brief_type,
        content: briefContent,
        signals_used: workstreams.length + coachingLogs.length + openActions.length,
        generated_by: "claude",
      })
      .select()
      .single();

    if (saveError) {
      console.error("Save error:", saveError);
    }

    return new Response(
      JSON.stringify({
        brief: briefContent,
        id: savedBrief?.id,
        signals_used: workstreams.length + coachingLogs.length + openActions.length,
        generated_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error", message: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
